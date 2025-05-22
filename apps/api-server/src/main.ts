import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { ImageModel } from './models/image.model';
import { CommentModel } from './models/comment.model';
import type { Image } from './types/image.types';
import type { Comment } from './types/comment.types';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const db = process.env.MONGO_URI || 'mongodb://localhost:27017/imagegallery';
console.log(`connecting to ${db}`);

export const app = express();

app.use(express.json());
app.use(cors());

// Mock Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string };
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  if (token === 'mocktoken') {
    req.user = { id: '123', username: 'testuser' };
    next();
    return;
  } else {
    return res.sendStatus(403);
  }
};


MongoMemoryServer.create().then((mongoServer) => {
  const db = mongoServer.getUri();
  mongoose.connect(db)
    .then(() => console.log('MongoDB connected to', db))
    .catch(err => console.error('MongoDB connection error:', err));
});

// Initialize database with mock data if empty
async function initializeDatabase() {
  const count = await ImageModel.countDocuments();
  if (count === 0) {
    const mockImages = Array.from({ length: 100 }, (_, i) => ({
      url: `https://picsum.photos/seed/img${i + 1}/600/400`,
      title: `Image ${i + 1}`,
      description: `This is a detailed description for Image ${i + 1}. It can be quite long and informative, discussing the nuances and context of the visual content presented. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
    }));

    try {
      await ImageModel.insertMany(mockImages);
      console.log('Database initialized with mock images');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
}

initializeDatabase();

app.get('/', (req: Request, res: Response): Response => {
  return res.send({ 'message': 'Hello API. Use /images to get images.' });
});

interface PaginatedResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalImages: number;
  data: Image[];
}

// Images endpoint with pagination
app.get('/images', authenticateToken, async (req: AuthenticatedRequest, res: Response<PaginatedResponse>): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      ImageModel.find()
        .skip(skip)
        .limit(limit)
        .lean()
        .transform((docs) => 
          docs.map(doc => ({
            url: doc.url,
            title: doc.title,
            description: doc.description,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            id: doc._id.toString()
          }))
        ),
      ImageModel.countDocuments()
    ]);

    return res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalImages: total,
      data: images
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return res.status(500).json({ message: 'Error fetching images' } as any);
  }
});

interface ImageWithComments extends Image {
  comments: Comment[];
}

// GET single image with comments
app.get('/images/:imageId', authenticateToken, async (req: AuthenticatedRequest, res: Response<ImageWithComments>): Promise<Response> => {
  try {

    let image;
    typeof req.params.imageId === 'string' ? image = await ImageModel.findById(req.params.imageId) : image = await ImageModel.findById(`${req.params.imageId}`);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' } as any);
    }

    const comments = await CommentModel.find({ imageId: image._id })
      .sort({ timestamp: -1 })
      .lean()
      .transform((docs) =>
        docs.map(doc => ({
          id: doc._id.toString(),
          imageId: doc.imageId.toString(),
          userId: doc.userId,
          username: doc.username,
          text: doc.text,
          timestamp: doc.timestamp
        }))
      );

    const transformedImage: Image = {
      id: image._id.toString(),
      url: image.url,
      title: image.title,
      description: image.description,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    };

    return res.json({ ...transformedImage, comments });
  } catch (error) {
    console.error('Error fetching image details:', error);
    return res.status(500).json({ message: 'Error fetching image details' } as any);
  }
});

// POST new comment
app.post('/images/:imageId/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response<Comment>): Promise<Response> => {
  try {
    const { text } = req.body;
    const user = req.user!;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' } as any);
    }

    const image = await ImageModel.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' } as any);
    }

    const newComment = new CommentModel({
      imageId: image._id,
      userId: user.id,
      username: user.username,
      text,
      timestamp: new Date()
    });

    const savedComment = await newComment.save();
    
    // Transform the comment document safely
    const transformedComment: Comment = {
      id: savedComment._id?.toString() || '',
      imageId: savedComment.imageId?.toString() || '',
      userId: savedComment.userId || '',
      username: savedComment.username || '',
      text: savedComment.text || '',
      timestamp: savedComment.timestamp || new Date()
    };

    return res.status(201).json(transformedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ message: 'Error adding comment' } as any);
  }
});

// PUT update image description
app.put('/images/:imageId/description', authenticateToken, async (req: AuthenticatedRequest, res: Response<ImageWithComments>): Promise<Response> => {
  try {
    const { description } = req.body;

    if (typeof description !== 'string') {
      return res.status(400).json({ message: 'Description must be a string' } as any);
    }

    let image;
    typeof req.params.imageId === 'string' ? 
      image = await ImageModel.findById(req.params.imageId) : 
      image = await ImageModel.findById(`${req.params.imageId}`);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' } as any);
    }

    image.description = description;
    await image.save();
    const savedImage = image.toJSON();

    const comments = await CommentModel.find({ imageId: image._id })
      .sort({ timestamp: -1 })
      .lean()
      .transform((docs) =>
        docs.map(doc => ({
          id: doc._id?.toString() || '',
          imageId: doc.imageId?.toString() || '',
          userId: doc.userId || '',
          username: doc.username || '',
          text: doc.text || '',
          timestamp: doc.timestamp || new Date()
        }))
      );

    // Transform the image document safely
    const transformedImage: Image = {
      id: savedImage._id?.toString() || '',
      url: savedImage.url || '',
      title: savedImage.title || '',
      description: savedImage.description || '',
      createdAt: savedImage.createdAt || new Date(),
      updatedAt: savedImage.updatedAt || new Date()
    };

    return res.json({ ...transformedImage, comments });
  } catch (error) {
    console.error('Error updating description:', error);
    return res.status(500).json({ message: 'Error updating description' } as any);
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] API server listening on http://${host}:${port}`);
});
