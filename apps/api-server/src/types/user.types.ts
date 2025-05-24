import { Types } from 'mongoose';

export interface User {
    username: string;
    passwordHash: string;
}

export interface UserDocument extends User {
    _id: Types.ObjectId;
  }
