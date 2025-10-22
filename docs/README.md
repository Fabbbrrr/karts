# RaceFacer UI Documentation

Welcome to the RaceFacer UI documentation! This is a comprehensive karting live timing and analysis application with real-time WebSocket connections, advanced analytics, and historical session tracking.

## 📚 Table of Contents

### [Getting Started](getting-started/)
Start here if you're new to RaceFacer UI
- **[Installation](getting-started/installation.md)** - Setup and dependencies
- **[Quick Start](getting-started/quick-start.md)** - Get up and running quickly
- **[Configuration](getting-started/configuration.md)** - Environment and settings

### [Features](features/)
Learn about RaceFacer's powerful features
- **[Core Features](features/core-features.md)** - Main application features
- **[Session History](features/session-history.md)** - Historical session tracking
- **[Personal Best Tracking](features/personal-best.md)** - Driver PB management
- **[Text-to-Speech](features/text-to-speech.md)** - Audio notifications
- **[Future Roadmap](features/roadmap.md)** - Planned features

### [Architecture](architecture/)
Technical deep-dive into the system
- **[System Overview](architecture/overview.md)** - High-level architecture
- **[Data Flow](architecture/data-flow.md)** - How data moves through the system
- **[Storage](architecture/storage.md)** - Storage optimization and analysis
- **[Event System](architecture/event-handlers.md)** - Event-driven architecture
- **[Testing](architecture/testing.md)** - Test specifications and strategy

### [Development](development/)
For developers contributing to the project
- **[Development Guide](development/guide.md)** - Dev environment setup
- **[Debugging](development/debugging.md)** - Debugging techniques
- **[Migration Guide](development/migration.md)** - Upgrading and migrations
- **[Refactoring History](development/refactoring.md)** - Major refactorings
- **[Code Style](development/code-style.md)** - Coding standards

### [Deployment](deployment/)
Deploy RaceFacer to various environments
- **[Web Application](deployment/web-app.md)** - Deploy the frontend
- **[Analysis Server](deployment/analysis-server.md)** - Backend server deployment
- **[AWS Deployment](deployment/aws.md)** - Deploy to AWS Free Tier
- **[Docker](deployment/docker.md)** - Container deployment

### [API Reference](api/)
API documentation for developers
- **[WebSocket API](api/websocket.md)** - Real-time WebSocket protocol
- **[Analysis Server API](api/server.md)** - REST API endpoints
- **[Services](api/services.md)** - JavaScript service modules

### [Changelog](changelog/)
Track changes and updates
- **[Recent Updates](changelog/recent.md)** - Latest changes
- **[Version History](changelog/history.md)** - Complete changelog
- **[Bug Fixes](changelog/fixes.md)** - Resolved issues

## 🚀 Quick Links

### For Users
- **[Installation Guide](getting-started/installation.md)** - Set up RaceFacer
- **[User Guide](features/core-features.md)** - Learn to use all features
- **[FAQ](getting-started/faq.md)** - Common questions

### For Developers
- **[Development Guide](development/guide.md)** - Start developing
- **[Architecture Overview](architecture/overview.md)** - Understand the system
- **[API Reference](api/)** - Integrate with RaceFacer

### For DevOps
- **[Deployment Guide](deployment/)** - Deploy to production
- **[AWS Guide](deployment/aws.md)** - Cloud deployment
- **[Docker Guide](deployment/docker.md)** - Container deployment

## 🏁 What is RaceFacer UI?

RaceFacer UI is a real-time karting timing and analysis system featuring:

- ✅ **Live Timing**: Real-time WebSocket connection to timing systems
- ✅ **Advanced Analytics**: Multi-method race winner determination
- ✅ **Session History**: Automatic session tracking and storage
- ✅ **Personal Bests**: Track driver improvements over time
- ✅ **Audio Alerts**: Text-to-speech notifications for key events
- ✅ **Analysis Server**: Standalone 24/7 data collection
- ✅ **Progressive Web App**: Install as native app
- ✅ **Offline Support**: Works without internet connection

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Backend**: Node.js, Express, Socket.io
- **Storage**: LocalStorage (browser), JSON files (server)
- **Real-time**: WebSocket connections
- **Deployment**: Docker, AWS, Static hosting

## 📖 Documentation Structure

This documentation is organized into logical sections:

```
docs/
├── getting-started/    # Installation and setup
├── features/           # Feature documentation
├── architecture/       # Technical architecture
├── development/        # Developer guides
├── deployment/         # Deployment guides
├── api/               # API documentation
└── changelog/         # Version history
```

## 🤝 Contributing

We welcome contributions! Please see the [Development Guide](development/guide.md) for:
- Setting up your development environment
- Code style and standards
- Testing requirements
- Pull request process

## 📝 License

MIT License - see main repository for details

## 🆘 Support

- **Issues**: Report bugs or request features on GitHub
- **Questions**: Check the [FAQ](getting-started/faq.md)
- **Documentation**: You're reading it!

## 🔗 Links

- **GitHub Repository**: [RaceFacer UI](https://github.com/Fabbbrrr/karts)
- **Live Demo**: [Coming Soon]
- **Analysis Server**: See [deployment docs](deployment/analysis-server.md)

---

**Last Updated**: October 2025  
**Version**: 2.0.0  
**Status**: Active Development

