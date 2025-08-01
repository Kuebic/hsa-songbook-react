import 'dotenv/config';
import { DatabaseConnection } from './config/database.js';

async function testConnection() {
  console.log('🔗 Testing MongoDB connection...');
  console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Found in environment' : 'Not found');
  
  try {
    const db = DatabaseConnection.getInstance();
    await db.connect();
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test storage stats
    try {
      const stats = await db.getStorageStats();
      console.log(`📊 Database storage: ${stats.totalSizeMB.toFixed(2)}MB used`);
      console.log(`📈 Collections: ${stats.storageSize > 0 ? 'Data found' : 'Empty database'}`);
    } catch (error) {
      console.log('📊 Could not fetch storage stats:', error);
    }
    
    await db.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();