// Unit tests for Storage Module
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  initializeStorage,
  updateLapHistory,
  getKartLapHistory,
  getAllLapHistory,
  clearLapHistory,
  saveSessionData,
  getCurrentSession,
  getAllSessions,
  getSessionById,
  deleteSession,
  getStorageStats,
  exportSession
} from '../../storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_STORAGE_PATH = join(__dirname, '..', 'test-storage');

describe('Storage Module', () => {
  let originalStoragePath;
  
  before(async () => {
    // Save original and set test storage path
    originalStoragePath = process.env.STORAGE_PATH;
    process.env.STORAGE_PATH = TEST_STORAGE_PATH;
    await initializeStorage();
  });

  after(async () => {
    // Restore original storage path
    if (originalStoragePath) {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    
    // Clean up test storage
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Storage Initialization', () => {
    it('should create storage directories', async () => {
      const sessionsDir = join(TEST_STORAGE_PATH, 'sessions');
      const currentDir = join(TEST_STORAGE_PATH, 'current');
      
      const sessionsExists = await fs.access(sessionsDir).then(() => true).catch(() => false);
      const currentExists = await fs.access(currentDir).then(() => true).catch(() => false);
      
      expect(sessionsExists).to.be.true;
      expect(currentExists).to.be.true;
    });
  });

  describe('Lap History Management', () => {
    beforeEach(() => {
      clearLapHistory();
    });

    it('should update lap history for a kart', () => {
      updateLapHistory('1', {
        lapNum: 1,
        timeRaw: 26500,
        position: 1,
        timestamp: Date.now()
      });

      const history = getKartLapHistory('1');
      expect(history).to.have.lengthOf(1);
      expect(history[0].lapNum).to.equal(1);
      expect(history[0].timeRaw).to.equal(26500);
    });

    it('should not add duplicate laps', () => {
      const lapData = {
        lapNum: 1,
        timeRaw: 26500,
        position: 1,
        timestamp: Date.now()
      };

      updateLapHistory('1', lapData);
      updateLapHistory('1', lapData); // Try to add same lap again

      const history = getKartLapHistory('1');
      expect(history).to.have.lengthOf(1);
    });

    it('should track multiple karts separately', () => {
      updateLapHistory('1', { lapNum: 1, timeRaw: 26500, position: 1 });
      updateLapHistory('2', { lapNum: 1, timeRaw: 27000, position: 2 });

      const history1 = getKartLapHistory('1');
      const history2 = getKartLapHistory('2');

      expect(history1).to.have.lengthOf(1);
      expect(history2).to.have.lengthOf(1);
      expect(history1[0].timeRaw).to.equal(26500);
      expect(history2[0].timeRaw).to.equal(27000);
    });

    it('should return empty array for unknown kart', () => {
      const history = getKartLapHistory('999');
      expect(history).to.be.an('array').that.is.empty;
    });

    it('should get all lap history', () => {
      updateLapHistory('1', { lapNum: 1, timeRaw: 26500, position: 1 });
      updateLapHistory('2', { lapNum: 1, timeRaw: 27000, position: 2 });

      const allHistory = getAllLapHistory();
      expect(allHistory).to.have.property('1');
      expect(allHistory).to.have.property('2');
    });

    it('should clear all lap history', () => {
      updateLapHistory('1', { lapNum: 1, timeRaw: 26500, position: 1 });
      updateLapHistory('2', { lapNum: 1, timeRaw: 27000, position: 2 });

      clearLapHistory();

      const allHistory = getAllLapHistory();
      expect(Object.keys(allHistory)).to.have.lengthOf(0);
    });

    it('should limit lap history to prevent memory issues', () => {
      const maxLaps = 1000; // Based on config
      
      // Add more than max laps
      for (let i = 1; i <= maxLaps + 10; i++) {
        updateLapHistory('1', {
          lapNum: i,
          timeRaw: 26000 + i,
          position: 1
        });
      }

      const history = getKartLapHistory('1');
      expect(history.length).to.be.at.most(maxLaps);
    });
  });

  describe('Session Data Management', () => {
    const mockSessionData = {
      sessionId: 1234567890,
      sessionData: {
        event_name: 'Test Race',
        runs: [
          { kart_number: '1', name: 'Driver 1', total_laps: 10 }
        ]
      },
      analysis: {
        summary: {
          totalKarts: 1,
          totalLaps: 10
        },
        karts: [
          { kartNumber: '1', driverName: 'Driver 1', bestLap: 26500 }
        ]
      },
      lapHistory: {
        '1': [{ lapNum: 1, timeRaw: 26500 }]
      }
    };

    it('should save session data', async () => {
      await saveSessionData(mockSessionData);

      const currentSession = await getCurrentSession();
      expect(currentSession).to.not.be.null;
      expect(currentSession.sessionId).to.equal(mockSessionData.sessionId);
    });

    it('should retrieve current session', async () => {
      await saveSessionData(mockSessionData);

      const session = await getCurrentSession();
      expect(session.sessionData.event_name).to.equal('Test Race');
      expect(session.analysis.summary.totalKarts).to.equal(1);
    });

    it('should retrieve session by ID', async () => {
      await saveSessionData(mockSessionData);

      const session = await getSessionById(mockSessionData.sessionId);
      expect(session).to.not.be.null;
      expect(session.sessionId).to.equal(mockSessionData.sessionId);
    });

    it('should return null for non-existent session', async () => {
      const session = await getSessionById(999999999);
      expect(session).to.be.null;
    });

    it('should list all sessions', async () => {
      // Save multiple sessions
      const session1 = { ...mockSessionData, sessionId: 1111 };
      const session2 = { ...mockSessionData, sessionId: 2222 };

      await saveSessionData(session1);
      await saveSessionData(session2);

      const sessions = await getAllSessions();
      expect(sessions.length).to.be.at.least(2);
    });

    it('should delete session by ID', async () => {
      await saveSessionData(mockSessionData);
      
      const deleted = await deleteSession(mockSessionData.sessionId);
      expect(deleted).to.be.true;

      const session = await getSessionById(mockSessionData.sessionId);
      expect(session).to.be.null;
    });

    it('should export session data', async () => {
      await saveSessionData(mockSessionData);

      const exported = await exportSession(mockSessionData.sessionId);
      expect(exported).to.not.be.null;
      expect(exported).to.have.property('exportDate');
      expect(exported).to.have.property('session');
      expect(exported.session.sessionId).to.equal(mockSessionData.sessionId);
    });
  });

  describe('Storage Statistics', () => {
    it('should return storage statistics', async () => {
      const stats = await getStorageStats();
      
      expect(stats).to.have.property('totalSessions');
      expect(stats).to.have.property('storageSize');
      expect(stats).to.have.property('storageSizeMB');
      expect(stats).to.have.property('maxSessions');
      expect(stats).to.have.property('lapHistoryKarts');
    });

    it('should include current session in stats', async () => {
      const mockData = {
        sessionId: Date.now(),
        sessionData: { event_name: 'Stats Test' },
        analysis: { summary: { totalKarts: 5 } }
      };

      await saveSessionData(mockData);

      const stats = await getStorageStats();
      expect(stats.currentSession).to.not.be.null;
      expect(stats.currentSession.eventName).to.equal('Stats Test');
    });
  });
});

