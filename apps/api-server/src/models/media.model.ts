import mongoose from 'mongoose';
import type { MediaDocument } from '../types/media.types';

const mediaSchema = new mongoose.Schema<MediaDocument>({
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
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  tags: {
    type: [String],
    default: [],
  },
});

// Update the updatedAt timestamp before saving
mediaSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Transform the document to match media interface
mediaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const MediaModel = mongoose.model<MediaDocument>('Media', mediaSchema); 