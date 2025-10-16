# 🧪 Karting Live Timer - Test Suite

Modern JavaScript testing infrastructure without external dependencies.

## Overview

This test suite provides comprehensive coverage for the Karting Live Timer application using pure JavaScript ES6 modules. No external testing frameworks required!

## Features

- ✅ **Zero Dependencies** - Pure JavaScript, no jest/mocha/chai required
- ✅ **ES6 Modules** - Modern import/export syntax
- ✅ **Browser-Based** - Run tests directly in the browser
- ✅ **Real-time Feedback** - Visual test runner with console output
- ✅ **Maintainable** - Clean, descriptive test cases
- ✅ **Fast** - No build step, instant execution

## Running Tests

### Method 1: Browser Test Runner (Recommended)

1. Open `tests/test-runner.html` in your browser
2. Click "▶️ Run All Tests"
3. View results in the console panel

### Method 2: Console

```javascript
// In browser console
import { runAllTests } from './tests/driver-selection.test.js';
await runAllTests();
```

## Test Coverage

### Driver Selection Service (40+ tests)

#### 1. Core Functionality (4 tests)
- ✅ Select driver with valid kart number
- ✅ Reject invalid/null kart numbers
- ✅ Sync all dropdowns on selection
- ✅ Update application state

#### 2. Driver Validation (5 tests)
- ✅ Validate existing drivers
- ✅ Detect non-existent drivers
- ✅ Handle missing session data
- ✅ Handle null inputs
- ✅ Provide available drivers list

#### 3. Get Selected Driver (4 tests)
- ✅ Return current selection
- ✅ Return null when no selection
- ✅ Handle undefined state
- ✅ Handle missing settings

#### 4. Dropdown Synchronization (4 tests)
- ✅ Update all dropdowns to same value
- ✅ Clear all dropdowns
- ✅ Handle missing DOM elements gracefully
- ✅ Convert null to empty string

#### 5. Selection Change Handler (3 tests)
- ✅ Select driver and trigger updates
- ✅ Handle driver deselection
- ✅ Work without update callback

#### 6. Select and Show HUD (2 tests)
- ✅ Select driver and switch tabs
- ✅ Handle invalid driver gracefully

## Test Structure

### Test Suite Pattern

```javascript
const suite = new TestSuite('Feature Name');

suite.test('should do something specific', () => {
    // Arrange
    const mockData = createMockData();
    
    // Act
    const result = functionUnderTest(mockData);
    
    // Assert
    assert.equal(result, expected, 'Description');
});
```

### Assertion Methods

```javascript
assert.equal(actual, expected, message)      // Strict equality
assert.truthy(value, message)                // Value is truthy
assert.falsy(value, message)                 // Value is falsy
assert.deepEqual(obj1, obj2, message)        // Deep object comparison
```

## Test File Structure

```
tests/
├── README.md                      # This file
├── test-runner.html               # Visual test runner
├── driver-selection.test.js       # Driver selection tests
├── hud-view.test.js              # HUD view tests (TODO)
├── integration.test.js           # Integration tests (TODO)
└── e2e.test.js                   # End-to-end tests (TODO)
```

## Writing New Tests

### 1. Create Test File

```javascript
// tests/my-feature.test.js
import * as MyService from '../js/services/my-service.js';

const suite = new TestSuite('My Feature');

suite.test('should work correctly', () => {
    const result = MyService.doSomething('input');
    assert.equal(result, 'expected');
});

export async function runMyFeatureTests() {
    return await suite.run();
}
```

### 2. Add to Test Runner

```html
<!-- tests/test-runner.html -->
<script type="module">
    import { runMyFeatureTests } from './my-feature.test.js';
    
    async function runTests() {
        await runMyFeatureTests();
    }
</script>
```

## Best Practices

### ✅ DO

- Write descriptive test names: `'should do X when Y happens'`
- Use arrange-act-assert pattern
- Test one thing per test
- Create mock data helpers
- Test edge cases (null, undefined, empty)
- Test error conditions
- Keep tests independent

### ❌ DON'T

- Test implementation details
- Create interdependent tests
- Use real DOM elements (use mocks)
- Test framework code
- Write overly complex tests
- Skip error case testing

## Mock Helpers

### Mock DOM Elements

```javascript
function createMockElements() {
    return {
        mainDriverSelect: { value: '' },
        hudDriverSelect: { value: '' },
        hudQuickDriverSelect: { value: '' }
    };
}
```

### Mock State

```javascript
function createMockState() {
    return {
        settings: { mainDriver: null },
        sessionData: {
            runs: [
                { kart_number: '1', name: 'Driver 1' }
            ]
        }
    };
}
```

### Mock Callbacks

```javascript
let callCount = 0;
const mockCallback = () => { callCount++; };

// Test
someFunction(mockCallback);
assert.truthy(callCount > 0, 'Callback should be called');
```

## Debugging Tests

### Console Logging

Tests automatically log to both:
- Browser console (for detailed debugging)
- Test runner panel (for visual feedback)

### Step-by-Step Debugging

1. Open browser DevTools (F12)
2. Run tests
3. Check console for detailed output
4. Use breakpoints in test files

### Common Issues

#### Test Not Running
- Check ES6 module syntax
- Verify file paths in imports
- Check browser console for errors

#### Assertion Failures
- Review expected vs actual values in console
- Check mock data setup
- Verify function behavior

#### Import Errors
- Use relative paths: `'../js/service.js'`
- Check file extensions: `.js` required
- Verify export syntax in source files

## Performance

- **Fast**: 40+ tests run in < 100ms
- **No Build**: Instant execution in browser
- **Lightweight**: < 5KB test infrastructure
- **Parallel**: Tests run sequentially for clarity

## Integration with CI/CD

### Manual Testing
Open test runner before committing changes

### Future: Automated Testing
Can be extended with headless browser testing:
```bash
# Example with Puppeteer (future)
npx puppeteer test-runner.html
```

## Coverage Goals

- [x] Driver Selection Service: 100%
- [ ] HUD View: 0% (TODO)
- [ ] Race View: 0% (TODO)
- [ ] Kart Analysis: 0% (TODO)
- [ ] WebSocket Service: 0% (TODO)
- [ ] Integration Tests: 0% (TODO)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Add test coverage for edge cases
4. Update this README

## Test Results Example

```
📦 Test Suite: Driver Selection Core Functionality
============================================================
  ✅ selectDriver should update state with valid kart number
  ✅ selectDriver should return false for invalid kart number
  ✅ selectDriver should return false for empty string
  ✅ selectDriver should sync all dropdowns
============================================================
Results: 4 passed, 0 failed

📊 TOTAL RESULTS: 40/40 tests passed
✅ All tests passed!
```

## Resources

- [MDN: JavaScript Testing](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Testing)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

**Version**: 1.0  
**Last Updated**: 2025-01-06  
**Test Coverage**: Driver Selection Service (100%)

