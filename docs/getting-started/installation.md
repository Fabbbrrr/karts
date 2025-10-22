# Installation Guide

Complete installation instructions for RaceFacer UI across different platforms and deployment scenarios.

## 📱 For End Users

### Web Browser Access

**No installation needed!** Simply visit:
```
https://fabbbrrr.github.io/karts/
```

Works on any modern browser:
- ✅ Chrome (Recommended)
- ✅ Safari
- ✅ Edge
- ✅ Firefox

### Progressive Web App (PWA) Install

**Best Experience - Install as Native App**

#### Android
1. Open URL in Chrome/Samsung Internet
2. Tap **menu icon** (⋮)
3. Select **"Add to Home screen"**
4. Name it (e.g., "RaceFacer")
5. Tap **Add**
6. Find app icon on home screen

#### iPhone/iPad
1. Open URL in Safari
2. Tap **Share button** (□↑)
3. Scroll and select **"Add to Home Screen"**
4. Name it
5. Tap **Add**
6. Find app icon on home screen

#### Desktop (Chrome/Edge)
1. Open URL in browser
2. Look for **install icon** in address bar (⊕ or ⬇)
3. Click **"Install RaceFacer"**
4. App opens in standalone window
5. Find in Applications/Programs

###Benefits of PWA Installation
- ✅ **Always-On Display**: Screen stays awake
- ✅ **Faster Loading**: Cached resources
- ✅ **Offline Access**: Works without internet
- ✅ **Native Feel**: Full-screen, no browser UI
- ✅ **Home Screen Icon**: Launch like any app

## 💻 For Developers

### Local Development Setup

#### Prerequisites
- Git
- Node.js 16+ (for server only)
- Modern web browser
- Text editor/IDE

#### Clone Repository

```bash
git clone https://github.com/Fabbbrrr/karts.git
cd karts
```

#### Run Locally

**Option 1: Simple HTTP Server (Python)**
```bash
# Python 3
python -m http.server 8000

# Open browser
http://localhost:8000
```

**Option 2: Node HTTP Server**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000

# Open browser
http://localhost:8000
```

**Option 3: VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Analysis Server Setup

For 24/7 data collection, install the Node.js backend:

```bash
cd server
npm install
```

**Configure Environment:**
```bash
cp env.example.txt .env
nano .env  # Edit with your settings
```

**Start Server:**
```bash
# Development
npm run dev

# Production
npm start
```

See [Server Deployment Guide](../deployment/analysis-server.md) for details.

## 🚀 Deployment Options

### GitHub Pages (Free)

**Perfect for personal use**

1. Fork the repository
2. Go to repository **Settings**
3. Navigate to **Pages**
4. Source: **main branch**
5. Save and wait ~2 minutes
6. Access at: `https://YOUR_USERNAME.github.io/karts/`

**Custom Domain (Optional):**
1. Add `CNAME` file with your domain
2. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: YOUR_USERNAME.github.io
   ```
3. Enable HTTPS in GitHub Pages settings

### Netlify (Free)

**One-click deployment**

1. Click: [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)
2. Connect GitHub account
3. Select repository
4. Click **Deploy**
5. Custom domain available

### Vercel (Free)

**Optimized hosting**

1. Visit [vercel.com](https://vercel.com)
2. Import Git repository
3. Framework: **Other**
4. Root directory: `/`
5. Deploy

### Self-Hosted Server

**Full control**

```bash
# Install Nginx
sudo apt install nginx

# Copy files
sudo cp -r /path/to/karts/* /var/www/html/

# Configure Nginx
sudo nano /etc/nginx/sites-available/default

# Restart Nginx
sudo systemctl restart nginx
```

## 🐳 Docker Deployment

### Web App (Static Files)

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build -t racefacer-ui .
docker run -d -p 8080:80 racefacer-ui
```

### Analysis Server

```bash
cd server
docker-compose up -d
```

See [Docker Deployment Guide](../deployment/docker.md)

## ☁️ Cloud Deployment

### AWS (Free Tier)

See [AWS Deployment Guide](../deployment/aws.md) for:
- EC2 deployment
- S3 static hosting
- CloudFront CDN
- Analysis server on EC2

### Azure Static Web Apps (Free)

1. Fork repository
2. Go to [Azure Portal](https://portal.azure.com)
3. Create **Static Web App**
4. Connect GitHub
5. Build settings:
   - App location: `/`
   - Output location: `/`
6. Deploy

## 📦 Requirements

### Minimum Requirements

**For Users:**
- Modern smartphone or tablet
- Web browser (updated)
- Internet connection during race
- ~10MB free space for PWA install

**For Developers:**
- Git
- Text editor
- Local web server
- Node.js (for server)

### Recommended Setup

**For Best Experience:**
- Install as PWA
- Chrome browser
- Good WiFi connection
- Device with wake lock support

**For Development:**
- VS Code with extensions
- Node.js LTS version
- Docker (for server)
- Git GUI (optional)

## 🔧 Configuration

### Basic Setup

1. **Track Configuration**:
   - Settings → Track/Venue
   - Enter venue channel name
   - Save

2. **Driver Selection**:
   - Race tab → Tap driver name
   - Or HUD dropdown

3. **Customize Display**:
   - Settings → HUD Components
   - Enable/disable features

### Advanced Configuration

**For hosting your own:**
- Modify `js/core/config.js`
- Set default WebSocket URL
- Configure track settings

See [Configuration Guide](configuration.md) for details.

## 🔄 Updates

### Auto-Update (PWA)

Installed PWAs auto-update on:
- Next app launch
- Manual refresh
- Service worker update

### Manual Update

**Web Version:**
- Hard refresh: `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac)

**PWA:**
- Close and reopen app
- Or uninstall and reinstall

## 🧪 Verification

### Check Installation

1. Open browser console (F12)
2. Should see: `✅ RaceFacer UI initialized`
3. Check Network tab for WebSocket connection
4. No errors in Console

### Test Features

- ✅ Connection indicator (top right)
- ✅ Driver list populates
- ✅ Real-time updates work
- ✅ Tab switching smooth
- ✅ Audio alerts (if enabled)

## 🆘 Installation Troubleshooting

### PWA Won't Install

**Problem**: No "Add to Home Screen" option
- **iPhone**: Must use Safari (not Chrome)
- **Android**: Use Chrome or Samsung Internet
- **Desktop**: Look for install icon in address bar

### Server Won't Start

**Problem**: Port already in use
```bash
# Find process using port 8000
netstat -an | findstr 8000    # Windows
lsof -i :8000                  # Mac/Linux

# Kill process or use different port
http-server -p 8080
```

### Can't Connect to Venue

**Problem**: WebSocket connection fails
1. Check internet connection
2. Verify venue is online
3. Check browser console for errors
4. Try different browser

### Files Not Loading

**Problem**: 404 errors
- Check file paths are correct
- Ensure web server serves from correct directory
- Clear browser cache

## 📚 Next Steps

**After Installation:**
1. [Quick Start Guide](quick-start.md) - Start using the app
2. [Configuration Guide](configuration.md) - Customize settings
3. [Features Overview](../features/core-features.md) - Learn all features

**For Developers:**
1. [Development Guide](../development/guide.md) - Start coding
2. [Architecture Overview](../architecture/overview.md) - Understand system
3. [API Reference](../api/) - Integration details

## 💡 Tips

- ✅ Install as PWA for best experience
- ✅ Keep browser updated
- ✅ Enable audio for notifications
- ✅ Test connection before race day
- ✅ Bookmark the URL for quick access

---

**Having issues? See [Troubleshooting](../development/debugging.md)**

