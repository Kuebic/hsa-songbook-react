import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Song } from '../Song';

describe('Song Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Song.deleteMany({});
  });

  it('should compress chord data using Zstd', async () => {
    const chordData = "{title: Amazing Grace}\n[G]Amazing grace, how [C]sweet the [G]sound";
    const song = new Song({ 
      title: 'Amazing Grace', 
      artist: 'John Newton'
    });
    
    song.setChordData(chordData);
    await song.save();

    expect(song.chordData).toBeInstanceOf(Buffer);
    // For small strings, compression may not save space due to headers
    // The important thing is that it's compressed and can be decompressed
    expect(song.chordData.length).toBeGreaterThan(0);
    
    // Verify we can decompress it back
    const decompressed = await song.getDecompressedChordData();
    expect(decompressed).toBe(chordData);
  });

  it('should generate proper slug on save', async () => {
    const song = await Song.create({
      title: 'Amazing Grace',
      artist: 'John Newton'
    });

    expect(song.slug).toMatch(/^amazing-grace-jn-[a-z0-9]{5}$/);
  });

  it('should handle slug collision with counter', async () => {
    // Create first song
    const song1 = await Song.create({
      title: 'Amazing Grace',
      artist: 'John Newton'
    });

    // Create second song with same title/artist
    const song2 = await Song.create({
      title: 'Amazing Grace',
      artist: 'John Newton'
    });

    expect(song1.slug).toMatch(/^amazing-grace-jn-[a-z0-9]{5}$/);
    expect(song2.slug).toMatch(/^amazing-grace-jn-[a-z0-9]{5}$/);
    expect(song1.slug).not.toBe(song2.slug);
  });

  it('should create compound text index for search', async () => {
    const song = await Song.create({
      title: 'Amazing Grace',
      artist: 'John Newton',
      themes: ['grace', 'salvation'],
      source: 'Traditional Hymnal'
    });

    // Test search functionality
    const searchResults = await Song.find({
      $text: { $search: 'Amazing Grace' }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0]._id).toEqual(song._id);
  });

  it('should calculate and store document size', async () => {
    const chordData = "{title: Amazing Grace}\n[G]Amazing grace, how [C]sweet the [G]sound";
    const song = new Song({
      title: 'Amazing Grace',
      artist: 'John Newton'
    });
    
    song.setChordData(chordData);
    await song.save();

    expect(song.documentSize).toBeGreaterThan(0);
    expect(typeof song.documentSize).toBe('number');
  });

  it('should validate required fields', async () => {
    await expect(Song.create({})).rejects.toThrow();
    
    await expect(Song.create({
      artist: 'John Newton'
    })).rejects.toThrow();
  });

  it('should compress large chord data to less than 40% original size', async () => {
    // Create larger chord data to test compression ratio
    const largeChordData = `{title: Amazing Grace}
{key: G}
{tempo: 120}

Verse 1:
[G]Amazing grace, how [C]sweet the [G]sound
That saved a [D]wretch like [G]me
I [G]once was lost, but [C]now am [G]found
Was blind but [D]now I [G]see

Verse 2:
'Twas [G]grace that taught my [C]heart to [G]fear
And grace my [D]fears re[G]lieved
How [G]precious did that [C]grace ap[G]pear
The hour I [D]first be[G]lieved

Chorus:
[G]How sweet the sound [C]that saved a [G]wretch
That saved a [D]wretch like [G]me
[G]I once was lost [C]but now am [G]found
Was blind but [D]now I [G]see`.repeat(3); // Make it larger

    const song = new Song({
      title: 'Amazing Grace Extended',
      artist: 'John Newton'
    });
    
    song.setChordData(largeChordData);
    await song.save();

    const originalSize = Buffer.from(largeChordData).length;
    const compressedSize = song.chordData.length;
    const compressionRatio = compressedSize / originalSize;

    expect(compressionRatio).toBeLessThan(0.4); // Less than 40%
  });
});