import { Document, Types } from 'mongoose';

export interface ISong {
  title: string;
  artist?: string;
  slug: string;
  chordData?: Buffer; // Compressed chord data
  key?: string;
  tempo?: number;
  timeSignature?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  themes?: string[];
  source?: string;
  lyrics?: string;
  notes?: string;
  metadata?: {
    createdBy?: Types.ObjectId;
    lastModifiedBy?: Types.ObjectId;
    isPublic?: boolean;
    ratings?: {
      average: number;
      count: number;
    };
    views?: number;
  };
  documentSize: number; // Calculated document size in bytes
  createdAt: Date;
  updatedAt: Date;
}

export interface ISongDocument extends ISong, Document {
  getDecompressedChordData(): Promise<string | null>;
  generateSlug(): Promise<string>;
  calculateDocumentSize(): number;
  setChordData(chordData: string): void;
}

export interface ISongModel {
  // Static methods can be added here
  findBySlug(slug: string): Promise<ISongDocument | null>;
  searchSongs(query: string, options?: SearchOptions): Promise<ISongDocument[]>;
}

export interface SearchOptions {
  limit?: number;
  skip?: number;
  sortBy?: 'relevance' | 'title' | 'artist' | 'createdAt' | 'popularity';
  filters?: {
    key?: string[];
    difficulty?: string[];
    themes?: string[];
    source?: string[];
  };
}