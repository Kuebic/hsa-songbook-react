/**
 * @file crud-operations.test.ts
 * @description Tests for CRUD operations on songs and setlists in offline storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CachedSong, CachedSetlist } from '../../types/storage.types';
import { OfflineStorage } from '../../services/offlineStorage';
import { createMockIndexedDB, createMockCachedSong, createMockSetlist } from '../../../test/factories/typeSafeMockFactory';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('OfflineStorage - CRUD Operations', () => {
  let offlineStorage: OfflineStorage;
  let mockDB: ReturnType<typeof createMockIndexedDB>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDB = createMockIndexedDB();
    const { openDB } = await import('idb');
    vi.mocked(openDB).mockResolvedValue(mockDB as unknown as IDBDatabase);
    offlineStorage = new OfflineStorage();
    await offlineStorage.initialize();
  });

  afterEach(async () => {
    if (offlineStorage) {
      await offlineStorage.close();
    }
  });

  describe('Setlist CRUD Operations', () => {
    const mockSetlist = createMockSetlist({
      id: 'setlist-1',
      name: 'Sunday Service',
      description: 'Morning worship setlist',
      songIds: ['song-1', 'song-2'],
      metadata: {
        isPublic: false,
        tags: ['worship', 'sunday'],
        lastUsed: Date.now()
      }
    });

    it('should save setlist locally', async () => {
      const result = await offlineStorage.saveSetlist(mockSetlist);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSetlist.id,
        name: mockSetlist.name,
        description: mockSetlist.description
      }));
      expect(mockDB.put).toHaveBeenCalledWith('setlists', expect.objectContaining({
        id: mockSetlist.id,
        cachedAt: expect.any(Number)
      }));
    });

    it('should retrieve setlist by ID', async () => {
      // Setup: save setlist first
      await offlineStorage.saveSetlist(mockSetlist);
      mockDB.get.mockResolvedValueOnce(mockSetlist);

      const result = await offlineStorage.getSetlist(mockSetlist.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSetlist.id,
        name: mockSetlist.name
      }));
      expect(mockDB.get).toHaveBeenCalledWith('setlists', mockSetlist.id);
    });

    it('should retrieve all setlists', async () => {
      const setlists = [mockSetlist, createMockCachedSetlist({ id: 'setlist-2' })];
      mockDB.getAll.mockResolvedValueOnce(setlists);

      const result = await offlineStorage.getAllSetlists();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockDB.getAll).toHaveBeenCalledWith('setlists');
    });

    it('should update existing setlist', async () => {
      const updatedSetlist = { 
        ...mockSetlist, 
        name: 'Updated Sunday Service',
        updatedAt: Date.now()
      };

      const result = await offlineStorage.saveSetlist(updatedSetlist);
      
      expect(result.success).toBe(true);
      expect(mockDB.put).toHaveBeenCalledWith('setlists', expect.objectContaining({
        name: 'Updated Sunday Service',
        updatedAt: expect.any(Number)
      }));
    });

    it('should delete setlist', async () => {
      mockDB.delete.mockResolvedValueOnce(true);

      const result = await offlineStorage.deleteSetlist(mockSetlist.id);
      
      expect(result.success).toBe(true);
      expect(mockDB.delete).toHaveBeenCalledWith('setlists', mockSetlist.id);
    });

    it('should handle setlist not found', async () => {
      mockDB.get.mockResolvedValueOnce(undefined);

      const result = await offlineStorage.getSetlist('nonexistent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should search setlists by name', async () => {
      const setlists = [
        mockSetlist,
        createMockCachedSetlist({ name: 'Evening Service' }),
        createMockCachedSetlist({ name: 'Sunday Special' })
      ];
      mockDB.getAll.mockResolvedValueOnce(setlists);

      const result = await offlineStorage.searchSetlists({ query: 'Sunday' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(s => s.name.includes('Sunday'))).toBe(true);
    });
  });

  describe('Song CRUD Operations', () => {
    const mockSong = createMockCachedSong({
      id: 'song-1',
      title: 'Amazing Grace',
      artist: 'Traditional',
      key: 'G',
      lyrics: 'Amazing grace, how sweet the sound...'
    });

    it('should save song locally', async () => {
      const result = await offlineStorage.saveSong(mockSong);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSong.id,
        title: mockSong.title,
        artist: mockSong.artist
      }));
      expect(mockDB.put).toHaveBeenCalledWith('songs', expect.objectContaining({
        id: mockSong.id,
        cachedAt: expect.any(Number)
      }));
    });

    it('should retrieve song by ID', async () => {
      mockDB.get.mockResolvedValueOnce(mockSong);

      const result = await offlineStorage.getSong(mockSong.id);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        id: mockSong.id,
        title: mockSong.title
      }));
      expect(mockDB.get).toHaveBeenCalledWith('songs', mockSong.id);
    });

    it('should retrieve all songs', async () => {
      const songs = [mockSong, createMockCachedSong({ id: 'song-2' })];
      mockDB.getAll.mockResolvedValueOnce(songs);

      const result = await offlineStorage.getAllSongs();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockDB.getAll).toHaveBeenCalledWith('songs');
    });

    it('should update existing song', async () => {
      const updatedSong = { 
        ...mockSong, 
        title: 'Amazing Grace (Updated)',
        updatedAt: Date.now()
      };

      const result = await offlineStorage.saveSong(updatedSong);
      
      expect(result.success).toBe(true);
      expect(mockDB.put).toHaveBeenCalledWith('songs', expect.objectContaining({
        title: 'Amazing Grace (Updated)',
        updatedAt: expect.any(Number)
      }));
    });

    it('should delete song', async () => {
      mockDB.delete.mockResolvedValueOnce(true);

      const result = await offlineStorage.deleteSong(mockSong.id);
      
      expect(result.success).toBe(true);
      expect(mockDB.delete).toHaveBeenCalledWith('songs', mockSong.id);
    });

    it('should handle song not found', async () => {
      mockDB.get.mockResolvedValueOnce(undefined);

      const result = await offlineStorage.getSong('nonexistent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should search songs by title', async () => {
      const songs = [
        mockSong,
        createMockCachedSong({ title: 'How Great Thou Art' }),
        createMockCachedSong({ title: 'Amazing Love' })
      ];
      mockDB.getAll.mockResolvedValueOnce(songs);

      const result = await offlineStorage.searchSongs({ query: 'Amazing' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(s => s.title.includes('Amazing'))).toBe(true);
    });

    it('should search songs by key', async () => {
      const songs = [
        mockSong,
        createMockCachedSong({ key: 'C' }),
        createMockCachedSong({ key: 'G' })
      ];
      mockDB.getAll.mockResolvedValueOnce(songs);

      const result = await offlineStorage.searchSongs({ key: 'G' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(s => s.key === 'G')).toBe(true);
    });

    it('should search songs by multiple criteria', async () => {
      const songs = [
        createMockCachedSong({ title: 'Amazing Grace', key: 'G', difficulty: 'beginner' }),
        createMockCachedSong({ title: 'How Great', key: 'G', difficulty: 'intermediate' }),
        createMockCachedSong({ title: 'Amazing Love', key: 'C', difficulty: 'beginner' })
      ];
      mockDB.getAll.mockResolvedValueOnce(songs);

      const result = await offlineStorage.searchSongs({ 
        query: 'Amazing', 
        key: 'G' 
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expect.objectContaining({
        title: 'Amazing Grace',
        key: 'G'
      }));
    });
  });

  describe('Batch Operations', () => {
    it('should save multiple songs in batch', async () => {
      const songs = [
        createMockCachedSong({ id: 'song-1' }),
        createMockCachedSong({ id: 'song-2' }),
        createMockCachedSong({ id: 'song-3' })
      ];

      const result = await offlineStorage.saveSongsBatch(songs);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(mockDB.put).toHaveBeenCalledTimes(3);
    });

    it('should delete multiple songs in batch', async () => {
      const songIds = ['song-1', 'song-2', 'song-3'];
      mockDB.delete.mockResolvedValue(true);

      const result = await offlineStorage.deleteSongsBatch(songIds);
      
      expect(result.success).toBe(true);
      expect(mockDB.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle partial batch failures', async () => {
      const songs = [
        createMockCachedSong({ id: 'song-1' }),
        createMockCachedSong({ id: 'song-2' })
      ];
      
      mockDB.put
        .mockResolvedValueOnce('song-1') // Success
        .mockRejectedValueOnce(new Error('Save failed')); // Failure

      const result = await offlineStorage.saveSongsBatch(songs);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Batch operation partially failed');
      expect(result.data).toHaveLength(1); // Only successful saves
    });
  });
});