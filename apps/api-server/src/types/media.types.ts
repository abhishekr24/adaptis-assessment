import { Types } from 'mongoose';

export interface Media {
  id: string;
  url: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  mediaType: 'image' | 'video';
}

export interface MediaDocument extends Omit<Media, 'id'> {
  _id: Types.ObjectId;
} 