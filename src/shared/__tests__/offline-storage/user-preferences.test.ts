/**
 * @file user-preferences.test.ts
 * @description Tests for user preferences management in offline storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { UserPreferences } from '../../types/storage.types';
import { OfflineStorage } from '../../services/offlineStorage';
import { createMockIndexedDB, createMockUserPreferences } from '../../../test/factories/typeSafeMockFactory';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('OfflineStorage - User Preferences', () => {
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

  describe('Preference Management', () => {
    const mockPreferences = createMockUserPreferences({
      theme: 'dark',
      fontSize: 16,
      autoTranspose: true,
      defaultKey: 'G',
      displaySettings: {
        showChords: true,
        showLyrics: true,
        compactMode: false
      },
      cacheSettings: {
        maxCacheSize: 100 * 1024 * 1024,
        autoCleanup: true,
        retentionDays: 30
      }
    });

    it('should save user preferences', async () => {
      const result = await offlineStorage.savePreferences(mockPreferences);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
      expect(mockDB.put).toHaveBeenCalledWith('preferences', expect.objectContaining({
        theme: 'dark',
        fontSize: 16,
        autoTranspose: true
      }));
    });

    it('should retrieve user preferences', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);

      const result = await offlineStorage.getPreferences();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
      expect(mockDB.get).toHaveBeenCalledWith('preferences', 'user-preferences');
    });

    it('should return default preferences when none exist', async () => {
      mockDB.get.mockResolvedValueOnce(undefined);

      const result = await offlineStorage.getPreferences();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        theme: 'light',
        fontSize: 14,
        autoTranspose: false,
        defaultKey: 'C'
      }));
    });

    it('should update specific preference', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);

      const result = await offlineStorage.updatePreference('theme', 'light');
      
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('light');
      expect(mockDB.put).toHaveBeenCalledWith('preferences', expect.objectContaining({
        theme: 'light'
      }));
    });

    it('should update display settings', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);
      const newDisplaySettings = {
        showChords: false,
        showLyrics: true,
        compactMode: true
      };

      const result = await offlineStorage.updateDisplaySettings(newDisplaySettings);
      
      expect(result.success).toBe(true);
      expect(result.data.displaySettings).toEqual(newDisplaySettings);
      expect(mockDB.put).toHaveBeenCalledWith('preferences', expect.objectContaining({
        displaySettings: newDisplaySettings
      }));
    });

    it('should update cache settings', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);
      const newCacheSettings = {
        maxCacheSize: 200 * 1024 * 1024,
        autoCleanup: false,
        retentionDays: 60
      };

      const result = await offlineStorage.updateCacheSettings(newCacheSettings);
      
      expect(result.success).toBe(true);
      expect(result.data.cacheSettings).toEqual(newCacheSettings);
      expect(mockDB.put).toHaveBeenCalledWith('preferences', expect.objectContaining({
        cacheSettings: newCacheSettings
      }));
    });

    it('should reset preferences to defaults', async () => {
      const result = await offlineStorage.resetPreferences();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        theme: 'light',
        fontSize: 14,
        autoTranspose: false,
        defaultKey: 'C'
      }));
      expect(mockDB.put).toHaveBeenCalledWith('preferences', expect.objectContaining({
        theme: 'light'
      }));
    });

    it('should validate preference values', async () => {
      const invalidPreferences = {
        ...mockPreferences,
        fontSize: -5, // Invalid
        theme: 'invalid-theme' as unknown as UserPreferences['theme'] // Invalid
      };

      const result = await offlineStorage.savePreferences(invalidPreferences);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid preference values');
    });

    it('should handle nested preference updates', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);

      const result = await offlineStorage.updatePreference('displaySettings.showChords', false);
      
      expect(result.success).toBe(true);
      expect(result.data.displaySettings.showChords).toBe(false);
      expect(result.data.displaySettings.showLyrics).toBe(true); // Should remain unchanged
    });

    it('should export preferences', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);

      const result = await offlineStorage.exportPreferences();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });

    it('should import preferences', async () => {
      const importedPreferences = createMockUserPreferences({
        theme: 'system',
        fontSize: 18
      });

      const result = await offlineStorage.importPreferences(importedPreferences);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(importedPreferences);
      expect(mockDB.put).toHaveBeenCalledWith('preferences', expect.objectContaining({
        theme: 'system',
        fontSize: 18
      }));
    });

    it('should merge imported preferences with existing ones', async () => {
      mockDB.get.mockResolvedValueOnce(mockPreferences);
      const partialPreferences = {
        theme: 'system' as const,
        fontSize: 18
      };

      const result = await offlineStorage.importPreferences(partialPreferences, true);
      
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('system');
      expect(result.data.fontSize).toBe(18);
      expect(result.data.autoTranspose).toBe(mockPreferences.autoTranspose); // Should be preserved
    });

    it('should handle preference migration', async () => {
      const oldPreferences = {
        ...mockPreferences,
        version: 1 // Old version
      };
      mockDB.get.mockResolvedValueOnce(oldPreferences);

      const result = await offlineStorage.getPreferences();
      
      expect(result.success).toBe(true);
      expect(result.data.version).toBeGreaterThan(1); // Should be updated
      expect(mockDB.put).toHaveBeenCalled(); // Should save migrated preferences
    });
  });

  describe('Preference Categories', () => {
    it('should manage theme preferences', async () => {
      const themes: UserPreferences['theme'][] = ['light', 'dark', 'system'];
      
      for (const theme of themes) {
        const result = await offlineStorage.updatePreference('theme', theme);
        expect(result.success).toBe(true);
        expect(result.data.theme).toBe(theme);
      }
    });

    it('should manage font size preferences', async () => {
      const fontSizes = [12, 14, 16, 18, 20, 24];
      
      for (const fontSize of fontSizes) {
        const result = await offlineStorage.updatePreference('fontSize', fontSize);
        expect(result.success).toBe(true);
        expect(result.data.fontSize).toBe(fontSize);
      }
    });

    it('should manage transpose preferences', async () => {
      const result1 = await offlineStorage.updatePreference('autoTranspose', true);
      expect(result1.success).toBe(true);
      expect(result1.data.autoTranspose).toBe(true);

      const result2 = await offlineStorage.updatePreference('defaultKey', 'F#');
      expect(result2.success).toBe(true);
      expect(result2.data.defaultKey).toBe('F#');
    });

    it('should manage display preferences', async () => {
      const displaySettings = {
        showChords: false,
        showLyrics: true,
        compactMode: true
      };

      const result = await offlineStorage.updateDisplaySettings(displaySettings);
      
      expect(result.success).toBe(true);
      expect(result.data.displaySettings).toEqual(displaySettings);
    });

    it('should manage cache preferences', async () => {
      const cacheSettings = {
        maxCacheSize: 500 * 1024 * 1024, // 500MB
        autoCleanup: false,
        retentionDays: 90
      };

      const result = await offlineStorage.updateCacheSettings(cacheSettings);
      
      expect(result.success).toBe(true);
      expect(result.data.cacheSettings).toEqual(cacheSettings);
    });
  });

  describe('Preference Validation', () => {
    it('should validate theme values', async () => {
      const invalidResult = await offlineStorage.updatePreference('theme', 'invalid' as unknown as UserPreferences['theme']);
      expect(invalidResult.success).toBe(false);

      const validResult = await offlineStorage.updatePreference('theme', 'dark');
      expect(validResult.success).toBe(true);
    });

    it('should validate font size ranges', async () => {
      const tooSmall = await offlineStorage.updatePreference('fontSize', 8);
      expect(tooSmall.success).toBe(false);

      const tooBig = await offlineStorage.updatePreference('fontSize', 48);
      expect(tooBig.success).toBe(false);

      const valid = await offlineStorage.updatePreference('fontSize', 16);
      expect(valid.success).toBe(true);
    });

    it('should validate cache size limits', async () => {
      const tooSmall = await offlineStorage.updateCacheSettings({
        maxCacheSize: 1024, // 1KB - too small
        autoCleanup: true,
        retentionDays: 7
      });
      expect(tooSmall.success).toBe(false);

      const valid = await offlineStorage.updateCacheSettings({
        maxCacheSize: 100 * 1024 * 1024, // 100MB
        autoCleanup: true,
        retentionDays: 30
      });
      expect(valid.success).toBe(true);
    });
  });
});