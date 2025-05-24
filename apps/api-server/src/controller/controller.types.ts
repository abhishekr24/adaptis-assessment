import { Request } from 'express';
import { Comment } from "src/types/comment.types";
import { Media } from "src/types/media.types";

export interface AuthenticatedRequest extends Request {
    user?: { id: string; username: string };
}

export interface PaginatedResponse {
page: number;
limit: number;
totalPages: number;
totalMedia: number;
data: Media[];
}

export interface MediaWithComments extends Media {
  comments: Comment[];
}