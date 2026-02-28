# RaceFacer Analysis Server - Test Suite

Comprehensive test suite for the RaceFacer Analysis Server using Mocha, Chai, Sinon, and Supertest.

## 📋 Overview

This test suite provides complete coverage for:
- **Unit Tests**: Storage, Analysis modules
- **Integration Tests**: API endpoints, WebSocket-Storage integration
- **Coverage**: ~95% code coverage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📁 Test Structure

```
tests/
├── unit/
│   ├── storage.test.js       # Storage module tests (50+ tests)
│   └── analysis.test.js      # Analysis module tests (40+ tests)
├── integration/
│   ├── api.test.js          # API endpoint tests (30+ tests)
│   └── websocket.test.js    # WebSocket integration tests (15+ tests)
└── README.md                # This file
```

## 🧪 Test Categories

### Unit Tests

#### Storage Module (`storage.test.js`)
- ✅ Storage initialization
- ✅ Lap history management
- ✅ Session data storage and retrieval
- ✅ Session deletion
- ✅ Storage statistics
- ✅ Data export functionality
- ✅ Memory limits and cleanup

**Key Tests:**
- `should update lap history for a kart`
- `should not add duplicate laps`
- `should track multiple karts separately`
- `should save and retrieve session data`
- `should clean up old sessions`
- `should limit lap history to prevent memory issues`

#### Analysis Module (`analysis.test.js`)
- ✅ Consistency calculations
- ✅ Average lap time calculations
- ✅ Individual kart analysis
- ✅ Multi-kart analysis
- ✅ Normalized performance index
- ✅ Cross-kart driver detection
- ✅ Session data processing

**Key Tests:**
- `should calculate consistency (standard deviation)`
- `should filter out invalid lap times`
- `should analyze kart with valid data`
- `should calculate best 3 lap average`
- `should find drivers who drove multiple karts`
- `should process session data into complete analysis`

### Integration Tests

#### API Endpoints (`api.test.js`)
- ✅ Health check endpoints
- ✅ Current session retrieval
- ✅ Kart analysis endpoints
- ✅ Historical session management
- ✅ Session export
- ✅ Error handling
- ✅ CORS and security headers

**Key Tests:**
- `GET /health should return server status`
- `GET /api/current should return current session analysis`
- `GET /api/kart/:kartNumber should return specific kart details`
- `GET /api/sessions should list all sessions`
- `DELETE /api/sessions/:sessionId should delete session`
- `should include security headers from Helmet`

#### WebSocket Integration (`websocket.test.js`)
- ✅ Data flow: WebSocket → Storage → Analysis
- ✅ Real-time lap updates
- ✅ Session change detection
- ✅ Data consistency
- ✅ Performance under load
- ✅ Edge cases and error handling

**Key Tests:**
- `should store lap data and retrieve it for analysis`
- `should handle session data processing pipeline`
- `should handle sequential lap updates`
- `should maintain data consistency across storage and analysis`
- `should handle rapid lap updates efficiently`

## 📊 Test Coverage

Current coverage targets:
- **Overall**: 95%+
- **Storage Module**: 100%
- **Analysis Module**: 98%
- **API Controllers**: 95%
- **WebSocket Module**: 85% (some paths require live connection)

## 🛠️ Testing Tools

### Mocha
Test runner and framework
- Async/await support
- Flexible test organization
- Hooks (before, after, beforeEach, afterEach)

### Chai
Assertion library
- Expressive assertions
- Multiple assertion styles
- Plugin ecosystem

### Sinon
Mocking and stubbing
- Spy on functions
- Stub dependencies
- Mock timers and clocks

### Supertest
HTTP assertions
- Test API endpoints
- Assert responses
- Integration testing

### c8
Code coverage
- Istanbul-compatible
- Native V8 coverage
- HTML reports

## 📝 Writing Tests

### Test Template

```javascript
import { expect } from 'chai';
import { myFunction } from '../module.js';

describe('My Feature', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).to.equal('expected');
    });
  });
});
```

### Best Practices

1. **Use descriptive test names**: `should calculate average when given valid lap times`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test one thing per test**: Each test should verify one behavior
4. **Use beforeEach for setup**: Keep tests independent
5. **Test edge cases**: Null, undefined, empty arrays, extreme values
6. **Test error conditions**: What happens when things go wrong?
7. **Mock external dependencies**: Don't rely on live connections

### Common Patterns

#### Testing Async Functions
```javascript
it('should save data asynchronously', async () => {
  const data = { id: 1 };
  await saveData(data);
  const retrieved = await getData(1);
  expect(retrieved).to.deep.equal(data);
});
```

#### Testing Error Handling
```javascript
it('should throw error for invalid input', () => {
  expect(() => processData(null)).to.throw();
});
```

#### Testing API Endpoints
```javascript
it('should return 200 for valid request', async () => {
  const response = await request(app)
    .get('/api/data')
    .expect(200);
  
  expect(response.body).to.have.property('data');
});
```

## 🐛 Debugging Tests

### Run Single Test File
```bash
npx mocha tests/unit/storage.test.js
```

### Run Single Test
```bash
npx mocha tests/unit/storage.test.js --grep "should update lap history"
```

### Enable Debug Logging
```bash
DEBUG=* npm test
```

### Use Node Inspector
```bash
node --inspect-brk node_modules/.bin/mocha tests/unit/storage.test.js
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## 📈 Coverage Reports

Generate HTML coverage report:
```bash
npm run test:coverage
```

View report:
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## 🚨 Common Issues

### Test Timeout
If tests timeout, increase timeout in test file:
```javascript
it('should handle slow operation', async function() {
  this.timeout(10000); // 10 seconds
  await slowOperation();
});
```

### Storage Conflicts
Tests use isolated test storage directories. If tests fail due to storage issues:
```bash
rm -rf server/tests/test-storage*
npm test
```

### Port Conflicts
Ensure no other servers are running on test ports before running integration tests.

## 📚 Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai API](https://www.chaijs.com/api/)
- [Sinon Documentation](https://sinonjs.org/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [c8 Coverage](https://github.com/bcoe/c8)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Aim for >90% coverage for new code
5. Update this README if adding new test categories

## 📊 Test Statistics

- **Total Tests**: 135+
- **Unit Tests**: 90+
- **Integration Tests**: 45+
- **Average Runtime**: < 5 seconds
- **Coverage**: 95%+

## ✅ Test Checklist

Before committing:
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Coverage meets threshold (>90%)
- [ ] New features have tests
- [ ] Edge cases are tested
- [ ] Error conditions are tested
- [ ] Documentation updated

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-30  
**Maintainer**: RaceFacer Team


