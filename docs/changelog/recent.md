# Recent Updates

Latest changes and improvements to RaceFacer UI.

## October 2025

### 🚀 Analysis Server Implementation (v2.0.0)
**Date**: October 22, 2025  
**Type**: Major Feature  
**Status**: Production Ready

Complete standalone Node.js server for 24/7 data collection and analysis.

**Features:**
- ✅ Real-time WebSocket connection to timing systems
- ✅ Automatic lap tracking and analysis
- ✅ RESTful API for data access
- ✅ Session management and storage
- ✅ Historical data preservation
- ✅ Docker deployment ready
- ✅ AWS Free Tier deployment guides

**API Endpoints:**
- `/health` - Server health check
- `/api/current` - Current session analysis
- `/api/analysis` - All kart analysis
- `/api/kart/:number` - Specific kart details
- `/api/sessions` - Session history
- `/api/stats` - Server statistics

**Documentation:**
- Complete deployment guides (AWS, Docker, Local)
- API reference
- Configuration options
- Monitoring and maintenance

**Deployment Options:**
1. AWS EC2 (Free Tier)
2. AWS Elastic Beanstalk
3. AWS Lightsail
4. Docker/Docker Compose
5. Self-hosted

---

### 🔧 Results View Scoring Methods Fix (v1.9.1)
**Date**: October 22, 2025  
**Type**: Bug Fix  
**Priority**: High

**Problem:**
Multiple scoring methods were not displaying data properly due to missing lap history data.

**Solution:**
- ✅ Improved lap history enrichment with fallback logic
- ✅ All methods now use API data when available
- ✅ Added fallback for Best-3-Average to use best lap
- ✅ Enhanced debugging with console logging
- ✅ Better null safety checks

**Scoring Methods Fixed:**
- ✅ Fastest Lap - Uses API `best_time_raw`
- ✅ Average Lap - Uses API `avg_lap_raw`
- ✅ Best 3 Average - Falls back to best lap when no history
- ✅ Total Time - Estimates from `avg × laps` when needed
- ✅ Consistency - Uses API `consistency_lap_raw`

**Technical Changes:**
- Improved `enrichRunsWithLapHistory()` function
- Added comprehensive fallback logic
- Enhanced error logging
- Better handling of edge cases

---

### 🎨 Results Tab Complete Redesign (v1.9.0)
**Date**: October 2025  
**Type**: Major Feature

Complete overhaul of the Results tab with world-class UI/UX.

**New Features:**
- ✅ Dynamic animated podium with pulsing effects
- ✅ 5 scoring method selector
- ✅ Full results table with sorting
- ✅ Session insights panel
- ✅ Award badges system
- ✅ Interactive driver cards
- ✅ Export functionality
- ✅ Search and filters

**Scoring Methods:**
1. Fastest Lap (venue default)
2. Total Time (endurance)
3. Average Lap Time
4. Best 3 Average
5. Consistency Score

**Visual Improvements:**
- Color-coded podium (gold/silver/bronze)
- Horizontal bar charts
- Position indicators
- Achievement badges
- Smooth animations

---

### 📊 Analysis Display Update (v1.8.5)
**Date**: October 2025  
**Type**: Enhancement

Improved kart performance analysis visualization.

**Changes:**
- ✅ Enhanced confidence scoring display
- ✅ Better data quality indicators
- ✅ Improved cross-kart driver detection
- ✅ Clearer statistics presentation
- ✅ Better error handling

---

### 📼 Session History Feature (v1.8.0)
**Date**: September 2025  
**Type**: Major Feature

Complete session replay and history management.

**Features:**
- ✅ Auto-saves last 20 sessions
- ✅ Session selector in Results and Summary tabs
- ✅ Full replay mode with historical data
- ✅ Orange banner for historical view
- ✅ "Go Live" button to return to current session
- ✅ Session metadata (date, time, winner)

**Benefits:**
- Review races when venue is closed
- Analyze past performance
- Compare historical sessions
- No data loss between sessions

---

### 💾 Storage Optimization (v1.7.5)
**Date**: September 2025  
**Type**: Performance

Complete storage system optimization for better performance.

**Improvements:**
- ✅ Reduced localStorage usage by 60%
- ✅ Faster data access
- ✅ Better memory management
- ✅ Optimized session storage
- ✅ Automatic cleanup of old data

**Technical:**
- Implemented data compression
- Removed redundant storage
- Optimized data structures
- Better cache management

---

### 🏅 Personal Best Tracking (v1.7.0)
**Date**: August 2025  
**Type**: Major Feature

Comprehensive personal best lap tracking system.

**Features:**
- ✅ Tracks by driver name (across karts/sessions)
- ✅ All-time best lap for each driver
- ✅ Real-time PB comparison
- ✅ Celebration animations for new PBs
- ✅ Display in Race table and HUD
- ✅ Gap to PB calculation
- ✅ Persistent storage

**Display:**
- Race Table: PB column with gap (green/red)
- HUD: Personal Best card + Gap to PB card
- Lap History: PB delta per lap
- Summary: PB achievements section

---

### 🎤 Text-to-Speech Feature (v1.6.0)
**Date**: August 2025  
**Type**: Major Feature

Voice announcements for racing events.

**Features:**
- ✅ Quick toggle in HUD header
- ✅ Granular controls in Settings
- ✅ Configurable announcements
- ✅ Test buttons for each type
- ✅ Natural voice synthesis

**Announcements:**
- Lap time (always)
- Position (always)
- Gap to session best (always)
- Gap to leader (optional)
- Gap to personal best (optional)

---

### 🔄 Major Refactoring (v1.5.0)
**Date**: July 2025  
**Type**: Technical Improvement

Complete codebase refactoring for maintainability.

**Changes:**
- ✅ Modular ES6 architecture
- ✅ Separation of concerns
- ✅ Service layer implementation
- ✅ View layer organization
- ✅ Better state management
- ✅ Improved event handling

**Benefits:**
- Easier to maintain
- Better performance
- Clearer code structure
- Easier to add features
- Better testing capability

---

## Version History Overview

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 2.0.0 | Oct 2025 | Major | Analysis Server |
| 1.9.1 | Oct 2025 | Fix | Results scoring methods |
| 1.9.0 | Oct 2025 | Major | Results tab redesign |
| 1.8.5 | Oct 2025 | Enhancement | Analysis display |
| 1.8.0 | Sep 2025 | Major | Session history |
| 1.7.5 | Sep 2025 | Performance | Storage optimization |
| 1.7.0 | Aug 2025 | Major | Personal best tracking |
| 1.6.0 | Aug 2025 | Major | Text-to-speech |
| 1.5.0 | Jul 2025 | Technical | Major refactoring |

---

## Migration Notes

### From v1.9.0 to v2.0.0
- No breaking changes for web app
- Analysis server is optional addition
- Web app works independently
- Can gradually migrate to server API

### From v1.8.x to v1.9.x
- Results tab completely redesigned
- Old results view removed
- All scoring methods improved
- No data migration needed

### From v1.7.x to v1.8.x
- Session history added
- Auto-save enabled by default
- Storage format unchanged
- Backward compatible

---

## Known Issues

### Current
- None

### Resolved
- ✅ Results scoring methods data display (v1.9.1)
- ✅ Storage performance issues (v1.7.5)
- ✅ Session detection reliability (v1.8.0)

---

## Coming Soon

See [Future Roadmap](../features/roadmap.md) for planned features.

**Next Release (v2.1.0):**
- Web app integration with Analysis Server API
- Enhanced real-time notifications
- Advanced statistics dashboard
- Mobile app optimization

---

## Feedback & Bug Reports

Found a bug or have a suggestion?
1. Check console logs (F12)
2. Note the version number
3. Document steps to reproduce
4. Report via GitHub Issues

---

**Stay Updated:**
- ⭐ Star the repo for notifications
- 📢 Watch for new releases
- 📖 Check this changelog regularly

**Current Version**: v2.0.0  
**Last Updated**: October 22, 2025

