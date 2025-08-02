/**
 * @file index.ts
 * @description Index file for offline storage test modules
 * 
 * This directory contains focused test modules extracted from the original
 * monolithic offlineStorage.test.ts file (695 lines) for better maintainability:
 * 
 * - crud-operations.test.ts - CRUD operations for songs and setlists
 * - user-preferences.test.ts - User preference management
 * - data-management.test.ts - Export/import/cleanup operations
 * - system-behavior.test.ts - Event handling and error scenarios
 * - performance.test.ts - Storage statistics and performance monitoring
 */

// This file serves as documentation for the test structure.
// Individual test files can be run independently or as a group.

export const testModules = {
  'crud-operations': 'Tests CRUD operations on songs and setlists',
  'user-preferences': 'Tests user preference management',
  'data-management': 'Tests export, import, and cleanup operations',
  'system-behavior': 'Tests event handling and error scenarios',
  'performance': 'Tests storage statistics and performance monitoring'
} as const;

export const originalFileInfo = {
  originalFile: 'offlineStorage.test.ts',
  originalLines: 695,
  newModules: 5,
  averageLinesPerModule: 139,
  benefits: [
    'Faster test execution (parallel runs)',
    'Better test isolation',
    'Easier maintenance and debugging',
    'Clearer test intent and scope',
    'Reduced cognitive load per file'
  ]
};