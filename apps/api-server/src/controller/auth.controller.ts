import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

export const JWT_SECRET = process.env.JWT_SECRET || 'mocksecret';

export async function register(req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({message: "Username and Password is required"})
    }
    const existingUser = await UserModel.findOne({ username })
    if (existingUser) {
        return res.status(400).json({ message: "User already exists"})
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await UserModel.create({username, passwordHash})

    return res.status(201).json({username: username, id: user._id})
}

export async function login(req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({message: "Username and Password is required"})
    }
    const existingUser = await UserModel.findOne({ username })
    if (!existingUser) {
        return res.status(401).json({ message: "User does not exist"})
    }
    const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid Credentials. Please try again"})
    }
    const token = jwt.sign({ id: existingUser._id, username: username}, JWT_SECRET, { expiresIn: '2h'})
    return res.json({ token, username: username });

}