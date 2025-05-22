import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from './main';
import { ImageModel } from './models/image.model';
import { CommentModel } from './models/comment.model';

describe('API Routes', () => {
  let mongoServer: MongoMemoryServer;
  const mockToken = 'mocktoken';

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
    await ImageModel.deleteMany({});
    await CommentModel.deleteMany({});
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello API. Use /images to get images.' });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app).get('/images');
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/images')
        .set('Authorization', 'Bearer invalidtoken');
      expect(response.status).toBe(403);
    });
  });

  describe('GET /images', () => {
    beforeEach(async () => {
      // Add some test images
      await ImageModel.create([
        {
          url: 'https://test1.com/image.jpg',
          title: 'Test Image 1',
          description: 'Description 1'
        },
        {
          url: 'https://test2.com/image.jpg',
          title: 'Test Image 2',
          description: 'Description 2'
        }
      ]);
    });

    it('should return paginated images', async () => {
      const response = await request(app)
        .get('/images')
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
        .get('/images?page=1&limit=1')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe('GET /images/:imageId', () => {
    let testImage: any;

    beforeEach(async () => {
      testImage = await ImageModel.create({
        url: 'https://test.com/image.jpg',
        title: 'Test Image',
        description: 'Test Description'
      });

      await CommentModel.create({
        imageId: testImage._id,
        userId: '123',
        username: 'testuser',
        text: 'Test comment',
        timestamp: new Date()
      });
    });

    it('should return image with comments', async () => {
      const response = await request(app)
        .get(`/images/${testImage._id}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.title).toBe('Test Image');
    });

    it('should return 404 for non-existent image', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/images/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /images/:imageId/comments', () => {
    let testImage: any;

    beforeEach(async () => {
      testImage = await ImageModel.create({
        url: 'https://test.com/image.jpg',
        title: 'Test Image',
        description: 'Test Description'
      });
    });

    it('should add a new comment', async () => {
      const response = await request(app)
        .post(`/images/${testImage._id}/comments`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ text: 'New comment' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toBe('New comment');
      expect(response.body.username).toBe('testuser');
    });

    it('should reject empty comments', async () => {
      const response = await request(app)
        .post(`/images/${testImage._id}/comments`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ text: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /images/:imageId/description', () => {
    let testImage: any;

    beforeEach(async () => {
      testImage = await ImageModel.create({
        url: 'https://test.com/image.jpg',
        title: 'Test Image',
        description: 'Original description'
      });
    });

    it('should update image description', async () => {
      const newDescription = 'Updated description';
      const response = await request(app)
        .put(`/images/${testImage._id}/description`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ description: newDescription });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(newDescription);
    });

    it('should reject invalid description', async () => {
      const response = await request(app)
        .put(`/images/${testImage._id}/description`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ description: null });

      expect(response.status).toBe(400);
    });
  });
}); 