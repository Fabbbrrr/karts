// Integration tests for WebSocket and Storage
import { expect } from 'chai';
import sinon from 'sinon';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  updateLapHistory,
  getKartLapHistory,
  clearLapHistory,
  initializeStorage
} from '../../storage.js';
import {
  analyzeKart,
  processSessionData
} from '../../analysis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_STORAGE_PATH = join(__dirname, '..', 'test-storage-ws');

describe('WebSocket and Storage Integration', () => {
  let originalStoragePath;
  
  before(async () => {
    originalStoragePath = process.env.STORAGE_PATH;
    process.env.STORAGE_PATH = TEST_STORAGE_PATH;
    await initializeStorage();
  });

  after(async () => {
    // Restore original
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

  beforeEach(() => {
    clearLapHistory();
  });

  describe('Data Flow: WebSocket -> Storage -> Analysis', () => {
    it('should store lap data and retrieve it for analysis', () => {
      // Simulate receiving lap data from WebSocket
      updateLapHistory('1', {
        lapNum: 1,
        timeRaw: 26500,
        position: 1,
        timestamp: Date.now()
      });

      updateLapHistory('1', {
        lapNum: 2,
        timeRaw: 26300,
        position: 1,
        timestamp: Date.now()
      });

      updateLapHistory('1', {
        lapNum: 3,
        timeRaw: 26400,
        position: 1,
        timestamp: Date.now()
      });

      // Retrieve lap history
      const history = getKartLapHistory('1');
      expect(history).to.have.lengthOf(3);

      // Use in analysis
      const mockRun = {
        kart_number: '1',
        name: 'Test Driver',
        total_laps: 3
      };

      const lapHistory = { '1': history };
      const analysis = analyzeKart(mockRun, lapHistory);

      expect(analysis).to.not.be.null;
      expect(analysis.bestLap).to.equal(26300);
    });

    it('should handle session data processing pipeline', () => {
      // Simulate WebSocket session data
      const sessionData = {
        event_name: 'Integration Test Race',
        timestamp: Date.now(),
        runs: [
          { kart_number: '1', name: 'Driver 1', total_laps: 5 },
          { kart_number: '2', name: 'Driver 2', total_laps: 5 }
        ]
      };

      // Simulate lap history from WebSocket updates
      const lapHistory = {
        '1': [
          { lapNum: 1, timeRaw: 26500, position: 1 },
          { lapNum: 2, timeRaw: 26300, position: 1 },
          { lapNum: 3, timeRaw: 26400, position: 1 },
          { lapNum: 4, timeRaw: 26200, position: 1 },
          { lapNum: 5, timeRaw: 26350, position: 1 }
        ],
        '2': [
          { lapNum: 1, timeRaw: 27000, position: 2 },
          { lapNum: 2, timeRaw: 26900, position: 2 },
          { lapNum: 3, timeRaw: 26800, position: 2 },
          { lapNum: 4, timeRaw: 27100, position: 2 },
          { lapNum: 5, timeRaw: 26950, position: 2 }
        ]
      };

      // Process through analysis pipeline
      const analysis = processSessionData(sessionData, lapHistory);

      expect(analysis).to.have.property('summary');
      expect(analysis).to.have.property('karts');
      expect(analysis.summary.totalKarts).to.equal(2);
      expect(analysis.karts).to.have.lengthOf(2);
    });
  });

  describe('Real-time Lap Updates', () => {
    it('should handle sequential lap updates', () => {
      const laps = [
        { lapNum: 1, timeRaw: 26500, position: 1 },
        { lapNum: 2, timeRaw: 26300, position: 1 },
        { lapNum: 3, timeRaw: 26400, position: 2 },
        { lapNum: 4, timeRaw: 26200, position: 1 },
        { lapNum: 5, timeRaw: 26350, position: 1 }
      ];

      laps.forEach(lap => {
        updateLapHistory('1', {
          ...lap,
          timestamp: Date.now()
        });
      });

      const history = getKartLapHistory('1');
      expect(history).to.have.lengthOf(5);
      
      // Verify laps are in order
      for (let i = 0; i < history.length; i++) {
        expect(history[i].lapNum).to.equal(i + 1);
      }
    });

    it('should handle multiple karts updating simultaneously', () => {
      // Simulate multiple karts finishing laps at similar times
      updateLapHistory('1', { lapNum: 1, timeRaw: 26500, position: 1 });
      updateLapHistory('2', { lapNum: 1, timeRaw: 27000, position: 2 });
      updateLapHistory('3', { lapNum: 1, timeRaw: 27500, position: 3 });

      updateLapHistory('1', { lapNum: 2, timeRaw: 26300, position: 1 });
      updateLapHistory('2', { lapNum: 2, timeRaw: 26900, position: 2 });
      updateLapHistory('3', { lapNum: 2, timeRaw: 27400, position: 3 });

      expect(getKartLapHistory('1')).to.have.lengthOf(2);
      expect(getKartLapHistory('2')).to.have.lengthOf(2);
      expect(getKartLapHistory('3')).to.have.lengthOf(2);
    });
  });

  describe('Session Change Detection', () => {
    it('should clear lap history on session change', () => {
      // Add laps for session 1
      updateLapHistory('1', { lapNum: 1, timeRaw: 26500, position: 1 });
      updateLapHistory('1', { lapNum: 2, timeRaw: 26300, position: 1 });
      updateLapHistory('2', { lapNum: 1, timeRaw: 27000, position: 2 });

      expect(getKartLapHistory('1')).to.have.lengthOf(2);

      // Simulate session change
      clearLapHistory();

      // Add laps for session 2
      updateLapHistory('1', { lapNum: 1, timeRaw: 25500, position: 1 });

      expect(getKartLapHistory('1')).to.have.lengthOf(1);
      expect(getKartLapHistory('2')).to.have.lengthOf(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across storage and analysis', () => {
      // Add lap data
      for (let i = 1; i <= 10; i++) {
        updateLapHistory('1', {
          lapNum: i,
          timeRaw: 26000 + (i * 100),
          position: 1
        });
      }

      const storedHistory = getKartLapHistory('1');
      expect(storedHistory).to.have.lengthOf(10);

      // Analyze the same data
      const mockRun = {
        kart_number: '1',
        name: 'Consistency Test',
        total_laps: 10
      };

      const analysis = analyzeKart(mockRun, { '1': storedHistory });
      
      expect(analysis.totalLaps).to.equal(10);
      expect(analysis.validLaps).to.equal(10);
      expect(analysis.lapHistory).to.have.lengthOf(10);

      // Verify best lap is correct
      const expectedBestLap = Math.min(...storedHistory.map(l => l.timeRaw));
      expect(analysis.bestLap).to.equal(expectedBestLap);
    });
  });

  describe('Performance under Load', () => {
    it('should handle rapid lap updates efficiently', () => {
      const startTime = Date.now();
      const numKarts = 20;
      const lapsPerKart = 50;

      // Simulate rapid lap updates for multiple karts
      for (let kart = 1; kart <= numKarts; kart++) {
        for (let lap = 1; lap <= lapsPerKart; lap++) {
          updateLapHistory(String(kart), {
            lapNum: lap,
            timeRaw: 26000 + (Math.random() * 2000),
            position: kart
          });
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).to.be.below(1000);

      // Verify all data was stored
      for (let kart = 1; kart <= numKarts; kart++) {
        const history = getKartLapHistory(String(kart));
        expect(history.length).to.be.at.least(lapsPerKart);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing lap numbers gracefully', () => {
      updateLapHistory('1', {
        timeRaw: 26500,
        position: 1
      });

      const history = getKartLapHistory('1');
      expect(history).to.have.lengthOf(1);
    });

    it('should handle invalid time values', () => {
      updateLapHistory('1', {
        lapNum: 1,
        timeRaw: null,
        position: 1
      });

      updateLapHistory('1', {
        lapNum: 2,
        timeRaw: 26500,
        position: 1
      });

      const history = getKartLapHistory('1');
      // Only valid lap should be stored
      expect(history.length).to.be.at.most(1);
    });

    it('should handle extremely fast lap times', () => {
      updateLapHistory('1', {
        lapNum: 1,
        timeRaw: 5000, // 5 seconds - unrealistically fast but valid
        position: 1
      });

      const history = getKartLapHistory('1');
      expect(history).to.have.lengthOf(1);
    });

    it('should filter extremely slow lap times', () => {
      const fastLaps = [
        { lapNum: 1, timeRaw: 26500, position: 1 },
        { lapNum: 2, timeRaw: 26300, position: 1 },
        { lapNum: 3, timeRaw: 26400, position: 1 }
      ];

      const slowLap = { lapNum: 4, timeRaw: 120000, position: 1 }; // 2 minutes (pit stop)

      fastLaps.forEach(lap => updateLapHistory('1', lap));
      updateLapHistory('1', slowLap);

      const mockRun = {
        kart_number: '1',
        name: 'Filter Test',
        total_laps: 4
      };

      const analysis = analyzeKart(mockRun, { '1': getKartLapHistory('1') });
      
      // Analysis should only include fast laps (< 60s)
      expect(analysis.validLaps).to.equal(3);
    });
  });
});

