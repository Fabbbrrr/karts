# 🏎️ RaceFacer UI - Karting Live Timing & Analysis

**Professional-grade karting telemetry system for your browser. Real-time timing, advanced analytics, and performance tracking - completely free.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-00ff88?style=for-the-badge)](https://fabbbrrr.github.io/karts/)
[![Documentation](https://img.shields.io/badge/Read-Documentation-blue?style=for-the-badge)](./docs/)
[![Install PWA](https://img.shields.io/badge/Install-Add%20to%20Home-orange?style=for-the-badge)](#-installation)

---

## ⚡ Quick Start

### 🌐 Try It Now
**Visit: [https://fabbbrrr.github.io/karts/](https://fabbbrrr.github.io/karts/)**

### 📱 Install as App
1. Open the URL on your device
2. **Android**: Menu → "Add to Home screen"
3. **iPhone**: Share → "Add to Home Screen"
4. Launch from home screen!

### 🏁 Start Racing
1. Select your driver/kart
2. Switch to HUD tab
3. Race with real-time data!

---

## ✨ Key Features

- **🏁 Live Timing** - Real-time WebSocket connection to RaceFacer timing systems
- **📊 5 Scoring Methods** - Fastest Lap, Total Time, Average, Best 3, Consistency
- **🎮 HUD Mode** - Full-screen dashboard optimized for racing
- **📈 Advanced Analytics** - Lap-by-lap analysis with gap tracking
- **🏅 Personal Bests** - Automatic PB tracking across sessions
- **📼 Session History** - Auto-saves last 20 sessions for replay
- **🎤 Text-to-Speech** - Voice announcements for events
- **📊 Kart Analysis** - Scientific performance rankings
- **💾 Progressive Web App** - Install like native app, works offline
- **🌐 Multi-Venue** - Works with any RaceFacer timing system

---

## 📚 Documentation

**[📖 Complete Documentation →](./docs/)**

### Quick Links

**Getting Started:**
- [Installation Guide](./docs/getting-started/installation.md)
- [Quick Start](./docs/getting-started/quick-start.md)
- [Configuration](./docs/getting-started/configuration.md)

**Features:**
- [Core Features](./docs/features/core-features.md)
- [Personal Best Tracking](./docs/features/personal-best.md)
- [Session History](./docs/features/session-history.md)
- [Text-to-Speech](./docs/features/text-to-speech.md)

**Deployment:**
- [Analysis Server](./docs/deployment/analysis-server.md)
- [AWS Deployment](./docs/deployment/aws.md)
- [Docker Guide](./docs/deployment/docker.md)

**Development:**
- [Development Guide](./docs/development/guide.md)
- [Architecture Overview](./docs/architecture/overview.md)
- [API Reference](./docs/api/)

---

## 🚀 For Developers

### Local Development

```bash
# Clone repository
git clone https://github.com/Fabbbrrr/karts.git
cd karts

# Serve locally (any method works)
python -m http.server 8000
# or
npx http-server -p 8000

# Open browser
http://localhost:8000
```

### Analysis Server (Optional)

24/7 backend for continuous data collection:

```bash
cd server
npm install
npm start
```

**[→ Complete Server Documentation](./docs/deployment/analysis-server.md)**

### Deploy Your Own

**GitHub Pages (Free):**
1. Fork repository
2. Settings → Pages → Enable
3. Access at: `https://YOUR_USERNAME.github.io/karts/`

**Other Options:**
- Netlify (One-click deploy)
- Vercel (Optimized hosting)
- AWS S3 + CloudFront
- Self-hosted (Nginx/Apache)

**[→ Deployment Guides](./docs/deployment/)**

---

## 🎯 Use Cases

✅ **Practice Sessions** - Track improvements lap-by-lap  
✅ **Competitive Racing** - Know your exact position  
✅ **Endurance Events** - Use Total Time scoring  
✅ **League Racing** - Compare across methods  
✅ **Coaching** - Analyze student performance  
✅ **Team Racing** - Compare teammates  
✅ **Personal Records** - Beat your own times  

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6), HTML5, CSS3
- **Backend**: Node.js, Express, Socket.io (optional)
- **Real-time**: WebSocket connections
- **Storage**: LocalStorage, JSON files
- **PWA**: Service Workers, Web App Manifest
- **Deployment**: Static hosting, Docker, AWS

---

## 📊 Screenshots

| Race View | HUD Mode | Results |
|-----------|----------|---------|
| Live leaderboard | Full-screen racing data | Multiple scoring methods |

---

## 🤝 Contributing

We welcome contributions! Please see:
- [Development Guide](./docs/development/guide.md)
- [Architecture Overview](./docs/architecture/overview.md)
- [Code Style Guide](./docs/development/code-style.md)

---

## 📝 License

MIT License - Free to use, modify, and distribute

---

## 🆘 Support

- **Documentation**: [Complete Docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/Fabbbrrr/karts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Fabbbrrr/karts/discussions)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

## 📱 Connect

- **Live Demo**: [https://fabbbrrr.github.io/karts/](https://fabbbrrr.github.io/karts/)
- **Documentation**: [./docs/](./docs/)
- **Server Repo**: [Analysis Server Documentation](./docs/deployment/analysis-server.md)

---

<div align="center">

### 🏁 Ready to Race? 🏁

**[OPEN APP NOW →](https://fabbbrrr.github.io/karts/)**

*Made with ❤️ by racers, for racers*

**[⭐ Star this repo](https://github.com/Fabbbrrr/karts)** | **[📖 Read the docs](./docs/)** | **[🐛 Report issues](https://github.com/Fabbbrrr/karts/issues)**

</div>
