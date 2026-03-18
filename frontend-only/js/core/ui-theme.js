// RaceFacer — Apex UI Theme Module
// Handles: theme toggle, Wake Lock, swipe navigation, haptic feedback
// No external dependencies — pure browser APIs + localStorage

const APEX_KEY      = 'useApexUI';
const WAKELOCK_KEY  = 'useWakeLock';
const TAB_ORDER     = ['race', 'hud', 'results', 'compare', 'summary', 'settings'];

let wakeLockSentinel = null;
let swipeStartX = 0;
let swipeStartY = 0;
let swipeActive = false;

// ── Theme Application ──────────────────────────────────────────────
export function applyApexTheme(enable) {
    document.body.classList.toggle('apex', enable);
    try { localStorage.setItem(APEX_KEY, enable ? '1' : '0'); } catch (_) {}
    updateThemeControl(enable);
}

export function isApexEnabled() {
    try { return localStorage.getItem(APEX_KEY) === '1'; } catch (_) { return false; }
}

// ── Haptic Feedback ────────────────────────────────────────────────
export function haptic(pattern = [40]) {
    if (navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch (_) {}
    }
}

// ── Wake Lock ──────────────────────────────────────────────────────
async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        if (wakeLockSentinel) return; // already held
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
        });
    } catch (_) { /* user denied or feature unavailable */ }
}

function releaseWakeLock() {
    if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
    }
}

export function setWakeLock(enable) {
    try { localStorage.setItem(WAKELOCK_KEY, enable ? '1' : '0'); } catch (_) {}
    if (enable) {
        requestWakeLock();
    } else {
        releaseWakeLock();
    }
}

// Re-acquire after page returns to foreground (screen lock, tab switch)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        let useWL = true;
        try { useWL = localStorage.getItem(WAKELOCK_KEY) !== '0'; } catch (_) {}
        if (useWL) requestWakeLock();
    }
});

// ── Swipe Tab Navigation ───────────────────────────────────────────
// Excluded scrollable containers — swipe won't trigger inside these
const SWIPE_EXCLUSIONS = [
    '.hud-content',
    '.hud-lap-history',
    '.hud-lap-list',
    '.results-content-modern',
    '.compare-table-wrapper',
    '.settings-container',
    '.driver-picker-overlay',
    '.summary-container',
].join(', ');

function getActiveTab() {
    const btn = document.querySelector('.tab-btn.active');
    return btn ? (btn.dataset.tab || 'race') : 'race';
}

function switchToTab(tabName) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) {
        btn.click();
        haptic([22]);
    }
}

function setupSwipeNav() {
    const app = document.getElementById('app');
    if (!app) return;

    app.addEventListener('touchstart', (e) => {
        // Don't track if inside a scrollable area
        if (e.target.closest(SWIPE_EXCLUSIONS)) {
            swipeActive = false;
            return;
        }
        // Don't track multi-touch
        if (e.touches.length !== 1) {
            swipeActive = false;
            return;
        }
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeActive = true;
    }, { passive: true });

    app.addEventListener('touchend', (e) => {
        if (!swipeActive) return;
        swipeActive = false;

        // Only active in Apex mode
        if (!document.body.classList.contains('apex')) return;

        const dx = e.changedTouches[0].clientX - swipeStartX;
        const dy = e.changedTouches[0].clientY - swipeStartY;

        // Require horizontal dominance and minimum 44px travel
        if (Math.abs(dx) < 44) return;
        if (Math.abs(dy) > Math.abs(dx) * 0.7) return;

        const currentTab = getActiveTab();
        const idx = TAB_ORDER.indexOf(currentTab);
        if (idx === -1) return;

        // Swipe left → next tab, swipe right → previous tab
        const nextIdx = dx < 0 ? idx + 1 : idx - 1;
        if (nextIdx >= 0 && nextIdx < TAB_ORDER.length) {
            switchToTab(TAB_ORDER[nextIdx]);
        }
    }, { passive: true });

    // Cancel swipe on multi-touch or touch cancel
    app.addEventListener('touchcancel', () => { swipeActive = false; }, { passive: true });
}

// ── Connection Indicator Observer ──────────────────────────────────
// Sets data-status attribute so CSS ::after content works correctly
function setupConnectionIndicatorObserver() {
    const el = document.getElementById('connection-indicator');
    if (!el) return;

    const update = () => {
        if (el.classList.contains('replay-mode')) {
            el.dataset.status = 'REPLAY';
        } else if (el.classList.contains('connected')) {
            el.dataset.status = 'LIVE';
        } else {
            el.dataset.status = 'OFFLINE';
        }
    };

    update(); // initial state

    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
}

// ── Race Item Trend Observer ────────────────────────────────────────
// Sets data-trend on .race-item based on badge classes, for CSS left border
function setupRaceItemObserver() {
    const raceList = document.getElementById('race-list');
    if (!raceList) return;

    function updateTrends() {
        raceList.querySelectorAll('.race-item').forEach(item => {
            const badge = item.querySelector('.hud-stat-badge');
            if (!badge) {
                item.dataset.trend = 'neutral';
            } else if (badge.classList.contains('improving') || badge.classList.contains('gap-closing')) {
                item.dataset.trend = 'improving';
            } else if (badge.classList.contains('declining') || badge.classList.contains('gap-opening')) {
                item.dataset.trend = 'declining';
            } else {
                item.dataset.trend = 'neutral';
            }
        });
    }

    const obs = new MutationObserver(updateTrends);
    obs.observe(raceList, { childList: true, subtree: true });
}

// ── Orientation Class ──────────────────────────────────────────────
function setupOrientationClass() {
    function update() {
        const landscape = window.matchMedia('(orientation: landscape)').matches;
        document.body.classList.toggle('landscape', landscape);
        document.body.classList.toggle('portrait', !landscape);
    }
    update();
    window.addEventListener('resize', update, { passive: true });
    if (screen.orientation) {
        screen.orientation.addEventListener('change', update);
    }
}

// ── Theme Control UI ───────────────────────────────────────────────
// Injects Classic/Apex segmented control into Appearance settings section
function ensureThemeControl() {
    if (document.getElementById('apex-theme-control')) {
        updateThemeControl(isApexEnabled());
        return;
    }

    // Find the Appearance section — it contains #theme-glass-toggle
    const glassToggle = document.getElementById('theme-glass-toggle');
    if (!glassToggle) return;

    const section = glassToggle.closest('.settings-section');
    if (!section) return;

    const ctrl = document.createElement('div');
    ctrl.id = 'apex-theme-control';
    ctrl.className = 'apex-theme-control';

    const apex = isApexEnabled();
    ctrl.innerHTML = `
        <button class="apex-theme-btn${!apex ? ' active' : ''}" data-val="0" type="button">Classic</button>
        <button class="apex-theme-btn${apex ? ' active' : ''}"  data-val="1" type="button">Apex</button>
    `;

    ctrl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-val]');
        if (!btn) return;
        const enable = btn.dataset.val === '1';
        applyApexTheme(enable);
        haptic([30]);
    });

    // Insert at the top of the section, before the first child
    section.insertBefore(ctrl, section.firstChild);
}

function updateThemeControl(apexEnabled) {
    const ctrl = document.getElementById('apex-theme-control');
    if (!ctrl) return;
    ctrl.querySelectorAll('.apex-theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === (apexEnabled ? '1' : '0'));
    });
}

// ── Tab Haptic ─────────────────────────────────────────────────────
function setupTabHaptic() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => haptic([18]), { passive: true });
    });
    // HUD card toggles
    document.addEventListener('click', (e) => {
        if (e.target.closest('.hud-toggle-btn')) haptic([14]);
        if (e.target.closest('.driver-pick-btn')) haptic([25]);
    }, { passive: true });
}

// ── Wake Lock Setting UI ────────────────────────────────────────────
// Injects a Wake Lock toggle into the Appearance section
function ensureWakeLockControl() {
    if (document.getElementById('wake-lock-toggle')) return;

    const glassToggle = document.getElementById('theme-glass-toggle');
    if (!glassToggle) return;
    const section = glassToggle.closest('.settings-section');
    if (!section) return;

    let useWL = true;
    try { useWL = localStorage.getItem(WAKELOCK_KEY) !== '0'; } catch (_) {}

    const label = document.createElement('label');
    label.className = 'settings-checkbox';
    label.innerHTML = `
        <input type="checkbox" id="wake-lock-toggle"${useWL ? ' checked' : ''}>
        <span>Keep Screen On</span>
    `;

    const cb = label.querySelector('input');
    cb.addEventListener('change', () => {
        setWakeLock(cb.checked);
        haptic([20]);
    });

    // Insert after apex-theme-control or at top of section
    const ctrl = document.getElementById('apex-theme-control');
    if (ctrl && ctrl.nextSibling) {
        section.insertBefore(label, ctrl.nextSibling);
    } else {
        section.insertBefore(label, section.firstChild);
    }
}

// ── Init ───────────────────────────────────────────────────────────
export function init() {
    // Apply Apex from persisted preference immediately
    const useApex = isApexEnabled();
    document.body.classList.toggle('apex', useApex);
    // Remove flash-prevention class now that body class is applied
    document.documentElement.classList.remove('apex-pending');

    // Wake Lock
    let useWL = true;
    try { useWL = localStorage.getItem(WAKELOCK_KEY) !== '0'; } catch (_) {}
    if (useWL) requestWakeLock();

    // Orientation helper classes
    setupOrientationClass();

    // Swipe between tabs
    setupSwipeNav();

    // Haptic on tab/card clicks
    setupTabHaptic();

    // Observers (race items, connection indicator)
    setupConnectionIndicatorObserver();
    setupRaceItemObserver();

    // Inject settings UI — after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ensureThemeControl();
            ensureWakeLockControl();
        });
    } else {
        ensureThemeControl();
        ensureWakeLockControl();
    }
}
