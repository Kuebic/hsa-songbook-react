/**
 * @file validation.test.ts
 * @description Tests for search filter validation utilities - validateSearchFilters
 */

import { describe, it, expect } from 'vitest';
import { validateSearchFilters } from '../../utils/searchUtils';
import type { SearchFilters } from '../../types/search.types';
import { createMockSearchFilters } from '../../../../test/factories/typeSafeMockFactory';
import type { MockSearchFilters } from '../../../../test/types/test-fixtures.types';
// Type-safe assertions available but not used in this test file

describe('Search Utils - Validation', () => {
  describe('validateSearchFilters', () => {
    it('should validate empty filters as valid', () => {
      const filters: SearchFilters = {};
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate default filters as valid', () => {
      const filters = createMockSearchFilters({
        query: '',
        page: 1,
        limit: 20,
        sortBy: 'relevance'
      });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate basic query filter', () => {
      const filters = createMockSearchFilters({ query: 'Amazing Grace' });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject query that is too long', () => {
      const longQuery = 'a'.repeat(1001); // Over 1000 characters
      const filters = createMockSearchFilters({ query: longQuery });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot exceed 1000 characters');
    });

    it('should validate key filters', () => {
      const validKeys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
      const filters = createMockSearchFilters({ key: validKeys });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid key filters', () => {
      const invalidKeys = ['H', 'I', 'J', 'X#'];
      const filters = createMockSearchFilters({ key: invalidKeys });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid key values: H, I, J, X#');
    });

    it('should validate difficulty filters', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      const filters = createMockSearchFilters({ difficulty: validDifficulties });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid difficulty filters', () => {
      const invalidDifficulties = ['easy', 'hard', 'expert'] as const;
      // Use type override to test invalid data
      const filters = createMockSearchFilters({ difficulty: invalidDifficulties as unknown as MockSearchFilters['difficulty'] });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid difficulty values: easy, hard, expert');
    });

    it('should validate tempo range', () => {
      const validTempoRanges = [
        [60, 120],
        [80, 140],
        [100, 200]
      ];
      
      validTempoRanges.forEach(tempo => {
        const filters = createMockSearchFilters({ tempo });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject invalid tempo ranges', () => {
      const invalidTempoRanges = [
        { tempo: [30, 60], error: 'Tempo minimum cannot be less than 40 BPM' },
        { tempo: [200, 300], error: 'Tempo maximum cannot exceed 250 BPM' },
        { tempo: [120, 80], error: 'Tempo minimum cannot be greater than maximum' },
        { tempo: [-10, 100], error: 'Tempo minimum cannot be less than 40 BPM' }
      ];
      
      invalidTempoRanges.forEach(({ tempo, error }) => {
        const filters = createMockSearchFilters({ tempo });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(error);
      });
    });

    it('should validate page number', () => {
      const validPages = [1, 5, 10, 100];
      
      validPages.forEach(page => {
        const filters = createMockSearchFilters({ page });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject invalid page numbers', () => {
      const invalidPages = [
        { page: 0, error: 'Page number must be greater than 0' },
        { page: -1, error: 'Page number must be greater than 0' },
        { page: 1001, error: 'Page number cannot exceed 1000' }
      ];
      
      invalidPages.forEach(({ page, error }) => {
        const filters = createMockSearchFilters({ page });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(error);
      });
    });

    it('should validate limit values', () => {
      const validLimits = [10, 20, 50, 100];
      
      validLimits.forEach(limit => {
        const filters = createMockSearchFilters({ limit });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject invalid limit values', () => {
      const invalidLimits = [
        { limit: 0, error: 'Limit must be greater than 0' },
        { limit: -1, error: 'Limit must be greater than 0' },
        { limit: 101, error: 'Limit cannot exceed 100' }
      ];
      
      invalidLimits.forEach(({ limit, error }) => {
        const filters = createMockSearchFilters({ limit });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(error);
      });
    });

    it('should validate sort options', () => {
      const validSortOptions: Array<MockSearchFilters['sortBy']> = ['relevance', 'title', 'artist', 'date', 'popularity'];
      
      validSortOptions.forEach(sortBy => {
        const filters = createMockSearchFilters({ sortBy });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject invalid sort options', () => {
      const invalidSortOptions = ['name', 'created', 'updated', 'rating'] as const;
      
      invalidSortOptions.forEach(sortBy => {
        const filters = createMockSearchFilters({ sortBy: sortBy as unknown as MockSearchFilters['sortBy'] });
        const result = validateSearchFilters(filters);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(`Invalid sort option: ${sortBy}`);
      });
    });

    it('should validate theme filters', () => {
      const validThemes = ['hymn', 'worship', 'contemporary', 'traditional', 'praise'];
      const filters = createMockSearchFilters({ themes: validThemes });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle empty theme arrays', () => {
      const filters = createMockSearchFilters({ themes: [] });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate source filters', () => {
      const validSources = ['CCLI', 'Public Domain', 'Traditional Hymnal', 'Contemporary Collection'];
      const filters = createMockSearchFilters({ source: validSources });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle special characters in filters', () => {
      const filters = createMockSearchFilters({
        query: 'Lord\'s Prayer & Communion',
        themes: ['praise & worship'],
        source: ['St. Mark\'s Hymnal']
      });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accumulate multiple validation errors', () => {
      const filters = createMockSearchFilters({
        query: 'a'.repeat(1001), // Too long
        key: ['H', 'I'], // Invalid keys
        difficulty: ['easy'] as unknown as MockSearchFilters['difficulty'], // Invalid difficulty
        tempo: [30, 60], // Invalid tempo range
        page: 0, // Invalid page
        limit: 101, // Invalid limit
        sortBy: 'rating' as unknown as MockSearchFilters['sortBy'] // Invalid sort
      });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(7);
      expect(result.errors).toContain('Query cannot exceed 1000 characters');
      expect(result.errors).toContain('Invalid key values: H, I');
      expect(result.errors).toContain('Invalid difficulty values: easy');
      expect(result.errors).toContain('Tempo minimum cannot be less than 40 BPM');
      expect(result.errors).toContain('Page number must be greater than 0');
      expect(result.errors).toContain('Limit cannot exceed 100');
      expect(result.errors).toContain('Invalid sort option: rating');
    });

    it('should handle null and undefined values', () => {
      // Test null/undefined values using MockSearchFilters which allows null
      const filters = createMockSearchFilters({
        query: null,
        key: undefined,
        difficulty: null,
        themes: undefined,
        source: null,
        tempo: undefined,
        page: null,
        limit: null,
        sortBy: undefined
      });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate filter array lengths', () => {
      const tooManyKeys = Array.from({ length: 51 }, (_, i) => `key-${i}`);
      const filters = createMockSearchFilters({ key: tooManyKeys as unknown as string[] });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Too many key filters (maximum 50)');
    });

    it('should validate duplicate values in arrays', () => {
      const filters = createMockSearchFilters({
        key: ['G', 'C', 'G'], // Duplicate G
        difficulty: ['beginner', 'beginner'], // Duplicate beginner
        themes: ['hymn', 'worship', 'hymn'] // Duplicate hymn
      });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate key values found: G');
      expect(result.errors).toContain('Duplicate difficulty values found: beginner');
      expect(result.errors).toContain('Duplicate theme values found: hymn');
    });

    it('should validate XSS prevention in strings', () => {
      const maliciousQuery = '<script>alert("xss")</script>';
      const filters = createMockSearchFilters({ query: maliciousQuery });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query contains potentially dangerous content');
    });

    it('should validate SQL injection prevention', () => {
      const sqlInjection = "'; DROP TABLE songs; --";
      const filters = createMockSearchFilters({ query: sqlInjection });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query contains potentially dangerous content');
    });

    it('should handle edge cases in validation', () => {
      const edgeCases = [
        { filters: createMockSearchFilters({ tempo: [60, 60] }), shouldBeValid: true },
        { filters: createMockSearchFilters({ page: 1000 }), shouldBeValid: true },
        { filters: createMockSearchFilters({ limit: 1 }), shouldBeValid: true },
        { filters: createMockSearchFilters({ query: ' ' }), shouldBeValid: true }
      ];
      
      edgeCases.forEach(({ filters, shouldBeValid }) => {
        const result = validateSearchFilters(filters);
        expect(result.isValid).toBe(shouldBeValid);
      });
    });

    it('should provide detailed error information', () => {
      const filters = createMockSearchFilters({
        key: ['invalid-key'],
        page: -1
      });
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.summary).toContain('2 validation errors found');
    });

    it('should validate performance with complex filters', () => {
      const startTime = performance.now();
      
      const complexFilters = createMockSearchFilters({
        query: 'Complex validation test with many parameters and edge cases',
        key: ['C', 'G', 'D', 'A', 'E', 'B', 'F#'],
        difficulty: ['beginner', 'intermediate', 'advanced'],
        themes: Array.from({ length: 20 }, (_, i) => `theme-${i}`),
        source: Array.from({ length: 10 }, (_, i) => `source-${i}`),
        tempo: [60, 180],
        page: 50,
        limit: 50,
        sortBy: 'relevance'
      });
      
      const result = validateSearchFilters(complexFilters);
      const endTime = performance.now();
      
      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should validate custom validation rules', () => {
      const customRules = {
        maxQueryLength: 500,
        maxKeysCount: 10,
        maxPage: 500
      };
      
      const filters = createMockSearchFilters({
        query: 'a'.repeat(501), // Exceeds custom limit
        key: Array.from({ length: 11 }, (_, i) => `C${i}`), // Exceeds custom limit
        page: 501 // Exceeds custom limit
      });
      
      const result = validateSearchFilters(filters, customRules);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot exceed 500 characters');
    });

    it('should return validation warnings for suspicious patterns', () => {
      const filters = createMockSearchFilters({
        query: 'a'.repeat(900), // Long but valid
        key: Array.from({ length: 45 }, (_, i) => `C${i}`), // Many but valid
      });
      
      const result = validateSearchFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Query is unusually long');
      expect(result.warnings).toContain('Large number of key filters may impact performance');
    });

    it('should validate with context information', () => {
      const filters = createMockSearchFilters({
        page: 100, // High page number
        limit: 100 // Maximum limit
      });
      
      const context = {
        totalResults: 50, // Page 100 would be empty
        userRole: 'basic' // Basic users might have different limits
      };
      
      const result = validateSearchFilters(filters, {}, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page number exceeds available results');
    });
  });
});