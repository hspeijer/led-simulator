# Hexagonal Cylinder LED Controller

Arduino program for controlling a hexagonal cylinder LED structure with 595 WS2812B LEDs.

## Hardware Requirements

- **Arduino Board** (Uno, Nano, Mega, etc.)
- **595 WS2812B LEDs** (or compatible addressable LEDs)
- **10kΩ Potentiometer** for pattern selection
- **5V Power Supply** (sufficient amperage for your LED count - estimate ~35A at full brightness)
- **Logic Level Shifter** (optional but recommended for data line)

## Wiring

```
Arduino Pin 6  -> LED Data In
Arduino A0     -> Potentiometer Middle Pin
Arduino 5V     -> Potentiometer One Side
Arduino GND    -> Potentiometer Other Side
Arduino GND    -> LED Ground
Power Supply + -> LED 5V
Power Supply - -> LED Ground & Arduino Ground (common ground)
```

**Important:** Connect Arduino GND to power supply GND for common ground!

## Software Setup

1. Install the Arduino IDE from https://www.arduino.cc/
2. Install the FastLED library:
   - Open Arduino IDE
   - Go to **Sketch → Include Library → Manage Libraries**
   - Search for "FastLED"
   - Install the latest version

3. Open `hexagonal_cylinder_led.ino` in Arduino IDE
4. Select your board: **Tools → Board**
5. Select your port: **Tools → Port**
6. Upload the sketch: **Sketch → Upload**

## LED Structure

The hexagonal cylinder has:
- **595 LEDs total** (17 edges × 35 LEDs per edge)
- **12 nodes** (6 bottom + 6 top)
- **Clockwise arrangement** when viewed from top
- LED path: A→G→H→B→I→C→J→D→K→E→L→F→E→D→C→B→A→F

## Animation Patterns

Turn the potentiometer to select different patterns:

| Position | Pattern          | Description                                    |
|----------|------------------|------------------------------------------------|
| 0        | Rainbow Wave     | Rainbow colors flowing along the LEDs          |
| 1        | Running Lights   | Red light chasing around the structure         |
| 2        | Knight Rider 3D  | Sweeping gradient from bottom to top           |
| 3        | Heartbeat        | Pulsing red/pink like a heartbeat              |
| 4        | Edge Flash       | Random edges flash in different colors         |
| 5        | Color Fade       | Smooth color transitions across all LEDs       |
| 6        | Sparkle          | Random sparkles in various colors              |
| 7        | Breathing        | Gentle breathing effect with color rotation    |

## Serial Monitor

Open the Serial Monitor (**Tools → Serial Monitor**) at 115200 baud to see:
- Startup information
- Pattern changes with names
- Debug information

## Configuration Options

Edit these constants in the sketch to customize:

```cpp
#define NUM_LEDS 595           // Total number of LEDs
#define DATA_PIN 6             // Data pin for LED strip
#define BRIGHTNESS 128         // LED brightness (0-255)
#define FRAMES_PER_SECOND 60   // Animation speed
#define POT_PIN A0             // Potentiometer analog pin
#define NUM_PATTERNS 8         // Number of available patterns
```

## Power Considerations

- Each LED can draw up to 60mA at full white brightness
- 595 LEDs × 60mA = 35.7A maximum
- At 128 brightness (50%), expect ~18A peak draw
- Use an appropriate 5V power supply (recommend 20-40A capacity)
- **Never power all LEDs from Arduino's 5V pin!**

## Troubleshooting

**LEDs don't light up:**
- Check data pin connection
- Verify power supply is adequate
- Ensure common ground between Arduino and power supply
- Try lowering BRIGHTNESS value

**Colors are wrong:**
- Change `COLOR_ORDER` in code (try RGB, GRB, BGR)
- Check if your LEDs are WS2812B or different type

**Pattern doesn't change:**
- Verify potentiometer is connected correctly
- Open Serial Monitor to see current pattern
- Check A0 connection

**Flickering:**
- Add 470Ω resistor on data line
- Add 1000µF capacitor across power supply
- Ensure good power supply

## Modifications

To add your own patterns:
1. Increment `NUM_PATTERNS`
2. Add pattern name in `setup()` logging
3. Add case in pattern switch statement
4. Implement your pattern function

## License

This code is provided as-is for educational and hobbyist purposes.

