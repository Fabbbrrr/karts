# GitHub Pages Deployment Guide

## Quick Start (3 Steps)

### Step 1: Prepare Your Files
Make sure you have these files in `frontend-only/`:
```
frontend-only/
├── index.html          # Main entry point
├── storage.service.js  # Local storage
├── css/                # Stylesheets
│   ├── main.css
│   └── mobile.css
└── js/                 # Application modules
    ├── websocket-service.js
    ├── state.js
    ├── settings-view.js
    └── views/
        ├── race-view.js
        └── summary-view.js
```

### Step 2: Create .nojekyll File
Create `.nojekyll` in `frontend-only/` directory:
```bash
echo "" > .nojekyll
```
This disables Jekyll processing for GitHub Pages.

### Step 3: Deploy to GitHub
1. Initialize git repository (if not already):
   ```bash
   cd frontend-only
   git init
   git add .
   git commit -m "Initial frontend-only deployment"
   ```

2. Create new GitHub repository:
   - Go to github.com → New Repository
   - Name: `racefacer-frontend`
   - Public repository

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/racefacer-frontend.git
   git branch -M main
   git push -u origin main
   ```

### Step 4: Enable GitHub Pages
1. Go to your repository Settings → Pages
2. Under "Source", select `main` branch
3. Click Save

Your app will be live at: `https://YOUR_USERNAME.github.io/racefacer-frontend/`

---

## WebSocket Connection Setup

The app connects directly to RaceFacer server:
```javascript
// In js/websocket-service.js
const SOCKET_URL = 'wss://live.racefacer.com:3123';
```

No additional server configuration needed - browser connects directly!

---

## Testing Locally

Before deploying, test locally:
```bash
# Using Python HTTP server
python -m http.server 8000

# Or Node.js
npx serve .
```
Then visit `http://localhost:8000`

---

## Common Issues & Solutions

### Issue: "404 Not Found"
**Solution**: Make sure `.nojekyll` file exists and you selected the correct branch in GitHub Pages settings.

### Issue: "Access-Control-Allow-Origin" Error
**Solution**: RaceFacer WebSocket server should handle CORS. Ensure you're using `wss://` (secure WebSocket).

### Issue: Files Not Loading
**Solution**: Check browser console for module import errors. Make sure all JS files use ES modules (`type="module"`).

---

## Next Steps After Deployment

1. Test on mobile device (your kart steering wheel mount)
2. Verify WebSocket connection works in browser
3. Test data persistence with IndexedDB
4. Customize channel name in settings if needed

---

**Need help?** Check the browser console for errors - this will show any missing files or connection issues.