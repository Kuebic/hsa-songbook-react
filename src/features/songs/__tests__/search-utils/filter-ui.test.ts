/**
 * @file filter-ui.test.ts
 * @description Tests for search filter UI utilities - createFilterChips
 */

import { describe, it, expect } from 'vitest';
import { createFilterChips } from '../../utils/searchUtils';
import { createMockSearchFilters } from '../../../../test/factories/typeSafeMockFactory';

describe('Search Utils - Filter UI', () => {
  describe('createFilterChips', () => {
    it('should return empty array for no active filters', () => {
      const filters = createMockSearchFilters({});
      const chips = createFilterChips(filters);
      expect(chips).toEqual([]);
    });

    it('should create chip for query filter', () => {
      const filters = createMockSearchFilters({ query: 'Amazing Grace' });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0]).toEqual({
        id: 'query',
        label: 'Search: Amazing Grace',
        value: 'Amazing Grace',
        type: 'query',
        removable: true
      });
    });

    it('should create chips for key filters', () => {
      const filters = createMockSearchFilters({ key: ['G', 'C'] });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(2);
      expect(chips[0]).toEqual({
        id: 'key-G',
        label: 'Key: G',
        value: 'G',
        type: 'key',
        removable: true
      });
      expect(chips[1]).toEqual({
        id: 'key-C',
        label: 'Key: C',
        value: 'C',
        type: 'key',
        removable: true
      });
    });

    it('should create chips for difficulty filters', () => {
      const filters = createMockSearchFilters({ difficulty: ['beginner', 'advanced'] });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(2);
      expect(chips[0]).toEqual({
        id: 'difficulty-beginner',
        label: 'Difficulty: Beginner',
        value: 'beginner',
        type: 'difficulty',
        removable: true
      });
      expect(chips[1]).toEqual({
        id: 'difficulty-advanced',
        label: 'Difficulty: Advanced',
        value: 'advanced',
        type: 'difficulty',
        removable: true
      });
    });

    it('should create chips for theme filters', () => {
      const filters = createMockSearchFilters({ themes: ['hymn', 'worship'] });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(2);
      expect(chips[0]).toEqual({
        id: 'themes-hymn',
        label: 'Theme: Hymn',
        value: 'hymn',
        type: 'themes',
        removable: true
      });
      expect(chips[1]).toEqual({
        id: 'themes-worship',
        label: 'Theme: Worship',
        value: 'worship',
        type: 'themes',
        removable: true
      });
    });

    it('should create chips for source filters', () => {
      const filters = createMockSearchFilters({ source: ['CCLI', 'Public Domain'] });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(2);
      expect(chips[0]).toEqual({
        id: 'source-CCLI',
        label: 'Source: CCLI',
        value: 'CCLI',
        type: 'source',
        removable: true
      });
      expect(chips[1]).toEqual({
        id: 'source-Public Domain',
        label: 'Source: Public Domain',
        value: 'Public Domain',
        type: 'source',
        removable: true
      });
    });

    it('should create chip for tempo filter', () => {
      const filters = createMockSearchFilters({ tempo: [80, 120] });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0]).toEqual({
        id: 'tempo',
        label: 'Tempo: 80-120 BPM',
        value: [80, 120],
        type: 'tempo',
        removable: true
      });
    });

    it('should handle tempo range with same min/max', () => {
      const filters = createMockSearchFilters({ tempo: [100, 100] });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0].label).toBe('Tempo: 100 BPM');
    });

    it('should create chips for all filter types combined', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: ['G'],
        difficulty: ['beginner'],
        themes: ['hymn'],
        source: ['CCLI'],
        tempo: [80, 120]
      });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(6);
      
      const chipTypes = chips.map(chip => chip.type);
      expect(chipTypes).toContain('query');
      expect(chipTypes).toContain('key');
      expect(chipTypes).toContain('difficulty');
      expect(chipTypes).toContain('themes');
      expect(chipTypes).toContain('source');
      expect(chipTypes).toContain('tempo');
    });

    it('should ignore empty filters', () => {
      const filters = createMockSearchFilters({
        query: '',
        key: [],
        difficulty: [],
        themes: [],
        source: [],
        tempo: undefined
      });
      const chips = createFilterChips(filters);
      
      expect(chips).toEqual([]);
    });

    it('should ignore navigation filters', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        page: 5,
        limit: 50,
        sortBy: 'title'
      });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0].type).toBe('query');
    });

    it('should handle special characters in filter values', () => {
      const filters = createMockSearchFilters({
        query: 'Lord\'s Prayer & Communion',
        themes: ['praise & worship', 'call-to-worship']
      });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(3);
      expect(chips[0].label).toBe('Search: Lord\'s Prayer & Communion');
      expect(chips[1].label).toBe('Theme: Praise & worship');
      expect(chips[2].label).toBe('Theme: Call-to-worship');
    });

    it('should capitalize filter values properly', () => {
      const filters = createMockSearchFilters({
        difficulty: ['beginner', 'intermediate'],
        themes: ['contemporary', 'traditional']
      });
      const chips = createFilterChips(filters);
      
      expect(chips[0].label).toBe('Difficulty: Beginner');
      expect(chips[1].label).toBe('Difficulty: Intermediate');
      expect(chips[2].label).toBe('Theme: Contemporary');
      expect(chips[3].label).toBe('Theme: Traditional');
    });

    it('should handle long filter values', () => {
      const longQuery = 'This is a very long search query that might be truncated in the UI';
      const filters = createMockSearchFilters({ query: longQuery });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0].label).toBe(`Search: ${longQuery}`);
      expect(chips[0].value).toBe(longQuery);
    });

    it('should create unique IDs for each chip', () => {
      const filters = createMockSearchFilters({
        key: ['G', 'C', 'D'],
        difficulty: ['beginner', 'intermediate']
      });
      const chips = createFilterChips(filters);
      
      const ids = chips.map(chip => chip.id);
      const uniqueIds = new Set(ids);
      
      expect(ids).toHaveLength(5);
      expect(uniqueIds.size).toBe(5); // All IDs should be unique
    });

    it('should handle edge cases in tempo ranges', () => {
      const testCases = [
        { tempo: [0, 200], expected: 'Tempo: 0-200 BPM' },
        { tempo: [60, 60], expected: 'Tempo: 60 BPM' },
        { tempo: [999, 999], expected: 'Tempo: 999 BPM' }
      ];

      testCases.forEach(({ tempo, expected }) => {
        const filters = createMockSearchFilters({ tempo });
        const chips = createFilterChips(filters);
        
        expect(chips).toHaveLength(1);
        expect(chips[0].label).toBe(expected);
      });
    });

    it('should preserve original filter values', () => {
      const filters = createMockSearchFilters({
        query: 'Original Query',
        key: ['F#', 'Bb'],
        difficulty: ['advanced']
      });
      const chips = createFilterChips(filters);
      
      expect(chips[0].value).toBe('Original Query');
      expect(chips[1].value).toBe('F#');
      expect(chips[2].value).toBe('Bb');
      expect(chips[3].value).toBe('advanced');
    });

    it('should maintain consistent chip structure', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: ['G']
      });
      const chips = createFilterChips(filters);
      
      chips.forEach(chip => {
        expect(chip).toHaveProperty('id');
        expect(chip).toHaveProperty('label');
        expect(chip).toHaveProperty('value');
        expect(chip).toHaveProperty('type');
        expect(chip).toHaveProperty('removable');
        
        expect(typeof chip.id).toBe('string');
        expect(typeof chip.label).toBe('string');
        expect(typeof chip.type).toBe('string');
        expect(typeof chip.removable).toBe('boolean');
        
        expect(chip.id).toBeTruthy();
        expect(chip.label).toBeTruthy();
        expect(chip.type).toBeTruthy();
      });
    });

    it('should handle null and undefined values gracefully', () => {
      const filters = createMockSearchFilters({
        query: null,
        key: undefined,
        difficulty: null,
        themes: ['valid-theme'],
        source: undefined,
        tempo: null
      });
      const chips = createFilterChips(filters);
      
      expect(chips).toHaveLength(1);
      expect(chips[0].type).toBe('themes');
      expect(chips[0].value).toBe('valid-theme');
    });

    it('should sort chips in a logical order', () => {
      const filters = createMockSearchFilters({
        tempo: [80, 120],
        source: ['CCLI'],
        themes: ['hymn'],
        difficulty: ['beginner'],
        key: ['G'],
        query: 'test'
      });
      const chips = createFilterChips(filters);
      
      // Should maintain a consistent order regardless of input order
      const expectedOrder = ['query', 'key', 'difficulty', 'themes', 'source', 'tempo'];
      const actualOrder = chips.map(chip => chip.type);
      
      expect(actualOrder).toEqual(expectedOrder);
    });

    it('should handle performance with many filters', () => {
      const startTime = performance.now();
      
      const filters = createMockSearchFilters({
        key: Array.from({ length: 50 }, (_, i) => `key-${i}`),
        themes: Array.from({ length: 30 }, (_, i) => `theme-${i}`),
        source: Array.from({ length: 20 }, (_, i) => `source-${i}`)
      });
      
      const chips = createFilterChips(filters);
      const endTime = performance.now();
      
      expect(chips).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
    });

    it('should create removable chips by default', () => {
      const filters = createMockSearchFilters({
        query: 'test',
        key: ['G'],
        difficulty: ['beginner']
      });
      const chips = createFilterChips(filters);
      
      chips.forEach(chip => {
        expect(chip.removable).toBe(true);
      });
    });

    it('should support custom chip configuration', () => {
      const filters = createMockSearchFilters({ query: 'test' });
      const chips = createFilterChips(filters, {
        removable: false,
        showType: false
      });
      
      expect(chips[0].removable).toBe(false);
      expect(chips[0].label).toBe('Amazing Grace'); // Without "Search:" prefix
    });

    it('should handle empty arrays correctly', () => {
      const filters = createMockSearchFilters({
        key: [],
        difficulty: [],
        themes: [],
        source: []
      });
      const chips = createFilterChips(filters);
      
      expect(chips).toEqual([]);
    });

    it('should generate consistent IDs for the same filters', () => {
      const filters = createMockSearchFilters({ key: ['G'], query: 'test' });
      
      const chips1 = createFilterChips(filters);
      const chips2 = createFilterChips(filters);
      
      expect(chips1.map(c => c.id)).toEqual(chips2.map(c => c.id));
    });
  });
});