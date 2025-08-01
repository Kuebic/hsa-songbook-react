import mongoose from 'mongoose';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(uri?: string): Promise<void> {
    if (this.isConnected) return;

    const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/hsa-songbook';

    try {
      await mongoose.connect(mongoUri, {
        // Optimize for free tier limits
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      });

      this.isConnected = true;
      console.log('Connected to MongoDB');

      // Monitor connection events
      mongoose.connection.on('error', (error: Error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async getStorageStats(): Promise<{
    dataSize: number;
    storageSize: number;
    indexSize: number;
    totalSize: number;
    dataSizeMB: number;
    storageSizeMB: number;
    totalSizeMB: number;
  }> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    
    return {
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexSize: stats.indexSize,
      totalSize: stats.dataSize + stats.indexSize,
      dataSizeMB: stats.dataSize / (1024 * 1024),
      storageSizeMB: stats.storageSize / (1024 * 1024),
      totalSizeMB: (stats.dataSize + stats.indexSize) / (1024 * 1024)
    };
  }
}