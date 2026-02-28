# Server Integration Guide

Complete guide to setting up and using the RaceFacer Analysis Server with the web application.

## 🎯 Overview

The RaceFacer Analysis Server enables:
- **Persistent WebSocket Connection**: Keeps listening even when browser is closed
- **Session Storage**: Automatically saves and analyzes all sessions
- **Remote Access**: View sessions from any device
- **Advanced Analysis**: Server-side performance calculations
- **API Access**: RESTful API for session data

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (RaceFacer UI) │
└────────┬────────┘
         │
         │ HTTP/API
         ├──────────────┐
         │              │
┌────────▼──────┐  ┌───▼──────────────┐
│ RaceFacer     │  │ Analysis Server  │
│ Live Timing   │  │   (Node.js)      │
│ (WebSocket)   │  │                  │
└───────────────┘  └─────┬────────────┘
                         │
                         │ Storage
                    ┌────▼────┐
                    │  File   │
                    │ System  │
                    └─────────┘
```

## 📋 Prerequisites

- Node.js 18+ installed
- Access to RaceFacer timing system
- Network connectivity to timing server

## 🚀 Quick Start

### 1. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp env.example.txt .env

# Edit configuration
nano .env
```

### 2. Configure Environment

Edit `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# WebSocket Configuration (RaceFacer Cloud)
WS_HOST=live.racefacer.com
WS_PORT=3123
WS_PROTOCOL=https
WS_CHANNEL=lemansentertainment

# Storage Configuration
STORAGE_PATH=./storage
MAX_SESSIONS=50
MAX_LAPS_PER_SESSION=1000

# Logging
LOG_LEVEL=info
```

### 3. Start Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### 4. Verify Server

```bash
# Check health
curl http://localhost:3001/health

# Should return:
# {
#   "status": "OK",
#   "timestamp": "2025-10-30T...",
#   "websocket": { "connected": true },
#   "uptime": 123.45
# }
```

### 5. Enable in Web UI

Add to your `js/core/config.js`:

```javascript
export const CONFIG = {
    SOCKET_URL: 'https://live.racefacer.com:3123',
    CHANNEL: 'lemansentertainment',
    RECONNECT_DELAY: 2000,
    
    // Server integration (optional)
    SERVER_ENABLED: true,
    SERVER_URL: 'http://localhost:3001'
};
```

Then in your app initialization:

```javascript
import * as SessionHistoryService from './services/session-history.service.js';
import * as ServerAPI from './services/server-api.service.js';

// Enable server integration
if (CONFIG.SERVER_ENABLED) {
    ServerAPI.setServerURL(CONFIG.SERVER_URL);
    SessionHistoryService.setServerEnabled(true);
    console.log('✅ Server integration enabled');
}
```

## 🔧 Configuration Options

### WebSocket Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `WS_HOST` | Timing system hostname | `live.racefacer.com` | `live.racefacer.com` |
| `WS_PORT` | WebSocket port | `3123` | `3123` |
| `WS_PROTOCOL` | Protocol (ws/wss/http/https) | `https` | `https` |
| `WS_CHANNEL` | Channel name | `lemansentertainment` | Your venue name |

### Storage Configuration

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `STORAGE_PATH` | Directory for sessions | `./storage` | Auto-created |
| `MAX_SESSIONS` | Max stored sessions | `50` | Oldest auto-deleted |
| `MAX_LAPS_PER_SESSION` | Lap limit per session | `1000` | Prevents memory issues |

### Server Configuration

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `PORT` | HTTP server port | `3001` | Must be available |
| `NODE_ENV` | Environment | `development` | `production` recommended |
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |

## 📊 API Endpoints

### Health & Status

```bash
# Health check
GET /health
GET /api/health

# Server statistics
GET /api/stats
```

### Current Session

```bash
# Get current session analysis
GET /api/current

# Get all kart analysis
GET /api/analysis

# Get specific kart details
GET /api/kart/:kartNumber
```

### Historical Sessions

```bash
# List all sessions
GET /api/sessions

# Get session details
GET /api/sessions/:sessionId

# Export session
GET /api/sessions/:sessionId/export

# Delete session
DELETE /api/sessions/:sessionId
```

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

- **Storage Module**: 100% coverage
- **Analysis Module**: 98% coverage
- **API Endpoints**: 95% coverage
- **Overall**: 95%+ coverage

### Test Structure

```
server/tests/
├── unit/
│   ├── storage.test.js       # 50+ tests
│   └── analysis.test.js      # 40+ tests
├── integration/
│   ├── api.test.js          # 30+ tests
│   └── websocket.test.js    # 15+ tests
└── README.md
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  racefacer-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - WS_HOST=live.racefacer.com
      - WS_PORT=3123
      - WS_CHANNEL=your_channel
    volumes:
      - ./storage:/app/storage
      - ./logs:/app/logs
    restart: unless-stopped
```

## ☁️ Cloud Deployment

### AWS Free Tier

See [AWS Deployment Guide](./aws.md) for complete instructions.

Quick summary:
1. Create EC2 t2.micro instance
2. Install Node.js
3. Clone repository
4. Configure environment
5. Set up systemd service
6. Configure security groups

### Other Platforms

- **Heroku**: [Deploy Guide](./heroku.md)
- **DigitalOcean**: [Deploy Guide](./digitalocean.md)
- **Railway**: [Deploy Guide](./railway.md)

## 🔍 Monitoring

### Log Files

```bash
# View logs
tail -f logs/server.log
tail -f logs/server.error.log

# With Docker
docker-compose logs -f
```

### Health Monitoring

```bash
# Periodic health checks
watch -n 5 'curl -s http://localhost:3001/health | jq'

# Monitor statistics
watch -n 10 'curl -s http://localhost:3001/api/stats | jq'
```

### Metrics to Monitor

- WebSocket connection status
- Number of stored sessions
- Storage size (MB)
- Server uptime
- Memory usage

## 🔐 Security

### Production Checklist

- [ ] Use HTTPS (not HTTP)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### CORS Configuration

```env
# Allow specific origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# For development only
ALLOWED_ORIGINS=*
```

## 🐛 Troubleshooting

### Server Won't Start

**Check port availability:**
```bash
netstat -an | grep 3001
lsof -i :3001
```

**Verify Node.js version:**
```bash
node --version  # Should be 18+
```

### WebSocket Not Connecting

**Test connection manually:**
```bash
# Check if timing system is reachable
telnet live.racefacer.com 3123

# Verify channel name
curl https://live.racefacer.com/your_channel
```

**Check logs:**
```bash
grep -i "websocket" logs/server.log
grep -i "connect" logs/server.error.log
```

### No Data Being Stored

**Verify permissions:**
```bash
ls -la storage/
# Should be writable by server process
```

**Check storage stats:**
```bash
curl http://localhost:3001/api/stats | jq '.storage'
```

### High Memory Usage

**Check lap limits:**
```env
# Reduce limits if needed
MAX_SESSIONS=30
MAX_LAPS_PER_SESSION=500
```

**Monitor memory:**
```bash
curl http://localhost:3001/api/stats | jq '.server.memory'
```

## 📚 API Usage Examples

### Fetch Current Session

```javascript
const response = await fetch('http://localhost:3001/api/current');
const data = await response.json();

console.log(`Session: ${data.sessionData.eventName}`);
console.log(`Total Karts: ${data.analysis.summary.totalKarts}`);
```

### List All Sessions

```javascript
const response = await fetch('http://localhost:3001/api/sessions');
const data = await response.json();

data.sessions.forEach(session => {
    console.log(`${session.timestamp}: ${session.eventName}`);
});
```

### Export Session

```javascript
const sessionId = 1234567890;
const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/export`);
const data = await response.json();

// Save to file
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `session-${sessionId}.json`;
a.click();
```

## 🔄 Maintenance

### Backup Strategy

```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz storage/

# Automated backup (crontab)
0 2 * * * cd /path/to/server && tar -czf backup-$(date +\%Y\%m\%d).tar.gz storage/
```

### Update Server

```bash
# Pull latest code
git pull

# Update dependencies
npm install

# Rebuild if using Docker
docker-compose up -d --build

# Or restart server
npm start
```

### Clean Old Data

```bash
# Delete specific session
curl -X DELETE http://localhost:3001/api/sessions/1234567890

# Or manually clean storage
rm storage/sessions/session-old.json
```

## 💡 Best Practices

1. **Always Use Environment Variables**: Never hardcode credentials
2. **Monitor Logs Regularly**: Catch issues early
3. **Backup Before Updates**: Protect your session data
4. **Test in Development First**: Verify changes work
5. **Set Resource Limits**: Prevent memory issues
6. **Use HTTPS in Production**: Secure your data
7. **Keep Node.js Updated**: Security patches
8. **Document Your Configuration**: Team knowledge

## 📖 Additional Resources

- [Server README](../../server/README.md)
- [Testing Guide](../../server/tests/README.md)
- [API Reference](../api/server.md)
- [AWS Deployment](./aws.md)
- [Docker Guide](./docker.md)

## 🆘 Support

If you encounter issues:
1. Check logs: `logs/server.log` and `logs/server.error.log`
2. Verify configuration: `.env` file
3. Test connection: `curl http://localhost:3001/health`
4. Review documentation
5. Open GitHub issue with logs

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-30  
**Maintainer**: RaceFacer Team


