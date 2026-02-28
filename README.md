# 🏎️ RaceFacer UI - Karting Live Timing & Analysis

A powerful Progressive Web App (PWA) for real-time go-karting session monitoring with advanced analytics, multi-device synchronization, and session replay capabilities.

## 🌟 Key Features

### ⭐ NEW: Backend-Controlled Architecture (v2.0)

- **Multi-Device Sync**: View from phone, tablet, laptop - all in perfect sync
- **24/7 Data Collection**: Server runs continuously, never lose data
- **Session Replay**: Replay any of last 10 sessions lap-by-lap
- **Advanced Analytics**: Server-side processing for complex metrics
- **Always Available**: View races you missed, analyze past sessions

### Core Features

- **Real-Time Timing**: Live lap times, positions, gaps, and intervals
- **Driver Analytics**: Personal bests, consistency metrics, pace tracking
- **Multi-Driver Support**: Track multiple karts simultaneously
- **Session History**: Review past sessions with full lap data
- **Voice Announcements**: Text-to-speech alerts for key events
- **Driver Awards**: Automatic award system for achievements
- **Incident Detection**: Automatic detection of unusual patterns
- **Mock Mode**: Test with simulated data when no race is running
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Progressive Web App**: Install and use offline

## 🏗️ Architecture

```
┌─────────────┐       ┌──────────────────────────┐       ┌──────────────────┐
│  Browser 1  │──SSE─→│                          │──WS──→│  RaceFacer Live  │
└─────────────┘       │   Analysis Server        │       │  Timing System   │
                      │   (Central Hub)          │       └──────────────────┘
┌─────────────┐       │                          │
│  Browser 2  │──SSE─→│  - Multi-client sync     │
└─────────────┘       │  - Session replay        │
                      │  - Persistent storage    │
┌─────────────┐       │  - Advanced analytics    │
│  Phone      │──SSE─→│  - 24/7 collection       │
└─────────────┘       └──────────────────────────┘
                                   │
                                   ▼
                      ┌──────────────────────────┐
                      │  Persistent Storage      │
                      │  - Last 10 sessions      │
                      │  - Full replay data      │
                      └──────────────────────────┘
```

**Benefits**:
- ✅ Multiple devices viewing simultaneously
- ✅ Perfect synchronization across all clients
- ✅ Session replay capabilities
- ✅ No data loss
- ✅ Battery-friendly (browser can close)
- ✅ Advanced analytics possible

## 🚀 Quick Start

### 1. Start Backend Server (Recommended)

```bash
cd server
npm install
npm start
```

Expected output:
```
🚀 Server started on port 3001
✅ Connected to RaceFacer timing system
📡 Joined channel: lemansentertainment
```

### 2. Open UI

Open `http://localhost:8000` in your browser(s)

You can now open the same URL on multiple devices - they'll all sync perfectly!

### 3. Verify Connection

Browser console should show:
```
🏢 Backend mode enabled - connecting via backend server
✅ SSE Connected
```

## 📦 Installation

### Frontend (UI)

```bash
# Clone repository
git clone https://github.com/Fabbbrrr/karts.git
cd karts

# Serve with any HTTP server
python -m http.server 8000
# OR
npx http-server -p 8000
```

### Backend (Analysis Server)

```bash
cd server
npm install

# Copy environment template
cp env.example.txt .env

# Edit .env with your settings
nano .env

# Start server
npm start
```

## 🔧 Configuration

### Backend Mode (Recommended)

**Enable** in `js/core/config.js`:
```javascript
export const CONFIG = {
    BACKEND_MODE: true,  // Use backend (recommended)
    SERVER_URL: 'http://localhost:3001'
};
```

### Direct Mode (Legacy)

**Disable backend** for direct connection:
```javascript
export const CONFIG = {
    BACKEND_MODE: false,  // Connect directly to RaceFacer
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment'
};
```

### Server Configuration

Edit `server/.env`:
```bash
PORT=3001
WS_CHANNEL=lemansentertainment  # Your track channel
MAX_SESSIONS=10                 # Keep last 10 sessions
```

## 📊 API Endpoints

### Live Data
- `GET /api/stream` - SSE real-time stream (keep open)
- `GET /api/current` - Current session snapshot
- `GET /api/clients` - Connected clients stats

### Session Replay
- `GET /api/replay/sessions` - List replayable sessions
- `GET /api/replay/:sessionId` - Full replay data
- `GET /api/replay/:sessionId/metadata` - Session info

### Historical
- `GET /api/sessions` - All stored sessions
- `GET /api/sessions/:sessionId` - Session details
- `GET /api/sessions/:sessionId/export` - Export JSON

## 🎯 Use Cases

### 1. Race Director
- Monitor all racers from tablet
- Voice announcements for incidents
- Award system for achievements
- Session history review

### 2. Karting Team
- Coach watches on tablet
- Driver checks stats on phone
- All devices perfectly synced
- Post-race analysis together

### 3. Track Operator
- 24/7 data collection
- Review sessions next day
- Track records database
- Customer engagement

### 4. Solo Racer
- Track personal bests
- Analyze consistency
- Compare sessions
- Improvement tracking

## 🆕 What's New in v2.0

### Backend-Controlled Architecture
- Multi-device synchronization
- Server-Sent Events (SSE) for real-time updates
- Persistent WebSocket to RaceFacer
- 24/7 data collection

### Session Replay
- Store last 10 sessions completely
- Replay lap-by-lap
- Jump to specific lap
- Export session data

### Enhanced Analytics
- Server-side processing
- Advanced metrics
- Historical comparisons
- Trend analysis

### Mock Mode
- Test without live race
- Randomized session generation
- All features work identically
- Perfect for development

## 📚 Documentation

- [Backend Mode Guide](docs/getting-started/backend-mode.md) - **Start here!**
- [Backend-Enabled Features](docs/features/backend-enabled-features.md) - What's possible now
- [Installation Guide](docs/getting-started/installation.md) - Detailed setup
- [Configuration](docs/getting-started/configuration.md) - All settings
- [Core Features](docs/features/core-features.md) - Feature documentation
- [Architecture Overview](docs/architecture/overview.md) - Technical details
- [API Documentation](docs/api/) - Integration guide
- [Deployment Guide](docs/deployment/) - Production setup

## 🛠️ Development

### Run Tests

```bash
cd server
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:coverage     # With coverage report
```

### Mock Mode (Testing)

Enable in UI settings:
- ✅ Mock Mode checkbox
- Select session type (Practice/Qualifying/Race)
- Set duration or lap count
- Configure number of karts

Perfect for:
- UI development
- Feature testing
- Demonstrations
- No live race needed

## 🌐 Deployment

### Frontend (GitHub Pages)
```bash
# Automatically deployed from main branch
# Visit: https://your-username.github.io/karts/
```

### Backend (AWS Free Tier)
```bash
# See deployment guide
docs/deployment/aws.md

# Or use Docker
docker-compose up -d
```

## 🔒 Security

- No hardcoded secrets
- Environment variables for config
- Pinned dependencies (no ^ or ~)
- Regular security updates
- Input validation
- Error handling without info disclosure

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **RaceFacer** for the live timing system
- Open source community
- All contributors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Fabbbrrr/karts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Fabbbrrr/karts/discussions)
- **Documentation**: [docs/](docs/)

## ⭐ Star History

If you find this project useful, please consider giving it a star!

---

**Version**: 2.0.0 (Backend-Controlled Architecture)  
**Status**: ✅ Production Ready  
**Last Updated**: October 30, 2025

**Quick Links**:
- [📖 Full Documentation](docs/)
- [🚀 Quick Start](docs/getting-started/quick-start.md)
- [🏢 Backend Mode Guide](docs/getting-started/backend-mode.md)
- [⭐ New Features](docs/features/backend-enabled-features.md)
