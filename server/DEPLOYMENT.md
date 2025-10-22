# RaceFacer Analysis Server - Deployment Documentation

## Overview

The RaceFacer Analysis Server is a standalone Node.js application that continuously collects and analyzes kart racing data from timing systems. It runs independently of the web application and provides RESTful API endpoints for accessing analysis data.

## Architecture

```
┌─────────────────────────────────────────┐
│   RaceFacer Timing System (WebSocket)  │
│          ws://host:port                 │
└────────────────┬────────────────────────┘
                 │
                 │ WebSocket Connection
                 │
                 ▼
┌─────────────────────────────────────────┐
│    RaceFacer Analysis Server            │
│    ┌──────────────────────────────┐     │
│    │  WebSocket Client            │     │
│    └──────────┬───────────────────┘     │
│               │                          │
│               ▼                          │
│    ┌──────────────────────────────┐     │
│    │  Analysis Engine             │     │
│    │  - Lap tracking              │     │
│    │  - Performance calculations  │     │
│    │  - Statistics                │     │
│    └──────────┬───────────────────┘     │
│               │                          │
│               ▼                          │
│    ┌──────────────────────────────┐     │
│    │  Storage Layer               │     │
│    │  - Current session           │     │
│    │  - Historical sessions       │     │
│    │  - JSON file storage         │     │
│    └──────────┬───────────────────┘     │
│               │                          │
│               ▼                          │
│    ┌──────────────────────────────┐     │
│    │  RESTful API                 │     │
│    │  - Express.js                │     │
│    │  - CORS enabled              │     │
│    │  - Health checks             │     │
│    └──────────────────────────────┘     │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST API
                  │
                  ▼
         ┌────────────────────┐
         │  Client Apps       │
         │  - Web dashboard   │
         │  - Mobile apps     │
         │  - Other services  │
         └────────────────────┘
```

## Features

### Data Collection
- ✅ Real-time WebSocket connection to timing system
- ✅ Automatic reconnection with exponential backoff
- ✅ Lap-by-lap data tracking
- ✅ Session detection and management
- ✅ Stale data filtering

### Analysis
- ✅ Best lap time calculation
- ✅ Average lap time
- ✅ Best 3 lap average
- ✅ Consistency analysis (standard deviation)
- ✅ Total time calculation
- ✅ Performance normalization (0-100 index)
- ✅ Cross-kart driver tracking

### Storage
- ✅ Current session in memory + disk
- ✅ Historical sessions (configurable limit)
- ✅ Automatic cleanup of old sessions
- ✅ Export functionality
- ✅ Backup-friendly structure

### API
- ✅ RESTful endpoints
- ✅ CORS support
- ✅ Health checks
- ✅ Statistics endpoint
- ✅ Session history access
- ✅ Export capabilities

### Operations
- ✅ Structured logging (Winston)
- ✅ Docker support
- ✅ Docker Compose orchestration
- ✅ Health monitoring
- ✅ Graceful shutdown
- ✅ Environment-based configuration

## Deployment Methods

### 1. Local Development

```bash
cd server
npm install
node index.js
```

**Environment**: Development
**Use Case**: Testing, debugging
**Pros**: Easy setup, fast iteration
**Cons**: Manual startup, no persistence

### 2. Docker (Recommended for Production)

```bash
docker-compose up -d --build
```

**Environment**: Production
**Use Case**: Reliable deployment
**Pros**: Isolated, reproducible, easy updates
**Cons**: Requires Docker knowledge

### 3. PM2 Process Manager

```bash
npm install -g pm2
cd server
pm2 start index.js --name racefacer-analysis
pm2 save
pm2 startup
```

**Environment**: Production
**Use Case**: Traditional Node.js deployment
**Pros**: Auto-restart, monitoring, logs
**Cons**: Requires Node.js on host

### 4. AWS Elastic Beanstalk

See `AWS_DEPLOYMENT.md` for details.

**Environment**: Cloud
**Use Case**: Managed AWS deployment
**Pros**: Automatic scaling, monitoring
**Cons**: AWS-specific

### 5. AWS EC2 with Docker

See `AWS_DEPLOYMENT.md` for details.

**Environment**: Cloud
**Use Case**: Full control AWS deployment
**Pros**: Complete control, cost-effective
**Cons**: Manual server management

## Configuration

### Environment Variables

Create `.env` file in `server/` directory:

```env
# Server
PORT=3001
NODE_ENV=production

# WebSocket (Timing System)
WS_HOST=lemansentertainment.loc
WS_PORT=8131
WS_PROTOCOL=ws

# Storage
STORAGE_PATH=./storage
MAX_SESSIONS=50
MAX_LAPS_PER_SESSION=1000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/server.log

# Security
ALLOWED_ORIGINS=*
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuration Priority

1. Environment variables (highest)
2. `.env` file
3. Default values in `config.js` (lowest)

## API Endpoints

### Health & Status

```http
GET /health
GET /api/health
```
Returns server health and WebSocket connection status.

```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "websocket": { "connected": true },
  "uptime": 3600
}
```

### Current Session

```http
GET /api/current
```
Returns current session analysis data.

```http
GET /api/analysis
```
Returns all kart analysis for current session.

```http
GET /api/kart/:kartNumber
```
Returns detailed analysis for specific kart.

### Statistics

```http
GET /api/stats
```
Returns comprehensive server and storage statistics.

### Sessions (Historical)

```http
GET /api/sessions
```
Returns list of all stored sessions.

```http
GET /api/sessions/:sessionId
```
Returns full data for specific session.

```http
GET /api/sessions/:sessionId/export
```
Exports session data as downloadable JSON.

```http
DELETE /api/sessions/:sessionId
```
Deletes specific session.

## Monitoring

### Logs

```bash
# View live logs
docker-compose logs -f

# View specific service
docker-compose logs -f racefacer-analysis

# View last 100 lines
docker-compose logs --tail=100

# Log files location
ls -lah logs/
```

### Health Checks

```bash
# Quick health check
curl http://localhost:3001/health

# Detailed stats
curl http://localhost:3001/api/stats

# Current analysis status
curl http://localhost:3001/api/current
```

### Docker Health Status

```bash
docker ps
# HEALTHY status indicates working server
```

## Backup & Recovery

### Manual Backup

```bash
# Backup storage directory
tar -czf backup-$(date +%Y%m%d).tar.gz storage/

# Backup to remote location
rsync -avz storage/ user@backup-server:/backups/racefacer/
```

### Restore from Backup

```bash
# Stop server
docker-compose down

# Restore files
tar -xzf backup-20250115.tar.gz

# Start server
docker-compose up -d
```

### Automated Backups

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/racefacer && tar -czf backup-$(date +\%Y\%m\%d).tar.gz storage/

# Weekly cleanup (keep 30 days)
0 3 * * 0 find /path/to/backups -name "backup-*.tar.gz" -mtime +30 -delete
```

## Maintenance

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify
docker-compose ps
curl http://localhost:3001/health
```

### Clean Up Storage

```bash
# Remove old sessions via API
curl -X DELETE http://localhost:3001/api/sessions/OLD_SESSION_ID

# Manual cleanup
rm -f storage/sessions/session-OLD_ID.json

# Docker cleanup
docker system prune -a
```

### Log Rotation

Logs are automatically rotated (see docker-compose.yml logging config).

Manual rotation:

```bash
# Compress old logs
gzip logs/server.log.1

# Keep last 5 compressed logs
ls -t logs/*.gz | tail -n +6 | xargs rm -f
```

## Troubleshooting

### Server Won't Start

```bash
# Check logs
docker-compose logs racefacer-analysis

# Common issues:
# - Port 3001 already in use
# - Missing environment variables
# - Storage permissions
```

### WebSocket Connection Failed

```bash
# Test connectivity
telnet WS_HOST WS_PORT

# Check configuration
cat .env | grep WS_

# View WebSocket logs
docker-compose logs | grep -i websocket
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart container
docker-compose restart

# Reduce MAX_SESSIONS in .env
```

### Data Not Being Collected

```bash
# Check WebSocket connection
curl http://localhost:3001/api/stats | jq '.websocket'

# Check timing system is sending data
# Verify WS_HOST and WS_PORT are correct
# Check network connectivity
```

## Performance Tuning

### Memory Optimization

```yaml
# docker-compose.yml
services:
  racefacer-analysis:
    environment:
      - NODE_OPTIONS=--max-old-space-size=768
    mem_limit: 1g
    memswap_limit: 1g
```

### Storage Optimization

```env
# .env
MAX_SESSIONS=30           # Reduce stored sessions
MAX_LAPS_PER_SESSION=500  # Reduce lap history
```

### Logging Optimization

```env
# .env
LOG_LEVEL=warn  # Reduce log verbosity in production
```

## Security Considerations

### Network Security

- ✅ Use security groups/firewall rules
- ✅ Restrict API access with ALLOWED_ORIGINS
- ✅ Use HTTPS in production (reverse proxy)
- ✅ Keep system updated

### Application Security

- ✅ Non-root Docker user
- ✅ Input validation on all endpoints
- ✅ Rate limiting (future enhancement)
- ✅ Secure WebSocket connection

### Data Security

- ✅ Regular backups
- ✅ Access control on storage directory
- ✅ Encrypted backups (if sensitive data)

## Migration Plan

### Phase 1: Server Deployment (Current)
- [x] Deploy server
- [x] Test WebSocket connection
- [x] Verify data collection
- [x] Monitor for 24-48 hours

### Phase 2: Web App Integration (Future)
- [ ] Add API client to web app
- [ ] Implement fallback to local storage
- [ ] Gradual migration of features
- [ ] A/B testing

### Phase 3: Full Migration (Future)
- [ ] Remove local analysis from web app
- [ ] Full API integration
- [ ] Deprecate local storage

## Support & Maintenance

### Regular Tasks

**Daily**:
- ✅ Check server health
- ✅ Monitor logs for errors

**Weekly**:
- ✅ Review storage usage
- ✅ Check backup status
- ✅ Review performance metrics

**Monthly**:
- ✅ Update dependencies
- ✅ Review and clean old sessions
- ✅ Security patches

### Contact & Resources

- Documentation: `server/README.md`
- AWS Guide: `server/AWS_DEPLOYMENT.md`
- Issues: Check logs and troubleshooting section
- Updates: `git pull` regularly

## Next Steps

1. ✅ Complete local testing
2. ✅ Deploy to production environment (AWS recommended)
3. ✅ Configure monitoring and alerts
4. ✅ Setup automated backups
5. ✅ Monitor for 24-48 hours
6. 🔄 Document any issues or improvements
7. 🔄 Plan web app migration (Phase 2)

---

**Last Updated**: January 2025
**Version**: 1.0.0

