import mongoose from 'mongoose';
import type { ImageDocument } from '../types/image.types';

const imageSchema = new mongoose.Schema<ImageDocument>({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
imageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Transform the document to match Image interface
imageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ImageModel = mongoose.model<ImageDocument>('Image', imageSchema); 