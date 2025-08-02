import '../../test/setup.js'; // Must be first to ensure mocks are set up
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';
import { DatabaseConnection } from '../../config/database.js';
import { Song } from '../../models/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createAuthHeader, MOCK_USER_IDS } from '../../test/clerk-helpers.js';

describe('Songs API', () => {
  let mongoServer: MongoMemoryServer;
  let db: DatabaseConnection;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    db = DatabaseConnection.getInstance();
    await db.connect(mongoUri);
    
    // Ensure text indexes are created for search functionality
    await Song.createIndexes();
  }, 10000); // 10 second timeout for database setup

  afterAll(async () => {
    // Clean up
    await db.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Song.deleteMany({});
  });

  describe('GET /api/songs', () => {
    it('returns paginated results', async () => {
      // Create test songs
      const testSongs = [
        {
          title: 'Amazing Grace',
          artist: 'John Newton',
          key: 'G',
          difficulty: 'intermediate',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        },
        {
          title: 'How Great Thou Art',
          artist: 'Carl Boberg',
          slug: 'how-great-thou-art-cb-67890',
          key: 'A',
          difficulty: 'beginner',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        }
      ];

      await Song.insertMany(testSongs);

      const response = await request(app)
        .get('/api/songs?page=1&limit=20')
        .expect(200);

      expect(response.body).toMatchObject({
        songs: expect.arrayContaining([
          expect.objectContaining({
            title: 'Amazing Grace',
            artist: 'John Newton'
          }),
          expect.objectContaining({
            title: 'How Great Thou Art',
            artist: 'Carl Boberg'
          })
        ]),
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      });
    });

    it('filters by key', async () => {
      const testSongs = [
        {
          title: 'Song in G',
          key: 'G',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        },
        {
          title: 'Song in A',
          slug: 'song-in-a-67890',
          key: 'A',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        }
      ];

      await Song.insertMany(testSongs);

      const response = await request(app)
        .get('/api/songs?key=G')
        .expect(200);

      expect(response.body.songs).toHaveLength(1);
      expect(response.body.songs[0].title).toBe('Song in G');
    });

    it('filters by difficulty', async () => {
      const testSongs = [
        {
          title: 'Easy Song',
          difficulty: 'beginner',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        },
        {
          title: 'Hard Song',
          slug: 'hard-song-67890',
          difficulty: 'advanced',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        }
      ];

      await Song.insertMany(testSongs);

      const response = await request(app)
        .get('/api/songs?difficulty=beginner')
        .expect(200);

      expect(response.body.songs).toHaveLength(1);
      expect(response.body.songs[0].title).toBe('Easy Song');
    });

    it('supports text search', async () => {
      const testSongs = [
        {
          title: 'Amazing Grace',
          artist: 'John Newton',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        },
        {
          title: 'Great is Thy Faithfulness',
          artist: 'Thomas Chisholm',
          slug: 'great-is-thy-faithfulness-tc-67890',
          metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
        }
      ];

      await Song.insertMany(testSongs);

      const response = await request(app)
        .get('/api/songs?q=grace')
        .expect(200);

      expect(response.body.songs).toHaveLength(1);
      expect(response.body.songs[0].title).toBe('Amazing Grace');
    });

    it('handles pagination correctly', async () => {
      // Create 25 test songs
      const testSongs = Array.from({ length: 25 }, (_, i) => ({
        title: `Song ${i + 1}`,
        slug: `song-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
        metadata: { isPublic: true, ratings: { average: 0, count: 0 }, views: 0 }
      }));

      await Song.insertMany(testSongs);

      // Test first page
      const page1 = await request(app)
        .get('/api/songs?page=1&limit=10')
        .expect(200);

      expect(page1.body.songs).toHaveLength(10);
      expect(page1.body.pagination.hasNext).toBe(true);
      expect(page1.body.pagination.hasPrev).toBe(false);

      // Test second page
      const page2 = await request(app)
        .get('/api/songs?page=2&limit=10')
        .expect(200);

      expect(page2.body.songs).toHaveLength(10);
      expect(page2.body.pagination.hasNext).toBe(true);
      expect(page2.body.pagination.hasPrev).toBe(true);
    });
  });

  describe('GET /api/songs/:slug', () => {
    it('returns song by slug', async () => {
      const testSong = await Song.create({
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        _directChordData: 'test chord data', // Use _directChordData to trigger automatic compression
        metadata: { isPublic: true, ratings: { average: 4.5, count: 10 }, views: 100 }
      });

      const response = await request(app)
        .get(`/api/songs/${testSong.slug}`)
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Amazing Grace',
        artist: 'John Newton',
        slug: testSong.slug, // Use the generated slug
        key: 'G'
      });

      expect(response.body.chordData).toBeDefined();
      expect(response.body._id).toBe(testSong._id?.toString());
    });

    it('returns 404 for non-existent song', async () => {
      const response = await request(app)
        .get('/api/songs/non-existent-slug')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Song not found',
        code: 'NOT_FOUND'
      });
    });

    it('hides private songs from unauthenticated users', async () => {
      const privateSong = await Song.create({
        title: 'Private Song',
        metadata: { 
          isPublic: false, 
          ratings: { average: 0, count: 0 }, 
          views: 0,
          createdBy: MOCK_USER_IDS.REGULAR_USER.toString()
        }
      });

      const response = await request(app)
        .get(`/api/songs/${privateSong.slug}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Song not found',
        code: 'NOT_FOUND'
      });
    });

    it('shows private songs to authenticated users who own them', async () => {
      const privateSong = await Song.create({
        title: 'My Private Song',
        key: 'C',
        metadata: { 
          isPublic: false, 
          ratings: { average: 0, count: 0 }, 
          views: 0,
          createdBy: MOCK_USER_IDS.REGULAR_USER.toString()
        }
      });

      const response = await request(app)
        .get(`/api/songs/${privateSong.slug}`)
        .set(createAuthHeader('REGULAR_USER'))
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'My Private Song',
        slug: privateSong.slug,
        key: 'C'
      });
    });
  });

  describe('Validation', () => {
    it('validates pagination parameters', async () => {
      const response = await request(app)
        .get('/api/songs?page=0&limit=101')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('validates difficulty filter', async () => {
      const response = await request(app)
        .get('/api/songs?difficulty=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication & Authorization', () => {
    it('allows authenticated users to access their content', async () => {
      // Create a song owned by the regular user
      const userSong = await Song.create({
        title: 'User Song',
        key: 'D',
        metadata: { 
          isPublic: true, 
          ratings: { average: 0, count: 0 }, 
          views: 0,
          createdBy: MOCK_USER_IDS.REGULAR_USER.toString()
        }
      });

      const response = await request(app)
        .get(`/api/songs/${userSong.slug}`)
        .set(createAuthHeader('REGULAR_USER'))
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'User Song',
        key: 'D'
      });
    });

    it('tracks different user permissions correctly', async () => {
      // Test that different users see appropriate content
      const adminSong = await Song.create({
        title: 'Admin Only Song',
        metadata: { 
          isPublic: false, 
          ratings: { average: 0, count: 0 }, 
          views: 0,
          createdBy: MOCK_USER_IDS.ADMIN_USER.toString()
        }
      });

      // Regular user cannot see admin's private song
      await request(app)
        .get(`/api/songs/${adminSong.slug}`)
        .set(createAuthHeader('REGULAR_USER'))
        .expect(404);

      // Admin can see their own private song
      await request(app)
        .get(`/api/songs/${adminSong.slug}`)
        .set(createAuthHeader('ADMIN_USER'))
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should be disabled in test environment', async () => {
      // Make multiple requests quickly - should all succeed due to mocking
      const requests = Array.from({ length: 3 }, () =>
        request(app).get('/api/songs')
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (no rate limiting in tests)
      responses.forEach(response => {
        expect(response.status).not.toBe(429);
      });
    });
  });
});