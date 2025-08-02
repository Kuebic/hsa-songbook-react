import mongoose, { Schema } from 'mongoose';
import { Role } from '../types/auth';

export interface IUser {
  clerkId: string; // Clerk authentication ID
  email: string;
  name: string;
  role: Role;
  preferences: {
    defaultKey?: string;
    fontSize?: number;
    theme?: 'light' | 'dark' | 'stage';
  };
  profile: {
    bio?: string;
    website?: string;
    location?: string;
  };
  stats: {
    songsCreated: number;
    arrangementsCreated: number;
    setlistsCreated: number;
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, mongoose.Document {
  updateStats(): Promise<void>;
  getPublicProfile(): Partial<IUser>;
}

const userSchema = new Schema<IUserDocument>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.USER,
    index: true
  },
  preferences: {
    defaultKey: {
      type: String,
      enum: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
    },
    fontSize: {
      type: Number,
      min: 12,
      max: 32,
      default: 16
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'stage'],
      default: 'light'
    }
  },
  profile: {
    bio: {
      type: String,
      maxlength: 500
    },
    website: {
      type: String,
      maxlength: 200
    },
    location: {
      type: String,
      maxlength: 100
    }
  },
  stats: {
    songsCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    arrangementsCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    setlistsCreated: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// Update stats method
userSchema.methods.updateStats = async function(): Promise<void> {
  const Song = mongoose.model('Song');
  const Arrangement = mongoose.model('Arrangement');
  const Setlist = mongoose.model('Setlist');

  const [songsCount, arrangementsCount, setlistsCount] = await Promise.all([
    Song.countDocuments({ 'metadata.createdBy': this._id }),
    Arrangement.countDocuments({ createdBy: this._id }),
    Setlist.countDocuments({ createdBy: this._id })
  ]);

  this.stats = {
    songsCreated: songsCount,
    arrangementsCreated: arrangementsCount,
    setlistsCreated: setlistsCount
  };

  await this.save();
};

// Get public profile method
userSchema.methods.getPublicProfile = function(): Partial<IUser> {
  return {
    name: this.name,
    profile: this.profile,
    stats: this.stats,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model<IUserDocument>('User', userSchema);