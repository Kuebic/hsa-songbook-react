/**
 * @file searchResults.ts
 * @description Shared search result fixtures for testing
 */

import type { SearchResult, AvailableFilters } from '../../features/songs/types/search.types';
import { mockSongs, songArrays } from './songs';

export const mockAvailableFilters: AvailableFilters = {
  keys: [
    { value: 'G', label: 'G', count: 1 },
    { value: 'C', label: 'C', count: 1 },
    { value: 'D', label: 'D', count: 1 },
    { value: 'A', label: 'A', count: 1 },
    { value: 'E', label: 'E', count: 1 }
  ],
  difficulties: [
    { value: 'beginner', label: 'Beginner', count: 2 },
    { value: 'intermediate', label: 'Intermediate', count: 2 },
    { value: 'advanced', label: 'Advanced', count: 1 }
  ],
  themes: [
    { value: 'hymn', label: 'Hymn', count: 4 },
    { value: 'worship', label: 'Worship', count: 2 },
    { value: 'contemporary', label: 'Contemporary', count: 1 },
    { value: 'praise', label: 'Praise', count: 1 },
    { value: 'assurance', label: 'Assurance', count: 1 },
    { value: 'faith', label: 'Faith', count: 1 },
    { value: 'joy', label: 'Joy', count: 1 },
    { value: 'celebration', label: 'Celebration', count: 1 }
  ],
  sources: [
    { value: 'Traditional Hymnal', label: 'Traditional Hymnal', count: 3 },
    { value: 'CCLI', label: 'CCLI', count: 1 },
    { value: 'Public Domain', label: 'Public Domain', count: 1 }
  ],
  tempoRange: [65, 140]
};

export const mockSearchResults: Record<string, SearchResult> = {
  fullResults: {
    songs: songArrays.all,
    totalCount: 5,
    currentPage: 1,
    totalPages: 1,
    availableFilters: mockAvailableFilters,
    executionTime: 150
  },

  singlePage: {
    songs: songArrays.all.slice(0, 3),
    totalCount: 3,
    currentPage: 1,
    totalPages: 1,
    availableFilters: mockAvailableFilters,
    executionTime: 120
  },

  multiPage: {
    songs: songArrays.all.slice(0, 2),
    totalCount: 10,
    currentPage: 1,
    totalPages: 5,
    availableFilters: mockAvailableFilters,
    executionTime: 200
  },

  lastPage: {
    songs: [songArrays.all[4]],
    totalCount: 10,
    currentPage: 5,
    totalPages: 5,
    availableFilters: mockAvailableFilters,
    executionTime: 180
  },

  emptyResults: {
    songs: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    availableFilters: {
      keys: [],
      difficulties: [],
      themes: [],
      sources: [],
      tempoRange: [0, 0]
    },
    executionTime: 50
  },

  hymnResults: {
    songs: songArrays.hymns,
    totalCount: 4,
    currentPage: 1,
    totalPages: 1,
    availableFilters: {
      ...mockAvailableFilters,
      themes: mockAvailableFilters.themes.filter(theme => 
        ['hymn', 'worship', 'praise', 'assurance', 'joy', 'celebration'].includes(theme.value)
      )
    },
    executionTime: 100
  },

  beginnerResults: {
    songs: songArrays.beginner,
    totalCount: 2,
    currentPage: 1,
    totalPages: 1,
    availableFilters: {
      ...mockAvailableFilters,
      difficulties: [{ value: 'beginner', label: 'Beginner', count: 2 }]
    },
    executionTime: 80
  },

  slowPerformance: {
    songs: songArrays.all.slice(0, 1),
    totalCount: 1,
    currentPage: 1,
    totalPages: 1,
    availableFilters: mockAvailableFilters,
    executionTime: 2500 // Slow execution time for performance testing
  }
};

export const searchResultVariations = {
  withHighRatings: {
    ...mockSearchResults.fullResults,
    songs: mockSearchResults.fullResults.songs.map(song => ({
      ...song,
      metadata: {
        ...song.metadata,
        ratings: { average: 4.8, count: 200 }
      }
    }))
  },

  withLowRatings: {
    ...mockSearchResults.fullResults,
    songs: mockSearchResults.fullResults.songs.map(song => ({
      ...song,
      metadata: {
        ...song.metadata,
        ratings: { average: 2.5, count: 10 }
      }
    }))
  },

  withoutMetadata: {
    ...mockSearchResults.fullResults,
    songs: mockSearchResults.fullResults.songs.map(song => ({
      ...song,
      metadata: undefined
    }))
  },

  largePage: {
    songs: Array.from({ length: 100 }, (_, i) => ({
      ...mockSongs.amazingGrace,
      id: `song-${i + 1}`,
      title: `Song ${i + 1}`,
      slug: `song-${i + 1}`
    })),
    totalCount: 100,
    currentPage: 1,
    totalPages: 1,
    availableFilters: mockAvailableFilters,
    executionTime: 300
  }
};