# ESP32 LED Controller

Arduino sketch for controlling the hexagonal cylinder LEDs using an ESP32 board.

## Hardware Requirements

- **ESP32 Development Board** (any variant)
- **870 WS2815 LEDs** arranged in hexagonal cylinder
- **Power supply** appropriate for your LED count (5V or 12V depending on LED type, sufficient amperage)

## Wiring

### Required Connections
- **LED Data Pin**: Connect to GPIO 33 on ESP32
- **LED Power**: Connect to appropriate power supply (5V for WS2812B, 12V for WS2815)
- **LED Ground**: Connect to common ground with ESP32

## Features

### Automatic Pattern Switching
- Patterns automatically switch randomly every **10 seconds**
- No manual control needed - fully automatic operation

### Available Patterns (19 Total)
1. **Rainbow Wave** - Flowing rainbow colors
2. **Running Lights** - Red chaser effect
3. **Knight Rider 3D** - Vertical scanning effect
4. **Heartbeat** - Pulsing heart rhythm in red/pink
5. **Edge Flash** - Random edge flashing
6. **Breathing** - Slow color breathing effect
7. **Star Sprinkle** - Twinkling stars throughout
8. **Flames** - Volumetric fire effect
9. **Music Beat** - VU meter style (120 BPM)
10. **Cylinder Trace** - Tracing pattern around cylinder
11. **Shockwave** - Expanding rings from center
12. **Winter Freeze** - Sparkly ice effect from top to bottom
13. **Fireworks** - Exploding spheres of color
14. **Random Sparkle** - Groups of LEDs lighting up
15. **Spiral Sphere** - Fire ball spinning up and down
16. **Edge Walker** - Single point walking through the strip
17. **Multi Walker** - 10 colored points moving simultaneously
18. **Color Flood** - Color expanding from random points
19. **Rainbow Flood** - Rainbow expanding with hue progression

## Installation

1. Install the **Arduino IDE** (1.8.x or 2.x)
2. Install **ESP32 board support**:
   - Add to Board Manager URLs: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to Tools > Board > Boards Manager
   - Search for "esp32" and install
3. Install **FastLED library**:
   - Go to Sketch > Include Library > Manage Libraries
   - Search for "FastLED" and install version 3.5.0 or later

## Configuration

Edit these constants at the top of the sketch if needed:

```cpp
#define NUM_LEDS 870         // Total number of LEDs (18 edges with varying counts)
#define DATA_PIN 33          // GPIO pin for LED data
#define LED_TYPE WS2815      // LED chipset type
#define BRIGHTNESS 128       // Global brightness (0-255)
#define FRAMES_PER_SECOND 60 // Animation speed
```

### Adjusting Auto-Switch Interval

To change how often patterns auto-switch (default is 10 seconds):

```cpp
const unsigned long AUTO_SWITCH_INTERVAL = 10000; // milliseconds
```

### LED Strip Configuration

The hexagonal cylinder uses 18 edges with varying LED counts:
- Edge lengths: 47, 48, 48, 48, 49, 50, 49, 48, 49, 48, 49, 48, 49, 48, 49, 49, 47, 48
- Total: 870 LEDs
- Path: A→G→H→B→I→C→J→D→K→E→L→G→L→F→E→D→C→B→A→F

## Usage

1. **Upload the sketch** to your ESP32
2. **Open Serial Monitor** (115200 baud) to see debug output
3. **Watch patterns auto-switch** every 10 seconds

## Serial Output

The sketch provides debug information via Serial:
- Startup confirmation
- Complete pattern list
- Pattern changes with names
- Frame counter status

## Power Considerations

**Important**: 870 LEDs at full brightness can draw significant current!
- Maximum current: ~870 × 60mA = ~52.2A at full white (WS2812B) or ~870 × 12mA = ~10.4A (WS2815 at 12V)
- Typical usage: Much lower with animations (10-30% of maximum)
- Use appropriate power supply rated for your LED count and type
- Consider lowering `BRIGHTNESS` constant to reduce power draw (default: 128 = 50%)

## Troubleshooting

### LEDs not lighting up
- Check wiring connections
- Verify power supply voltage (5V for WS2812B, 12V for WS2815)
- Try reducing `BRIGHTNESS` value
- Check DATA_PIN matches your wiring (GPIO 33)
- Verify `LED_TYPE` matches your actual LEDs

### Patterns not smooth or flickering
- Check power supply is adequate for the LED count
- Ensure common ground between ESP32 and LED power supply
- Add 330Ω-470Ω resistor in series with data line
- Add 1000µF capacitor across LED power supply

### Wrong pattern on LEDs
- Verify LED path matches the hexagonal cylinder wiring
- Check `getLEDYPosition()` function matches your physical layout
- Patterns may look different due to varying edge lengths

## Performance Notes

- ESP32 has plenty of processing power for all 19 animations
- All patterns run at 60 FPS
- Memory usage is optimized for 870 LEDs
- Some animations (like Flames, Fireworks) use more RAM due to per-LED state
- Total sketch size: ~100KB (well within ESP32 flash capacity)

## License

This code is provided as-is for the LED Simulator project.

