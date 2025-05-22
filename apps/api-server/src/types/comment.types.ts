import { Types } from 'mongoose';

export interface Comment {
  id: string;
  imageId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export interface CommentDocument extends Omit<Comment, 'id' | 'imageId'> {
  _id: Types.ObjectId;
  imageId: Types.ObjectId;
} 