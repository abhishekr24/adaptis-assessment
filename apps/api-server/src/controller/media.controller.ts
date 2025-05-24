import { Response } from 'express';
import { CommentModel } from '../models/comment.model';
import { MediaModel } from '../models/media.model';
import { Comment } from '../types/comment.types';
import { Media } from '../types/media.types';
import { AuthenticatedRequest, MediaWithComments, PaginatedResponse } from './controller.types';

// Media endpoint with pagination
export async function getAllMedia(req: AuthenticatedRequest, res: Response<PaginatedResponse>): Promise<Response> {
     try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 25;
        const skip = (page - 1) * limit;
        const tagFilter = req.query.tag as string | undefined;
        const filter = tagFilter ? { tags: tagFilter } : {};
    
        const [media, total] = await Promise.all([
          MediaModel.find(filter)
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
                tags: doc.tags
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
}

// GET single media with comments
export async function getMediaDetail(req: AuthenticatedRequest, res: Response<MediaWithComments>): Promise<Response> {
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
          mediaType: media.mediaType,
          tags: media.tags
        };
    
        return res.json({ ...transformedMedia, comments });
      } catch (error) {
        console.error('Error fetching media details:', error);
        return res.status(500).json({ message: 'Error fetching media details' } as any);
      }
}

// POST new comment
export async function updateComment(req: AuthenticatedRequest, res: Response<Comment>): Promise<Response> {
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
}

// PUT update media description
export async function updateDescription(req: AuthenticatedRequest, res: Response<MediaWithComments>): Promise<Response> {
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
          mediaType: savedMedia.mediaType || 'image',
          tags: savedMedia.tags
        };
    
        return res.json({ ...transformedMedia, comments });
      } catch (error) {
        console.error('Error updating description:', error);
        return res.status(500).json({ message: 'Error updating description' } as any);
      }
}

// PUT tags
export async function updateTags(req: AuthenticatedRequest, res: Response): Promise<Response>  {
  try {
    const { tags } = req.body
    const { mediaId } = req.params

    if (!Array.isArray(tags)) {
      return res.status(400).json({message: "Tags must be an array"})
    }

    const media = await MediaModel.findById(mediaId);
    if (!media) return res.status(404).json({message: "Media not found"})

    media.tags = tags
    await media.save()

    const transformedMedia: Media = {
      id: media._id?.toString() || '',
      url: media.url || '',
      title: media.title || '',
      description: media.description || '',
      createdAt: media.createdAt || new Date(),
      updatedAt: media.updatedAt || new Date(),
      mediaType: media.mediaType || 'image',
      tags: media.tags
    };

    return res.status(200).json({ ...transformedMedia })

  } catch (error) {
    console.error('Error adding tags:', error);
    return res.status(500).json({ message: 'Error adding tags' } as any);
  } 
} 