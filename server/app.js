// Express App Setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { setupRoutes } from './routes.js';
import { config } from './config.js';
import logger from './logger.js';

export function createApp() {
  const app = express();
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API server
    crossOriginEmbedderPolicy: false
  }));
  
  // CORS configuration
  const corsOptions = {
    origin: config.security.allowedOrigins === '*' 
      ? '*' 
      : config.security.allowedOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  
  app.use(cors(corsOptions));
  
  // Compression middleware
  app.use(compression());
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      ip: req.ip
    });
    next();
  });
  
  // Setup API routes
  setupRoutes(app);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
  });
  
  return app;
}
