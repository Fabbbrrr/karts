// Integration tests for API endpoints
import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../../app.js';
import { saveSessionData, clearLapHistory, initializeStorage } from '../../storage.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_STORAGE_PATH = join(__dirname, '..', 'test-storage-api');

describe('API Integration Tests', () => {
  let app;
  let originalStoragePath;
  let originalNodeEnv;

  before(async () => {
    // Save originals
    originalStoragePath = process.env.STORAGE_PATH;
    originalNodeEnv = process.env.NODE_ENV;
    
    // Set test environment
    process.env.STORAGE_PATH = TEST_STORAGE_PATH;
    process.env.NODE_ENV = 'test';
    await initializeStorage();
    app = createApp();
  });

  after(async () => {
    // Restore originals
    if (originalStoragePath) {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    }
    
    // Clean up test storage
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    clearLapHistory();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('status', 'OK');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('uptime');
      expect(response.body).to.have.property('websocket');
    });

    it('GET /api/health should return server status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).to.have.property('status', 'OK');
    });
  });

  describe('Current Session Endpoints', () => {
    const mockSessionData = {
      sessionId: Date.now(),
      sessionData: {
        event_name: 'API Test Race',
        track_configuration_id: 'test-track',
        current_lap: 5,
        total_laps: 20,
        runs: [
          { kart_number: '1', name: 'API Test Driver', total_laps: 5 }
        ]
      },
      analysis: {
        summary: {
          totalKarts: 1,
          totalLaps: 5,
          fastestLap: '26.500',
          fastestDriver: 'API Test Driver'
        },
        karts: [
          {
            kartNumber: '1',
            driverName: 'API Test Driver',
            bestLap: 26500,
            bestLapFormatted: '26.500',
            avgLapTime: 26700,
            validLaps: 5
          }
        ],
        crossKartDrivers: []
      }
    };

    beforeEach(async () => {
      await saveSessionData(mockSessionData);
    });

    it('GET /api/current should return current session analysis', async () => {
      const response = await request(app)
        .get('/api/current')
        .expect(200);

      expect(response.body).to.have.property('sessionId');
      expect(response.body).to.have.property('analysis');
      expect(response.body).to.have.property('sessionData');
      expect(response.body.sessionData.eventName).to.equal('API Test Race');
    });

    it('GET /api/analysis should return all kart analysis', async () => {
      const response = await request(app)
        .get('/api/analysis')
        .expect(200);

      expect(response.body).to.have.property('summary');
      expect(response.body).to.have.property('karts');
      expect(response.body.karts).to.be.an('array');
      expect(response.body.karts).to.have.lengthOf(1);
    });

    it('GET /api/kart/:kartNumber should return specific kart details', async () => {
      const response = await request(app)
        .get('/api/kart/1')
        .expect(200);

      expect(response.body.kartNumber).to.equal('1');
      expect(response.body.driverName).to.equal('API Test Driver');
      expect(response.body).to.have.property('bestLap');
    });

    it('GET /api/kart/:kartNumber should return 404 for non-existent kart', async () => {
      const response = await request(app)
        .get('/api/kart/999')
        .expect(404);

      expect(response.body).to.have.property('error');
    });
  });

  describe('Statistics Endpoint', () => {
    it('GET /api/stats should return comprehensive statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body).to.have.property('storage');
      expect(response.body).to.have.property('websocket');
      expect(response.body).to.have.property('server');
      
      expect(response.body.storage).to.have.property('totalSessions');
      expect(response.body.storage).to.have.property('storageSizeMB');
      expect(response.body.server).to.have.property('uptime');
      expect(response.body.server).to.have.property('memory');
    });
  });

  describe('Historical Sessions Endpoints', () => {
    const session1 = {
      sessionId: 111111,
      sessionData: {
        event_name: 'Race 1',
        runs: []
      },
      analysis: {
        summary: { totalKarts: 5, totalLaps: 50 },
        karts: []
      }
    };

    const session2 = {
      sessionId: 222222,
      sessionData: {
        event_name: 'Race 2',
        runs: []
      },
      analysis: {
        summary: { totalKarts: 8, totalLaps: 80 },
        karts: []
      }
    };

    beforeEach(async () => {
      await saveSessionData(session1);
      await saveSessionData(session2);
    });

    it('GET /api/sessions should list all sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(200);

      expect(response.body).to.have.property('total');
      expect(response.body).to.have.property('sessions');
      expect(response.body.sessions).to.be.an('array');
      expect(response.body.total).to.be.at.least(2);
    });

    it('GET /api/sessions/:sessionId should return session details', async () => {
      const response = await request(app)
        .get('/api/sessions/111111')
        .expect(200);

      expect(response.body.sessionId).to.equal(111111);
      expect(response.body.sessionData.event_name).to.equal('Race 1');
    });

    it('GET /api/sessions/:sessionId should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/999999')
        .expect(404);

      expect(response.body).to.have.property('error');
    });

    it('GET /api/sessions/:sessionId/export should export session', async () => {
      const response = await request(app)
        .get('/api/sessions/111111/export')
        .expect(200);

      expect(response.body).to.have.property('exportDate');
      expect(response.body).to.have.property('session');
      expect(response.header['content-type']).to.include('application/json');
    });

    it('DELETE /api/sessions/:sessionId should delete session', async () => {
      const response = await request(app)
        .delete('/api/sessions/111111')
        .expect(200);

      expect(response.body).to.have.property('message');
      expect(response.body.sessionId).to.equal(111111);

      // Verify session is deleted
      await request(app)
        .get('/api/sessions/111111')
        .expect(404);
    });
  });

  describe('Root Endpoint', () => {
    it('GET / should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('version');
      expect(response.body).to.have.property('status', 'running');
      expect(response.body).to.have.property('endpoints');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown endpoint', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).to.have.property('error');
      expect(response.body).to.have.property('path');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when no data available', async () => {
      // Create fresh app without any saved data
      const freshApp = createApp();
      
      const response = await request(freshApp)
        .get('/api/current')
        .expect(404);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('No current session data');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).to.have.property('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from Helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet adds various security headers
      expect(response.headers).to.have.property('x-dns-prefetch-control');
      expect(response.headers).to.have.property('x-frame-options');
    });
  });
});

