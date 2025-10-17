/**
 * Hexagonal Cylinder LED Controller for ESP32
 * Uses FastLED library to control 888 LEDs arranged in a hexagonal cylinder
 * 
 * Hardware:
 * - ESP32 Development Board
 * - 888 WS2815 LEDs (or similar FastLED compatible)
 * - Data pin: GPIO 33
 * - Potentiometer on GPIO 32 (ADC1_CH4)
 * 
 * Potentiometer Control:
 * - Wiring: 3.3V → pot → GND, wiper → GPIO 32
 * - Turn pot to select from 19 animation patterns
 * - After 1 minute of no movement, enters RANDOM mode
 * - RANDOM mode automatically changes patterns every minute
 * - Moving pot exits RANDOM mode and returns to MANUAL control
 * 
 * Configuration (adjust at top of file):
 * - POT_CHANGE_PERCENT: Sensitivity (3=very sensitive, 10=normal)
 * - IDLE_TIMEOUT: Time before entering RANDOM mode (default 60s)
 * - RANDOM_INTERVAL: Pattern change interval in RANDOM mode (default 60s)
 * - USE_AUTO_CALIBRATION: Auto-detect pot range at startup (default false)
 * 
 * Shape: Hexagonal Cylinder
 * - 18 edges with varying LED counts = 888 LEDs total (VERIFIED)
 * - Edge lengths: 48,49,49,49,49,50,49,48,49,48,49,49,48,49,49,49,49,57
 * - Path: A->G->H->B->I->C->J->D->K->E->L->G->L->F->E->D->C->B->A->F
 */

#include <FastLED.h>

// LED Configuration
#define NUM_LEDS 888  // 18 edges with VERIFIED LED counts (48+49+49+49+49+50+49+48+49+48+49+49+48+49+49+49+49+57)
#define DATA_PIN 33  // ESP32 GPIO 33
#define LED_TYPE WS2815
#define COLOR_ORDER RGB  // Changed from GRB - adjust if colors are wrong
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
#define NUM_PATTERNS 19  // All patterns from simulator

// LED array
CRGB leds[NUM_LEDS];

// Animation state
uint32_t frameCounter = 0;
uint8_t currentPattern = 0;

// Potentiometer state tracking
int lastPotValue = 0;
int lastStablePotValue = 0;
unsigned long lastPotChangeTime = 0;
bool randomMode = false;
unsigned long lastRandomChangeTime = 0;

// ADC Calibration - will be set during startup
int potMinValue = 0;
int potMaxValue = 4095;
int potThreshold = 123;  // Will be recalculated based on actual range and POT_CHANGE_PERCENT

// Animation-specific state variables
// Knight Rider 3D
float krYPosition = 17.5;
int8_t krDirection = -1;
uint8_t krWaitCounter = 0;

// Heartbeat
unsigned long hbStartTime = 0;

// Edge Flash
unsigned long efLastFlashTime = 0;

// Breathing Spheres
unsigned long breatheStartTime = 0;

// Music Beat
unsigned long mbStartTime = 0;

// Cylinder Trace
float ctProgress = 0.0f;
bool ctInitialized = false;

// Star Sprinkle
struct Star {
  uint16_t ledIndex;
  float brightness;
  uint8_t age;
  uint8_t maxAge;
  CRGB color;
};
#define MAX_STARS 50
Star stars[MAX_STARS];
uint8_t starCount = 0;

// Flames
struct FlameLED {
  float flicker;
  float heightOffset;
  float heightVelocity;
  float turbulence;
  float distFromCenter;
};
FlameLED flameLEDs[NUM_LEDS];
bool flamesInitialized = false;

// Shockwave
struct Wave {
  float radius;
  float intensity;
  bool active;
};
#define MAX_WAVES 3
Wave waves[MAX_WAVES];
uint16_t swFrameCounter = 120; // Start at SPAWN_INTERVAL for immediate wave

// Winter Freeze
float wfFreezeLevel = 0.0f;
uint8_t wfSparkleCount = 0;

// Fireworks
struct Firework {
  float centerX, centerY, centerZ;
  float radius;
  float maxRadius;
  float speed;
  uint8_t phase; // 0=expand, 1=contract
  float intensity;
  CRGB color;
  bool active;
};
#define MAX_FIREWORKS 3
Firework fireworks[MAX_FIREWORKS];
uint16_t fwFrameCounter = 20; // Start at SPAWN_INTERVAL for immediate firework

// Random Sparkle
uint16_t rsFrameCounter = 120; // Start at HOLD_DURATION for immediate sparkles
uint16_t rsActiveLEDs[60]; // 20 groups of 3
uint8_t rsActiveCount = 0;
CRGB rsColor;

// Spiral Sphere
float ssYPosition = 17.5f;
int8_t ssDirection = -1;
float ssAngle = 0.0f;

void setup() {
  Serial.begin(115200);
  Serial.println(F("\n\nESP32 Hexagonal Cylinder LED Controller"));
  Serial.println(F("========================================="));
  
  // Initialize FastLED
  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
  FastLED.setBrightness(BRIGHTNESS);
  
  // Initialize potentiometer ADC
  analogSetWidth(12);
  analogSetAttenuation(ADC_11db);
  analogSetPinAttenuation(POT_PIN, ADC_11db);
  delay(100);
  
  Serial.println(F("\n=== Potentiometer Control Mode ==="));
  
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
  breatheStartTime = millis(); // Initialize breathing timer
  hbStartTime = millis(); // Initialize heartbeat timer
  efLastFlashTime = millis(); // Initialize edge flash timer
  mbStartTime = millis(); // Initialize music beat timer
  currentPattern = map(constrain(lastPotValue, potMinValue, potMaxValue), 
                       potMinValue, potMaxValue, 0, NUM_PATTERNS - 1);
  
  Serial.print(F("Sensitivity: "));
  Serial.print(POT_CHANGE_PERCENT);
  Serial.print(F("% | Threshold: "));
  Serial.println(potThreshold);
  Serial.println(F("Setup complete!"));
  Serial.println(F("\nAvailable patterns:"));
  Serial.println(F("  0: Rainbow Wave"));
  Serial.println(F("  1: Running Lights"));
  Serial.println(F("  2: Knight Rider 3D"));
  Serial.println(F("  3: Heartbeat"));
  Serial.println(F("  4: Edge Flash"));
  Serial.println(F("  5: Breathing"));
  Serial.println(F("  6: Star Sprinkle"));
  Serial.println(F("  7: Flames"));
  Serial.println(F("  8: Music Beat"));
  Serial.println(F("  9: Cylinder Trace"));
  Serial.println(F(" 10: Shockwave"));
  Serial.println(F(" 11: Winter Freeze"));
  Serial.println(F(" 12: Fireworks"));
  Serial.println(F(" 13: Random Sparkle"));
  Serial.println(F(" 14: Spiral Sphere"));
  Serial.println(F(" 15: Edge Walker"));
  Serial.println(F(" 16: Multi Walker"));
  Serial.println(F(" 17: Color Flood"));
  Serial.println(F(" 18: Rainbow Flood"));
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
  uint8_t newPattern = currentPattern;
  
  if (potDifference >= potThreshold) {
    // Significant movement detected
    lastStablePotValue = potValue;
    lastPotChangeTime = currentTime;
    
    // Map pot value to pattern number using calibrated range
    int constrainedValue = constrain(potValue, potMinValue, potMaxValue);
    newPattern = map(constrainedValue, potMinValue, potMaxValue, 0, NUM_PATTERNS - 1);
    
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
    newPattern = random(NUM_PATTERNS);
    lastRandomChangeTime = currentTime;
  }
  
  // Pattern change handling
  if (newPattern != currentPattern) {
    currentPattern = newPattern;
    
    Serial.print(randomMode ? F("RANDOM → ") : F("MANUAL → "));
    Serial.print(F("Pattern "));
    Serial.print(currentPattern);
    Serial.print(F(": "));
    
    switch(currentPattern) {
      case 0: Serial.println(F("Rainbow Wave")); break;
      case 1: Serial.println(F("Running Lights")); break;
      case 2: Serial.println(F("Knight Rider 3D")); break;
      case 3: Serial.println(F("Heartbeat")); break;
      case 4: Serial.println(F("Edge Flash")); break;
      case 5: Serial.println(F("Breathing")); break;
      case 6: Serial.println(F("Star Sprinkle")); break;
      case 7: Serial.println(F("Flames")); break;
      case 8: Serial.println(F("Music Beat")); break;
      case 9: Serial.println(F("Cylinder Trace")); break;
      case 10: Serial.println(F("Shockwave")); break;
      case 11: Serial.println(F("Winter Freeze")); break;
      case 12: Serial.println(F("Fireworks")); break;
      case 13: Serial.println(F("Random Sparkle")); break;
      case 14: Serial.println(F("Spiral Sphere")); break;
      case 15: Serial.println(F("Edge Walker")); break;
      case 16: Serial.println(F("Multi Walker")); break;
      case 17: Serial.println(F("Color Flood")); break;
      case 18: Serial.println(F("Rainbow Flood")); break;
    }
    
    // Instantly clear all LEDs to black on pattern change
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();
    
    frameCounter = 0; // Reset frame counter on pattern change
    
    // Reset pattern-specific state
    krYPosition = 17.5f;
    krDirection = -1;
    krWaitCounter = 0;
    hbStartTime = millis();
    efLastFlashTime = millis();
    breatheStartTime = millis();
    mbStartTime = millis();
    ctProgress = 0.0f;
    starCount = 0;
    flamesInitialized = false;
    swFrameCounter = 120; // Start at SPAWN_INTERVAL for immediate wave
    for (uint8_t i = 0; i < MAX_WAVES; i++) waves[i].active = false;
    wfFreezeLevel = 0.0f;
    wfSparkleCount = 0;
    fwFrameCounter = 20; // Start at SPAWN_INTERVAL for immediate firework
    for (uint8_t i = 0; i < MAX_FIREWORKS; i++) fireworks[i].active = false;
    rsFrameCounter = 120; // Start at HOLD_DURATION for immediate sparkles
    rsActiveCount = 0;
    ssYPosition = 17.5f;
    ssDirection = -1;
    ssAngle = 0.0f;
  }
  
  // Run current pattern
  switch(currentPattern) {
    case 0: rainbowWave(); break;
    case 1: runningLights(); break;
    case 2: knightRider3D(); break;
    case 3: heartbeat(); break;
    case 4: edgeFlash(); break;
    case 5: breathing(); break;
    case 6: starSprinkle(); break;
    case 7: flames(); break;
    case 8: musicBeat(); break;
    case 9: cylinderTrace(); break;
    case 10: shockwave(); break;
    case 11: winterFreeze(); break;
    case 12: fireworksAnim(); break;
    case 13: randomSparkle(); break;
    case 14: spiralSphere(); break;
    case 15: edgeWalker(); break;
    case 16: multiWalker(); break;
    case 17: colorFlood(); break;
    case 18: rainbowFlood(); break;
  }
  
  FastLED.show();
  FastLED.delay(1000 / FRAMES_PER_SECOND);
  frameCounter++;
}

// ============================================================================
// ANIMATION PATTERNS
// ============================================================================

// Pattern 0: Rainbow Wave
void rainbowWave() {
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float hue = (float)i / (float)NUM_LEDS + (float)frameCounter * 0.01f;
    hue = hue - (int)hue;
    uint8_t hue8 = (uint8_t)(hue * 255.0f);
    leds[i] = CHSV(hue8, 255, 255);
  }
}

// Pattern 1: Running Lights
void runningLights() {
  float position = fmodf((float)frameCounter * 0.5f, (float)NUM_LEDS);
  
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float distance = fabsf((float)i - position);
    float wrappedDistance = min(distance, (float)NUM_LEDS - distance);
    float intensity = max(0.0f, 1.0f - wrappedDistance / 5.0f);
    
    leds[i].r = (uint8_t)(intensity * 255.0f);
    leds[i].g = (uint8_t)(intensity * 50.0f);
    leds[i].b = (uint8_t)(intensity * 50.0f);
  }
}

// Pattern 2: Knight Rider 3D
void knightRider3D() {
  const float HEIGHT = 35.0f;
  const float MIN_Y = -HEIGHT / 2.0f;
  const float MAX_Y = HEIGHT / 2.0f;
  const float Y_RANGE = max(HEIGHT, 10.0f); // Both floats now
  const float SPEED = Y_RANGE / 30.0f;
  const float GRADIENT_WIDTH = Y_RANGE / 4.0f;
  const uint8_t WAIT_FRAMES = 5;
  
  if (krWaitCounter > 0) {
    krWaitCounter--;
  } else {
    krYPosition += SPEED * krDirection;
    
    if (krDirection == -1 && krYPosition <= MIN_Y) {
      krYPosition = MIN_Y;
      krDirection = 1;
      krWaitCounter = WAIT_FRAMES;
    } else if (krDirection == 1 && krYPosition >= MAX_Y) {
      krYPosition = MAX_Y;
      krDirection = -1;
      krWaitCounter = WAIT_FRAMES;
    }
  }
  
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float ledY = getLEDYPosition(i);
    float distance = fabsf(ledY - krYPosition);
    
    if (distance < GRADIENT_WIDTH) {
      float intensity = 1.0f - (distance / GRADIENT_WIDTH);
      leds[i].r = (uint8_t)(255.0f * intensity);
      leds[i].g = 0; // Pure red, no green
      leds[i].b = 0; // Pure red, no blue
    } else {
      leds[i].fadeToBlackBy(15);
    }
  }
}

// Pattern 3: Heartbeat (50 BPM)
void heartbeat() {
  // Timing in milliseconds - 50 BPM = 1.2 seconds per beat
  const unsigned long BEAT_CYCLE_MS = 1200; // 50 BPM = 1200ms per beat
  const unsigned long BEAT1_START_MS = 0;
  const unsigned long BEAT1_DURATION_MS = 140; // First beat (LUB)
  const float BEAT1_PEAK = 1.0f;
  const unsigned long BEAT2_START_MS = 240;
  const unsigned long BEAT2_DURATION_MS = 120; // Second beat (DUB)
  const float BEAT2_PEAK = 0.7f;
  
  // Calculate elapsed time in cycle
  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - hbStartTime;
  unsigned long cycleTime = elapsed % BEAT_CYCLE_MS;
  
  float intensity = 0.05f;
  
  if (cycleTime >= BEAT1_START_MS && cycleTime < BEAT1_START_MS + BEAT1_DURATION_MS) {
    float progress = (float)(cycleTime - BEAT1_START_MS) / (float)BEAT1_DURATION_MS;
    intensity = sinf(progress * PI) * BEAT1_PEAK;
  }
  else if (cycleTime >= BEAT2_START_MS && cycleTime < BEAT2_START_MS + BEAT2_DURATION_MS) {
    float progress = (float)(cycleTime - BEAT2_START_MS) / (float)BEAT2_DURATION_MS;
    intensity = sinf(progress * PI) * BEAT2_PEAK;
  }
  
  float pinkMix = 1.0f - intensity;
  
  uint8_t r = (uint8_t)(255.0f * intensity);
  uint8_t g = (uint8_t)(100.0f * pinkMix * intensity);
  uint8_t b = (uint8_t)(120.0f * pinkMix * intensity);
  
  fill_solid(leds, NUM_LEDS, CRGB(r, g, b));
}

// Pattern 4: Edge Flash - flashes individual edges with bright colors
void edgeFlash() {
  // Edge definitions with actual LED positions
  struct EdgeData {
    uint16_t startLED;
    uint8_t ledCount;
  };
  
  const EdgeData edges[18] = {
    {0, 48},       // Edge 0: A->G
    {48, 49},      // Edge 1: G->H
    {97, 49},      // Edge 2: H->B
    {146, 49},     // Edge 3: B->I
    {195, 49},     // Edge 4: I->C
    {244, 50},     // Edge 5: C->J
    {294, 49},     // Edge 6: J->D
    {343, 48},     // Edge 7: D->K
    {391, 49},     // Edge 8: K->E
    {440, 48},     // Edge 9: E->L
    {488, 49},     // Edge 10: L->G
    {537, 49},     // Edge 11: L->F
    {586, 48},     // Edge 12: F->E
    {634, 49},     // Edge 13: E->D
    {683, 49},     // Edge 14: D->C
    {732, 49},     // Edge 15: C->B
    {781, 49},     // Edge 16: B->A
    {830, 57}      // Edge 17: A->F
  };
  
  fadeToBlackBy(leds, NUM_LEDS, 15);
  
  // 150 BPM = 400ms per beat
  const unsigned long FLASH_INTERVAL_MS = 400; // 150 BPM
  unsigned long currentTime = millis();
  
  if (currentTime - efLastFlashTime >= FLASH_INTERVAL_MS) {
    efLastFlashTime = currentTime;
    
    // Pick random edge
    uint8_t edgeIndex = random(18);
    uint8_t hue = random(256);
    
    const EdgeData &edge = edges[edgeIndex];
    
    // Light up entire edge with bright color (mixed with white)
    for (uint8_t i = 0; i < edge.ledCount; i++) {
      uint16_t ledIndex = edge.startLED + i;
      if (ledIndex < NUM_LEDS) {
        CRGB color = CHSV(hue, 255, 255);
        // Mix 70% color + 30% white for bright flash
        leds[ledIndex].r = min(255, (int)(color.r * 0.7f + 255 * 0.3f));
        leds[ledIndex].g = min(255, (int)(color.g * 0.7f + 255 * 0.3f));
        leds[ledIndex].b = min(255, (int)(color.b * 0.7f + 255 * 0.3f));
      }
    }
  }
}

// Pattern 5: Breathing Spheres - spheres expand from each node, mixing colors
void breathing() {
  
  // Node positions for hexagonal cylinder (same as in getLED3DPosition)
  const float nodeX[12] = {0, 13, 13, 0, -13, -13, 0, 13, 13, 0, -13, -13};
  const float nodeY[12] = {-17.5, -17.5, -17.5, -17.5, -17.5, -17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5};
  const float nodeZ[12] = {15, 7.5, -7.5, -15, -7.5, 7.5, 15, 7.5, -7.5, -15, -7.5, 7.5};
  
  // Node colors (distribute evenly around color wheel)
  const CRGB nodeColors[12] = {
    CRGB(255, 0, 0),     // Red
    CRGB(255, 128, 0),   // Orange
    CRGB(255, 255, 0),   // Yellow
    CRGB(128, 255, 0),   // Yellow-green
    CRGB(0, 255, 0),     // Green
    CRGB(0, 255, 128),   // Cyan-green
    CRGB(0, 255, 255),   // Cyan
    CRGB(0, 128, 255),   // Sky blue
    CRGB(0, 0, 255),     // Blue
    CRGB(128, 0, 255),   // Purple
    CRGB(255, 0, 255),   // Magenta
    CRGB(255, 0, 128)    // Pink
  };
  
  // Timing in milliseconds
  const unsigned long EXPAND_MS = 1667;    // 1.67 seconds to expand
  const unsigned long HOLD_MAX_MS = 3000;  // 3 seconds hold at max
  const unsigned long CONTRACT_MS = 1667;  // 1.67 seconds to contract
  const unsigned long HOLD_MIN_MS = 1333;  // 1.33 seconds hold at min
  const unsigned long BREATH_CYCLE_MS = EXPAND_MS + HOLD_MAX_MS + CONTRACT_MS + HOLD_MIN_MS; // 7667ms total
  const float MAX_RADIUS = 25.0f; // 45% of max distance (~55)
  
  // Calculate elapsed time in cycle
  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - breatheStartTime;
  unsigned long cycleTime = elapsed % BREATH_CYCLE_MS;
  
  // Calculate current radius based on actual time
  float currentRadius;
  if (cycleTime < EXPAND_MS) {
    // Expanding phase
    float progress = (float)cycleTime / (float)EXPAND_MS;
    float eased = 0.5f - 0.5f * cosf(progress * PI);
    currentRadius = eased * MAX_RADIUS;
  } else if (cycleTime < EXPAND_MS + HOLD_MAX_MS) {
    // Hold at max
    currentRadius = MAX_RADIUS;
  } else if (cycleTime < EXPAND_MS + HOLD_MAX_MS + CONTRACT_MS) {
    // Contracting phase
    float progress = (float)(cycleTime - EXPAND_MS - HOLD_MAX_MS) / (float)CONTRACT_MS;
    float eased = 0.5f + 0.5f * cosf(progress * PI);
    currentRadius = eased * MAX_RADIUS;
  } else {
    // Hold at min
    currentRadius = 0.0f;
  }
  
  const float shellThickness = MAX_RADIUS * 0.3f;
  
  // Clear all LEDs
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  
  // Apply sphere effects from each node
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float ledX, ledY, ledZ;
    getLED3DPosition(i, ledX, ledY, ledZ);
    
    float totalR = 0, totalG = 0, totalB = 0;
    
    // Check distance from each node
    for (uint8_t n = 0; n < 12; n++) {
      float dx = ledX - nodeX[n];
      float dy = ledY - nodeY[n];
      float dz = ledZ - nodeZ[n];
      float distance = sqrtf(dx*dx + dy*dy + dz*dz);
      
      // Check if LED is within this sphere
      if (distance <= currentRadius) {
        // LEDs near the surface are brightest
        float distFromSurface = fabsf(distance - currentRadius);
        
        if (distFromSurface <= shellThickness) {
          float intensity = 1.0f - (distFromSurface / shellThickness);
          float smoothIntensity = intensity * intensity; // Quadratic for softer gradient
          
          // Add this node's color contribution
          totalR += nodeColors[n].r * smoothIntensity;
          totalG += nodeColors[n].g * smoothIntensity;
          totalB += nodeColors[n].b * smoothIntensity;
        }
      }
    }
    
    // Apply mixed colors
    leds[i].r = min(255, (int)totalR);
    leds[i].g = min(255, (int)totalG);
    leds[i].b = min(255, (int)totalB);
  }
}

// Pattern 6: Star Sprinkle
void starSprinkle() {
  // Fade all LEDs
  fadeToBlackBy(leds, NUM_LEDS, 15);
  
  // Spawn new stars (3 attempts per frame, 50% chance each)
  for (int attempt = 0; attempt < 3; attempt++) {
    if (random(100) < 50 && starCount < MAX_STARS) {
      stars[starCount].ledIndex = random(NUM_LEDS);
      stars[starCount].age = 0;
      stars[starCount].maxAge = 20 + random(30);
      stars[starCount].color = CRGB(200 + random(55), 200 + random(55), 200 + random(55));
      starCount++;
    }
  }
  
  // Update and render stars
  for (uint8_t i = 0; i < starCount; i++) {
    stars[i].age++;
    
    float ageProgress = (float)stars[i].age / (float)stars[i].maxAge;
    float brightness;
    
    if (ageProgress < 0.2f) {
      brightness = ageProgress / 0.2f;
    } else if (ageProgress < 0.8f) {
      brightness = sinf(stars[i].age * 0.5f) * 0.2f + 0.8f;
    } else {
      brightness = (1.0f - ageProgress) / 0.2f;
    }
    
    // Apply to LED
    if (stars[i].ledIndex < NUM_LEDS) {
      leds[stars[i].ledIndex].r = max(leds[stars[i].ledIndex].r, (uint8_t)(stars[i].color.r * brightness));
      leds[stars[i].ledIndex].g = max(leds[stars[i].ledIndex].g, (uint8_t)(stars[i].color.g * brightness));
      leds[stars[i].ledIndex].b = max(leds[stars[i].ledIndex].b, (uint8_t)(stars[i].color.b * brightness));
    }
    
    // Remove expired stars
    if (stars[i].age >= stars[i].maxAge) {
      stars[i] = stars[starCount - 1];
      starCount--;
      i--;
    }
  }
}

// Pattern 7: Flames (simplified for ESP32)
void flames() {
  if (!flamesInitialized) {
    // Initialize flame data
    for (uint16_t i = 0; i < NUM_LEDS; i++) {
      flameLEDs[i].flicker = random(100) / 100.0f;
      flameLEDs[i].heightOffset = random(100) / 100.0f;
      flameLEDs[i].heightVelocity = (random(100) - 50) / 1000.0f;
      flameLEDs[i].turbulence = random(30) / 100.0f;
      flameLEDs[i].distFromCenter = random(40); // Simplified
    }
    flamesInitialized = true;
  }
  
  const float HEIGHT = 35.0f;
  const float MIN_Y = -HEIGHT / 2.0f;
  
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    // Update flame physics
    flameLEDs[i].flicker += (random(100) - 50) / 100.0f * 0.6f;
    flameLEDs[i].flicker = constrain(flameLEDs[i].flicker, 0.0f, 1.0f);
    
    flameLEDs[i].heightVelocity += (random(100) - 50) / 1000.0f * 0.025f;
    flameLEDs[i].heightVelocity *= 0.92f;
    flameLEDs[i].heightOffset += flameLEDs[i].heightVelocity;
    flameLEDs[i].heightOffset = constrain(flameLEDs[i].heightOffset, -0.2f, 1.1f);
    
    float ledY = getLEDYPosition(i);
    float yNorm = (ledY - MIN_Y) / HEIGHT;
    float effectiveHeight = yNorm - flameLEDs[i].heightOffset;
    
    // More aggressive cutoff - more black areas
    if (effectiveHeight > 0.5f || effectiveHeight < -0.1f) {
      leds[i] = CRGB::Black;
    } else {
      // More dramatic intensity falloff
      float intensity = (1.0f - effectiveHeight * 1.5f) * (0.3f + flameLEDs[i].flicker * 0.7f);
      intensity = constrain(intensity, 0.0f, 1.0f);
      
      // Flame colors: mostly red with orange accents, minimal yellow
      uint8_t r, g, b = 0;
      if (effectiveHeight < 0.1f) {
        // Base: orange-red (hot)
        r = 255;
        g = 150;
      } else if (effectiveHeight < 0.25f) {
        // Lower: orange to red
        r = 255;
        g = (uint8_t)(150 - (effectiveHeight - 0.1f) * 667); // 150 -> 50
      } else {
        // Upper: deep red
        r = 255;
        int gVal = 50 - (int)((effectiveHeight - 0.25f) * 200); // 50 -> 0
        g = (uint8_t)max(0, gVal);
      }
      
      leds[i].r = (uint8_t)(r * intensity);
      leds[i].g = (uint8_t)(g * intensity);
      leds[i].b = 0;
    }
  }
}

// Pattern 8: Music Beat (VU meter style) - 130 BPM
void musicBeat() {
  const unsigned long BEAT_CYCLE_MS = 462; // 130 BPM = 462ms per beat
  const uint8_t NUM_SIDES = 6;
  const unsigned long SIDE_OFFSET_MS = 77; // Offset between sides (462ms / 6)
  
  // Calculate elapsed time
  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - mbStartTime;
  
  // Calculate beat level for sides with offsets
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float ledY = getLEDYPosition(i);
    float yNorm = (ledY + 17.5f) / 35.0f; // Normalize 0-1
    
    // Simple side mapping (approximate)
    uint8_t side = (i / 100) % NUM_SIDES;
    unsigned long sideElapsed = elapsed + (side * SIDE_OFFSET_MS);
    unsigned long cycleTime = sideElapsed % BEAT_CYCLE_MS;
    float progress = (float)cycleTime / (float)BEAT_CYCLE_MS;
    
    float level;
    if (progress < 0.1f) {
      level = progress / 0.1f;
    } else {
      level = 1.0f - ((progress - 0.1f) / 0.9f);
    }
    level *= 0.95f; // Cap at 95%
    
    if (yNorm <= level) {
      // VU meter colors: distinct sections - green (bottom) -> yellow (middle) -> red (top)
      uint8_t r, g;
      if (yNorm < 0.35f) {
        // Bottom section: pure green
        r = 0;
        g = 255;
      } else if (yNorm < 0.7f) {
        // Middle section: pure yellow
        r = 255;
        g = 255;
      } else {
        // Top section (70%+): pure red
        r = 255;
        g = 0;
      }
      leds[i] = CRGB(r, g, 0);
    } else {
      leds[i] = CRGB::Black;
    }
  }
}

// Pattern 9: Cylinder Trace - rectangular pattern around cylinder
void cylinderTrace() {
  static float ledAngles[NUM_LEDS];
  static float ledYPositions[NUM_LEDS];
  
  const float HEIGHT = 35.0f;
  const float MIN_Y = -HEIGHT / 2.0f;
  const float MAX_Y = HEIGHT / 2.0f;
  const float SPEED = 0.02f;
  const uint8_t TAIL_LENGTH = 70;
  
  // Initialize LED cylindrical coordinates once
  if (!ctInitialized) {
    for (uint16_t i = 0; i < NUM_LEDS; i++) {
      float ledX, ledY, ledZ;
      getLED3DPosition(i, ledX, ledY, ledZ);
      ledYPositions[i] = ledY;
      ledAngles[i] = atan2(ledZ, ledX);
      if (ledAngles[i] < 0) ledAngles[i] += TWO_PI;
    }
    ctInitialized = true;
  }
  
  // Fade all LEDs
  fadeToBlackBy(leds, NUM_LEDS, 10);
  
  // Update progress
  ctProgress += SPEED;
  if (ctProgress >= 12.0f) ctProgress = 0.0f;
  
  // Pattern: up, right, down, right × 3 rectangles around cylinder
  const float angleStep = TWO_PI / 6.0f; // 60° per hexagon edge
  
  // Create trail positions
  for (uint8_t i = 0; i < TAIL_LENGTH; i++) {
    float trailProgress = ctProgress - (i * 0.015f);
    while (trailProgress < 0.0f) trailProgress += 12.0f;
    
    uint8_t localPhase = ((uint8_t)trailProgress) % 4;
    uint8_t rectangleIndex = ((uint8_t)trailProgress) / 4;
    float phaseProgress = trailProgress - (uint8_t)trailProgress;
    
    float targetY, targetAngle;
    float baseAngle = rectangleIndex * angleStep * 2.0f; // Each rectangle = 2 edges (120°)
    
    if (localPhase == 0) {
      // Going UP
      targetY = MIN_Y + phaseProgress * HEIGHT;
      targetAngle = baseAngle;
    } else if (localPhase == 1) {
      // Going RIGHT (top ring)
      targetY = MAX_Y;
      targetAngle = baseAngle + phaseProgress * angleStep;
    } else if (localPhase == 2) {
      // Going DOWN
      targetY = MAX_Y - phaseProgress * HEIGHT;
      targetAngle = baseAngle + angleStep;
    } else {
      // Going RIGHT (bottom ring)
      targetY = MIN_Y;
      targetAngle = baseAngle + angleStep + phaseProgress * angleStep;
    }
    
    // Normalize angle
    while (targetAngle >= TWO_PI) targetAngle -= TWO_PI;
    
    // Find closest LED to this trail position
    float closestDist = 10000.0f;
    int16_t closestLED = -1;
    
    for (uint16_t led = 0; led < NUM_LEDS; led++) {
      // Calculate angular distance (accounting for wrap-around)
      float angleDiff = fabsf(ledAngles[led] - targetAngle);
      if (angleDiff > PI) angleDiff = TWO_PI - angleDiff;
      
      float yDiff = fabsf(ledYPositions[led] - targetY);
      float dist = sqrtf(angleDiff * angleDiff + (yDiff / HEIGHT) * (yDiff / HEIGHT));
      
      if (dist < closestDist) {
        closestDist = dist;
        closestLED = led;
      }
    }
    
    // Light up the closest LED
    if (closestLED >= 0) {
      float intensity = 1.0f - ((float)i / TAIL_LENGTH);
      float smoothIntensity = intensity * intensity;
      
      // Cyan to blue gradient
      float hue = 0.5f + (1.0f - intensity) * 0.2f;
      CHSV color = CHSV((uint8_t)(hue * 255), 255, (uint8_t)(smoothIntensity * 255));
      leds[closestLED] += color;
    }
  }
}

// Shockwave - expanding rings from center
void shockwave() {
  const float CENTER_X = 0.0f;
  const float CENTER_Z = 0.0f;
  const float MAX_RADIUS = 50.0f;
  const float EXPAND_SPEED = 0.5f;
  const float FADE_SPEED = 1.0f / 60.0f; // 1 second fade
  const uint16_t SPAWN_INTERVAL = 120; // 2 seconds
  
  swFrameCounter++;
  
  // Spawn new wave
  if (swFrameCounter >= SPAWN_INTERVAL) {
    swFrameCounter = 0;
    for (uint8_t i = 0; i < MAX_WAVES; i++) {
      if (!waves[i].active) {
        waves[i].radius = 0.0f;
        waves[i].intensity = 1.0f;
        waves[i].active = true;
        break;
      }
    }
  }
  
  // Fade all LEDs
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    leds[i].fadeToBlackBy(12);
  }
  
  // Update and render waves
  for (uint8_t w = 0; w < MAX_WAVES; w++) {
    if (!waves[w].active) continue;
    
    if (waves[w].radius < MAX_RADIUS * 1.5f) {
      waves[w].radius += EXPAND_SPEED;
    } else {
      waves[w].intensity -= FADE_SPEED;
      if (waves[w].intensity <= 0.0f) {
        waves[w].active = false;
        continue;
      }
    }
    
    // Apply wave to LEDs (simplified - use approximate X/Z positions)
    for (uint16_t i = 0; i < NUM_LEDS; i++) {
      float ledX = cosf((float)i / NUM_LEDS * TWO_PI) * 35.0f;
      float ledZ = sinf((float)i / NUM_LEDS * TWO_PI) * 35.0f;
      float dist = sqrtf((ledX - CENTER_X) * (ledX - CENTER_X) + (ledZ - CENTER_Z) * (ledZ - CENTER_Z));
      
      const float RING_THICKNESS = 6.0f;
      if (dist >= waves[w].radius - RING_THICKNESS && dist <= waves[w].radius + RING_THICKNESS) {
        float distFromRing = fabsf(dist - waves[w].radius);
        float intensity = (1.0f - distFromRing / RING_THICKNESS) * waves[w].intensity;
        
        leds[i].r = min(255, leds[i].r + (uint8_t)(200 * intensity));
        leds[i].g = min(255, leds[i].g + (uint8_t)(220 * intensity));
        leds[i].b = min(255, leds[i].b + (uint8_t)(255 * intensity));
      }
    }
  }
}

// Winter Freeze - sparkly ice effect from top to bottom
void winterFreeze() {
  const float FREEZE_SPEED = 0.005f;
  const float HEIGHT = 35.0f;
  const float MIN_Y = -HEIGHT / 2.0f;
  const float MAX_Y = HEIGHT / 2.0f;
  
  wfFreezeLevel += FREEZE_SPEED;
  if (wfFreezeLevel >= 1.2f) {
    wfFreezeLevel = 0.0f;
    wfSparkleCount = 0;
  }
  
  // Add sparkles
  if (wfFreezeLevel > 0 && random(100) < 50) {
    wfSparkleCount++;
  }
  
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float yPos = getLEDYPosition(i);
    float yNorm = (yPos - MIN_Y) / HEIGHT;
    float distFromTop = 1.0f - yNorm;
    
    if (distFromTop <= wfFreezeLevel) {
      // Frozen - varying shades of blue
      uint8_t variation = (i * 17) % 100;
      uint8_t r, g, b;
      
      if (variation < 33) {
        r = 150; g = 200; b = 255; // Light ice blue
      } else if (variation < 67) {
        r = 50; g = 180; b = 255; // Cyan blue
      } else {
        r = 30; g = 100; b = 200; // Deep blue
      }
      
      // Add sparkle
      if (random(100) < 5) {
        r = g = b = 255;
      }
      
      leds[i] = CRGB(r, g, b);
    } else {
      leds[i] = CRGB(0, 0, 0);
    }
  }
}

// Random Sparkle - 20 groups of 3 consecutive LEDs
void randomSparkle() {
  const uint16_t HOLD_DURATION = 120; // 2 seconds
  
  rsFrameCounter++;
  
  if (rsFrameCounter >= HOLD_DURATION) {
    rsFrameCounter = 0;
    rsActiveCount = 0;
    
    // Pick 20 random groups of 3 consecutive LEDs
    for (uint8_t g = 0; g < 20; g++) {
      uint16_t startIdx = random(0, NUM_LEDS - 2);
      for (uint8_t j = 0; j < 3; j++) {
        if (rsActiveCount < 60) {
          rsActiveLEDs[rsActiveCount++] = startIdx + j;
        }
      }
    }
    
    // Random color
    rsColor = CHSV(random(256), 255, 255);
  }
  
  // Turn off all LEDs
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  
  // Light up active LEDs
  for (uint8_t i = 0; i < rsActiveCount; i++) {
    if (rsActiveLEDs[i] < NUM_LEDS) {
      leds[rsActiveLEDs[i]] = rsColor;
    }
  }
}

// Spiral Sphere - fire ball on a rope spinning up and down
void spiralSphere() {
  const float HEIGHT = 35.0f;
  const float MIN_Y = -HEIGHT / 2.0f;
  const float MAX_Y = HEIGHT / 2.0f;
  const float SPIRAL_RADIUS = 15.0f; // Matches hexagon radius (max Z = 15)
  const float SPHERE_RADIUS = 20.0f;
  const float TRAVEL_FRAMES = 480.0f; // 8 seconds for full height (2x faster)
  const float SPEED = HEIGHT / TRAVEL_FRAMES;
  const float ROTATION_SPEED = (15.0f * TWO_PI) / TRAVEL_FRAMES; // 15 turns total
  
  // Move Y position
  ssYPosition += SPEED * ssDirection;
  ssAngle += ROTATION_SPEED * ssDirection;
  
  // Check boundaries
  if (ssDirection == -1 && ssYPosition <= MIN_Y) {
    ssYPosition = MIN_Y;
    ssDirection = 1;
  } else if (ssDirection == 1 && ssYPosition >= MAX_Y) {
    ssYPosition = MAX_Y;
    ssDirection = -1;
  }
  
  // Calculate sphere center
  float sphereX = cosf(ssAngle) * SPIRAL_RADIUS;
  float sphereZ = sinf(ssAngle) * SPIRAL_RADIUS;
  
  // Fade all LEDs
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    leds[i].fadeToBlackBy(20);
  }
  
  // Light up LEDs within sphere (using actual 3D positions)
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    // Get actual 3D position of LED
    float ledX, ledY, ledZ;
    getLED3DPosition(i, ledX, ledY, ledZ);
    
    float dx = ledX - sphereX;
    float dy = ledY - ssYPosition;
    float dz = ledZ - sphereZ;
    float dist = sqrtf(dx*dx + dy*dy + dz*dz);
    
    if (dist <= SPHERE_RADIUS) {
      float intensity = 1.0f - (dist / SPHERE_RADIUS);
      
      // Fire colors with bright white core
      uint8_t r, g, b;
      if (intensity > 0.7f) {
        // Core: bright white
        r = 255; g = 255; b = 255;
      } else if (intensity > 0.4f) {
        // Middle: yellow to orange
        r = 255; g = 200; b = 50;
      } else {
        // Outer: orange to red
        r = 255; 
        g = (uint8_t)(80 * intensity / 0.4f); 
        b = 0;
      }
      
      // Apply intensity without dimming too much to keep it bright
      leds[i].r = min(255, (int)(r * intensity));
      leds[i].g = min(255, (int)(g * intensity));
      leds[i].b = min(255, (int)(b * intensity));
    }
  }
}

// Fireworks - spherical explosions that expand and contract in 3D space
void fireworksAnim() {
  const uint16_t SPAWN_INTERVAL = 20; // Spawn new firework every 20 frames (matches JS)
  
  fwFrameCounter++;
  
  // Spawn new firework
  if (fwFrameCounter >= SPAWN_INTERVAL) {
    fwFrameCounter = 0;
    for (uint8_t i = 0; i < MAX_FIREWORKS; i++) {
      if (!fireworks[i].active) {
        // Random position within shape bounds (-13 to 13 for X, -17.5 to 17.5 for Y, -15 to 15 for Z)
        fireworks[i].centerX = random(-13, 14);
        fireworks[i].centerY = random(-18, 18);
        fireworks[i].centerZ = random(-15, 16);
        fireworks[i].radius = 0.0f;
        fireworks[i].maxRadius = 20.0f + random(0, 16);
        fireworks[i].speed = 0.8f + (random(0, 41) / 100.0f); // 0.8 to 1.2
        fireworks[i].phase = 0; // 0 = expanding, 1 = contracting
        fireworks[i].intensity = 1.0f;
        fireworks[i].color = CHSV(random(256), 255, 128); // HSV color
        fireworks[i].active = true;
        break;
      }
    }
  }
  
  // Fade all LEDs (fade speed 8 to match JS)
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    leds[i].fadeToBlackBy(8);
  }
  
  // Update and render fireworks
  for (uint8_t f = 0; f < MAX_FIREWORKS; f++) {
    if (!fireworks[f].active) continue;
    
    if (fireworks[f].phase == 0) {
      // Expanding phase
      fireworks[f].radius += fireworks[f].speed;
      if (fireworks[f].radius >= fireworks[f].maxRadius) {
        fireworks[f].phase = 1; // Switch to contracting
      }
    } else {
      // Contracting phase
      fireworks[f].radius -= fireworks[f].speed * 1.5f;
      fireworks[f].intensity -= 0.05f;
      
      if (fireworks[f].radius <= 0.0f || fireworks[f].intensity <= 0.0f) {
        fireworks[f].active = false;
        continue;
      }
    }
    
    // Apply to LEDs using actual 3D positions
    for (uint16_t i = 0; i < NUM_LEDS; i++) {
      float ledX, ledY, ledZ;
      getLED3DPosition(i, ledX, ledY, ledZ);
      
      float dx = ledX - fireworks[f].centerX;
      float dy = ledY - fireworks[f].centerY;
      float dz = ledZ - fireworks[f].centerZ;
      float dist = sqrtf(dx*dx + dy*dy + dz*dz);
      
      // Check if LED is within the explosion sphere shell
      const float shellThickness = 8.0f;
      if (dist >= fireworks[f].radius - shellThickness && 
          dist <= fireworks[f].radius + shellThickness) {
        
        // Calculate intensity based on distance from shell center
        float distFromShell = fabsf(dist - fireworks[f].radius);
        float intensity = (1.0f - distFromShell / shellThickness) * fireworks[f].intensity;
        
        // Mix color with white based on intensity (smaller white core)
        float whiteMix = pow(intensity, 3.0f) * 0.5f; // Cubic curve
        
        CRGB color = fireworks[f].color;
        uint8_t r = (color.r * (1.0f - whiteMix) + 255 * whiteMix) * intensity;
        uint8_t g = (color.g * (1.0f - whiteMix) + 255 * whiteMix) * intensity;
        uint8_t b = (color.b * (1.0f - whiteMix) + 255 * whiteMix) * intensity;
        
        leds[i].r = min(255, leds[i].r + r);
        leds[i].g = min(255, leds[i].g + g);
        leds[i].b = min(255, leds[i].b + b);
      }
    }
  }
}

// Edge Walker - single walker following graph structure
void edgeWalker() {
  // Walker structure
  struct Walker {
    uint8_t currentEdgeId;
    float ledPositionInEdge;
    float speed;
    uint8_t previousNodeId;
    uint8_t tailLength;
  };
  
  static Walker walker;
  static bool initialized = false;
  
  // Edge data structure (reuse from Multi Walker)
  struct EdgeData {
    uint8_t fromNode;
    uint8_t toNode;
    uint16_t startLED;
    uint8_t ledCount;
  };
  
  const EdgeData edges[18] = {
    {0, 6, 0, 48},       // Edge 0: A->G
    {6, 7, 48, 49},      // Edge 1: G->H
    {7, 1, 97, 49},      // Edge 2: H->B
    {1, 8, 146, 49},     // Edge 3: B->I
    {8, 2, 195, 49},     // Edge 4: I->C
    {2, 9, 244, 50},     // Edge 5: C->J
    {9, 3, 294, 49},     // Edge 6: J->D
    {3, 10, 343, 48},    // Edge 7: D->K
    {10, 4, 391, 49},    // Edge 8: K->E
    {4, 11, 440, 48},    // Edge 9: E->L
    {11, 6, 488, 49},    // Edge 10: L->G
    {11, 5, 537, 49},    // Edge 11: L->F
    {5, 4, 586, 48},     // Edge 12: F->E
    {4, 3, 634, 49},     // Edge 13: E->D
    {3, 2, 683, 49},     // Edge 14: D->C
    {2, 1, 732, 49},     // Edge 15: C->B
    {1, 0, 781, 49},     // Edge 16: B->A
    {0, 5, 830, 57}      // Edge 17: A->F
  };
  
  // Node connections
  const uint8_t nodeEdges[12][6] = {
    {0, 16, 17, 255, 255, 255},       // A
    {2, 3, 15, 16, 255, 255},         // B
    {4, 5, 14, 15, 255, 255},         // C
    {6, 7, 13, 14, 255, 255},         // D
    {8, 9, 12, 13, 255, 255},         // E
    {11, 12, 17, 255, 255, 255},      // F
    {0, 1, 10, 255, 255, 255},        // G
    {1, 2, 255, 255, 255, 255},       // H
    {3, 4, 255, 255, 255, 255},       // I
    {5, 6, 255, 255, 255, 255},       // J
    {7, 8, 255, 255, 255, 255},       // K
    {9, 10, 11, 255, 255, 255}        // L
  };
  
  if (!initialized) {
    walker.currentEdgeId = 0;
    walker.ledPositionInEdge = 0;
    walker.speed = 2.0f;
    walker.previousNodeId = edges[0].fromNode;
    walker.tailLength = 15;
    initialized = true;
  }
  
  // Fade all LEDs
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    leds[i].fadeToBlackBy(10);
  }
  
  const EdgeData &currentEdge = edges[walker.currentEdgeId];
  uint8_t fromNode = currentEdge.fromNode;
  uint8_t toNode = currentEdge.toNode;
  uint16_t startLED = currentEdge.startLED;
  uint8_t ledCount = currentEdge.ledCount;
  
  // Only draw walker if it's sufficiently into the edge (prevents teleport appearance)
  float fadeMargin = 2.0f;
  bool shouldDraw = false;
  
  if (walker.speed > 0) {
    // Moving forward: only draw if we've moved in from position 0
    shouldDraw = (walker.ledPositionInEdge >= fadeMargin);
  } else {
    // Moving backward: only draw if we've moved in from position ledCount-1
    shouldDraw = (walker.ledPositionInEdge <= (ledCount - 1 - fadeMargin));
  }
  
  if (shouldDraw) {
    
    // Draw tail
    int8_t tailDirection = (walker.speed > 0) ? -1 : 1;
    for (uint8_t i = 0; i < walker.tailLength; i++) {
      float tailPos = walker.ledPositionInEdge + (tailDirection * i);
      
      if (tailPos >= 0 && tailPos < ledCount) {
        int16_t ledIdx = startLED + (int16_t)tailPos;
        float intensity = 1.0f - ((float)i / walker.tailLength);
        leds[ledIdx].r = max(leds[ledIdx].r, (uint8_t)(255 * intensity));
        leds[ledIdx].g = max(leds[ledIdx].g, (uint8_t)(100 * intensity));
        leds[ledIdx].b = max(leds[ledIdx].b, (uint8_t)(200 * intensity));
      }
    }
  }
  
  // Move walker
  walker.ledPositionInEdge += walker.speed;
  
  // Check if reached end of edge
  if (walker.ledPositionInEdge >= ledCount || walker.ledPositionInEdge < 0) {
    // Determine which node we reached
    uint8_t reachedNodeId = (walker.previousNodeId == fromNode) ? toNode : fromNode;
    
    // Get available edges from this node
    uint8_t availableEdges[6];
    uint8_t availableCount = 0;
    
    for (uint8_t i = 0; i < 6; i++) {
      uint8_t edgeId = nodeEdges[reachedNodeId][i];
      if (edgeId != 255 && edgeId != walker.currentEdgeId) {
        availableEdges[availableCount++] = edgeId;
      }
    }
    
    // Pick random next edge
    if (availableCount > 0) {
      uint8_t nextEdgeId = availableEdges[random(availableCount)];
      const EdgeData &nextEdge = edges[nextEdgeId];
      walker.currentEdgeId = nextEdgeId;
      walker.previousNodeId = reachedNodeId;
      
      // Determine direction on new edge
      if (reachedNodeId == nextEdge.toNode) {
        walker.ledPositionInEdge = nextEdge.ledCount - 1;
        walker.speed = -abs(walker.speed);
      } else {
        walker.ledPositionInEdge = 0;
        walker.speed = abs(walker.speed);
      }
    }
  }
}

// Multi Walker - 10 walkers following graph structure
void multiWalker() {
  // Walker structure
  struct Walker {
    uint8_t currentEdgeId;
    float ledPositionInEdge;
    float speed;
    uint8_t previousNodeId;
    uint8_t tailLength;
    CRGB color;
  };
  
  static Walker walkers[10];
  static bool initialized = false;
  
  // Edge data structure
  struct EdgeData {
    uint8_t fromNode;
    uint8_t toNode;
    uint16_t startLED;
    uint8_t ledCount;
  };
  
  const EdgeData edges[18] = {
    {0, 6, 0, 48},       // Edge 0: A->G
    {6, 7, 48, 49},      // Edge 1: G->H
    {7, 1, 97, 49},      // Edge 2: H->B
    {1, 8, 146, 49},     // Edge 3: B->I
    {8, 2, 195, 49},     // Edge 4: I->C
    {2, 9, 244, 50},     // Edge 5: C->J
    {9, 3, 294, 49},     // Edge 6: J->D
    {3, 10, 343, 48},    // Edge 7: D->K
    {10, 4, 391, 49},    // Edge 8: K->E
    {4, 11, 440, 48},    // Edge 9: E->L
    {11, 6, 488, 49},    // Edge 10: L->G
    {11, 5, 537, 49},    // Edge 11: L->F
    {5, 4, 586, 48},     // Edge 12: F->E
    {4, 3, 634, 49},     // Edge 13: E->D
    {3, 2, 683, 49},     // Edge 14: D->C
    {2, 1, 732, 49},     // Edge 15: C->B
    {1, 0, 781, 49},     // Edge 16: B->A
    {0, 5, 830, 57}      // Edge 17: A->F
  };
  
  // Node connections: list of connected edge IDs for each node (0-11 = A-L)
  const uint8_t nodeEdges[12][6] = {
    {0, 16, 17, 255, 255, 255},       // A: edges 0, 16, 17
    {2, 3, 15, 16, 255, 255},         // B: edges 2, 3, 15, 16
    {4, 5, 14, 15, 255, 255},         // C: edges 4, 5, 14, 15
    {6, 7, 13, 14, 255, 255},         // D: edges 6, 7, 13, 14
    {8, 9, 12, 13, 255, 255},         // E: edges 8, 9, 12, 13
    {11, 12, 17, 255, 255, 255},      // F: edges 11, 12, 17
    {0, 1, 10, 255, 255, 255},        // G: edges 0, 1, 10
    {1, 2, 255, 255, 255, 255},       // H: edges 1, 2
    {3, 4, 255, 255, 255, 255},       // I: edges 3, 4
    {5, 6, 255, 255, 255, 255},       // J: edges 5, 6
    {7, 8, 255, 255, 255, 255},       // K: edges 7, 8
    {9, 10, 11, 255, 255, 255}        // L: edges 9, 10, 11
  };
  
  if (!initialized) {
    for (uint8_t i = 0; i < 10; i++) {
      uint8_t randomEdge = random(18);
      const EdgeData &edge = edges[randomEdge];
      
      // Randomly choose direction: 0 = from->to, 1 = to->from
      bool goingBackward = random(2);
      
      walkers[i].currentEdgeId = randomEdge;
      walkers[i].tailLength = 8;
      walkers[i].color = CHSV((i * 256 / 10), 255, 255);
      
      if (goingBackward) {
        // Moving from toNode to fromNode (backwards through LED indices)
        walkers[i].ledPositionInEdge = edge.ledCount - 1;
        walkers[i].speed = -(0.3f + (float)random(70) / 100.0f);
        walkers[i].previousNodeId = edge.toNode;
      } else {
        // Moving from fromNode to toNode (forwards through LED indices)
        walkers[i].ledPositionInEdge = 0;
        walkers[i].speed = 0.3f + (float)random(70) / 100.0f;
        walkers[i].previousNodeId = edge.fromNode;
      }
    }
    initialized = true;
  }
  
  // Fade all LEDs
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    leds[i].fadeToBlackBy(20);
  }
  
  // Update and draw each walker
  for (uint8_t w = 0; w < 10; w++) {
    Walker &walker = walkers[w];
    
    const EdgeData &currentEdge = edges[walker.currentEdgeId];
    uint8_t fromNode = currentEdge.fromNode;
    uint8_t toNode = currentEdge.toNode;
    uint16_t startLED = currentEdge.startLED;
    uint8_t ledCount = currentEdge.ledCount;
    
    // Only draw walker if it's sufficiently into the edge (prevents teleport appearance)
    float fadeMargin = 2.0f;
    bool shouldDraw = false;
    
    if (walker.speed > 0) {
      // Moving forward: only draw if we've moved in from position 0
      shouldDraw = (walker.ledPositionInEdge >= fadeMargin);
    } else {
      // Moving backward: only draw if we've moved in from position ledCount-1
      shouldDraw = (walker.ledPositionInEdge <= (ledCount - 1 - fadeMargin));
    }
    
    if (shouldDraw) {
      
      // Calculate current LED index
      int16_t currentLedIndex = startLED + (int16_t)walker.ledPositionInEdge;
      
      // Draw tail - direction depends on speed sign
      int8_t tailDirection = (walker.speed > 0) ? -1 : 1;  // Tail goes opposite to movement
      for (uint8_t i = 0; i < walker.tailLength; i++) {
        float tailPos = walker.ledPositionInEdge + (tailDirection * i);
        
        // Only draw if tail position is within current edge
        if (tailPos >= 0 && tailPos < ledCount) {
          int16_t ledIdx = startLED + (int16_t)tailPos;
          float intensity = 1.0f - ((float)i / walker.tailLength);
          CRGB color = walker.color;
          color.nscale8((uint8_t)(intensity * 255));
          leds[ledIdx] += color;
        }
      }
    }
    
    // Move walker
    walker.ledPositionInEdge += walker.speed;
    
    // Check if reached end of edge
    if (walker.ledPositionInEdge >= ledCount || walker.ledPositionInEdge < 0) {
      // Determine which node we reached
      uint8_t reachedNodeId = (walker.previousNodeId == fromNode) ? toNode : fromNode;
      
      // Get available edges from this node
      uint8_t availableEdges[6];
      uint8_t availableCount = 0;
      
      for (uint8_t i = 0; i < 6; i++) {
        uint8_t edgeId = nodeEdges[reachedNodeId][i];
        if (edgeId != 255 && edgeId != walker.currentEdgeId) {
          availableEdges[availableCount++] = edgeId;
        }
      }
      
      // Pick random next edge
      if (availableCount > 0) {
        uint8_t nextEdgeId = availableEdges[random(availableCount)];
        const EdgeData &nextEdge = edges[nextEdgeId];
        walker.currentEdgeId = nextEdgeId;
        walker.previousNodeId = reachedNodeId;
        
        // Determine direction on new edge
        if (reachedNodeId == nextEdge.toNode) {
          // Starting from 'to' node, go backwards
          walker.ledPositionInEdge = nextEdge.ledCount - 1;
          walker.speed = -abs(walker.speed);
        } else {
          // Starting from 'from' node, go forwards
          walker.ledPositionInEdge = 0;
          walker.speed = abs(walker.speed);
        }
      }
    }
  }
}

// Color Flood - spreads color from random nodes across the whole shape
void colorFlood() {
  // Node positions for hexagonal cylinder (x, y, z)
  static const float nodePositions[12][3] = {
    {0, -17.5, 15},    // A - bottom
    {13, -17.5, 7.5},  // B - bottom
    {13, -17.5, -7.5}, // C - bottom
    {0, -17.5, -15},   // D - bottom
    {-13, -17.5, -7.5},// E - bottom
    {-13, -17.5, 7.5}, // F - bottom
    {0, 17.5, 15},     // G - top
    {13, 17.5, 7.5},   // H - top
    {13, 17.5, -7.5},  // I - top
    {0, 17.5, -15},    // J - top
    {-13, 17.5, -7.5}, // K - top
    {-13, 17.5, 7.5}   // L - top
  };
  
  static float radius = 0.0f;
  static float maxRadius = 55.0f;  // Approximate max distance * 1.2 for hexagonal cylinder
  static float expandSpeed = 0.92f; // maxRadius / 60 frames
  static CRGB targetColor;
  static uint8_t currentNodeIndex = 0;
  static uint8_t phase = 0; // 0=expanding, 1=holding
  static uint8_t holdCounter = 0;
  
  // Initialize on first call
  static bool initialized = false;
  if (!initialized) {
    currentNodeIndex = random(12);
    targetColor = CHSV(random(256), 255, 128);
    initialized = true;
  }
  
  // State machine
  if (phase == 0) { // Expanding
    radius += expandSpeed;
    if (radius >= maxRadius) {
      phase = 1;
      holdCounter = 30; // Hold for 30 frames
    }
  } else { // Holding
    holdCounter--;
    if (holdCounter == 0) {
      // Pick new random node and color
      currentNodeIndex = random(12);
      targetColor = CHSV(random(256), 255, 128);
      radius = 0.0f;
      phase = 0;
    }
  }
  
  // Get current node position
  float nodeX = nodePositions[currentNodeIndex][0];
  float nodeY = nodePositions[currentNodeIndex][1];
  float nodeZ = nodePositions[currentNodeIndex][2];
  
  // Apply color gradient based on 3D distance from current node
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    // Get LED 3D position
    float ledX, ledY, ledZ;
    getLED3DPosition(i, ledX, ledY, ledZ);
    
    // Calculate 3D distance from node
    float dx = ledX - nodeX;
    float dy = ledY - nodeY;
    float dz = ledZ - nodeZ;
    float distance = sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance <= radius) {
      // Calculate gradient intensity
      float intensity = 1.0f - (distance / radius);
      float smoothIntensity = intensity * intensity; // Quadratic for smoother gradient
      
      // Blend with current color
      uint8_t blend = (uint8_t)(smoothIntensity * 255);
      leds[i].r = lerp8by8(leds[i].r, targetColor.r, blend);
      leds[i].g = lerp8by8(leds[i].g, targetColor.g, blend);
      leds[i].b = lerp8by8(leds[i].b, targetColor.b, blend);
    }
  }
}

// Rainbow Flood - spreads rainbow from random nodes, hue changes with distance
void rainbowFlood() {
  // Node positions for hexagonal cylinder (x, y, z)
  static const float nodePositions[12][3] = {
    {0, -17.5, 15},    // A - bottom
    {13, -17.5, 7.5},  // B - bottom
    {13, -17.5, -7.5}, // C - bottom
    {0, -17.5, -15},   // D - bottom
    {-13, -17.5, -7.5},// E - bottom
    {-13, -17.5, 7.5}, // F - bottom
    {0, 17.5, 15},     // G - top
    {13, 17.5, 7.5},   // H - top
    {13, 17.5, -7.5},  // I - top
    {0, 17.5, -15},    // J - top
    {-13, 17.5, -7.5}, // K - top
    {-13, 17.5, 7.5}   // L - top
  };
  
  static float radius = 0.0f;
  static float maxRadius = 55.0f;  // Approximate max distance * 1.2 for hexagonal cylinder
  static float expandSpeed = 0.92f; // maxRadius / 60 frames
  static uint8_t startHue = 0;
  static uint8_t currentNodeIndex = 0;
  static uint8_t phase = 0; // 0=expanding, 1=holding
  static uint8_t holdCounter = 0;
  
  // Initialize on first call
  static bool initialized = false;
  if (!initialized) {
    currentNodeIndex = random(12);
    startHue = random(256);
    initialized = true;
  }
  
  // State machine
  if (phase == 0) { // Expanding
    radius += expandSpeed;
    if (radius >= maxRadius) {
      phase = 1;
      holdCounter = 30; // Hold for 30 frames
    }
  } else { // Holding
    holdCounter--;
    if (holdCounter == 0) {
      // Pick new random node and starting hue
      currentNodeIndex = random(12);
      startHue = random(256);
      radius = 0.0f;
      phase = 0;
    }
  }
  
  // Get current node position
  float nodeX = nodePositions[currentNodeIndex][0];
  float nodeY = nodePositions[currentNodeIndex][1];
  float nodeZ = nodePositions[currentNodeIndex][2];
  
  // Apply rainbow gradient based on 3D distance from current node
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    // Get LED 3D position
    float ledX, ledY, ledZ;
    getLED3DPosition(i, ledX, ledY, ledZ);
    
    // Calculate 3D distance from node
    float dx = ledX - nodeX;
    float dy = ledY - nodeY;
    float dz = ledZ - nodeZ;
    float distance = sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance <= radius) {
      // Calculate gradient intensity
      float intensity = 1.0f - (distance / radius);
      float smoothIntensity = intensity * intensity; // Quadratic for smoother gradient
      
      // Calculate hue based on distance (progresses around color wheel)
      float normalizedDist = distance / maxRadius;
      uint8_t hue = startHue + (uint8_t)(normalizedDist * 255.0f);
      CRGB targetColor = CHSV(hue, 255, 128);
      
      // Blend with current color
      uint8_t blend = (uint8_t)(smoothIntensity * 255);
      leds[i].r = lerp8by8(leds[i].r, targetColor.r, blend);
      leds[i].g = lerp8by8(leds[i].g, targetColor.g, blend);
      leds[i].b = lerp8by8(leds[i].b, targetColor.b, blend);
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get full 3D position of an LED
void getLED3DPosition(uint16_t ledIndex, float& x, float& y, float& z) {
  // Node positions for hexagonal cylinder
  const float nodeX[12] = {0, 13, 13, 0, -13, -13, 0, 13, 13, 0, -13, -13};
  const float nodeY[12] = {-17.5, -17.5, -17.5, -17.5, -17.5, -17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5};
  const float nodeZ[12] = {15, 7.5, -7.5, -15, -7.5, 7.5, 15, 7.5, -7.5, -15, -7.5, 7.5};
  // Indices:            A    B     C     D     E     F    G    H     I     J     K     L
  
  // Edge definitions: from, to, ledCount
  const uint8_t edges[18][3] = {
    {0, 6, 48},   // A->G
    {6, 7, 49},   // G->H
    {7, 1, 49},   // H->B
    {1, 8, 49},   // B->I
    {8, 2, 49},   // I->C
    {2, 9, 50},   // C->J
    {9, 3, 49},   // J->D
    {3, 10, 48},  // D->K
    {10, 4, 49},  // K->E
    {4, 11, 48},  // E->L
    {11, 6, 49},  // L->G
    {11, 5, 49},  // L->F
    {5, 4, 48},   // F->E
    {4, 3, 49},   // E->D
    {3, 2, 49},   // D->C
    {2, 1, 49},   // C->B
    {1, 0, 49},   // B->A
    {0, 5, 57}    // A->F
  };
  
  uint16_t idx = ledIndex;
  
  // Find which edge this LED is on
  for (uint8_t edge = 0; edge < 18; edge++) {
    uint8_t fromNode = edges[edge][0];
    uint8_t toNode = edges[edge][1];
    uint8_t count = edges[edge][2];
    
    if (idx < count) {
      // Interpolate between from and to nodes
      float t = (float)idx / (float)count;
      x = nodeX[fromNode] + t * (nodeX[toNode] - nodeX[fromNode]);
      y = nodeY[fromNode] + t * (nodeY[toNode] - nodeY[fromNode]);
      z = nodeZ[fromNode] + t * (nodeZ[toNode] - nodeZ[fromNode]);
      return;
    }
    idx -= count;
  }
  
  // Fallback if index out of range
  x = y = z = 0;
}

float getLEDYPosition(uint16_t ledIndex) {
  const float HEIGHT = 35.0f;
  const float MIN_Y = -HEIGHT / 2.0f;
  const float MAX_Y = HEIGHT / 2.0f;
  
  // Path: A->G->H->B->I->C->J->D->K->E->L->G->L->F->E->D->C->B->A->F
  // 18 edges with VERIFIED LED counts = 888 total LEDs
  // Edge counts: 48,49,49,49,49,50,49,48,49,48,49,49,48,49,49,49,49,57
  
  uint16_t idx = ledIndex;
  
  // Edge 0: A->G (0-47) - 48 LEDs - vertical up [VERIFIED]
  if (idx < 48) {
    return MIN_Y + ((float)idx / 48.0f) * HEIGHT;
  }
  idx -= 48;
  
  // Edge 1: G->H (48-96) - 49 LEDs - top ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MAX_Y;
  }
  idx -= 49;
  
  // Edge 2: H->B (97-145) - 49 LEDs - vertical down [VERIFIED]
  if (idx < 49) {
    return MAX_Y - ((float)idx / 49.0f) * HEIGHT;
  }
  idx -= 49;
  
  // Edge 3: B->I (146-194) - 49 LEDs - top ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MAX_Y;
  }
  idx -= 49;
  
  // Edge 4: I->C (195-243) - 49 LEDs - vertical down [VERIFIED]
  if (idx < 49) {
    return MAX_Y - ((float)idx / 49.0f) * HEIGHT;
  }
  idx -= 49;
  
  // Edge 5: C->J (244-293) - 50 LEDs - top ring (horizontal) [VERIFIED]
  if (idx < 50) {
    return MAX_Y;
  }
  idx -= 50;
  
  // Edge 6: J->D (294-342) - 49 LEDs - vertical down [VERIFIED]
  if (idx < 49) {
    return MAX_Y - ((float)idx / 49.0f) * HEIGHT;
  }
  idx -= 49;
  
  // Edge 7: D->K (343-390) - 48 LEDs - top ring (horizontal) [VERIFIED - has faulty LED]
  if (idx < 48) {
    return MAX_Y;
  }
  idx -= 48;
  
  // Edge 8: K->E (391-439) - 49 LEDs - vertical down [VERIFIED]
  if (idx < 49) {
    return MAX_Y - ((float)idx / 49.0f) * HEIGHT;
  }
  idx -= 49;
  
  // Edge 9: E->L (440-487) - 48 LEDs - top ring (horizontal) [VERIFIED]
  if (idx < 48) {
    return MAX_Y;
  }
  idx -= 48;
  
  // Edge 10: L->G (488-536) - 49 LEDs - top ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MAX_Y;
  }
  idx -= 49;
  
  // Edge 11: L->F (537-585) - 49 LEDs - vertical down [VERIFIED - has faulty LED]
  if (idx < 49) {
    return MAX_Y - ((float)idx / 49.0f) * HEIGHT;
  }
  idx -= 49;
  
  // Edge 12: F->E (586-633) - 48 LEDs - bottom ring (horizontal) [VERIFIED]
  if (idx < 48) {
    return MIN_Y;
  }
  idx -= 48;
  
  // Edge 13: E->D (634-682) - 49 LEDs - bottom ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MIN_Y;
  }
  idx -= 49;
  
  // Edge 14: D->C (683-731) - 49 LEDs - bottom ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MIN_Y;
  }
  idx -= 49;
  
  // Edge 15: C->B (732-780) - 49 LEDs - bottom ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MIN_Y;
  }
  idx -= 49;
  
  // Edge 16: B->A (781-829) - 49 LEDs - bottom ring (horizontal) [VERIFIED]
  if (idx < 49) {
    return MIN_Y;
  }
  idx -= 49;
  
  // Edge 17: A->F (830-886) - 57 LEDs - bottom ring (horizontal) [VERIFIED]
  if (idx < 57) {
    return MIN_Y;
  }
  
  return MIN_Y; // Fallback
}
