import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from './main';
import { MediaModel } from './models/media.model';
import { CommentModel } from './models/comment.model';
import { UserModel } from './models/user.model';
import { JWT_SECRET } from './controller/auth.controller'; // or wherever your secret is defined

describe('API Routes', () => {
  let mongoServer: MongoMemoryServer;
  let mockToken = 'mocktoken';

  beforeAll(async () => {
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await MediaModel.deleteMany({});
    await CommentModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello API. Use /media to get media.' });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app).get('/media');
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/media')
        .set('Authorization', 'Bearer invalidtoken');
      expect(response.status).toBe(403);
    });
  });

  describe('GET /media', () => {
    beforeEach(async () => {
      // Add some test media
      await MediaModel.create([
        {
          url: 'https://test1.com/image.jpg',
          title: 'Test Media 1',
          description: 'Description 1'
        },
        {
          url: 'https://test2.com/image.jpg',
          title: 'Test Media 2',
          description: 'Description 2'
        }
      ]);

      // Create a test user
      const testUser = await UserModel.create({
        username: 'testuser',
        passwordHash: 'testhash' // hash not needed if JWT is mocked directly
      });

      // Generate a JWT for this user
      mockToken = jwt.sign({ id: testUser._id, username: testUser.username }, JWT_SECRET, {
        expiresIn: '1h'
      });
    });

    it('should return paginated media', async () => {
      const response = await request(app)
        .get('/media')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('url');
      expect(response.body.data[0]).toHaveProperty('title');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/media?page=1&limit=1')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe('GET /media/:mediaId', () => {
    let testMedia: any;

    beforeEach(async () => {
      testMedia = await MediaModel.create({
        url: 'https://test.com/image.jpg',
        title: 'Test Media',
        description: 'Test Description'
      });

      await CommentModel.create({
        mediaId: testMedia._id,
        userId: '123',
        username: 'testuser',
        text: 'Test comment',
        timestamp: new Date()
      });
    });

    it('should return media with comments', async () => {
      const response = await request(app)
        .get(`/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.title).toBe('Test Media');
    });

    it('should return 404 for non-existent media', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/media/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /media/:mediaId/comments', () => {
    let testMedia: any;

    beforeEach(async () => {
      testMedia = await MediaModel.create({
        url: 'https://test.com/image.jpg',
        title: 'Test Media',
        description: 'Test Description'
      });
    });

    it('should add a new comment', async () => {
      const response = await request(app)
        .post(`/media/${testMedia._id}/comments`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ text: 'New comment' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toBe('New comment');
      expect(response.body.username).toBe('testuser');
    });

    it('should reject empty comments', async () => {
      const response = await request(app)
        .post(`/media/${testMedia._id}/comments`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ text: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /media/:mediaId/description', () => {
    let testMedia: any;

    beforeEach(async () => {
      testMedia = await MediaModel.create({
        url: 'https://test.com/image.jpg',
        title: 'Test Media',
        description: 'Original description'
      });
    });

    it('should update media description', async () => {
      const newDescription = 'Updated description';
      const response = await request(app)
        .put(`/media/${testMedia._id}/description`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ description: newDescription });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(newDescription);
    });

    it('should reject invalid description', async () => {
      const response = await request(app)
        .put(`/media/${testMedia._id}/description`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ description: null });

      expect(response.status).toBe(400);
    });
  });
}); 