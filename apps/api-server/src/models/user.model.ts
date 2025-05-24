import mongoose from 'mongoose';
import { UserDocument } from '../types/user.types';

const userSchema = new mongoose.Schema<UserDocument>({
    username: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
});

export const UserModel = mongoose.model('User', userSchema);