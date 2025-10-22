# RaceFacer Analysis Server

**Continuous kart racing data collection and analysis server**

A standalone Node.js server that connects to RaceFacer timing systems via WebSocket, continuously collects and analyzes kart performance data, and provides a RESTful API for accessing the analysis.

## 🎯 Purpose

This server runs independently of the web application to:
- ✅ Collect data 24/7 without keeping a browser tab open
- ✅ Provide centralized analysis for multiple clients
- ✅ Store historical session data
- ✅ Enable real-time monitoring from anywhere
- ✅ Reduce client-side processing load

## ✨ Features

### Data Collection
- Real-time WebSocket connection to timing system
- Automatic reconnection with retry logic
- Lap-by-lap tracking for all karts
- Session detection and management

### Analysis
- Best lap time
- Average lap time
- Best 3 lap average
- Consistency analysis (standard deviation)
- Total time calculations
- Performance normalization (0-100 index)
- Cross-kart driver tracking

### Storage
- Current session (memory + disk)
- Historical sessions (configurable limit)
- Automatic cleanup
- Export functionality

### API
- RESTful endpoints
- Real-time data access
- Session history
- Health monitoring
- Statistics

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# 1. Configure environment
cd server
cp .env.example .env
nano .env  # Edit with your timing system details

# 2. Start server
docker-compose up -d

# 3. Verify
curl http://localhost:3001/health
```

### Local Development

```bash
# 1. Install dependencies
cd server
npm install

# 2. Configure
export WS_HOST=your-timing-system-host
export WS_PORT=8131

# 3. Start
npm start

# or with nodemon for development
npm run dev
```

## 📡 API Endpoints

### Status & Health
- `GET /health` - Server health check
- `GET /api/stats` - Comprehensive statistics

### Current Session
- `GET /api/current` - Current session analysis
- `GET /api/analysis` - All kart analysis
- `GET /api/kart/:kartNumber` - Specific kart details

### Historical Sessions
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Session details
- `GET /api/sessions/:id/export` - Export session data
- `DELETE /api/sessions/:id` - Delete session

### Examples

```bash
# Check if server is running and connected
curl http://localhost:3001/health

# Get current session analysis
curl http://localhost:3001/api/current | jq

# Get specific kart details
curl http://localhost:3001/api/kart/14 | jq

# Get server statistics
curl http://localhost:3001/api/stats | jq
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file in `server/` directory:

```env
# Server
PORT=3001
NODE_ENV=production

# Timing System WebSocket
WS_HOST=lemansentertainment.loc
WS_PORT=8131
WS_PROTOCOL=ws

# Storage
MAX_SESSIONS=50
MAX_LAPS_PER_SESSION=1000

# Logging
LOG_LEVEL=info

# Security
ALLOWED_ORIGINS=*
```

See `.env.example` for all options.

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart
```

### Docker Compose Services

- `racefacer-analysis` - Main server
- `redis` - Optional caching (future use)

## ☁️ AWS Deployment

For deploying to AWS Free Tier, see:
- **[AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)** - Complete AWS guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - General deployment guide

## 📊 Monitoring

### Health Checks

```bash
# Quick check
curl http://localhost:3001/health

# Detailed stats
curl http://localhost:3001/api/stats

# WebSocket status
curl http://localhost:3001/api/stats | jq '.websocket'
```

### Logs

```bash
# Docker logs
docker-compose logs -f

# Log files
tail -f logs/server.log
tail -f logs/server.error.log
```

### Resource Usage

```bash
# Container stats
docker stats racefacer-analysis-server

# Disk usage
du -sh storage/
```

## 🔧 Maintenance

### Updates

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Backups

```bash
# Manual backup
tar -czf backup-$(date +%Y%m%d).tar.gz storage/

# Automated (add to crontab)
0 2 * * * cd /path/to/server && tar -czf backup-$(date +\%Y\%m\%d).tar.gz storage/
```

### Clean Up

```bash
# Remove old sessions
curl -X DELETE http://localhost:3001/api/sessions/OLD_ID

# Docker cleanup
docker system prune -a
```

## 🛠️ Development

### Project Structure

```
server/
├── index.js           # Entry point
├── app.js             # Express app setup
├── server.js          # HTTP server
├── config.js          # Configuration
├── logger.js          # Winston logger
├── websocket.js       # WebSocket client
├── analysis.js        # Analysis engine
├── storage.js         # Storage layer
├── controllers.js     # API controllers
├── routes.js          # API routes
├── package.json       # Dependencies
├── Dockerfile         # Docker image
└── docker-compose.yml # Docker orchestration
```

### Adding New Features

1. Add logic to appropriate module
2. Update routes if adding endpoints
3. Update controllers for API logic
4. Add tests (future)
5. Update documentation

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check logs
docker-compose logs

# Verify port availability
netstat -an | grep 3001

# Check environment
cat .env
```

### WebSocket Connection Issues

```bash
# Test connectivity
telnet WS_HOST WS_PORT

# Check configuration
echo $WS_HOST $WS_PORT

# View connection logs
docker-compose logs | grep -i websocket
```

### High Memory Usage

```bash
# Check usage
docker stats

# Restart
docker-compose restart

# Reduce storage limits in .env
```

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) - AWS-specific guide
- [API Documentation](#-api-endpoints) - API reference (above)

## 🔒 Security

- ✅ Non-root Docker user
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ Rate limiting (planned)
- ✅ Environment-based secrets

**Never commit `.env` files with real credentials!**

## 📦 Dependencies

- **express** (4.21.0) - Web framework
- **socket.io-client** (4.7.2) - WebSocket client
- **winston** (3.11.0) - Logging
- **helmet** (7.1.0) - Security
- **compression** (1.7.4) - Response compression
- **dotenv** (16.3.1) - Environment config

## 🤝 Contributing

1. Test changes locally
2. Update documentation
3. Follow existing code style
4. Add appropriate logging

## 📝 License

MIT

## 🆘 Support

- Check logs: `docker-compose logs`
- Review documentation above
- Check troubleshooting section
- Review AWS deployment guide

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Node Version**: >=18.0.0
