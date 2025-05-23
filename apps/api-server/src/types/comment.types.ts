import { Types } from 'mongoose';

export interface Comment {
  id: string;
  mediaId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export interface CommentDocument extends Omit<Comment, 'id' | 'mediaId'> {
  _id: Types.ObjectId;
  mediaId: Types.ObjectId;
} 