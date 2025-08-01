import express from 'express';
import { Setlist, Song, Arrangement } from '../models';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateSchema, commonSchemas } from '../middleware/validation';
import { z } from 'zod';
import { Types } from 'mongoose';

const router = express.Router();

// Validation schemas
const setlistItemSchema = z.object({
  songId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID'),
  arrangementId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid arrangement ID').optional(),
  transpose: z.number().int().min(-11).max(11).default(0),
  notes: z.string().optional(),
  order: z.number().int().min(0)
});

const createSetlistSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().optional(),
  songs: z.array(setlistItemSchema).default([]),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

const updateSetlistSchema = createSetlistSchema.partial();

const reorderSongsSchema = z.object({
  songOrder: z.array(z.object({
    songId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID'),
    order: z.number().int().min(0)
  }))
});

/**
 * GET /api/setlists - Get user's setlists
 */
router.get('/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.auth!.userId;
      
      const setlists = await Setlist.find({ createdBy: userId })
        .populate({
          path: 'songs.songId',
          select: 'title artist key tempo difficulty'
        })
        .populate({
          path: 'songs.arrangementId',
          select: 'name key difficulty'
        })
        .sort({ 'metadata.lastUsedAt': -1, updatedAt: -1 });
      
      res.json({ setlists });
    } catch (error) {
      console.error('Error fetching setlists:', error);
      res.status(500).json({
        error: 'Failed to fetch setlists',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/setlists/:id - Get single setlist (owner only)
 */
router.get('/:id',
  requireAuth,
  validateSchema(z.object({ id: commonSchemas.mongoId }), 'params'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth!.userId;
      
      const setlist = await Setlist.findOne({ _id: id, createdBy: userId })
        .populate({
          path: 'songs.songId',
          select: 'title artist slug key tempo difficulty metadata.ratings'
        })
        .populate({
          path: 'songs.arrangementId',
          select: 'name key tempo difficulty metadata.ratings'
        })
        .populate('createdBy', 'firstName lastName');
      
      if (!setlist) {
        return res.status(404).json({
          error: 'Setlist not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Update last used timestamp
      setlist.metadata.lastUsedAt = new Date();
      await setlist.save();
      
      res.json(setlist);
    } catch (error) {
      console.error('Error fetching setlist:', error);
      res.status(500).json({
        error: 'Failed to fetch setlist',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/setlists/share/:shareToken - Get public setlist by share token
 */
router.get('/share/:shareToken',
  optionalAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { shareToken } = req.params;
      
      const setlist = await Setlist.findOne({
        'metadata.shareToken': shareToken,
        'metadata.isPublic': true
      })
        .populate({
          path: 'songs.songId',
          select: 'title artist slug key tempo difficulty metadata.ratings'
        })
        .populate({
          path: 'songs.arrangementId',
          select: 'name key tempo difficulty metadata.ratings'
        })
        .populate('createdBy', 'firstName lastName');
      
      if (!setlist) {
        return res.status(404).json({
          error: 'Setlist not found or not public',
          code: 'NOT_FOUND'
        });
      }
      
      // Increment usage count
      setlist.metadata.usageCount += 1;
      setlist.metadata.lastUsedAt = new Date();
      await setlist.save();
      
      res.json(setlist);
    } catch (error) {
      console.error('Error fetching shared setlist:', error);
      res.status(500).json({
        error: 'Failed to fetch setlist',
        code: 'FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/setlists - Create new setlist
 */
router.post('/',
  requireAuth,
  validateSchema(createSetlistSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const setlistData = req.body as z.infer<typeof createSetlistSchema>;
      const userId = req.auth!.userId;
      
      // Verify all songs exist
      if (setlistData.songs.length > 0) {
        const songIds = setlistData.songs.map(item => new Types.ObjectId(item.songId));
        const songs = await Song.find({ _id: { $in: songIds } });
        
        if (songs.length !== new Set(songIds.map(id => id.toString())).size) {
          return res.status(400).json({
            error: 'One or more songs not found',
            code: 'INVALID_SONGS'
          });
        }
        
        // Verify arrangements exist if specified
        const arrangementIds = setlistData.songs
          .filter(item => item.arrangementId)
          .map(item => new Types.ObjectId(item.arrangementId!));
        
        if (arrangementIds.length > 0) {
          const arrangements = await Arrangement.find({ _id: { $in: arrangementIds } });
          if (arrangements.length !== arrangementIds.length) {
            return res.status(400).json({
              error: 'One or more arrangements not found',
              code: 'INVALID_ARRANGEMENTS'
            });
          }
        }
      }
      
      const setlist = new Setlist({
        name: setlistData.name,
        description: setlistData.description,
        createdBy: userId,
        songs: setlistData.songs.map(item => ({
          songId: new Types.ObjectId(item.songId),
          arrangementId: item.arrangementId ? new Types.ObjectId(item.arrangementId) : undefined,
          transpose: item.transpose,
          notes: item.notes,
          order: item.order
        })),
        tags: setlistData.tags,
        metadata: {
          isPublic: setlistData.isPublic,
          shareToken: setlistData.isPublic ? Math.random().toString(36).substring(2, 15) : undefined,
          usageCount: 0
        }
      });
      
      await setlist.save();
      
      // Populate and return
      await setlist.populate({
        path: 'songs.songId',
        select: 'title artist slug key tempo difficulty'
      });
      await setlist.populate({
        path: 'songs.arrangementId',
        select: 'name key difficulty'
      });
      
      res.status(201).json(setlist);
    } catch (error) {
      console.error('Error creating setlist:', error);
      res.status(500).json({
        error: 'Failed to create setlist',
        code: 'CREATE_ERROR'
      });
    }
  }
);

/**
 * PUT /api/setlists/:id - Update setlist
 */
router.put('/:id',
  requireAuth,
  validateSchema(z.object({ id: commonSchemas.mongoId }), 'params'),
  validateSchema(updateSetlistSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body as z.infer<typeof updateSetlistSchema>;
      const userId = req.auth!.userId;
      
      const setlist = await Setlist.findOne({ _id: id, createdBy: userId });
      
      if (!setlist) {
        return res.status(404).json({
          error: 'Setlist not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Update basic fields
      if (updateData.name) setlist.name = updateData.name;
      if (updateData.description !== undefined) setlist.description = updateData.description;
      if (updateData.tags) setlist.tags = updateData.tags;
      
      // Update public status
      if (updateData.isPublic !== undefined) {
        setlist.metadata.isPublic = updateData.isPublic;
        
        // Generate share token if making public for the first time
        if (updateData.isPublic && !setlist.metadata.shareToken) {
          setlist.metadata.shareToken = Math.random().toString(36).substring(2, 15);
        }
      }
      
      // Update songs if provided
      if (updateData.songs) {
        // Verify all songs exist
        const songIds = updateData.songs.map(item => new Types.ObjectId(item.songId));
        const songs = await Song.find({ _id: { $in: songIds } });
        
        if (songs.length !== new Set(songIds.map(id => id.toString())).size) {
          return res.status(400).json({
            error: 'One or more songs not found',
            code: 'INVALID_SONGS'
          });
        }
        
        setlist.songs = updateData.songs.map(item => ({
          songId: new Types.ObjectId(item.songId),
          arrangementId: item.arrangementId ? new Types.ObjectId(item.arrangementId) : undefined,
          transpose: item.transpose || 0,
          notes: item.notes,
          order: item.order
        }));
      }
      
      await setlist.save();
      
      // Populate and return
      await setlist.populate({
        path: 'songs.songId',
        select: 'title artist slug key tempo difficulty'
      });
      await setlist.populate({
        path: 'songs.arrangementId',
        select: 'name key difficulty'
      });
      
      res.json(setlist);
    } catch (error) {
      console.error('Error updating setlist:', error);
      res.status(500).json({
        error: 'Failed to update setlist',
        code: 'UPDATE_ERROR'
      });
    }
  }
);

/**
 * POST /api/setlists/:id/reorder - Reorder songs in setlist
 */
router.post('/:id/reorder',
  requireAuth,
  validateSchema(z.object({ id: commonSchemas.mongoId }), 'params'),
  validateSchema(reorderSongsSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { songOrder } = req.body as z.infer<typeof reorderSongsSchema>;
      const userId = req.auth!.userId;
      
      const setlist = await Setlist.findOne({ _id: id, createdBy: userId });
      
      if (!setlist) {
        return res.status(404).json({
          error: 'Setlist not found',
          code: 'NOT_FOUND'
        });
      }
      
      // Update song order
      setlist.songs.forEach(song => {
        const orderUpdate = songOrder.find(o => o.songId === song.songId.toString());
        if (orderUpdate) {
          song.order = orderUpdate.order;
        }
      });
      
      // Sort songs by new order
      setlist.songs.sort((a, b) => a.order - b.order);
      
      await setlist.save();
      
      res.json({ success: true, message: 'Songs reordered successfully' });
    } catch (error) {
      console.error('Error reordering setlist:', error);
      res.status(500).json({
        error: 'Failed to reorder setlist',
        code: 'REORDER_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/setlists/:id - Delete setlist
 */
router.delete('/:id',
  requireAuth,
  validateSchema(z.object({ id: commonSchemas.mongoId }), 'params'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth!.userId;
      
      const result = await Setlist.findOneAndDelete({ _id: id, createdBy: userId });
      
      if (!result) {
        return res.status(404).json({
          error: 'Setlist not found',
          code: 'NOT_FOUND'
        });
      }
      
      res.json({ success: true, message: 'Setlist deleted successfully' });
    } catch (error) {
      console.error('Error deleting setlist:', error);
      res.status(500).json({
        error: 'Failed to delete setlist',
        code: 'DELETE_ERROR'
      });
    }
  }
);

export default router;