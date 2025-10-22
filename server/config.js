// Configuration Module
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // WebSocket
  websocket: {
    host: process.env.WS_HOST || 'lemansentertainment.loc',
    port: parseInt(process.env.WS_PORT || '8131', 10),
    protocol: process.env.WS_PROTOCOL || 'ws',
    get url() {
      return `${this.protocol}://${this.host}:${this.port}`;
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  },
  
  // API
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://lemansentertainment.loc'
  },
  
  // Storage
  storage: {
    path: process.env.STORAGE_PATH || join(__dirname, 'storage'),
    maxSessions: parseInt(process.env.MAX_SESSIONS || '50', 10),
    maxLapsPerSession: parseInt(process.env.MAX_LAPS_PER_SESSION || '1000', 10)
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || join(__dirname, 'logs', 'server.log')
  },
  
  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    dynamoDbTable: process.env.AWS_DYNAMODB_TABLE || ''
  },
  
  // Security
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  // Thresholds (from client-side config)
  thresholds: {
    lapTimeThreshold: 60000, // 60 seconds in ms
    minLapsForAnalysis: 3,
    staleDriverThreshold: 300000, // 5 minutes in ms
    consistencyThreshold: 1.0 // seconds
  }
};

// Validate configuration
export function validateConfig() {
  const errors = [];
  
  if (!config.websocket.host) {
    errors.push('WS_HOST is required');
  }
  
  if (config.nodeEnv === 'production') {
    if (!config.websocket.port) {
      errors.push('WS_PORT is required in production');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

