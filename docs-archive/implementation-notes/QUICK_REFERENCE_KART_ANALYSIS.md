# Quick Reference: Advanced Kart Performance Analysis

## 🚀 How to Use

### Step 1: Collect Data
- Drive karts for multiple sessions
- Aim for 20+ laps per kart for reliable results
- Multiple drivers per kart = better cross-driver analysis

### Step 2: Run Analysis
1. Click the **Analysis** tab
2. Click **🔬 Run Advanced Analysis** button
3. Wait 1-2 seconds

### Step 3: Read the Report
- Scroll through the terminal-style green text report
- Click **📺 Fullscreen** for better viewing
- Click **📋 Copy Report** to share with mechanics

---

## 📊 Understanding the Metrics

### Performance Index (Most Important)
| Value | Meaning | Action |
|-------|---------|--------|
| < 0.97 | 🏆 Top performer | Keep as-is |
| 0.97-1.01 | ✅ Good | Normal maintenance |
| 1.01-1.03 | ⚠️ Average | Monitor closely |
| > 1.03 | 🔴 Underperforming | **Check immediately** |

### Consistency (CV %)
| Value | Meaning | Likely Cause |
|-------|---------|--------------|
| < 2% | Excellent | Kart is mechanically sound |
| 2-4% | Good | Normal wear |
| 4-6% | Average | Minor issues starting |
| 6-10% | Poor | Check tires, brakes |
| > 10% | Very Poor | **Mechanical failure likely** |

### Overall Rating
- **A+, A, A-**: Excellent karts, top of fleet
- **B+, B, B-**: Good karts, reliable
- **C+, C, C-**: Average, acceptable
- **D+, D**: Below average, needs attention
- **F**: Poor, requires immediate maintenance

---

## 🔧 Quick Fixes

### Underperforming Kart (Index > 1.03)
1. ✓ Check tire pressure (most common)
2. ✓ Test for dragging brakes
3. ✓ Inspect wheel alignment
4. ✓ Check engine tuning
5. ✓ Look for damage/loose parts

### Inconsistent Kart (CV > 6%)
1. ✓ Tire pressure (check all 4 wheels)
2. ✓ Suspension components
3. ✓ Seat tightness
4. ✓ Chain tension
5. ✓ Brake consistency

### High Driver Variation (> 5%)
1. ✓ Steering feel/response
2. ✓ Brake pedal consistency
3. ✓ Throttle response
4. ✓ Seat positioning

---

## 🏁 Track Names

| Display Name | Kart Type | Kart Prefix | Record Time |
|--------------|-----------|-------------|-------------|
| **Lakeside** | Super Karts | Numeric (16) | ~32 sec |
| **Penrite** | Sprint Karts | P (P63) | ~32 sec |
| **Mushroom** | Mini Karts | M (M01) | Slower |
| **Rimo** | Rookie (Kids) | E (E09) | Slower |

---

## 💡 Pro Tips

1. **Run weekly** to catch issues early
2. **Compare same track** only (don't compare Lakeside to Mushroom)
3. **Need 10+ laps** per track for baselines
4. **High confidence** = 20+ laps
5. **Document fixes** to track improvements
6. **Export reports** before clearing data

---

## 🐛 Troubleshooting

**"No karts to analyze"**
- Need more lap data (minimum 3 laps per kart)
- Check data isn't filtered as mock/test data

**"Low confidence" warnings**
- Normal for new karts with few laps
- Collect more data for reliable analysis

**Very high variation (20%+)**
- Could be different drivers with very different skill levels
- Or serious mechanical issues

---

## 📈 What to Look For

### Red Flags 🚩
- Performance index > 1.10 (very slow)
- CV > 15% (very inconsistent)
- Multiple critical severity flags
- Cross-driver variation > 10%

### Good Signs ✅
- Performance index 0.95-1.05 (normal range)
- CV < 4% (consistent)
- Rating A or B
- Low cross-driver variation (< 3%)

---

**Need more details?** See `ADVANCED_KART_ANALYSIS.md` for full documentation.




