import mongoose, { Schema, Types } from 'mongoose';

export interface ISetlistItem {
  songId: Types.ObjectId;
  arrangementId?: Types.ObjectId;
  transpose?: number; // Semitones to transpose for this performance
  notes?: string; // Performance notes for this song
  order: number;
}

export interface ISetlist {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  songs: ISetlistItem[];
  tags?: string[];
  metadata: {
    isPublic: boolean;
    shareToken?: string; // For public sharing without auth
    estimatedDuration?: number; // Minutes
    lastUsedAt?: Date;
    usageCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISetlistDocument extends ISetlist, mongoose.Document {
  generateShareToken(): string;
  calculateEstimatedDuration(): Promise<number>;
  addSong(songId: Types.ObjectId, arrangementId?: Types.ObjectId, options?: { transpose?: number; notes?: string }): void;
  removeSong(songId: Types.ObjectId): void;
  reorderSongs(newOrder: { songId: Types.ObjectId; order: number }[]): void;
}

const setlistItemSchema = new Schema<ISetlistItem>({
  songId: {
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  arrangementId: {
    type: Schema.Types.ObjectId,
    ref: 'Arrangement'
  },
  transpose: {
    type: Number,
    min: -11,
    max: 11,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const setlistSchema = new Schema<ISetlistDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  songs: [setlistItemSchema],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  metadata: {
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Only create index for non-null values
      index: true
    },
    estimatedDuration: {
      type: Number,
      min: 0
    },
    lastUsedAt: {
      type: Date
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  collection: 'setlists'
});

// Compound indexes
setlistSchema.index({ createdBy: 1, createdAt: -1 }); // User's setlists
setlistSchema.index({ 'metadata.isPublic': 1, createdAt: -1 }); // Public setlists
setlistSchema.index({ tags: 1, 'metadata.isPublic': 1 }); // Search by tags
setlistSchema.index({ 'metadata.lastUsedAt': -1 }); // Recently used setlists

// Generate share token method
setlistSchema.methods.generateShareToken = function(this: ISetlistDocument): string {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  this.metadata.shareToken = token;
  return token;
};

// Calculate estimated duration method
setlistSchema.methods.calculateEstimatedDuration = async function(this: ISetlistDocument): Promise<number> {
  const Song = mongoose.model('Song');
  const songIds = this.songs.map((item: ISetlistItem) => item.songId);
  
  const songs = await Song.find({ _id: { $in: songIds } }).select('tempo') as Array<{ tempo?: number }>;
  
  // Rough estimation: assume 3-4 minutes per song, adjust based on tempo
  let totalMinutes = 0;
  
  for (const song of songs) {
    let estimatedMinutes = 3.5; // Default duration
    
    if (song.tempo) {
      // Slower songs tend to be longer, faster songs shorter
      if (song.tempo < 80) estimatedMinutes = 4.5;
      else if (song.tempo > 140) estimatedMinutes = 2.5;
    }
    
    totalMinutes += estimatedMinutes;
  }
  
  this.metadata.estimatedDuration = Math.round(totalMinutes);
  return this.metadata.estimatedDuration;
};

// Add song method
setlistSchema.methods.addSong = function(
  this: ISetlistDocument,
  songId: Types.ObjectId, 
  arrangementId?: Types.ObjectId, 
  options: { transpose?: number; notes?: string } = {}
): void {
  const maxOrder = this.songs.length > 0 ? Math.max(...this.songs.map((s: ISetlistItem) => s.order)) : -1;
  
  this.songs.push({
    songId,
    arrangementId,
    transpose: options.transpose || 0,
    notes: options.notes,
    order: maxOrder + 1
  });
};

// Remove song method
setlistSchema.methods.removeSong = function(songId: Types.ObjectId): void {
  const initialLength = this.songs.length;
  this.songs = this.songs.filter(song => !song.songId.equals(songId));
  
  // Reorder remaining songs
  if (this.songs.length < initialLength) {
    this.songs.forEach((song, index) => {
      song.order = index;
    });
  }
};

// Reorder songs method
setlistSchema.methods.reorderSongs = function(newOrder: { songId: Types.ObjectId; order: number }[]): void {
  const orderMap = new Map(newOrder.map(item => [item.songId.toString(), item.order]));
  
  this.songs.forEach(song => {
    const newOrderValue = orderMap.get(song.songId.toString());
    if (newOrderValue !== undefined) {
      song.order = newOrderValue;
    }
  });
  
  // Sort by new order
  this.songs.sort((a, b) => a.order - b.order);
};

// Pre-save middleware to update usage tracking
setlistSchema.pre('save', function() {
  if (this.isModified('metadata.lastUsedAt')) {
    this.metadata.usageCount += 1;
  }
});

export const Setlist = mongoose.model<ISetlistDocument>('Setlist', setlistSchema);