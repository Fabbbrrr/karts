# 🚀 Deployment Guide - GitHub Pages

Step-by-step instructions to deploy your Karting Live Timer PWA to GitHub Pages (100% free).

## Prerequisites

- GitHub account (create at https://github.com/join)
- Git installed (optional, can use web interface)
- Icons generated (see README.md for icon creation)

---

## Method 1: GitHub Web Interface (No Git Required)

### Step 1: Create New Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `karting-timer`
   - **Description:** "Real-time karting session viewer PWA"
   - **Visibility:** Public ✅
   - **Initialize:** Leave unchecked (we'll upload files)
3. Click **"Create repository"**

### Step 2: Upload Files

1. You'll see the new empty repository
2. Click **"uploading an existing file"** link
3. Open your file explorer → Navigate to `karting-pwa` folder
4. Select ALL files:
   - index.html
   - styles.css
   - app.js
   - manifest.json
   - service-worker.js
   - icon-192.png
   - icon-512.png
   - README.md
   - .gitignore (if visible)
5. Drag and drop into GitHub upload area
6. **Commit message:** "Initial commit: Karting Live Timer PWA"
7. Click **"Commit changes"**

### Step 3: Enable GitHub Pages

1. Go to repository **Settings** (top menu)
2. Scroll down left sidebar → Click **"Pages"**
3. Under **"Build and deployment"**:
   - **Source:** Deploy from a branch
   - **Branch:** main
   - **Folder:** / (root)
4. Click **"Save"**
5. Wait 1-2 minutes for deployment

### Step 4: Access Your App

1. Refresh the Pages settings page
2. You'll see: **"Your site is live at https://YOUR_USERNAME.github.io/karting-timer/"**
3. Click the link to open your app
4. **Done!** 🎉

---

## Method 2: Git Command Line (Recommended if you know Git)

### Step 1: Initialize Git Repository

Open terminal/PowerShell in the `karting-pwa` folder:

```bash
cd C:\Users\oicir\Documents\workspace\racefacerUI\karting-pwa

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Karting Live Timer PWA"

# Rename branch to main
git branch -M main
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `karting-timer`
3. Visibility: **Public**
4. **Do NOT initialize** with README
5. Click **Create repository**

### Step 3: Push to GitHub

Copy the commands GitHub shows you, or use these:

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/karting-timer.git

# Push to GitHub
git push -u origin main
```

You'll be prompted for GitHub credentials.

### Step 4: Enable GitHub Pages

Same as Method 1, Step 3 above.

---

## Method 3: GitHub Desktop (GUI Alternative)

### Step 1: Install GitHub Desktop

Download from: https://desktop.github.com/

### Step 2: Create Repository

1. Open GitHub Desktop
2. File → New Repository
3. **Name:** karting-timer
4. **Local Path:** Choose where to create folder
5. **Initialize with README:** Unchecked
6. Click **Create Repository**

### Step 3: Copy Files

1. Open the newly created `karting-timer` folder
2. Copy all files from `karting-pwa` folder into it
3. GitHub Desktop will detect changes

### Step 4: Commit and Publish

1. In GitHub Desktop:
   - **Summary:** "Initial commit: Karting Live Timer PWA"
   - Click **Commit to main**
2. Click **Publish repository**
3. **Keep code public:** ✅ Checked
4. Click **Publish repository**

### Step 5: Enable GitHub Pages

Same as Method 1, Step 3 above.

---

## Verifying Deployment

### 1. Check Build Status

Go to repository → **Actions** tab:
- Should see "pages build and deployment" workflow
- Wait for green checkmark ✅

### 2. Test on Desktop

1. Open your URL: `https://YOUR_USERNAME.github.io/karting-timer/`
2. Should see loading screen
3. Connection indicator should turn green
4. Driver list should populate with data

### 3. Test on Mobile

1. Open URL on phone browser
2. Add to home screen (Chrome → Menu → "Add to Home screen")
3. Open from home screen
4. Should work in full-screen mode

---

## Updating Your App

### If Using Web Interface

1. Go to your repository on GitHub
2. Click on the file you want to edit (e.g., `app.js`)
3. Click pencil icon (Edit)
4. Make changes
5. Scroll down → Commit changes
6. Wait 1-2 minutes for deployment

### If Using Git Command Line

```bash
cd karting-pwa

# Make your changes to files

# Stage changes
git add .

# Commit
git commit -m "Update: describe your changes"

# Push
git push
```

Changes appear on your site in 1-2 minutes.

---

## Custom Domain (Optional)

### Step 1: Buy Domain

Use any domain registrar:
- Namecheap (~$10/year)
- Google Domains (~$12/year)
- Cloudflare (~$9/year)

Example: `karting.yourdomain.com`

### Step 2: Configure DNS

Add CNAME record:
```
Type: CNAME
Host: karting (or @)
Value: YOUR_USERNAME.github.io
```

### Step 3: Add to GitHub Pages

1. Repository Settings → Pages
2. **Custom domain:** karting.yourdomain.com
3. Click **Save**
4. Wait for DNS check (can take 1-24 hours)
5. ✅ **Enforce HTTPS** (enabled automatically)

---

## Troubleshooting Deployment

### 404 Page Not Found

**Problem:** Visiting URL shows GitHub 404 page

**Solutions:**
1. Wait 2-5 minutes (initial deployment is slow)
2. Verify Pages is enabled: Settings → Pages
3. Check branch is `main` and folder is `/ (root)`
4. Ensure `index.html` is in root folder (not subfolder)
5. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Icons Not Showing

**Problem:** App icon is blank/default

**Solutions:**
1. Verify `icon-192.png` and `icon-512.png` exist
2. Check file names are exactly correct (case-sensitive)
3. Clear browser cache
4. Re-add to home screen

### App Won't Install to Home Screen

**Problem:** No "Add to Home Screen" option

**Solutions:**
1. Use Chrome or Edge (Safari on iOS has limitations)
2. Verify HTTPS (GitHub Pages uses HTTPS automatically)
3. Check `manifest.json` is valid: https://manifest-validator.appspot.com/
4. Must visit via GitHub Pages URL (not localhost)

### WebSocket Not Connecting

**Problem:** Connection indicator stays red

**Solutions:**
1. Check browser console (F12) for errors
2. Verify internet connection
3. Test https://live.racefacer.com directly
4. Check if session is active on RaceFacer
5. Try different network (mobile data vs WiFi)

### Changes Not Appearing

**Problem:** Updated files but site hasn't changed

**Solutions:**
1. Wait 2 minutes for GitHub Pages rebuild
2. Check Actions tab for build status
3. Hard refresh: Ctrl+Shift+R
4. Clear browser cache
5. Try incognito/private mode

---

## GitHub Pages Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| **Bandwidth** | 100GB/month | More than enough for personal use |
| **Build time** | 10 minutes/build | Usually takes <30 seconds |
| **File size** | 100MB max | Your PWA is ~50KB |
| **Repo size** | 1GB | No issue for web apps |
| **Builds** | Unlimited | Every push triggers rebuild |

**For your use case:** These limits are more than sufficient. Only you and a few others will access it.

---

## Alternative Free Hosting Options

### Cloudflare Pages

**Pros:** Unlimited bandwidth, faster CDN  
**Cons:** Slightly more complex setup

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
cd karting-pwa
wrangler pages publish . --project-name=karting-timer
```

### Netlify

**Pros:** Drag-and-drop deployment  
**Cons:** 100GB bandwidth limit

1. Go to https://app.netlify.com/drop
2. Drag `karting-pwa` folder
3. **Done!** Gets URL like: https://random-name.netlify.app
4. Can customize: Site settings → Change site name

### Vercel

**Pros:** Fast deployment, great DX  
**Cons:** Requires Git integration

```bash
npm install -g vercel
cd karting-pwa
vercel --prod
```

---

## Security Best Practices

### 1. Don't Commit Secrets

Never add API keys, passwords, or tokens to public repos.

### 2. Enable 2FA on GitHub

Settings → Password and authentication → Two-factor authentication

### 3. Review Permissions

Settings → Security → Security log (check for suspicious activity)

---

## Monitoring & Analytics (Optional)

### Google Analytics

Add to `index.html` before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Simple Analytics (Privacy-focused)

Free alternative: https://plausible.io/

---

## Backup Your Code

### Method 1: GitHub (Already Done)

Your code is backed up on GitHub automatically.

### Method 2: Download Archive

1. Repository page → Code → Download ZIP
2. Save to external drive/cloud storage

### Method 3: Clone to Multiple Locations

```bash
git clone https://github.com/YOUR_USERNAME/karting-timer.git
```

---

## Next Steps

✅ App deployed to GitHub Pages  
✅ Test on mobile device  
✅ Add to home screen  
✅ Mount device on kart (use phone holder)  
✅ Race and enjoy real-time data! 🏎️💨

**Questions?** Check README.md or open a GitHub Issue in your repo.

