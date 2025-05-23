import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MediaModel } from './models/media.model';
import { CommentModel } from './models/comment.model';
import type { Media } from './types/media.types';
import type { Comment } from './types/comment.types';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const db = process.env.MONGO_URI || 'mongodb://localhost:27017/mediagallery';
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
  const count = await MediaModel.countDocuments();
  if (count === 0) {
    const mockMediaItems = Array.from({ length: 100 }, (_, i) => {
      const isVideo = Math.random() < 0.25;
      return ({
      url: isVideo
          ? 'https://sample-videos.com/video321/mp4/480/big_buck_bunny_480p_1mb.mp4'
          : `https://picsum.photos/seed/media${i}/600/400`,
      title: `${isVideo ? 'Video' : 'Image'} ${i + 1}`,
      description: `This is a detailed description for Media ${i + 1}. It can be quite long and informative, discussing the nuances and context of the visual content presented. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      mediaType: isVideo ? 'video' : 'image'
    })
    });

    try {
      await MediaModel.insertMany(mockMediaItems);
      console.log('Database initialized with mock media items');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
}

initializeDatabase();

app.get('/', (req: Request, res: Response): Response => {
  return res.send({ 'message': 'Hello API. Use /media to get media.' });
});

interface PaginatedResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalMedia: number;
  data: Media[];
}

// Media endpoint with pagination
app.get('/media', authenticateToken, async (req: AuthenticatedRequest, res: Response<PaginatedResponse>): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      MediaModel.find()
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
            id: doc._id.toString(),
            mediaType: doc.mediaType,
          }))
        ),
      MediaModel.countDocuments()
    ]);

    return res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalMedia: total,
      data: media
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return res.status(500).json({ message: 'Error fetching media' } as any);
  }
});

interface MediaWithComments extends Media {
  comments: Comment[];
}

// GET single media with comments
app.get('/media/:mediaId', authenticateToken, async (req: AuthenticatedRequest, res: Response<MediaWithComments>): Promise<Response> => {
  try {

    let media;
    typeof req.params.mediaId === 'string' ? media = await MediaModel.findById(req.params.mediaId) : media = await MediaModel.findById(`${req.params.mediaId}`);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' } as any);
    }

    const comments = await CommentModel.find({ mediaId: media._id })
      .sort({ timestamp: -1 })
      .lean()
      .transform((docs) =>
        docs.map(doc => ({
          id: doc._id.toString(),
          mediaId: doc.mediaId.toString(),
          userId: doc.userId,
          username: doc.username,
          text: doc.text,
          timestamp: doc.timestamp
        }))
      );

    const transformedMedia: Media = {
      id: media._id.toString(),
      url: media.url,
      title: media.title,
      description: media.description,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      mediaType: media.mediaType
    };

    return res.json({ ...transformedMedia, comments });
  } catch (error) {
    console.error('Error fetching media details:', error);
    return res.status(500).json({ message: 'Error fetching media details' } as any);
  }
});

// POST new comment
app.post('/media/:mediaId/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response<Comment>): Promise<Response> => {
  try {
    const { text } = req.body;
    const user = req.user!;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' } as any);
    }

    const media = await MediaModel.findById(req.params.mediaId);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' } as any);
    }

    const newComment = new CommentModel({
      mediaId: media._id,
      userId: user.id,
      username: user.username,
      text,
      timestamp: new Date()
    });

    const savedComment = await newComment.save();
    
    // Transform the comment document safely
    const transformedComment: Comment = {
      id: savedComment._id?.toString() || '',
      mediaId: savedComment.mediaId?.toString() || '',
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

// PUT update media description
app.put('/media/:mediaId/description', authenticateToken, async (req: AuthenticatedRequest, res: Response<MediaWithComments>): Promise<Response> => {
  try {
    const { description } = req.body;

    if (typeof description !== 'string') {
      return res.status(400).json({ message: 'Description must be a string' } as any);
    }

    let media;
    typeof req.params.mediaId === 'string' ? 
      media = await MediaModel.findById(req.params.mediaId) : 
      media = await MediaModel.findById(`${req.params.mediaId}`);
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' } as any);
    }

    media.description = description;
    await media.save();
    const savedMedia = media.toJSON();

    const comments = await CommentModel.find({ mediaId: media._id })
      .sort({ timestamp: -1 })
      .lean()
      .transform((docs) =>
        docs.map(doc => ({
          id: doc._id?.toString() || '',
          mediaId: doc.mediaId?.toString() || '',
          userId: doc.userId || '',
          username: doc.username || '',
          text: doc.text || '',
          timestamp: doc.timestamp || new Date()
        }))
      );

    // Transform the media document safely
    const transformedMedia: Media = {
      id: savedMedia._id?.toString() || '',
      url: savedMedia.url || '',
      title: savedMedia.title || '',
      description: savedMedia.description || '',
      createdAt: savedMedia.createdAt || new Date(),
      updatedAt: savedMedia.updatedAt || new Date(),
      mediaType: savedMedia.mediaType || 'image'
    };

    return res.json({ ...transformedMedia, comments });
  } catch (error) {
    console.error('Error updating description:', error);
    return res.status(500).json({ message: 'Error updating description' } as any);
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] API server listening on http://${host}:${port}`);
});
