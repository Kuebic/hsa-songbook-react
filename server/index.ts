import 'dotenv/config'; // Load environment variables
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { clerkMiddleware } from '@clerk/express';
import { DatabaseConnection } from './config/database';

/**
 * Custom error interface for application errors
 */
interface AppError extends Error {
  status?: number;
  code?: string;
}

// Import routes
import songsRouter from './routes/songs';
import arrangementsRouter from './routes/arrangements';
import setlistsRouter from './routes/setlists';
import { handleClerkWebhook } from './routes/webhooks/clerk';

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const db = DatabaseConnection.getInstance();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting - 5 requests per second per IP
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 5, // 5 requests per window
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
app.use(clerkMiddleware());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = db.getConnectionStatus();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// Webhook routes (before general middleware)
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

// API routes
app.use('/api/songs', songsRouter);
app.use('/api/arrangements', arrangementsRouter);
app.use('/api/setlists', setlistsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler  
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : 'Internal server error';
  console.error('Unhandled error:', errorMessage);
  
  res.status(err.status || 500).json({
    error: errorMessage,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

async function startServer() {
  try {
    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Found in environment' : 'Not found');
    
    await db.connect();
    
    // Get initial storage stats
    try {
      const stats = await db.getStorageStats();
      console.log(`📊 Database storage: ${stats.totalSizeMB.toFixed(2)}MB used`);
      if (stats.totalSizeMB > 400) {
        console.warn('⚠️  WARNING: Approaching 512MB storage limit!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('📊 Could not fetch storage stats (database may be empty):', errorMessage);
    }
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
      console.log(`📖 API docs: server/API_DOCUMENTATION.md`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  void (async () => {
    await db.disconnect();
    process.exit(0);
  })();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  void (async () => {
    await db.disconnect();
    process.exit(0);
  })();
});

if (require.main === module) {
  void startServer();
}

export { app };