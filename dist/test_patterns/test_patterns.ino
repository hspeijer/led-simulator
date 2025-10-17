/**
 * Hexagonal Cylinder LED Test Patterns for ESP32
 * Dynamic pattern selection with potentiometer control
 * 
 * Hardware:
 * - ESP32 Development Board
 * - 888 WS2815 LEDs arranged in hexagonal cylinder (VERIFIED)
 * - Data pin: GPIO 33
 * - Potentiometer on GPIO 32 (ADC1_CH4)
 * 
 * Potentiometer Wiring:
 * - One outer pin → 3.3V (NOT 5V!)
 * - Other outer pin → GND
 * - Center (wiper) pin → GPIO 32
 * - NO pull-up or pull-down resistor needed
 * - Use 10kΩ potentiometer for best results
 * - Optional: 0.1µF capacitor between GPIO 32 and GND for noise filtering
 * 
 * ADC Configuration:
 * - 12-bit resolution (0-4095)
 * - 11dB attenuation for full 0-3.3V range
 * - DON'T use pinMode() for ADC pins - it interferes!
 * - Readings are averaged (3 samples) for stability
 * - Check Serial Monitor for pot value debugging
 * 
 * Troubleshooting:
 * - If pot goes to max too quickly, check your wiring
 * - ESP32 ADC is non-linear near 3.3V
 * - Try connecting pot to VIN→GND instead of 3.3V→GND
 * - Or use a voltage divider to limit max voltage to 2.5V
 * - Check Serial Monitor calibration test at startup
 * 
 * Configuration:
 * - POT_CHANGE_PERCENT: Sensitivity (5-20 recommended, default 10)
 * - USE_AUTO_CALIBRATION: true = auto-detect range, false = use 0-4095
 * - IDLE_TIMEOUT: Time before entering random mode (default 60s)
 * - RANDOM_INTERVAL: Pattern change interval in random mode (default 60s)
 * 
 * Behavior:
 * - AUTO-CALIBRATION (if enabled): Turn pot through full range at startup
 * - Potentiometer controls pattern selection (24 patterns)
 * - Moving pot X% of range selects new pattern immediately
 * - After idle timeout, enters RANDOM mode automatically
 * - RANDOM mode switches patterns at interval
 * - Moving pot exits RANDOM mode and returns to MANUAL control
 * - Serial Monitor shows: pattern changes, mode transitions (MANUAL/RANDOM)
 * 
 * Patterns:
 * - Patterns 0-5: Basic tests (All Blue/Red/Green, Sides, Top, Bottom)
 * - Patterns 6-23: Individual edge tests for LED count verification
 * 
 * Shape: Hexagonal Cylinder
 * - 18 edges with VERIFIED LED counts = 888 LEDs total
 * - Edge lengths: 48,49,49,49,49,50,49,48,49,48,49,49,48,49,49,49,49,57
 * - Path: A→G→H→B→I→C→J→D→K→E→L→G→L→F→E→D→C→B→A→F
 */

#include <FastLED.h>

// LED Configuration
#define NUM_LEDS 888  // 18 edges with VERIFIED LED counts (48+49+49+49+49+50+49+48+49+48+49+49+48+49+49+49+49+57)
#define DATA_PIN 33   // ESP32 GPIO 33
#define LED_TYPE WS2815
#define COLOR_ORDER RGB  // Changed from GRB - adjust if colors are still wrong
#define BRIGHTNESS 128
#define FRAMES_PER_SECOND 60

// ============================================================================
// POTENTIOMETER CONFIGURATION - Adjust these to tune behavior
// ============================================================================
#define POT_PIN 32    // Potentiometer on GPIO 32 (ADC1_CH4)
#define POT_CHANGE_PERCENT 3  // Sensitivity: 3=very sensitive, 10=normal, 20=less sensitive
#define IDLE_TIMEOUT 60000  // Milliseconds before random mode (60000 = 1 minute)
#define RANDOM_INTERVAL 60000  // Milliseconds between random pattern changes (60000 = 1 minute)
#define USE_AUTO_CALIBRATION false  // true=auto-detect range at startup, false=use fixed 0-4095

// Pattern Configuration
#define NUM_PATTERNS 24  // 6 basic + 18 individual edges

// LED array
CRGB leds[NUM_LEDS];

// Potentiometer state tracking
int currentPattern = 0;
int lastPotValue = 0;
int lastStablePotValue = 0;
unsigned long lastPotChangeTime = 0;
bool randomMode = false;
unsigned long lastRandomChangeTime = 0;

// ADC Calibration - will be set during startup
int potMinValue = 0;
int potMaxValue = 4095;
int potThreshold = 410;  // Will be recalculated based on actual range and POT_CHANGE_PERCENT

void setup() {
  Serial.begin(115200);
  
  // Initialize FastLED
  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
  FastLED.setBrightness(BRIGHTNESS);
  
  // Initialize potentiometer ADC
  analogSetWidth(12);
  analogSetAttenuation(ADC_11db);
  analogSetPinAttenuation(POT_PIN, ADC_11db);
  delay(100);
  
  Serial.println(F("\n=== LED Pattern Controller ==="));
  
  // Auto-calibration
  if (USE_AUTO_CALIBRATION) {
    Serial.println(F("Calibrating... turn pot through full range"));
    int minReading = 4095;
    int maxReading = 0;
    for (int i = 0; i < 30; i++) {
      int reading = analogRead(POT_PIN);
      if (reading < minReading) minReading = reading;
      if (reading > maxReading) maxReading = reading;
      delay(100);
    }
    potMinValue = max(0, minReading - 50);
    potMaxValue = min(4095, maxReading + 50);
    Serial.print(F("Range: "));
    Serial.print(potMinValue);
    Serial.print(F(" - "));
    Serial.println(potMaxValue);
  } else {
    potMinValue = 0;
    potMaxValue = 4095;
  }
  
  // Calculate threshold
  int actualRange = potMaxValue - potMinValue;
  potThreshold = (actualRange * POT_CHANGE_PERCENT) / 100;
  
  // Initialize starting values
  lastPotValue = analogRead(POT_PIN);
  lastStablePotValue = lastPotValue;
  lastPotChangeTime = millis();
  currentPattern = map(constrain(lastPotValue, potMinValue, potMaxValue), 
                       potMinValue, potMaxValue, 0, NUM_PATTERNS - 1);
  
  Serial.print(F("Starting pattern: "));
  Serial.print(currentPattern);
  Serial.print(F(" - "));
  printPatternName(currentPattern);
  
  // Show pattern distribution info
  int rangePerPattern = actualRange / NUM_PATTERNS;
  Serial.print(F("Each pattern uses ~"));
  Serial.print(rangePerPattern);
  Serial.print(F(" ADC units ("));
  Serial.print(POT_CHANGE_PERCENT);
  Serial.println(F("% sensitivity)"));
  Serial.println(F("Ready!"));
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read potentiometer value with averaging for stability
  long potSum = 0;
  for (int i = 0; i < 3; i++) {
    potSum += analogRead(POT_PIN);
  }
  int potValue = potSum / 3;
  
  // Check if potentiometer moved significantly
  int potDifference = abs(potValue - lastStablePotValue);
  if (potDifference >= potThreshold) {
    // Significant movement detected
    lastStablePotValue = potValue;
    lastPotChangeTime = currentTime;
    
    // Map pot value to pattern number using calibrated range
    int constrainedValue = constrain(potValue, potMinValue, potMaxValue);
    int newPattern = map(constrainedValue, potMinValue, potMaxValue, 0, NUM_PATTERNS - 1);
    
    if (newPattern != currentPattern) {
      currentPattern = newPattern;
      Serial.print(F("MANUAL → Pattern "));
      Serial.print(currentPattern);
      Serial.print(F(": "));
      printPatternName(currentPattern);
    }
    
    // Exit random mode
    if (randomMode) {
      randomMode = false;
      Serial.println(F("Exiting RANDOM mode"));
    }
  }
  
  // Check for idle timeout
  if (!randomMode && (currentTime - lastPotChangeTime >= IDLE_TIMEOUT)) {
    randomMode = true;
    lastRandomChangeTime = currentTime;
    Serial.println(F("Entering RANDOM mode"));
  }
  
  // Random mode: change pattern at interval
  if (randomMode && (currentTime - lastRandomChangeTime >= RANDOM_INTERVAL)) {
    currentPattern = random(NUM_PATTERNS);
    lastRandomChangeTime = currentTime;
    Serial.print(F("RANDOM → Pattern "));
    Serial.print(currentPattern);
    Serial.print(F(": "));
    printPatternName(currentPattern);
  }
  
  // Display current pattern
  displayPattern(currentPattern);
  
  FastLED.show();
  FastLED.delay(1000 / FRAMES_PER_SECOND);
}

// Display a pattern by number
void displayPattern(int patternNum) {
  if (patternNum >= 6 && patternNum <= 23) {
    // Individual edge testing (patterns 6-23 = edges 0-17)
    testSingleEdge(patternNum - 6);
  } else {
    switch(patternNum) {
      case 0: allBlue(); break;
      case 1: allRed(); break;
      case 2: allGreen(); break;
      case 3: sideEdgesOnly(); break;
      case 4: topRingOnly(); break;
      case 5: bottomRingOnly(); break;
      default: allBlue(); break; // Fallback to blue if invalid
    }
  }
}

// Print pattern name to serial
void printPatternName(int patternNum) {
  switch(patternNum) {
    case 0: Serial.println(F("All Blue")); break;
    case 1: Serial.println(F("All Red")); break;
    case 2: Serial.println(F("All Green")); break;
    case 3: Serial.println(F("Side Edges Only")); break;
    case 4: Serial.println(F("Top Ring Only")); break;
    case 5: Serial.println(F("Bottom Ring Only")); break;
    default:
      if (patternNum >= 6 && patternNum <= 23) {
        Serial.print(F("Edge "));
        Serial.println(patternNum - 6);
      } else {
        Serial.println(F("Invalid"));
      }
      break;
  }
}

// ============================================================================
// TEST PATTERNS
// ============================================================================

// Individual Edge Testing - lights up one edge at a time in bright white
void testSingleEdge(uint8_t edgeNum) {
  // Turn off all LEDs
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  
  // Edge definitions with current LED counts (to be verified)
  // Format: {startIndex, ledCount}
  const uint16_t edges[18][2] = {
    {0, 48},       // Edge 0: A->G - VERIFIED: 48 LEDs
    {48, 49},      // Edge 1: G->H - VERIFIED: 49 LEDs
    {97, 49},      // Edge 2: H->B - VERIFIED: 49 LEDs
    {146, 49},     // Edge 3: B->I - VERIFIED: 49 LEDs (LED 49 is faulty - lights 2 LEDs)
    {194, 49},     // Edge 4: I->C
    {243, 50},     // Edge 5: C->J - VERIFIED: 50 LEDs
    {293, 49},     // Edge 6: J->D - VERIFIED: 49 LEDs
    {342, 48},     // Edge 7: D->K - VERIFIED: 48 LEDs (has faulty LED that lights double)
    {391, 49},     // Edge 8: K->E - VERIFIED: 49 LEDs
    {440, 48},     // Edge 9: E->L - VERIFIED: 48 LEDs
    {488, 49},     // Edge 10: L->G - VERIFIED: 49 LEDs
    {537, 49},     // Edge 11: L->F - VERIFIED: 49 LEDs (has faulty LED that lights double)
    {587, 48},     // Edge 12: F->E - VERIFIED: 48 LEDs
    {635, 49},     // Edge 13: E->D - VERIFIED: 49 LEDs
    {684, 49},     // Edge 14: D->C - VERIFIED: 49 LEDs
    {733, 49},     // Edge 15: C->B - VERIFIED: 49 LEDs
    {782, 49},     // Edge 16: B->A - VERIFIED: 49 LEDs
    {831, 57}      // Edge 17: A->F - VERIFIED: 57 LEDs
  };
  
  if (edgeNum < 18) {
    uint16_t start = edges[edgeNum][0];
    uint16_t count = edges[edgeNum][1];
    
    // Light up this edge in bright white
    for (uint16_t i = start; i < start + count && i < NUM_LEDS; i++) {
      leds[i] = CRGB::White;
    }
  }
}

// Pattern 0: All LEDs Blue
void allBlue() {
  fill_solid(leds, NUM_LEDS, CRGB::Blue);
}

// Pattern 1: All LEDs Red
void allRed() {
  fill_solid(leds, NUM_LEDS, CRGB::Red);
}

// Pattern 2: All LEDs Green
void allGreen() {
  fill_solid(leds, NUM_LEDS, CRGB::Green);
}

// Pattern 3: Only Side Edges (vertical edges that go from bottom to top)
void sideEdgesOnly() {
  // Turn off all LEDs first
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  
  // Light up the 6 vertical edges (sides of hexagon) in white
  // These are edges that connect bottom nodes to top nodes
  // Using VERIFIED LED counts and ranges
  
  // Edge 0: A->G (0-47) - 48 LEDs - VERTICAL
  for (uint16_t i = 0; i < 48; i++) {
    leds[i] = CRGB::White;
  }
  
  // Edge 2: H->B (97-145) - 49 LEDs - VERTICAL
  for (uint16_t i = 97; i < 146; i++) {
    leds[i] = CRGB::White;
  }
  
  // Edge 4: I->C (194-242) - 49 LEDs - VERTICAL
  for (uint16_t i = 194; i < 243; i++) {
    leds[i] = CRGB::White;
  }
  
  // Edge 6: J->D (293-340) - 48 LEDs - VERTICAL
  for (uint16_t i = 293; i < 341; i++) {
    leds[i] = CRGB::White;
  }
  
  // Edge 8: K->E (391-439) - 49 LEDs - VERTICAL
  for (uint16_t i = 391; i < 440; i++) {
    leds[i] = CRGB::White;
  }
  
  // Edge 11: L->F (537-585) - 49 LEDs - VERTICAL
  for (uint16_t i = 537; i < 586; i++) {
    leds[i] = CRGB::White;
  }
}

// Pattern 4: Only Top Ring (horizontal edges at top)
void topRingOnly() {
  // Turn off all LEDs first
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  
  // Light up all top ring edges in yellow
  // Using VERIFIED LED counts and ranges
  
  // Edge 1: G->H (48-96) - 49 LEDs - TOP RING
  for (uint16_t i = 48; i < 97; i++) {
    leds[i] = CRGB::Yellow;
  }
  
  // Edge 3: (146-193) - 49 LEDs - TOP RING
  for (uint16_t i = 146; i < 195; i++) {
    leds[i] = CRGB::Yellow;
  }
  
  // Edge 5: C->J (243-292) - 50 LEDs - TOP RING
  for (uint16_t i = 243; i < 293; i++) {
    leds[i] = CRGB::Yellow;
  }
  
  // Edge 7: D->K (342-390) - 48 LEDs - TOP RING (has faulty LED)
  for (uint16_t i = 342; i < 391; i++) {
    leds[i] = CRGB::Yellow;
  }
  
  // Edge 9: E->L (440-487) - 48 LEDs - TOP RING
  for (uint16_t i = 440; i < 488; i++) {
    leds[i] = CRGB::Yellow;
  }
  
  // Edge 10: L->G (488-536) - 49 LEDs - TOP RING
  for (uint16_t i = 488; i < 537; i++) {
    leds[i] = CRGB::Yellow;
  }
}

// Pattern 5: Only Bottom Ring (horizontal edges at bottom)
void bottomRingOnly() {
  // Turn off all LEDs first
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  
  // Light up bottom ring edges in cyan
  // Using VERIFIED LED counts and ranges
  
  // Edge 12: F->E (587-634) - 48 LEDs - BOTTOM RING
  for (uint16_t i = 587; i < 635; i++) {
    leds[i] = CRGB::Cyan;
  }
  
  // Edge 13: E->D (635-683) - 49 LEDs - BOTTOM RING
  for (uint16_t i = 635; i < 684; i++) {
    leds[i] = CRGB::Cyan;
  }
  
  // Edge 14: D->C (684-732) - 49 LEDs - BOTTOM RING
  for (uint16_t i = 684; i < 733; i++) {
    leds[i] = CRGB::Cyan;
  }
  
  // Edge 15: C->B (733-781) - 49 LEDs - BOTTOM RING
  for (uint16_t i = 733; i < 782; i++) {
    leds[i] = CRGB::Cyan;
  }
  
  // Edge 16: B->A (782-830) - 49 LEDs - BOTTOM RING
  for (uint16_t i = 782; i < 831; i++) {
    leds[i] = CRGB::Cyan;
  }
  
  // Edge 17: A->F (831-887) - 57 LEDs - BOTTOM RING
  for (uint16_t i = 831; i < 888; i++) {
    leds[i] = CRGB::Cyan;
  }
}

