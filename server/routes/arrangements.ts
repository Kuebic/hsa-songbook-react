import express from 'express';
import { Arrangement, Song } from '../models';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateSchema, commonSchemas } from '../middleware/validation';
import { z } from 'zod';
import { Types } from 'mongoose';

const router = express.Router();

// Validation schemas
const createArrangementSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  songIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID')).min(1).max(5),
  chordData: z.string(),
  key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']).optional(),
  tempo: z.number().int().min(40).max(200).optional(),
  timeSignature: z.string().default('4/4'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mashupSections: z.array(z.object({
    songId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID'),
    title: z.string(),
    startBar: z.number().int().min(1).optional(),
    endBar: z.number().int().min(1).optional()
  })).optional()
});

const updateArrangementSchema = createArrangementSchema.partial();

/**
 * GET /api/arrangements/:songId - List arrangements for a specific song
 */
router.get('/:songId',
  optionalAuth,
  validateSchema(z.object({ songId: commonSchemas.mongoId }), 'params'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { songId } = req.params;
      
      // Verify song exists
      const song = await Song.findById(songId);
      if (!song) {
        return res.status(404).json({
          error: 'Song not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Build query - find arrangements that include this song
      const query: Record<string, unknown> = {
        songIds: new Types.ObjectId(songId)
      };
      
      // Only show public arrangements unless user is authenticated
      if (!req.auth?.userId) {
        query['metadata.isPublic'] = { $ne: false };
      }
      
      const arrangements = await Arrangement.find(query)
        .populate('songIds', 'title artist slug')
        .populate('createdBy', 'firstName lastName')
        .select('-chordData') // Don't include heavy chord data in list view
        .sort({ 'metadata.ratings.average': -1, createdAt: -1 })
        .lean();
      
      res.json({ arrangements });
    } catch (error) {
      console.error('Error fetching arrangements:', error);
      res.status(500).json({
        error: 'Failed to fetch arrangements',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/arrangements/single/:id - Get single arrangement with full data
 */
router.get('/single/:id',
  optionalAuth,
  validateSchema(z.object({ id: commonSchemas.mongoId }), 'params'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const arrangement = await Arrangement.findById(id)
        .populate('songIds', 'title artist slug')
        .populate('createdBy', 'firstName lastName');
      
      if (!arrangement) {
        return res.status(404).json({
          error: 'Arrangement not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Check if user can access private arrangements
      if (arrangement.metadata?.isPublic === false && !req.auth?.userId) {
        return res.status(404).json({
          error: 'Arrangement not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Get decompressed chord data
      const chordData = await arrangement.getDecompressedChordData();
      
      // Increment view count if user is viewing
      if (req.auth?.userId) {
        await Arrangement.findByIdAndUpdate(arrangement._id, {
          $inc: { 'metadata.views': 1 }
        });
      }
      
      const arrangementData = arrangement.toObject();
      delete arrangementData.chordData; // Remove compressed buffer
      
      res.json({
        ...arrangementData,
        chordData // Include decompressed chord data
      });
    } catch (error) {
      console.error('Error fetching arrangement:', error);
      res.status(500).json({
        error: 'Failed to fetch arrangement',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/arrangements - Create new arrangement
 */
router.post('/',
  requireAuth,
  validateSchema(createArrangementSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const arrangementData = req.body as z.infer<typeof createArrangementSchema>;
      
      // Verify all songs exist
      const songIds = arrangementData.songIds.map(id => new Types.ObjectId(id));
      const songs = await Song.find({ _id: { $in: songIds } });
      
      if (songs.length !== songIds.length) {
        return res.status(400).json({
          error: 'One or more songs not found',
          code: 'INVALID_SONGS'
        });
      }
      
      // Determine if this is a mashup
      const isMashup = songIds.length > 1;
      
      // Create arrangement
      const arrangement = new Arrangement({
        name: arrangementData.name,
        songIds: songIds,
        createdBy: req.auth!.userId,
        key: arrangementData.key,
        tempo: arrangementData.tempo,
        timeSignature: arrangementData.timeSignature,
        difficulty: arrangementData.difficulty,
        description: arrangementData.description,
        tags: arrangementData.tags,
        metadata: {
          isMashup,
          mashupSections: arrangementData.mashupSections?.map(section => ({
            songId: new Types.ObjectId(section.songId),
            title: section.title,
            startBar: section.startBar,
            endBar: section.endBar
          })),
          isPublic: true,
          ratings: { average: 0, count: 0 },
          views: 0
        }
      });
      
      // Set compressed chord data
      arrangement.setChordData(arrangementData.chordData);
      
      await arrangement.save();
      
      // Populate and return
      await arrangement.populate('songIds', 'title artist slug');
      await arrangement.populate('createdBy', 'firstName lastName');
      
      const responseData = arrangement.toObject();
      delete responseData.chordData;
      
      res.status(201).json({
        ...responseData,
        chordData: arrangementData.chordData // Return original uncompressed
      });
    } catch (error) {
      console.error('Error creating arrangement:', error);
      res.status(500).json({
        error: 'Failed to create arrangement',
        code: 'CREATE_ERROR'
      });
    }
  }
);

/**
 * PUT /api/arrangements/:id - Update arrangement
 */
router.put('/:id',
  requireAuth,
  validateSchema(z.object({ id: commonSchemas.mongoId }), 'params'),
  validateSchema(updateArrangementSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body as z.infer<typeof updateArrangementSchema>;
      
      const arrangement = await Arrangement.findById(id);
      
      if (!arrangement) {
        return res.status(404).json({
          error: 'Arrangement not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Check permissions - only owner or admin can edit
      const userRole = req.auth!.sessionClaims?.metadata?.role || 'member';
      const isOwner = arrangement.createdBy.toString() === req.auth!.userId;
      
      if (!isOwner && userRole !== 'admin') {
        return res.status(403).json({
          error: 'Permission denied - only arrangement owner or admin can edit',
          code: 'FORBIDDEN'
        });
      }
      
      // If songIds are being updated, verify they exist
      if (updateData.songIds) {
        const songIds = updateData.songIds.map(id => new Types.ObjectId(id));
        const songs = await Song.find({ _id: { $in: songIds } });
        
        if (songs.length !== songIds.length) {
          return res.status(400).json({
            error: 'One or more songs not found',
            code: 'INVALID_SONGS'
          });
        }
        
        arrangement.songIds = songIds;
        arrangement.metadata.isMashup = songIds.length > 1;
      }
      
      // Update other fields
      if (updateData.name) arrangement.name = updateData.name;
      if (updateData.key) arrangement.key = updateData.key;
      if (updateData.tempo) arrangement.tempo = updateData.tempo;
      if (updateData.timeSignature) arrangement.timeSignature = updateData.timeSignature;
      if (updateData.difficulty) arrangement.difficulty = updateData.difficulty;
      if (updateData.description !== undefined) arrangement.description = updateData.description;
      if (updateData.tags) arrangement.tags = updateData.tags;
      
      // Update mashup sections if provided
      if (updateData.mashupSections) {
        arrangement.metadata.mashupSections = updateData.mashupSections.map(section => ({
          songId: new Types.ObjectId(section.songId),
          title: section.title,
          startBar: section.startBar,
          endBar: section.endBar
        }));
      }
      
      // Update chord data if provided
      if (updateData.chordData) {
        arrangement.setChordData(updateData.chordData);
      }
      
      await arrangement.save();
      
      // Populate and return
      await arrangement.populate('songIds', 'title artist slug');
      await arrangement.populate('createdBy', 'firstName lastName');
      
      const responseData = arrangement.toObject();
      delete responseData.chordData;
      
      res.json({
        ...responseData,
        chordData: updateData.chordData || await arrangement.getDecompressedChordData()
      });
    } catch (error) {
      console.error('Error updating arrangement:', error);
      res.status(500).json({
        error: 'Failed to update arrangement',
        code: 'UPDATE_ERROR'
      });
    }
  }
);

export default router;