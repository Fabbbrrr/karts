# Push to GitHub Repository

## Your Repository
https://github.com/Fabbbrrr/karts

## Step-by-Step Commands

### 1. Navigate to PWA folder
```powershell
cd C:\Users\oicir\Documents\workspace\racefacerUI\karting-pwa
```

### 2. Initialize Git
```powershell
git init
```

### 3. Add all files
```powershell
git add .
```

### 4. Commit
```powershell
git commit -m "Initial commit: Karting Live Timer PWA"
```

### 5. Rename branch to main
```powershell
git branch -M main
```

### 6. Connect to your GitHub repository
```powershell
git remote add origin https://github.com/Fabbbrrr/karts.git
```

### 7. Push to GitHub
```powershell
git push -u origin main
```

You'll be prompted for your GitHub credentials.

## Enable GitHub Pages

1. Go to: https://github.com/Fabbbrrr/karts/settings/pages
2. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** main
   - **Folder:** / (root)
3. Click **Save**
4. Wait 1-2 minutes

## Your Live App URL

After deployment completes:
```
https://fabbbrrr.github.io/karts/
```

## If Repository Already Has Files

If the repo already has content and push fails, use:

```powershell
# Pull existing content first
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

Or force push (⚠️ overwrites everything):
```powershell
git push -u origin main --force
```

## Verify Deployment

1. Check Actions: https://github.com/Fabbbrrr/karts/actions
2. Wait for green checkmark ✅
3. Visit: https://fabbbrrr.github.io/karts/

## Future Updates

After initial push, just:
```powershell
git add .
git commit -m "Your update message"
git push
```

Changes appear in 1-2 minutes!

