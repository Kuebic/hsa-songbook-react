import express from 'express';
import { Song } from '../models';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateSchema, commonSchemas } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createSongSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  artist: z.string().max(100).trim().optional(),
  chordData: z.string().optional(),
  key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']).optional(),
  tempo: z.number().int().min(40).max(200).optional(),
  timeSignature: z.string().default('4/4'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  themes: z.array(z.string()).optional(),
  source: z.string().optional(),
  lyrics: z.string().optional(),
  notes: z.string().optional()
});

const updateSongSchema = createSongSchema.partial();

const searchQuerySchema = z.object({
  q: z.string().optional(),
  key: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  themes: z.string().optional(), // comma-separated
  artist: z.string().optional(),
  sort: z.enum(['title', 'artist', 'createdAt', 'rating', 'popularity']).default('title'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

/**
 * GET /api/songs - List songs with pagination and filtering
 */
router.get('/', 
  optionalAuth,
  validateSchema(searchQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { q, key, difficulty, themes, artist, sort, order, page, limit } = req.query as z.infer<typeof searchQuerySchema>;
      
      // Build search query
      const query: Record<string, unknown> = {};
      
      // Text search
      if (q) {
        query.$text = { $search: q };
      }
      
      // Filters
      if (key) query.key = key;
      if (difficulty) query.difficulty = difficulty;
      if (artist) query.artist = { $regex: artist, $options: 'i' };
      if (themes) {
        const themeArray = themes.split(',').map(t => t.trim());
        query.themes = { $in: themeArray };
      }
      
      // Only show public songs unless user is authenticated
      if (!req.auth?.userId) {
        query['metadata.isPublic'] = { $ne: false };
      }
      
      // Build sort options
      const sortOptions: Record<string, unknown> = {};
      if (sort === 'rating') {
        sortOptions['metadata.ratings.average'] = order === 'desc' ? -1 : 1;
      } else if (sort === 'popularity') {
        sortOptions['metadata.views'] = order === 'desc' ? -1 : 1;
      } else {
        sortOptions[sort] = order === 'desc' ? -1 : 1;
      }
      
      // Add text score for relevance sorting
      if (q) {
        sortOptions.score = { $meta: 'textScore' };
      }
      
      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [songs, total] = await Promise.all([
        Song.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .select('-chordData') // Don't include heavy chord data in list view
          .lean(),
        Song.countDocuments(query)
      ]);
      
      res.json({
        songs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({
        error: 'Failed to fetch songs',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/songs/:slug - Get single song with arrangements
 */
router.get('/:slug',
  optionalAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { slug } = req.params;
      
      const song = await Song.findOne({ slug });
      
      if (!song) {
        return res.status(404).json({
          error: 'Song not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Check if user can access private songs
      if (song.metadata?.isPublic === false && !req.auth?.userId) {
        return res.status(404).json({
          error: 'Song not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Get decompressed chord data
      const chordData = await song.getDecompressedChordData();
      
      // Increment view count if user is viewing
      if (req.auth?.userId) {
        await Song.findByIdAndUpdate(song._id, {
          $inc: { 'metadata.views': 1 }
        });
      }
      
      const songData = song.toObject();
      delete songData.chordData; // Remove compressed buffer
      
      res.json({
        ...songData,
        chordData // Include decompressed chord data
      });
    } catch (error) {
      console.error('Error fetching song:', error);
      res.status(500).json({
        error: 'Failed to fetch song',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/songs - Create new song (auth required)
 */
router.post('/',
  requireAuth,
  validateSchema(createSongSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const songData = req.body as z.infer<typeof createSongSchema>;
      
      // Create new song with metadata
      const song = new Song({
        ...songData,
        metadata: {
          createdBy: req.auth!.userId,
          lastModifiedBy: req.auth!.userId,
          isPublic: true,
          ratings: { average: 0, count: 0 },
          views: 0
        }
      });
      
      // Set chord data if provided (this will compress it)
      if (songData.chordData) {
        song.setChordData(songData.chordData);
      }
      
      // Generate unique slug
      song.slug = await song.generateSlug();
      
      await song.save();
      
      // Return without compressed chord data
      const responseData = song.toObject();
      delete responseData.chordData;
      
      res.status(201).json({
        ...responseData,
        chordData: songData.chordData // Return original uncompressed
      });
    } catch (error) {
      console.error('Error creating song:', error);
      
      if ((error as { code?: number }).code === 11000) {
        return res.status(409).json({
          error: 'Song with this title and artist already exists',
          code: 'DUPLICATE_SONG'
        });
      }
      
      res.status(500).json({
        error: 'Failed to create song',
        code: 'CREATE_ERROR'
      });
    }
  }
);

/**
 * PUT /api/songs/:id - Update song (owner/admin only)
 */
router.put('/:id',
  requireAuth,
  validateSchema(commonSchemas.mongoId, 'params'),
  validateSchema(updateSongSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body as z.infer<typeof updateSongSchema>;
      
      const song = await Song.findById(id);
      
      if (!song) {
        return res.status(404).json({
          error: 'Song not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Check permissions - only owner or admin can edit
      const userRole = req.auth!.sessionClaims?.metadata?.role || 'member';
      const isOwner = song.metadata?.createdBy?.toString() === req.auth!.userId;
      
      if (!isOwner && userRole !== 'admin') {
        return res.status(403).json({
          error: 'Permission denied - only song owner or admin can edit',
          code: 'FORBIDDEN'
        });
      }
      
      // Update fields
      Object.assign(song, updateData);
      
      // Update chord data if provided
      if (updateData.chordData) {
        song.setChordData(updateData.chordData);
      }
      
      // Update metadata
      if (song.metadata) {
        song.metadata.lastModifiedBy = req.auth!.userId as unknown as import('mongoose').Types.ObjectId;
      }
      
      await song.save();
      
      // Return updated song
      const responseData = song.toObject();
      delete responseData.chordData;
      
      res.json({
        ...responseData,
        chordData: updateData.chordData || await song.getDecompressedChordData()
      });
    } catch (error) {
      console.error('Error updating song:', error);
      res.status(500).json({
        error: 'Failed to update song',
        code: 'UPDATE_ERROR'
      });
    }
  }
);

export default router;