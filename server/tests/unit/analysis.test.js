// Unit tests for Analysis Module
import { expect } from 'chai';
import {
  calculateConsistency,
  calculateAverageLapTime,
  analyzeKart,
  analyzeAllKarts,
  calculateNormalizedIndex,
  getKartStats,
  findCrossKartDrivers,
  processSessionData
} from '../../analysis.js';

describe('Analysis Module', () => {
  describe('Consistency Calculation', () => {
    it('should calculate consistency (standard deviation)', () => {
      const lapTimes = [
        { lapTimeRaw: 26000 },
        { lapTimeRaw: 26100 },
        { lapTimeRaw: 26200 },
        { lapTimeRaw: 25900 }
      ];

      const consistency = calculateConsistency(lapTimes);
      expect(consistency).to.be.a('number');
      expect(consistency).to.be.above(0);
    });

    it('should return null for insufficient laps', () => {
      const lapTimes = [
        { lapTimeRaw: 26000 },
        { lapTimeRaw: 26100 }
      ];

      const consistency = calculateConsistency(lapTimes);
      expect(consistency).to.be.null;
    });

    it('should filter out invalid lap times', () => {
      const lapTimes = [
        { lapTimeRaw: 26000 },
        { lapTimeRaw: 26100 },
        { lapTimeRaw: 26200 },
        { lapTimeRaw: 120000 }, // Too slow (> 60s threshold)
        { lapTimeRaw: 25900 }
      ];

      const consistency = calculateConsistency(lapTimes);
      expect(consistency).to.be.a('number');
    });

    it('should return null for empty array', () => {
      const consistency = calculateConsistency([]);
      expect(consistency).to.be.null;
    });
  });

  describe('Average Lap Time Calculation', () => {
    it('should calculate average lap time', () => {
      const lapTimes = [
        { lapTimeRaw: 26000 },
        { lapTimeRaw: 26100 },
        { lapTimeRaw: 26200 }
      ];

      const avgTime = calculateAverageLapTime(lapTimes);
      expect(avgTime).to.equal(26100);
    });

    it('should return null for empty array', () => {
      const avgTime = calculateAverageLapTime([]);
      expect(avgTime).to.be.null;
    });

    it('should filter out invalid lap times', () => {
      const lapTimes = [
        { lapTimeRaw: 26000 },
        { lapTimeRaw: 120000 }, // Too slow
        { lapTimeRaw: 26100 }
      ];

      const avgTime = calculateAverageLapTime(lapTimes);
      expect(avgTime).to.equal(26050); // Average of 26000 and 26100
    });
  });

  describe('Kart Analysis', () => {
    const mockRun = {
      kart_number: '1',
      kart_id: 'K001',
      name: 'Test Driver',
      total_laps: 10
    };

    const mockLapHistory = {
      '1': [
        { lapNum: 1, timeRaw: 26500, position: 1 },
        { lapNum: 2, timeRaw: 26300, position: 1 },
        { lapNum: 3, timeRaw: 26400, position: 1 },
        { lapNum: 4, timeRaw: 26200, position: 1 },
        { lapNum: 5, timeRaw: 26350, position: 1 }
      ]
    };

    it('should analyze kart with valid data', () => {
      const analysis = analyzeKart(mockRun, mockLapHistory);
      
      expect(analysis).to.not.be.null;
      expect(analysis.kartNumber).to.equal('1');
      expect(analysis.driverName).to.equal('Test Driver');
      expect(analysis.totalLaps).to.equal(10);
      expect(analysis.bestLap).to.equal(26200);
    });

    it('should return null for insufficient laps', () => {
      const limitedHistory = {
        '1': [
          { lapNum: 1, timeRaw: 26500, position: 1 },
          { lapNum: 2, timeRaw: 26300, position: 1 }
        ]
      };

      const analysis = analyzeKart(mockRun, limitedHistory);
      expect(analysis).to.be.null;
    });

    it('should calculate best 3 lap average', () => {
      const analysis = analyzeKart(mockRun, mockLapHistory);
      
      expect(analysis.best3Avg).to.be.a('number');
      expect(analysis.best3Avg).to.be.below(analysis.avgLapTime);
    });

    it('should include formatted times', () => {
      const analysis = analyzeKart(mockRun, mockLapHistory);
      
      expect(analysis.bestLapFormatted).to.be.a('string');
      expect(analysis.avgLapTimeFormatted).to.be.a('string');
      expect(analysis.consistencyFormatted).to.be.a('string');
    });

    it('should calculate total time', () => {
      const analysis = analyzeKart(mockRun, mockLapHistory);
      
      expect(analysis.totalTime).to.be.a('number');
      expect(analysis.totalTime).to.equal(26500 + 26300 + 26400 + 26200 + 26350);
    });

    it('should include lap history details', () => {
      const analysis = analyzeKart(mockRun, mockLapHistory);
      
      expect(analysis.lapHistory).to.be.an('array');
      expect(analysis.lapHistory).to.have.lengthOf(5);
      expect(analysis.lapHistory[0]).to.have.property('lapNum');
      expect(analysis.lapHistory[0]).to.have.property('time');
      expect(analysis.lapHistory[0]).to.have.property('timeFormatted');
    });

    it('should return null for kart without number', () => {
      const invalidRun = { ...mockRun, kart_number: null };
      const analysis = analyzeKart(invalidRun, mockLapHistory);
      
      expect(analysis).to.be.null;
    });
  });

  describe('Analyze All Karts', () => {
    const mockSessionData = {
      runs: [
        { kart_number: '1', name: 'Driver 1', total_laps: 5 },
        { kart_number: '2', name: 'Driver 2', total_laps: 5 },
        { kart_number: '3', name: 'Driver 3', total_laps: 2 } // Too few laps
      ]
    };

    const mockLapHistory = {
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

    it('should analyze all karts with sufficient data', () => {
      const analyses = analyzeAllKarts(mockSessionData, mockLapHistory);
      
      expect(analyses).to.be.an('array');
      expect(analyses).to.have.lengthOf(2); // Only 2 karts have enough laps
    });

    it('should return empty array for no session data', () => {
      const analyses = analyzeAllKarts(null, mockLapHistory);
      expect(analyses).to.be.an('array').that.is.empty;
    });

    it('should handle errors gracefully', () => {
      const invalidSessionData = {
        runs: [
          { kart_number: '1' } // Missing required fields
        ]
      };

      const analyses = analyzeAllKarts(invalidSessionData, {});
      expect(analyses).to.be.an('array');
    });
  });

  describe('Normalized Performance Index', () => {
    const mockAnalyses = [
      { kartNumber: '1', bestLap: 26000, consistency: 0.2 },
      { kartNumber: '2', bestLap: 27000, consistency: 0.5 },
      { kartNumber: '3', bestLap: 28000, consistency: 0.8 }
    ];

    it('should calculate normalized index (0-100)', () => {
      const index = calculateNormalizedIndex(mockAnalyses[0], mockAnalyses);
      
      expect(index).to.be.a('number');
      expect(index).to.be.at.least(0);
      expect(index).to.be.at.most(100);
    });

    it('should give highest score to fastest, most consistent kart', () => {
      const index1 = calculateNormalizedIndex(mockAnalyses[0], mockAnalyses);
      const index2 = calculateNormalizedIndex(mockAnalyses[2], mockAnalyses);
      
      expect(index1).to.be.above(index2);
    });

    it('should return 0 for empty array', () => {
      const index = calculateNormalizedIndex(mockAnalyses[0], []);
      expect(index).to.equal(0);
    });
  });

  describe('Kart Statistics', () => {
    const mockAnalysis = {
      kartNumber: '1',
      driverName: 'Test Driver',
      totalLaps: 10,
      validLaps: 9,
      bestLapFormatted: '26.200',
      avgLapTimeFormatted: '26.350',
      best3AvgFormatted: '26.250',
      consistencyFormatted: '0.150s',
      totalTimeFormatted: '3:57.150',
      lastUpdate: new Date().toISOString()
    };

    it('should extract kart statistics', () => {
      const stats = getKartStats(mockAnalysis);
      
      expect(stats).to.not.be.null;
      expect(stats.kartNumber).to.equal('1');
      expect(stats.driverName).to.equal('Test Driver');
      expect(stats.bestLap).to.equal('26.200');
    });

    it('should return null for null input', () => {
      const stats = getKartStats(null);
      expect(stats).to.be.null;
    });
  });

  describe('Cross-Kart Drivers', () => {
    const mockAnalyses = [
      { kartNumber: '1', driverName: 'Driver A', bestLap: 26000, avgLapTime: 26200, validLaps: 10 },
      { kartNumber: '2', driverName: 'Driver A', bestLap: 26500, avgLapTime: 26700, validLaps: 8 },
      { kartNumber: '3', driverName: 'Driver B', bestLap: 27000, avgLapTime: 27200, validLaps: 12 }
    ];

    it('should find drivers who drove multiple karts', () => {
      const crossKartDrivers = findCrossKartDrivers(mockAnalyses);
      
      expect(crossKartDrivers).to.be.an('array');
      expect(crossKartDrivers).to.have.lengthOf(1);
      expect(crossKartDrivers[0].driverName).to.equal('Driver A');
    });

    it('should include kart details for each driver', () => {
      const crossKartDrivers = findCrossKartDrivers(mockAnalyses);
      const driverA = crossKartDrivers[0];
      
      expect(driverA.karts).to.have.lengthOf(2);
      expect(driverA.karts[0].kartNumber).to.equal('1');
      expect(driverA.karts[1].kartNumber).to.equal('2');
    });

    it('should sort karts by best lap time', () => {
      const crossKartDrivers = findCrossKartDrivers(mockAnalyses);
      const driverKarts = crossKartDrivers[0].karts;
      
      expect(driverKarts[0].bestLap).to.be.at.most(driverKarts[1].bestLap);
    });

    it('should return empty array when no cross-kart drivers', () => {
      const singleKartAnalyses = [
        { kartNumber: '1', driverName: 'Driver A', bestLap: 26000 },
        { kartNumber: '2', driverName: 'Driver B', bestLap: 27000 }
      ];

      const crossKartDrivers = findCrossKartDrivers(singleKartAnalyses);
      expect(crossKartDrivers).to.be.an('array').that.is.empty;
    });
  });

  describe('Process Session Data', () => {
    const mockSessionData = {
      event_name: 'Test Championship',
      track_configuration_id: 'track-001',
      timestamp: Date.now(),
      runs: [
        { kart_number: '1', name: 'Driver 1', total_laps: 5 },
        { kart_number: '2', name: 'Driver 2', total_laps: 5 }
      ]
    };

    const mockLapHistory = {
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

    it('should process session data into complete analysis', () => {
      const analysis = processSessionData(mockSessionData, mockLapHistory);
      
      expect(analysis).to.have.property('summary');
      expect(analysis).to.have.property('karts');
      expect(analysis).to.have.property('crossKartDrivers');
    });

    it('should include session summary', () => {
      const analysis = processSessionData(mockSessionData, mockLapHistory);
      
      expect(analysis.summary.eventName).to.equal('Test Championship');
      expect(analysis.summary.totalKarts).to.equal(2);
      expect(analysis.summary.fastestDriver).to.equal('Driver 1');
    });

    it('should sort karts by performance', () => {
      const analysis = processSessionData(mockSessionData, mockLapHistory);
      
      const karts = analysis.karts;
      expect(karts[0].bestLap).to.be.at.most(karts[1].bestLap);
    });

    it('should include normalized indices for all karts', () => {
      const analysis = processSessionData(mockSessionData, mockLapHistory);
      
      for (const kart of analysis.karts) {
        expect(kart).to.have.property('normalizedIndex');
        expect(kart.normalizedIndex).to.be.a('number');
      }
    });
  });
});


