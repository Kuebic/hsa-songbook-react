/**
 * @file index.ts
 * @description Export all test fixtures
 */

export * from './songs';
export * from './searchResults';

// Re-export commonly used fixtures with convenient names
export { mockSongs as songs } from './songs';
export { mockSearchResults as searchResults } from './searchResults';
export { mockAvailableFilters as availableFilters } from './searchResults';