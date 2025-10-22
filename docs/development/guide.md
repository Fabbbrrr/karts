# Development Guide

Complete guide for developers contributing to RaceFacer UI.

## 🚀 Getting Started

### Prerequisites

- **Git** - Version control
- **Node.js 18+** - For server development (optional)
- **Text Editor** - VS Code recommended
- **Web Browser** - Chrome/Firefox with DevTools
- **Basic Knowledge** - HTML, CSS, JavaScript (ES6+)

### Clone Repository

```bash
git clone https://github.com/Fabbbrrr/karts.git
cd karts
```

### Run Locally

**Option 1: Python HTTP Server**
```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

**Option 2: Node HTTP Server**
```bash
npx http-server -p 8000
# Visit: http://localhost:8000
```

**Option 3: VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Server Development (Optional)

```bash
cd server
npm install
npm run dev  # Development with hot reload
```

## 📁 Project Structure

```
racefacerUI/
├── index.html              # Main entry point
├── styles.css              # Global styles
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA service worker
├── README.md               # Project overview
│
├── docs/                   # Documentation
│   ├── getting-started/    # Installation & setup
│   ├── features/           # Feature guides
│   ├── architecture/       # Technical docs
│   ├── development/        # Dev guides
│   ├── deployment/         # Deployment guides
│   ├── changelog/          # Version history
│   └── api/                # API reference
│
├── js/                     # JavaScript modules
│   ├── app.main.js         # Application entry
│   ├── core/               # Core functionality
│   │   ├── config.js       # Configuration
│   │   └── state.js        # State management
│   ├── services/           # Business logic
│   │   ├── analysis.service.js
│   │   ├── driver-selection.service.js
│   │   ├── lap-tracker.service.js
│   │   ├── session-history.service.js
│   │   ├── storage.service.js
│   │   └── websocket.service.js
│   ├── utils/              # Utility functions
│   │   ├── audio.js
│   │   ├── calculations.js
│   │   ├── time-formatter.js
│   │   ├── timestamp-filter.js
│   │   ├── track-config.js
│   │   ├── tts.js
│   │   └── ui-helpers.js
│   └── views/              # UI components
│       ├── analysis.view.js
│       ├── compare.view.js
│       ├── hud.view.js
│       ├── race.view.js
│       ├── results.view.js
│       ├── settings.view.js
│       └── summary.view.js
│
├── css/                    # Stylesheets
│   └── components/         # Component styles
│
├── server/                 # Optional backend
│   ├── index.js            # Server entry
│   ├── config.js           # Server config
│   ├── websocket.js        # WebSocket client
│   ├── analysis.js         # Analysis engine
│   ├── storage.js          # Data storage
│   └── ...                 # Other modules
│
└── tests/                  # Test files
    ├── test-runner.html
    └── *.test.js
```

## 🏗️ Architecture

### ES6 Modules

RaceFacer uses native ES6 modules:

```javascript
// Importing
import { formatTime } from '../utils/time-formatter.js';
import * as StorageService from '../services/storage.service.js';

// Exporting
export function myFunction() { }
export const myConst = 42;
```

### Service Layer

Services contain business logic:
- **Analysis Service**: Kart performance calculations
- **Driver Selection**: Driver/kart management
- **Lap Tracker**: Lap history tracking
- **Session History**: Session management
- **Storage**: LocalStorage interface
- **WebSocket**: Real-time connections

### View Layer

Views handle UI updates:
- **Race View**: Live leaderboard
- **HUD View**: Full-screen dashboard
- **Results View**: Multi-method results
- **Compare View**: Driver comparison
- **Summary View**: Post-race analysis
- **Analysis View**: Kart rankings
- **Settings View**: Configuration

### State Management

Centralized state in `js/core/state.js`:

```javascript
const state = {
  sessionData: null,
  selectedDriver: null,
  lapHistory: {},
  positionHistory: {},
  sessionBest: null,
  personalBests: {},
  // ... more
};
```

## 💻 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

Edit files in appropriate directories:
- Services: `js/services/`
- Views: `js/views/`
- Utils: `js/utils/`
- Styles: `css/`

### 3. Test Locally

```bash
# Start local server
python -m http.server 8000

# Test in browser
# Open DevTools (F12)
# Check Console for errors
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### 5. Push & Pull Request

```bash
git push origin feature/my-new-feature
```

Create PR on GitHub with:
- Clear description
- Screenshots (if UI changes)
- Test results
- Related issues

## 🧪 Testing

### Manual Testing

**Checklist:**
- ✅ All tabs load correctly
- ✅ Data updates in real-time
- ✅ No console errors
- ✅ Features work as expected
- ✅ Responsive on mobile
- ✅ PWA installs correctly

### Browser DevTools

**Console (F12):**
```javascript
// Check state
console.log(window.kartingApp.state);

// Test function
window.kartingApp.updateResultsView();

// Check localStorage
console.log(localStorage);
```

**Network Tab:**
- Check WebSocket connection
- Monitor data flow
- Check for errors

**Application Tab:**
- Check localStorage
- Verify service worker
- Test offline mode

### Unit Tests (Future)

Structure for adding tests:

```javascript
// tests/my-feature.test.js
import { myFunction } from '../js/services/my-service.js';

describe('My Feature', () => {
  test('does something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

## 📝 Code Style

### JavaScript

**Modern ES6+:**
```javascript
// Use const/let, not var
const result = calculateSomething();
let counter = 0;

// Arrow functions
const processData = (data) => data.map(item => item.value);

// Template literals
const message = `Lap time: ${formatTime(lapTime)}`;

// Destructuring
const { name, kartNumber } = driver;

// Default parameters
function analyze(data, threshold = 60000) { }
```

**Naming Conventions:**
- `camelCase` for variables and functions
- `PascalCase` for classes
- `UPPER_CASE` for constants
- Descriptive names

**Functions:**
```javascript
/**
 * Calculate average lap time
 * @param {Array} laps - Array of lap times in ms
 * @returns {number} Average time in ms
 */
export function calculateAverageLapTime(laps) {
  if (!laps || laps.length === 0) return null;
  return laps.reduce((sum, lap) => sum + lap, 0) / laps.length;
}
```

### HTML

**Structure:**
```html
<!-- Semantic HTML5 -->
<section id="results-tab" class="tab-content">
  <header>
    <h2>Results</h2>
  </header>
  <main>
    <!-- Content -->
  </main>
</section>

<!-- Data attributes for JS -->
<button data-method="fastest-lap" class="method-btn">
  Fastest Lap
</button>
```

### CSS

**BEM-like Naming:**
```css
/* Block */
.hud-card { }

/* Element */
.hud-card__header { }
.hud-card__content { }

/* Modifier */
.hud-card--highlighted { }
```

**Variables:**
```css
:root {
  --primary-color: #00ff88;
  --background: #1a1a1a;
  --text-color: #ffffff;
}
```

## 🔧 Common Tasks

### Adding a New View

1. Create view file: `js/views/my-view.js`
2. Implement update function
3. Export functions
4. Import in `app.main.js`
5. Add tab in HTML
6. Wire up in tab switching

### Adding a Service

1. Create service: `js/services/my-service.js`
2. Implement functions
3. Export public API
4. Import where needed
5. Update state if needed

### Adding a Feature

1. Plan the feature
2. Update state schema if needed
3. Create/modify services
4. Update views
5. Add UI controls
6. Add settings if configurable
7. Update documentation

### Debugging Tips

**Console Logging:**
```javascript
console.log('🔍 Debug:', data);
console.table(results);
console.group('Analysis');
console.groupEnd();
```

**Breakpoints:**
- Set in DevTools Sources tab
- Step through code
- Inspect variables

**Network Issues:**
- Check WebSocket in Network tab
- Look for connection status
- Verify URL and port

## 🚀 Performance

### Best Practices

- **Minimize DOM Operations**: Batch updates
- **Use Event Delegation**: Attach to parent
- **Debounce/Throttle**: Frequent events
- **Lazy Load**: Non-critical features
- **Cache Calculations**: Store results

### Optimization

```javascript
// Good: Batch DOM updates
const fragment = document.createDocumentFragment();
items.forEach(item => fragment.appendChild(createItem(item)));
container.appendChild(fragment);

// Good: Debounce search
const debouncedSearch = debounce(search, 300);
```

## 📚 Resources

### Documentation
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [Web.dev](https://web.dev/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Git](https://git-scm.com/)

### Related Docs
- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/)
- [Testing Guide](../architecture/testing.md)

## 🤝 Contributing

### Guidelines

1. **Fork the repository**
2. **Create feature branch**
3. **Make changes**
4. **Test thoroughly**
5. **Submit Pull Request**

### Pull Request Checklist

- [ ] Code follows style guide
- [ ] No console errors
- [ ] Features work as expected
- [ ] Documentation updated
- [ ] Commit messages clear
- [ ] Branch up to date

### Code Review

**What we look for:**
- ✅ Code quality
- ✅ Performance
- ✅ Security
- ✅ User experience
- ✅ Documentation

## 💡 Tips

**Development:**
- Use DevTools extensively
- Test in multiple browsers
- Check mobile responsiveness
- Validate localStorage usage

**Git:**
- Commit often
- Write clear messages
- Keep PRs focused
- Update branch regularly

**Communication:**
- Ask questions
- Share ideas
- Report bugs clearly
- Help others

---

**Ready to contribute? Start with [Good First Issues](https://github.com/Fabbbrrr/karts/labels/good%20first%20issue)**

