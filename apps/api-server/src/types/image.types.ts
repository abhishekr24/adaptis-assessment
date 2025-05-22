import { Types } from 'mongoose';

export interface Image {
  id: string;
  url: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageDocument extends Omit<Image, 'id'> {
  _id: Types.ObjectId;
} 