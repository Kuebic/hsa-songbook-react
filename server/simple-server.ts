import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { DatabaseConnection } from './config/database.js';

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const db = DatabaseConnection.getInstance();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = db.getConnectionStatus();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    mongodb: db.getConnectionStatus() ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

async function startServer() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await db.connect();
    
    // Get storage stats
    try {
      const stats = await db.getStorageStats();
      console.log(`📊 Database storage: ${stats.totalSizeMB.toFixed(2)}MB used`);
    } catch (error) {
      console.log('📊 Could not fetch storage stats (database may be empty)', error);
    }
    
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
      console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();