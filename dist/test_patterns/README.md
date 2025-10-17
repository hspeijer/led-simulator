# LED Test Patterns

Simple diagnostic patterns to verify LED wiring, indexing, and physical layout of the hexagonal cylinder.

## Purpose

This sketch helps you verify that:
- All LEDs are working
- LED indexing matches your physical wiring
- Vertical (side) edges are correctly identified
- Top and bottom rings are correctly identified
- The LED path follows the expected route

## How It Works

The sketch runs **one test pattern continuously**. To change patterns:
1. Modify the `TEST_PATTERN` constant at the top of the sketch (line 33)
2. Re-upload the sketch to your ESP32
3. Observe the new pattern

This allows you to keep each pattern on as long as needed for verification.

## Test Patterns

### Pattern 0: All Blue
- **What it does**: Lights all 888 LEDs in blue
- **What to check**: 
  - All LEDs should light up
  - Color should be consistent blue
  - No dead/flickering LEDs

### Pattern 1: All Red
- **What it does**: Lights all 888 LEDs in red
- **What to check**:
  - All LEDs should light up
  - Color should be consistent red
  - Verifies RGB channels are working

### Pattern 2: All Green
- **What it does**: Lights all 888 LEDs in green
- **What to check**:
  - All LEDs should light up
  - Color should be consistent green
  - Completes RGB channel verification

### Pattern 3: Side Edges Only
- **What it does**: Lights only the 10 vertical edges in white
- **What to check**:
  - Only the 6 vertical sides of the hexagon should light up
  - Top and bottom rings should be **dark**
  - If wrong LEDs light up, check edge indexing in code

**Vertical edges that should light up:**
- A→G (LEDs 0-47) - 48 LEDs
- H→B (LEDs 97-145) - 49 LEDs
- I→C (LEDs 194-242) - 49 LEDs
- J→D (LEDs 293-341) - 49 LEDs
- K→E (LEDs 391-439) - 49 LEDs
- L→F (LEDs 537-585) - 49 LEDs

### Pattern 4: Top Ring Only
- **What it does**: Lights only the top horizontal ring in yellow
- **What to check**:
  - Only the top hexagonal ring should light up
  - All vertical edges should be **dark**
  - Bottom ring should be **dark**

**Top ring edges that should light up:**
- G→H (LEDs 48-96) - 49 LEDs
- B→I (LEDs 146-194) - 49 LEDs
- C→J (LEDs 243-292) - 50 LEDs
- D→K (LEDs 342-390) - 48 LEDs
- E→L (LEDs 440-487) - 48 LEDs
- L→G (LEDs 488-536) - 49 LEDs

### Pattern 5: Bottom Ring Only
- **What it does**: Lights only the bottom horizontal ring in cyan
- **What to check**:
  - Only the bottom hexagonal ring should light up
  - All vertical edges should be **dark**
  - Top ring should be **dark**

**Bottom ring edges that should light up:**
- F→E (LEDs 587-634) - 48 LEDs
- E→D (LEDs 635-683) - 49 LEDs
- D→C (LEDs 684-732) - 49 LEDs
- C→B (LEDs 733-781) - 49 LEDs
- B→A (LEDs 782-830) - 49 LEDs
- A→F (LEDs 831-887) - 57 LEDs

## Usage

1. **Open** `test_patterns.ino` in Arduino IDE
2. **Find line 33**: `#define TEST_PATTERN 0`
3. **Change the number** (0-23) to select your desired test pattern:
   ```cpp
   #define TEST_PATTERN 0  // 0=Blue, 1=Red, 2=Green, 3=Sides, 4=Top, 5=Bottom, 6-23=Individual Edges
   ```
4. **Upload** the sketch to your ESP32
5. **Open Serial Monitor** (115200 baud) to confirm which pattern is running
6. **Observe** the LEDs - the pattern will run continuously
7. **Repeat** steps 2-6 to test each pattern

### Individual Edge Testing (Patterns 6-23)

Patterns 6-23 light up a single edge in white, allowing you to verify the exact LED count for each edge:
- Pattern 6: Edge 0 (A→G)
- Pattern 7: Edge 1 (G→H)
- Pattern 8: Edge 2 (H→B)
- ... and so on through Pattern 23 (Edge 17: A→F)

## Troubleshooting

### Wrong LEDs lighting up in patterns 3-5

This indicates the LED indexing doesn't match your physical wiring. You need to:

1. **Identify your actual LED path** by watching pattern 3-5
2. **Update the edge ranges** in the test pattern code
3. **Update the main sketch** (`hexagonal_cylinder_led_esp32.ino`) with correct ranges
4. **Update `getLEDYPosition()`** function to match your wiring

### Some LEDs not lighting in patterns 0-2

- Check physical connections
- Check power supply capacity
- Try reducing brightness
- Individual LEDs may be defective

### Colors are wrong

- Check `COLOR_ORDER` setting (try RGB, GRB, or BRG)
- Current setting is `RGB` for WS2815 LEDs (verified)

### Pattern won't change

- Make sure you modified `TEST_PATTERN` at the top of the sketch
- Verify you saved the file before uploading
- Check Serial Monitor to see which pattern number is running

## LED Path Reference

The hexagonal cylinder follows this path:
```
A → G → H → B → I → C → J → D → K → E → L → G → L → F → E → D → C → B → A → F
```

Where:
- **A, B, C, D, E, F** = bottom ring nodes (6 corners)
- **G, H, I, J, K, L** = top ring nodes (6 corners)
- **→** = LED strip connection

## Edge Summary (VERIFIED)

| Edge # | Path | LEDs | Start | End | Type | Notes |
|--------|------|------|-------|-----|------|-------|
| 0 | A→G | 48 | 0 | 47 | Vertical | ✓ |
| 1 | G→H | 49 | 48 | 96 | Top Ring | ✓ |
| 2 | H→B | 49 | 97 | 145 | Vertical | ✓ |
| 3 | B→I | 49 | 146 | 194 | Top Ring | ✓ Faulty LED |
| 4 | I→C | 49 | 194 | 242 | Vertical | ✓ Overlap due to faulty |
| 5 | C→J | 50 | 243 | 292 | Top Ring | ✓ |
| 6 | J→D | 49 | 293 | 341 | Vertical | ✓ |
| 7 | D→K | 48 | 342 | 389 | Top Ring | ✓ Faulty LED |
| 8 | K→E | 49 | 391 | 439 | Vertical | ✓ Gap due to faulty |
| 9 | E→L | 48 | 440 | 487 | Top Ring | ✓ |
| 10 | L→G | 49 | 488 | 536 | Top Ring | ✓ |
| 11 | L→F | 49 | 537 | 585 | Vertical | ✓ Faulty LED |
| 12 | F→E | 48 | 586 | 634 | Bottom Ring | ✓ Gap due to faulty |
| 13 | E→D | 49 | 635 | 683 | Bottom Ring | ✓ |
| 14 | D→C | 49 | 684 | 732 | Bottom Ring | ✓ |
| 15 | C→B | 49 | 733 | 781 | Bottom Ring | ✓ |
| 16 | B→A | 49 | 782 | 830 | Bottom Ring | ✓ |
| 17 | A→F | 57 | 831 | 887 | Bottom Ring | ✓ |

**Total: 888 LEDs across 18 edges**

Note: Some edges have faulty LEDs that light up two physical LEDs for one address. The logical LED counts above account for this.

