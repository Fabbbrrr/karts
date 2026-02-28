# Test Fix Guide

## Issues Fixed

1. ✅ **Environment variable restoration** - Tests now properly restore original env vars
2. ✅ **Cleanup error handling** - Cleanup errors are ignored gracefully
3. ✅ **Cross-platform support** - Added cross-env for Windows compatibility
4. ✅ **Mocha exit flag** - Ensured tests exit after completion
5. ✅ **Simplified configuration** - Tests now use .mocharc.json

## Steps to Fix

### 1. Install Updated Dependencies

```bash
cd server
npm install
```

This will install the new `cross-env` package for cross-platform environment variables.

### 2. Clean Old Test Directories

```bash
# Remove any leftover test storage directories
rm -rf tests/test-storage*

# Or on Windows PowerShell:
Remove-Item -Recurse -Force tests\test-storage*
```

### 3. Run Tests

```bash
npm test
```

Tests should now:
- Run all 135+ tests
- Complete in < 10 seconds
- Exit gracefully
- Show summary

### 4. If Tests Still Hang

**Check for open handles:**

```bash
# Run with diagnostics
npm test -- --detect-open-handles

# Or with more verbosity
npm test -- --verbose
```

**Common issues:**

1. **WebSocket connections not closing**
   - Solution: Tests don't actually open WebSocket connections
   
2. **File handles not closed**
   - Solution: Fixed in cleanup handlers
   
3. **Timers still running**
   - Solution: Mocha --exit flag forces exit

### 5. Run Individual Test Suites

If you need to isolate issues:

```bash
# Unit tests only (should finish quickly)
npm run test:unit

# Integration tests only
npm run test:integration

# Specific file
npx mocha tests/unit/storage.test.js --exit
```

## Expected Output

```bash
$ npm test

  Storage Module
    Storage Initialization
      ✓ should create storage directories
    Lap History Management
      ✓ should update lap history for a kart
      ✓ should not add duplicate laps
      ... (90+ more tests)

  Analysis Module
    Consistency Calculation
      ✓ should calculate consistency
      ... (40+ more tests)

  API Integration Tests
    Health Endpoints
      ✓ GET /health should return server status
      ... (30+ more tests)

  WebSocket and Storage Integration
    Data Flow: WebSocket -> Storage -> Analysis
      ✓ should store lap data
      ... (15+ more tests)

  135 passing (4.2s)

# Process should exit immediately after this
```

## Troubleshooting

### Issue: Tests hang after "135 passing"

**Solution 1: Force exit with timeout**
```bash
# Add a timeout
npm test -- --timeout 5000

# Or kill after 15 seconds
timeout 15s npm test
```

**Solution 2: Check for dangling processes**
```bash
# List Node processes
ps aux | grep node

# Kill if needed
pkill -f mocha
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Storage permission errors

**Solution:**
```bash
# Fix permissions
chmod -R 755 storage/
chmod -R 755 tests/

# Or delete and let tests recreate
rm -rf storage/
rm -rf tests/test-storage*
```

### Issue: Tests fail on Windows

**Solution:**
The `cross-env` package should fix this, but if issues persist:

```powershell
# Set env var manually
$env:NODE_ENV="test"
npm test
```

## Verification

After fixes, verify:

```bash
# 1. Tests run
npm test

# 2. Tests exit (should return to prompt immediately)
echo $?  # Should show 0 (success)

# 3. Coverage works
npm run test:coverage

# 4. Watch mode works (Ctrl+C to exit)
npm run test:watch
```

## Clean State

To start completely fresh:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json
rm -rf storage/ logs/
rm -rf tests/test-storage*

# 2. Reinstall
npm install

# 3. Run tests
npm test
```

## Success Criteria

✅ All 135+ tests pass
✅ Tests complete in < 10 seconds
✅ Process exits immediately after tests
✅ No "waiting for async operations" message
✅ Exit code is 0

## Windows-Specific Notes

If you're on Windows and `npm test` still hangs:

1. **Use Git Bash or WSL** - Better POSIX compatibility
2. **Use cross-env** - Already added to package.json
3. **Check antivirus** - May hold file handles
4. **Run as administrator** - If permission issues persist

```powershell
# PowerShell alternative
$env:NODE_ENV="test"
.\node_modules\.bin\mocha --exit
```

## Need More Help?

Check test output for specific errors:
```bash
npm test 2>&1 | tee test-output.log
```

Then review `test-output.log` for detailed error messages.


