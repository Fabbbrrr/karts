/**
 * Driver Selection Service Tests
 * Modern JavaScript unit tests without external dependencies
 */

import * as DriverSelectionService from '../js/services/driver-selection.service.js';

// Test utilities
const assert = {
    equal: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
        }
    },
    truthy: (value, message) => {
        if (!value) {
            throw new Error(`${message || 'Expected truthy value'}: got ${value}`);
        }
    },
    falsy: (value, message) => {
        if (value) {
            throw new Error(`${message || 'Expected falsy value'}: got ${value}`);
        }
    },
    deepEqual: (actual, expected, message) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message || 'Objects not equal'}: ${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`);
        }
    }
};

// Mock storage
const mockStorage = {
    data: {},
    saveSettings: (settings) => {
        mockStorage.data.settings = { ...settings };
    },
    getSettings: () => mockStorage.data.settings || {},
    clear: () => {
        mockStorage.data = {};
    }
};

// Test suite runner
class TestSuite {
    constructor(name) {
        this.name = name;
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(description, fn) {
        this.tests.push({ description, fn });
    }

    async run() {
        console.log(`\n📦 Test Suite: ${this.name}`);
        console.log('='.repeat(60));

        for (const test of this.tests) {
            try {
                await test.fn();
                console.log(`  ✅ ${test.description}`);
                this.passed++;
            } catch (error) {
                console.error(`  ❌ ${test.description}`);
                console.error(`     ${error.message}`);
                this.failed++;
            }
        }

        console.log('='.repeat(60));
        console.log(`Results: ${this.passed} passed, ${this.failed} failed\n`);
        return { passed: this.passed, failed: this.failed };
    }
}

// Helper to create mock elements
function createMockElements() {
    return {
        mainDriverSelect: { value: '' },
        hudDriverSelect: { value: '' },
        hudQuickDriverSelect: { value: '' }
    };
}

// Helper to create mock state
function createMockState() {
    return {
        settings: {
            mainDriver: null
        },
        sessionData: {
            runs: [
                { kart_number: '1', name: 'Driver 1', best_time: '28.5' },
                { kart_number: '2', name: 'Driver 2', best_time: '29.1' },
                { kart_number: '3', name: 'Driver 3', best_time: '27.8' }
            ]
        }
    };
}

// ============================================================================
// TEST SUITE 1: Driver Selection Core Functionality
// ============================================================================

const suite1 = new TestSuite('Driver Selection Core Functionality');

suite1.test('selectDriver should update state with valid kart number', () => {
    const elements = createMockElements();
    const state = createMockState();

    const result = DriverSelectionService.selectDriver('1', elements, state);

    assert.truthy(result, 'Should return true on success');
    assert.equal(state.settings.mainDriver, '1', 'Should set mainDriver in state');
});

suite1.test('selectDriver should return false for invalid kart number', () => {
    const elements = createMockElements();
    const state = createMockState();

    const result = DriverSelectionService.selectDriver(null, elements, state);

    assert.falsy(result, 'Should return false for null kart number');
});

suite1.test('selectDriver should return false for empty string', () => {
    const elements = createMockElements();
    const state = createMockState();

    const result = DriverSelectionService.selectDriver('', elements, state);

    assert.falsy(result, 'Should return false for empty string');
});

suite1.test('selectDriver should sync all dropdowns', () => {
    const elements = createMockElements();
    const state = createMockState();

    DriverSelectionService.selectDriver('2', elements, state);

    assert.equal(elements.mainDriverSelect.value, '2', 'Main dropdown should be synced');
    assert.equal(elements.hudDriverSelect.value, '2', 'HUD dropdown should be synced');
    assert.equal(elements.hudQuickDriverSelect.value, '2', 'HUD quick dropdown should be synced');
});

// ============================================================================
// TEST SUITE 2: Driver Validation
// ============================================================================

const suite2 = new TestSuite('Driver Validation');

suite2.test('validateDriver should return valid for existing driver', () => {
    const state = createMockState();
    
    const result = DriverSelectionService.validateDriver('1', state.sessionData);

    assert.truthy(result.valid, 'Should be valid');
    assert.truthy(result.driver, 'Should return driver object');
    assert.equal(result.driver.kart_number, '1', 'Should return correct driver');
});

suite2.test('validateDriver should return invalid for non-existent driver', () => {
    const state = createMockState();
    
    const result = DriverSelectionService.validateDriver('99', state.sessionData);

    assert.falsy(result.valid, 'Should be invalid');
    assert.equal(result.reason, 'Driver 99 not found in session', 'Should provide reason');
    assert.falsy(result.driver, 'Should not return driver');
});

suite2.test('validateDriver should return invalid with no session data', () => {
    const result = DriverSelectionService.validateDriver('1', null);

    assert.falsy(result.valid, 'Should be invalid');
    assert.equal(result.reason, 'No session data available', 'Should provide reason');
});

suite2.test('validateDriver should return invalid for null kart number', () => {
    const state = createMockState();
    
    const result = DriverSelectionService.validateDriver(null, state.sessionData);

    assert.falsy(result.valid, 'Should be invalid');
    assert.equal(result.reason, 'No kart number provided', 'Should provide reason');
});

suite2.test('validateDriver should include available drivers on failure', () => {
    const state = createMockState();
    
    const result = DriverSelectionService.validateDriver('99', state.sessionData);

    assert.truthy(result.availableDrivers, 'Should include available drivers');
    assert.deepEqual(result.availableDrivers, ['1', '2', '3'], 'Should list all available kart numbers');
});

// ============================================================================
// TEST SUITE 3: Get Selected Driver
// ============================================================================

const suite3 = new TestSuite('Get Selected Driver');

suite3.test('getSelectedDriver should return current driver', () => {
    const state = createMockState();
    state.settings.mainDriver = '3';

    const driver = DriverSelectionService.getSelectedDriver(state);

    assert.equal(driver, '3', 'Should return current driver');
});

suite3.test('getSelectedDriver should return null when no driver selected', () => {
    const state = createMockState();

    const driver = DriverSelectionService.getSelectedDriver(state);

    assert.equal(driver, null, 'Should return null when no selection');
});

suite3.test('getSelectedDriver should handle undefined state', () => {
    const driver = DriverSelectionService.getSelectedDriver(undefined);

    assert.equal(driver, null, 'Should return null for undefined state');
});

suite3.test('getSelectedDriver should handle missing settings', () => {
    const state = { settings: undefined };
    
    const driver = DriverSelectionService.getSelectedDriver(state);

    assert.equal(driver, null, 'Should return null for missing settings');
});

// ============================================================================
// TEST SUITE 4: Dropdown Synchronization
// ============================================================================

const suite4 = new TestSuite('Dropdown Synchronization');

suite4.test('syncAllDropdowns should update all dropdowns to same value', () => {
    const elements = createMockElements();

    DriverSelectionService.syncAllDropdowns('5', elements);

    assert.equal(elements.mainDriverSelect.value, '5', 'Main dropdown synced');
    assert.equal(elements.hudDriverSelect.value, '5', 'HUD dropdown synced');
    assert.equal(elements.hudQuickDriverSelect.value, '5', 'Quick dropdown synced');
});

suite4.test('syncAllDropdowns should clear all dropdowns with empty string', () => {
    const elements = createMockElements();
    // Set initial values
    elements.mainDriverSelect.value = '1';
    elements.hudDriverSelect.value = '1';
    elements.hudQuickDriverSelect.value = '1';

    DriverSelectionService.syncAllDropdowns('', elements);

    assert.equal(elements.mainDriverSelect.value, '', 'Main dropdown cleared');
    assert.equal(elements.hudDriverSelect.value, '', 'HUD dropdown cleared');
    assert.equal(elements.hudQuickDriverSelect.value, '', 'Quick dropdown cleared');
});

suite4.test('syncAllDropdowns should handle missing dropdown elements gracefully', () => {
    const elements = {
        mainDriverSelect: { value: '' },
        // Missing other dropdowns
    };

    // Should not throw error
    DriverSelectionService.syncAllDropdowns('1', elements);

    assert.equal(elements.mainDriverSelect.value, '1', 'Should update available dropdown');
});

suite4.test('syncAllDropdowns should handle null value', () => {
    const elements = createMockElements();

    DriverSelectionService.syncAllDropdowns(null, elements);

    assert.equal(elements.mainDriverSelect.value, '', 'Should convert null to empty string');
});

// ============================================================================
// TEST SUITE 5: Driver Selection Change Handler
// ============================================================================

const suite5 = new TestSuite('Driver Selection Change Handler');

suite5.test('handleDriverSelectionChange should select driver and trigger update', () => {
    const elements = createMockElements();
    const state = createMockState();
    let updateCalled = false;
    const mockUpdate = () => { updateCalled = true; };

    DriverSelectionService.handleDriverSelectionChange('2', elements, state, mockUpdate);

    assert.equal(state.settings.mainDriver, '2', 'Should select driver');
    assert.truthy(updateCalled, 'Should call update function');
});

suite5.test('handleDriverSelectionChange should handle driver deselection', () => {
    const elements = createMockElements();
    const state = createMockState();
    state.settings.mainDriver = '1';
    let updateCalled = false;
    const mockUpdate = () => { updateCalled = true; };

    DriverSelectionService.handleDriverSelectionChange(null, elements, state, mockUpdate);

    assert.falsy(state.settings.mainDriver, 'Should clear driver selection');
    assert.truthy(updateCalled, 'Should call update function');
});

suite5.test('handleDriverSelectionChange should work without update function', () => {
    const elements = createMockElements();
    const state = createMockState();

    // Should not throw
    DriverSelectionService.handleDriverSelectionChange('1', elements, state, null);

    assert.equal(state.settings.mainDriver, '1', 'Should still select driver');
});

// ============================================================================
// TEST SUITE 6: Select Driver and Show HUD
// ============================================================================

const suite6 = new TestSuite('Select Driver and Show HUD');

suite6.test('selectDriverAndShowHUD should select driver and switch tabs', () => {
    const elements = createMockElements();
    const state = createMockState();
    let switchedToTab = null;
    let updateCalled = false;

    const mockSwitchTab = (tab) => { switchedToTab = tab; };
    const mockUpdate = () => { updateCalled = true; };

    DriverSelectionService.selectDriverAndShowHUD('1', elements, state, mockSwitchTab, mockUpdate);

    assert.equal(state.settings.mainDriver, '1', 'Should select driver');
    assert.equal(switchedToTab, 'hud', 'Should switch to HUD tab');
});

suite6.test('selectDriverAndShowHUD should handle invalid driver', () => {
    const elements = createMockElements();
    const state = createMockState();
    let switchedToTab = null;

    const mockSwitchTab = (tab) => { switchedToTab = tab; };

    DriverSelectionService.selectDriverAndShowHUD(null, elements, state, mockSwitchTab, null);

    assert.falsy(state.settings.mainDriver, 'Should not set invalid driver');
    assert.falsy(switchedToTab, 'Should not switch tabs on failure');
});

// ============================================================================
// Run all test suites
// ============================================================================

export async function runAllTests() {
    console.log('\n🧪 DRIVER SELECTION SERVICE - TEST SUITE\n');

    const results = [];
    results.push(await suite1.run());
    results.push(await suite2.run());
    results.push(await suite3.run());
    results.push(await suite4.run());
    results.push(await suite5.run());
    results.push(await suite6.run());

    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const total = totalPassed + totalFailed;

    console.log('━'.repeat(60));
    console.log(`\n📊 TOTAL RESULTS: ${totalPassed}/${total} tests passed`);
    
    if (totalFailed === 0) {
        console.log('✅ All tests passed!\n');
    } else {
        console.log(`❌ ${totalFailed} tests failed\n`);
    }

    return { totalPassed, totalFailed, total };
}

// Auto-run if loaded as module
if (typeof window !== 'undefined') {
    window.runDriverSelectionTests = runAllTests;
}

