import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mediaRoutes from './routes/media.routes';
import { authenticateToken } from './middleware/auth.middleware';
import { initializeDatabase } from './db/initialize';
import authRoutes from './routes/auth.routes';

dotenv.config();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const db = process.env.MONGO_URI || 'mongodb://localhost:27017/mediagallery';
const pexelsAPIKey = process.env.PEXELS_API_KEY ?? ""
console.log(`connecting to ${db}`);

export const app = express();

app.use(express.json());
app.use(cors());

MongoMemoryServer.create().then((mongoServer) => {
  const db = mongoServer.getUri();
  mongoose.connect(db)
    .then(() => console.log('MongoDB connected to', db))
    .catch(err => console.error('MongoDB connection error:', err));
});

initializeDatabase(pexelsAPIKey);

app.get('/', (_, res) => res.send({ message: 'Hello API. Use /media to get media.' }));
app.use('/auth', authRoutes);
app.use('/media', authenticateToken, mediaRoutes)

app.listen(port, host, () => {
  console.log(`[ ready ] API server listening on http://${host}:${port}`);
});
