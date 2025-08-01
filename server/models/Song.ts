import mongoose, { Schema, Model } from 'mongoose';
import { compress, decompress } from '@mongodb-js/zstd';
import { ISongDocument, ISongModel, SearchOptions } from './types';

const songSchema = new Schema<ISongDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  artist: {
    type: String,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  chordData: {
    type: Buffer, // Compressed using Zstd
    validate: {
      validator: function(value: Buffer) {
        // Ensure compressed data doesn't exceed reasonable limits
        return !value || value.length <= 50000; // 50KB compressed limit
      },
      message: 'Compressed chord data exceeds size limit'
    }
  },
  key: {
    type: String,
    enum: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
    index: true
  },
  tempo: {
    type: Number,
    min: 40,
    max: 200
  },
  timeSignature: {
    type: String,
    default: '4/4'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
    index: true
  },
  themes: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  source: {
    type: String,
    trim: true,
    maxlength: 100,
    index: true
  },
  lyrics: {
    type: String,
    maxlength: 10000
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  documentSize: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'songs',
  strict: false // Allow temporary fields like _directChordData
});

// Compound text index for search functionality
songSchema.index({
  title: 'text',
  artist: 'text',
  themes: 'text',
  source: 'text',
  lyrics: 'text'
}, {
  weights: {
    title: 10,
    artist: 8,
    themes: 6,
    source: 4,
    lyrics: 2
  },
  name: 'song_search_index'
});

// Compound indexes for common queries
songSchema.index({ 'metadata.isPublic': 1, createdAt: -1 }); // Public songs by date
songSchema.index({ key: 1, difficulty: 1 }); // Filter by key and difficulty
songSchema.index({ themes: 1, 'metadata.ratings.average': -1 }); // Theme-based with ratings
songSchema.index({ artist: 1, title: 1 }); // Artist + title lookups

// Instance method to decompress chord data
songSchema.methods.getDecompressedChordData = async function(): Promise<string | null> {
  if (!this.chordData) return null;
  
  try {
    const decompressed = await decompress(this.chordData);
    return decompressed.toString('utf8');
  } catch (error) {
    console.error('Failed to decompress chord data:', error);
    return null;
  }
};

// Instance method to generate unique slug
songSchema.methods.generateSlug = async function(): Promise<string> {
  const title = this.title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  const artistInitials = this.artist
    ? this.artist.split(' ')
        .map((word: string) => word.charAt(0).toLowerCase())
        .join('')
        .slice(0, 3) // Max 3 initials
    : '';

  // Generate random suffix to ensure uniqueness
  const generateRandomSuffix = () => {
    return Math.random().toString(36).substring(2, 7); // 5 characters
  };

  let baseSlug = `${title}${artistInitials ? '-' + artistInitials : ''}`;
  let slug = `${baseSlug}-${generateRandomSuffix()}`;
  
  // Check for collisions and regenerate if needed
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const existing = await (this.constructor as Model<ISongDocument>).findOne({ 
      slug,
      _id: { $ne: this._id } // Exclude current document if updating
    });
    
    if (!existing) break;
    
    slug = `${baseSlug}-${generateRandomSuffix()}`;
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    // Fallback with timestamp
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
  
  return slug;
};

// Instance method to calculate document size
songSchema.methods.calculateDocumentSize = function(): number {
  // Calculate approximate document size in bytes
  const doc = this.toObject();
  const jsonString = JSON.stringify(doc);
  return Buffer.byteLength(jsonString, 'utf8');
};

// Instance method to set chord data (for easier testing and usage)
songSchema.methods.setChordData = function(chordData: string): void {
  this.set('_directChordData', chordData);
  this.markModified('chordData');
};

// Pre-save middleware for slug generation and chord data compression
songSchema.pre('save', async function() {
  // Generate slug if new document or title/artist changed
  if (this.isNew || this.isModified('title') || this.isModified('artist') || !this.slug) {
    this.slug = await this.generateSlug();
  }
  
  // Handle direct chord data assignment (for testing and direct usage)
  const directChordData = this.get('_directChordData');
  if (directChordData && typeof directChordData === 'string') {
    try {
      this.chordData = await compress(Buffer.from(directChordData, 'utf8'));
      // Clear the temporary field
      this.set('_directChordData', undefined);
    } catch (error) {
      throw new Error(`Failed to compress chord data: ${error.message}`);
    }
  }
  
  // Compress chord data if provided and changed
  if (this.isModified('chordData') && this.get('_originalChordData')) {
    const originalData = this.get('_originalChordData');
    if (typeof originalData === 'string') {
      try {
        this.chordData = await compress(Buffer.from(originalData, 'utf8'));
      } catch (error) {
        throw new Error(`Failed to compress chord data: ${error.message}`);
      }
    }
  }
  
  // Calculate and store document size
  this.documentSize = this.calculateDocumentSize();
});

// Pre-save middleware for storage size tracking
songSchema.pre('save', async function() {
  if (this.isNew && mongoose.connection.db) {
    try {
      // Check current database size and warn if approaching limits
      const stats = await mongoose.connection.db.stats();
      const currentSizeMB = stats.dataSize / (1024 * 1024);
      
      if (currentSizeMB > 400) { // Warn at 400MB for 512MB free tier
        console.warn(`Database size warning: ${currentSizeMB.toFixed(2)}MB used. Approaching 512MB limit.`);
      }
    } catch (error: any) {
      // Silently continue if stats are unavailable (e.g., in testing)
      console.debug('Could not retrieve database stats:', error?.message || error);
    }
  }
});

// Static method to find by slug
songSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug });
};

// Static method for search
songSchema.statics.searchSongs = function(query: string, options: SearchOptions = {}) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'relevance',
    filters = {}
  } = options;

  let searchQuery: any = {
    'metadata.isPublic': true
  };

  // Add text search
  if (query.trim()) {
    searchQuery.$text = { $search: query };
  }

  // Add filters
  if (filters.key?.length) {
    searchQuery.key = { $in: filters.key };
  }
  
  if (filters.difficulty?.length) {
    searchQuery.difficulty = { $in: filters.difficulty };
  }
  
  if (filters.themes?.length) {
    searchQuery.themes = { $in: filters.themes };
  }
  
  if (filters.source?.length) {
    searchQuery.source = { $in: filters.source };
  }

  // Configure sorting
  let sort: any = {};
  switch (sortBy) {
    case 'relevance':
      sort = query.trim() ? { score: { $meta: 'textScore' } } : { 'metadata.ratings.average': -1 };
      break;
    case 'title':
      sort = { title: 1 };
      break;
    case 'artist':
      sort = { artist: 1, title: 1 };
      break;
    case 'createdAt':
      sort = { createdAt: -1 };
      break;
    case 'popularity':
      sort = { 'metadata.ratings.average': -1, 'metadata.views': -1 };
      break;
  }

  return this.find(searchQuery)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select('-chordData') // Exclude compressed data from search results
    .lean();
};

// Virtual for setting uncompressed chord data
songSchema.virtual('uncompressedChordData')
  .get(function() {
    return this.getDecompressedChordData();
  })
  .set(function(value: string) {
    // Store original data temporarily for compression in pre-save
    this.set('_originalChordData', value);
  });

// Ensure virtual fields are serialized
songSchema.set('toJSON', { virtuals: true });
songSchema.set('toObject', { virtuals: true });

export const Song = mongoose.model<ISongDocument, ISongModel & Model<ISongDocument>>('Song', songSchema);