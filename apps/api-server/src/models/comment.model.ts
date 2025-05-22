import mongoose from 'mongoose';
import type { CommentDocument } from '../types/comment.types';

const commentSchema = new mongoose.Schema<CommentDocument>({
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create an index for faster comment lookups by imageId
commentSchema.index({ imageId: 1 });

// Transform the document to match Comment interface
commentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(_doc, ret) {
    ret.id = ret._id.toString();
    ret.imageId = ret.imageId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const CommentModel = mongoose.model<CommentDocument>('Comment', commentSchema); 