/**
 * @file songs.ts
 * @description Shared song fixtures for testing
 */

import type { Song } from '../../features/songs/types/search.types';

export const mockSongs: Record<string, Song> = {
  amazingGrace: {
    id: 'amazing-grace-1',
    title: 'Amazing Grace',
    artist: 'Traditional',
    slug: 'amazing-grace',
    key: 'G',
    tempo: 90,
    difficulty: 'beginner',
    themes: ['hymn', 'worship'],
    source: 'Traditional Hymnal',
    lyrics: 'Amazing grace, how sweet the sound that saved a wretch like me...',
    metadata: {
      isPublic: true,
      ratings: { average: 4.8, count: 120 },
      views: 1500
    },
    documentSize: 1024,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },

  howGreatThouArt: {
    id: 'how-great-thou-art-2',
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    slug: 'how-great-thou-art',
    key: 'C',
    tempo: 80,
    difficulty: 'intermediate',
    themes: ['hymn', 'praise'],
    source: 'Traditional Hymnal',
    lyrics: 'O Lord my God, when I in awesome wonder...',
    metadata: {
      isPublic: true,
      ratings: { average: 4.9, count: 200 },
      views: 2500
    },
    documentSize: 1536,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },

  blessed: {
    id: 'blessed-assurance-3',
    title: 'Blessed Assurance',
    artist: 'Fanny Crosby',
    slug: 'blessed-assurance',
    key: 'D',
    tempo: 110,
    difficulty: 'beginner',
    themes: ['hymn', 'assurance'],
    source: 'Traditional Hymnal',
    lyrics: 'Blessed assurance, Jesus is mine!...',
    metadata: {
      isPublic: true,
      ratings: { average: 4.7, count: 95 },
      views: 800
    },
    documentSize: 896,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  },

  contemporary: {
    id: 'oceans-4',
    title: 'Oceans (Where Feet May Fail)',
    artist: 'Hillsong United',
    slug: 'oceans-where-feet-may-fail',
    key: 'A',
    tempo: 65,
    difficulty: 'advanced',
    themes: ['contemporary', 'worship', 'faith'],
    source: 'CCLI',
    lyrics: 'You call me out upon the waters...',
    metadata: {
      isPublic: true,
      ratings: { average: 4.6, count: 300 },
      views: 5000
    },
    documentSize: 2048,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01')
  },

  fastTempo: {
    id: 'joyful-joyful-5',
    title: 'Joyful, Joyful We Adore Thee',
    artist: 'Henry van Dyke',
    slug: 'joyful-joyful',
    key: 'E',
    tempo: 140,
    difficulty: 'intermediate',
    themes: ['hymn', 'joy', 'celebration'],
    source: 'Public Domain',
    lyrics: 'Joyful, joyful, we adore Thee...',
    metadata: {
      isPublic: true,
      ratings: { average: 4.5, count: 80 },
      views: 600
    },
    documentSize: 1280,
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  }
};

export const songArrays = {
  all: Object.values(mockSongs),
  hymns: Object.values(mockSongs).filter(song => song.themes.includes('hymn')),
  contemporary: Object.values(mockSongs).filter(song => song.themes.includes('contemporary')),
  beginner: Object.values(mockSongs).filter(song => song.difficulty === 'beginner'),
  intermediate: Object.values(mockSongs).filter(song => song.difficulty === 'intermediate'),
  advanced: Object.values(mockSongs).filter(song => song.difficulty === 'advanced'),
  keyG: Object.values(mockSongs).filter(song => song.key === 'G'),
  keyC: Object.values(mockSongs).filter(song => song.key === 'C'),
  slowTempo: Object.values(mockSongs).filter(song => song.tempo && song.tempo < 90),
  fastTempo: Object.values(mockSongs).filter(song => song.tempo && song.tempo > 120)
};

export const emptySongData = {
  songs: [],
  totalCount: 0,
  currentPage: 1,
  totalPages: 0
};