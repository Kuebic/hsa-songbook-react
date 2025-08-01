import mongoose, { Schema, Types } from 'mongoose';
import { compress, decompress } from '@mongodb-js/zstd';

export interface IArrangement {
  name: string;
  songIds: Types.ObjectId[]; // Support for mashups (multiple songs)
  createdBy: Types.ObjectId;
  chordData: Buffer; // Compressed ChordPro data
  key?: string;
  tempo?: number;
  timeSignature?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  tags?: string[];
  metadata: {
    isMashup: boolean;
    mashupSections?: {
      songId: Types.ObjectId;
      title: string;
      startBar?: number;
      endBar?: number;
    }[];
    isPublic: boolean;
    ratings: {
      average: number;
      count: number;
    };
    views: number;
  };
  documentSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IArrangementDocument extends IArrangement, mongoose.Document {
  getDecompressedChordData(): Promise<string | null>;
  setChordData(chordData: string): void;
  calculateDocumentSize(): number;
}

const arrangementSchema = new Schema<IArrangementDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  songIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  chordData: {
    type: Buffer,
    validate: {
      validator: function(value: Buffer) {
        return !value || value.length <= 100000; // 100KB compressed limit
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
  description: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  metadata: {
    isMashup: {
      type: Boolean,
      default: false,
      index: true
    },
    mashupSections: [{
      songId: {
        type: Schema.Types.ObjectId,
        ref: 'Song'
      },
      title: {
        type: String,
        trim: true,
        maxlength: 200
      },
      startBar: Number,
      endBar: Number
    }],
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
  collection: 'arrangements',
  strict: false
});

// Compound indexes for efficient queries
arrangementSchema.index({ songIds: 1, 'metadata.isPublic': 1 }); // Find arrangements for songs
arrangementSchema.index({ createdBy: 1, createdAt: -1 }); // User's arrangements
arrangementSchema.index({ 'metadata.isMashup': 1, 'metadata.isPublic': 1 }); // Public mashups
arrangementSchema.index({ key: 1, difficulty: 1 }); // Filter by key and difficulty
arrangementSchema.index({ 'metadata.ratings.average': -1, 'metadata.views': -1 }); // Popular arrangements

// Instance method to decompress chord data
arrangementSchema.methods.getDecompressedChordData = async function(): Promise<string | null> {
  if (!this.chordData) return null;
  
  try {
    const decompressed = await decompress(this.chordData);
    return decompressed.toString('utf8');
  } catch (error) {
    console.error('Failed to decompress chord data:', error);
    return null;
  }
};

// Instance method to set chord data
arrangementSchema.methods.setChordData = function(chordData: string): void {
  this.set('_directChordData', chordData);
  this.markModified('chordData');
};

// Instance method to calculate document size
arrangementSchema.methods.calculateDocumentSize = function(): number {
  const doc = this.toObject();
  const jsonString = JSON.stringify(doc);
  return Buffer.byteLength(jsonString, 'utf8');
};

// Pre-save middleware for chord data compression
arrangementSchema.pre('save', async function() {
  // Handle direct chord data assignment
  const directChordData = this.get('_directChordData');
  if (directChordData && typeof directChordData === 'string') {
    try {
      this.chordData = await compress(Buffer.from(directChordData, 'utf8'));
      this.set('_directChordData', undefined);
    } catch (error) {
      throw new Error(`Failed to compress chord data: ${error.message}`);
    }
  }
  
  // Set mashup flag based on songIds length
  this.metadata.isMashup = this.songIds.length > 1;
  
  // Calculate and store document size
  this.documentSize = this.calculateDocumentSize();
});

export const Arrangement = mongoose.model<IArrangementDocument>('Arrangement', arrangementSchema);