/**
 * Hexagonal Cylinder LED Controller
 * Uses FastLED library to control 595 LEDs arranged in a hexagonal cylinder
 * Potentiometer on A0 selects animation pattern
 * 
 * Hardware:
 * - 595 WS2812B LEDs (or similar FastLED compatible)
 * - Potentiometer connected to A0 (with pullup/pulldown)
 * - Data pin: D6
 * 
 * Shape: Hexagonal Cylinder
 * - 17 edges × 35 LEDs per edge = 595 LEDs total
 * - Path: A->G->H->B->I->C->J->D->K->E->L->F->E->D->C->B->A->F
 */

#include <FastLED.h>

// LED Configuration
#define NUM_LEDS 595
#define DATA_PIN 6
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB
#define BRIGHTNESS 128
#define FRAMES_PER_SECOND 60

// Potentiometer Configuration
#define POT_PIN A0
#define NUM_PATTERNS 6

// LED array
CRGB leds[NUM_LEDS];

// Animation state
uint32_t frameCounter = 0;
uint8_t currentPattern = 0;
uint8_t lastPattern = 255;

// Potentiometer smoothing
const int numReadings = 10;
int readings[numReadings];
int readIndex = 0;
int total = 0;

// Animation-specific state variables
// Knight Rider 3D
float krYPosition = 17.5;
int8_t krDirection = -1;
uint8_t krWaitCounter = 0;

// Heartbeat
uint16_t hbFrameCounter = 0;

// Edge Flash
uint8_t efFrameCounter = 0;
uint8_t efNextFlashIn = 10;

void setup() {
  Serial.begin(115200);
  Serial.println(F("Hexagonal Cylinder LED Controller"));
  Serial.println(F("================================="));
  
  // Initialize FastLED
  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
  FastLED.setBrightness(BRIGHTNESS);
  
  // Initialize potentiometer readings
  for (int i = 0; i < numReadings; i++) {
    readings[i] = 0;
  }
  
  Serial.println(F("Setup complete!"));
  Serial.println(F("Pattern 0: Rainbow Wave"));
  Serial.println(F("Pattern 1: Running Lights"));
  Serial.println(F("Pattern 2: Knight Rider 3D"));
  Serial.println(F("Pattern 3: Heartbeat"));
  Serial.println(F("Pattern 4: Edge Flash"));
  Serial.println(F("Pattern 5: Breathing"));
}

void loop() {
  // Read potentiometer with smoothing
  total = total - readings[readIndex];
  readings[readIndex] = analogRead(POT_PIN);
  total = total + readings[readIndex];
  readIndex = (readIndex + 1) % numReadings;
  int average = total / numReadings;
  
  // Map to pattern number
  currentPattern = map(average, 0, 1023, 0, NUM_PATTERNS - 1);
  currentPattern = constrain(currentPattern, 0, NUM_PATTERNS - 1);
  
  // Debug logging when pattern changes
  if (currentPattern != lastPattern) {
    Serial.print(F("Switching to pattern "));
    Serial.print(currentPattern);
    Serial.print(F(": "));
    
    switch(currentPattern) {
      case 0: Serial.println(F("Rainbow Wave")); break;
      case 1: Serial.println(F("Running Lights")); break;
      case 2: Serial.println(F("Knight Rider 3D")); break;
      case 3: Serial.println(F("Heartbeat")); break;
      case 4: Serial.println(F("Edge Flash")); break;
      case 5: Serial.println(F("Breathing")); break;
    }
    
    lastPattern = currentPattern;
    frameCounter = 0; // Reset frame counter on pattern change
    
    // Reset pattern-specific state
    krYPosition = 17.5;
    krDirection = -1;
    krWaitCounter = 0;
    hbFrameCounter = 0;
    efFrameCounter = 0;
    efNextFlashIn = 10;
  }
  
  // Run current pattern
  switch(currentPattern) {
    case 0: rainbowWave(); break;
    case 1: runningLights(); break;
    case 2: knightRider3D(); break;
    case 3: heartbeat(); break;
    case 4: edgeFlash(); break;
    case 5: breathing(); break;
  }
  
  FastLED.show();
  FastLED.delay(1000 / FRAMES_PER_SECOND);
  frameCounter++;
}

// ============================================================================
// ANIMATION PATTERNS - Ported from simulator
// ============================================================================

// Pattern 0: Rainbow Wave
// Exact port from: rainbowWave animation
void rainbowWave() {
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    // const hue = (index / shape.totalLEDs + frame * 0.01) % 1.0;
    float hue = (float)i / (float)NUM_LEDS + (float)frameCounter * 0.01;
    hue = hue - (int)hue; // modulo 1.0
    
    // Convert 0-1 hue to 0-255 for FastLED
    uint8_t hue8 = (uint8_t)(hue * 255);
    leds[i] = CHSV(hue8, 255, 255);
  }
}

// Pattern 1: Running Lights
// Exact port from: runningLights animation
void runningLights() {
  // const position = (frame * 0.5) % shape.totalLEDs;
  float position = fmod((float)frameCounter * 0.5, (float)NUM_LEDS);
  
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    // const distance = Math.abs(index - position);
    float distance = abs((float)i - position);
    
    // const wrappedDistance = Math.min(distance, shape.totalLEDs - distance);
    float wrappedDistance = min(distance, (float)NUM_LEDS - distance);
    
    // const intensity = Math.max(0, 1 - wrappedDistance / 5);
    float intensity = max(0.0, 1.0 - wrappedDistance / 5.0);
    
    // led.color.r = Math.floor(intensity * 255);
    // led.color.g = Math.floor(intensity * 50);
    // led.color.b = Math.floor(intensity * 50);
    leds[i].r = (uint8_t)(intensity * 255);
    leds[i].g = (uint8_t)(intensity * 50);
    leds[i].b = (uint8_t)(intensity * 50);
  }
}

// Pattern 2: Knight Rider 3D
// Exact port from: knightRider3D animation
void knightRider3D() {
  const float HEIGHT = 35.0;
  const float MIN_Y = -HEIGHT / 2.0;
  const float MAX_Y = HEIGHT / 2.0;
  const float Y_RANGE = max(HEIGHT, 10.0); // Ensure minimum range of 10
  const float SPEED = Y_RANGE / 30.0;
  const float GRADIENT_WIDTH = Y_RANGE / 4.0;
  const uint8_t WAIT_FRAMES = 5;
  
  // If waiting, don't move
  if (krWaitCounter > 0) {
    krWaitCounter--;
  } else {
    // Move the Y position
    krYPosition += SPEED * krDirection;
    
    // Check if we've reached the end
    if (krDirection == -1 && krYPosition <= MIN_Y) {
      // Reached bottom
      krYPosition = MIN_Y;
      krDirection = 1;
      krWaitCounter = WAIT_FRAMES;
    } else if (krDirection == 1 && krYPosition >= MAX_Y) {
      // Reached top
      krYPosition = MAX_Y;
      krDirection = -1;
      krWaitCounter = WAIT_FRAMES;
    }
  }
  
  // Apply gradient to all LEDs based on their Y position
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    float ledY = getLEDYPosition(i);
    float distance = abs(ledY - krYPosition);
    
    if (distance < GRADIENT_WIDTH) {
      // Calculate intensity based on distance
      float intensity = 1.0 - (distance / GRADIENT_WIDTH);
      
      leds[i].r = (uint8_t)(255 * intensity);
      leds[i].g = (uint8_t)(50 * intensity);
      leds[i].b = (uint8_t)(50 * intensity);
    } else {
      // Fade out
      leds[i].r = max(0, leds[i].r - 15);
      leds[i].g = max(0, leds[i].g - 15);
      leds[i].b = max(0, leds[i].b - 15);
    }
  }
}

// Pattern 3: Heartbeat
// Exact port from: heartbeat animation
void heartbeat() {
  const uint16_t BEAT_CYCLE = 120;
  const uint8_t BEAT1_START = 0;
  const uint8_t BEAT1_DURATION = 12;
  const float BEAT1_PEAK = 1.0;
  const uint8_t BEAT2_START = 20;
  const uint8_t BEAT2_DURATION = 10;
  const float BEAT2_PEAK = 0.7;
  
  hbFrameCounter = (hbFrameCounter + 1) % BEAT_CYCLE;
  
  // Calculate current intensity based on heartbeat pattern
  float intensity = 0.05; // Baseline
  
  // First beat (LUB) - stronger, red
  if (hbFrameCounter >= BEAT1_START && hbFrameCounter < BEAT1_START + BEAT1_DURATION) {
    float progress = (float)(hbFrameCounter - BEAT1_START) / (float)BEAT1_DURATION;
    // Use sine wave for smooth pulse
    intensity = sin(progress * PI) * BEAT1_PEAK;
  }
  // Second beat (DUB) - softer, pink
  else if (hbFrameCounter >= BEAT2_START && hbFrameCounter < BEAT2_START + BEAT2_DURATION) {
    float progress = (float)(hbFrameCounter - BEAT2_START) / (float)BEAT2_DURATION;
    intensity = sin(progress * PI) * BEAT2_PEAK;
  }
  
  // Color varies with intensity - red when strong, pink when softer
  float pinkMix = 1.0 - intensity; // More pink when less intense
  
  // Calculate colors
  uint8_t r = (uint8_t)(255 * intensity);
  uint8_t g = (uint8_t)(100 * pinkMix * intensity); // Add green for pink
  uint8_t b = (uint8_t)(120 * pinkMix * intensity); // Add blue for pink
  
  // Apply to all LEDs
  fill_solid(leds, NUM_LEDS, CRGB(r, g, b));
}

// Pattern 4: Edge Flash
// Simplified port from: edgeFlash animation (without full state management)
void edgeFlash() {
  // Fade all LEDs
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    leds[i].r = max(0, leds[i].r - 15);
    leds[i].g = max(0, leds[i].g - 15);
    leds[i].b = max(0, leds[i].b - 15);
  }
  
  efFrameCounter++;
  
  // Check if it's time to trigger a new flash
  if (efFrameCounter >= efNextFlashIn) {
    efFrameCounter = 0;
    efNextFlashIn = random(5, 20); // Random interval between 5-20 frames
    
    // Pick a random edge (0-16, 17 edges total)
    uint8_t edge = random(17);
    
    // Random color
    uint8_t hue = random(256);
    
    // Flash all LEDs in the edge
    for (uint8_t i = 0; i < 35; i++) {
      uint16_t ledIndex = edge * 35 + i;
      if (ledIndex < NUM_LEDS) {
        // Add white core for brightness
        CRGB color = CHSV(hue, 255, 255);
        // Mix with white (30%)
        leds[ledIndex].r = min(255, color.r * 0.7 + 255 * 0.3);
        leds[ledIndex].g = min(255, color.g * 0.7 + 255 * 0.3);
        leds[ledIndex].b = min(255, color.b * 0.7 + 255 * 0.3);
      }
    }
  }
}

// Pattern 5: Breathing Spheres (simplified - whole structure breathes in color)
// Simplified from breathingSpheres (memory constraints prevent full sphere calculations)
void breathing() {
  const uint16_t BREATH_CYCLE = 460;
  const uint16_t EXPAND_FRAMES = 100;
  const uint16_t HOLD_FRAMES = 180;
  const uint16_t CONTRACT_FRAMES = 100;
  
  uint16_t cyclePos = frameCounter % BREATH_CYCLE;
  
  float intensity;
  if (cyclePos < EXPAND_FRAMES) {
    // Expanding phase - ease in/out
    float progress = (float)cyclePos / (float)EXPAND_FRAMES;
    intensity = 0.5 - 0.5 * cos(progress * PI);
  } else if (cyclePos < EXPAND_FRAMES + HOLD_FRAMES) {
    // Hold at max
    intensity = 1.0;
  } else if (cyclePos < EXPAND_FRAMES + HOLD_FRAMES + CONTRACT_FRAMES) {
    // Contracting phase
    float progress = (float)(cyclePos - EXPAND_FRAMES - HOLD_FRAMES) / (float)CONTRACT_FRAMES;
    intensity = 0.5 + 0.5 * cos(progress * PI);
  } else {
    // Hold at min
    intensity = 0.0;
  }
  
  // Rotate through colors slowly
  uint8_t hue = (frameCounter / 8) % 256;
  uint8_t brightness = (uint8_t)(200 * intensity);
  
  fill_solid(leds, NUM_LEDS, CHSV(hue, 255, brightness));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get Y position for an LED based on its index
// Matches the hexagonal cylinder path: A->G->H->B->I->C->J->D->K->E->L->G->L->F->E->D->C->B->A->F
float getLEDYPosition(uint16_t ledIndex) {
  const float HEIGHT = 35.0;
  const float MIN_Y = -HEIGHT / 2.0;
  const float MAX_Y = HEIGHT / 2.0;
  
  // Edge 0: A->G (0-34) - bottom to top
  if (ledIndex < 35) {
    return MIN_Y + ((float)ledIndex / 35.0) * HEIGHT;
  }
  // Edge 1: G->H (35-69) - top ring
  else if (ledIndex < 70) {
    return MAX_Y;
  }
  // Edge 2: H->B (70-104) - top to bottom
  else if (ledIndex < 105) {
    return MAX_Y - ((float)(ledIndex - 70) / 35.0) * HEIGHT;
  }
  // Edge 3: B->I (105-139) - bottom to top
  else if (ledIndex < 140) {
    return MIN_Y + ((float)(ledIndex - 105) / 35.0) * HEIGHT;
  }
  // Edge 4: I->C (140-174) - top to bottom
  else if (ledIndex < 175) {
    return MAX_Y - ((float)(ledIndex - 140) / 35.0) * HEIGHT;
  }
  // Edge 5: C->J (175-209) - bottom to top
  else if (ledIndex < 210) {
    return MIN_Y + ((float)(ledIndex - 175) / 35.0) * HEIGHT;
  }
  // Edge 6: J->D (210-244) - top to bottom
  else if (ledIndex < 245) {
    return MAX_Y - ((float)(ledIndex - 210) / 35.0) * HEIGHT;
  }
  // Edge 7: D->K (245-279) - bottom to top
  else if (ledIndex < 280) {
    return MIN_Y + ((float)(ledIndex - 245) / 35.0) * HEIGHT;
  }
  // Edge 8: K->E (280-314) - top to bottom
  else if (ledIndex < 315) {
    return MAX_Y - ((float)(ledIndex - 280) / 35.0) * HEIGHT;
  }
  // Edge 9: E->L (315-349) - bottom to top
  else if (ledIndex < 350) {
    return MIN_Y + ((float)(ledIndex - 315) / 35.0) * HEIGHT;
  }
  // Edge 10: L->G (350-384) - top ring
  else if (ledIndex < 385) {
    return MAX_Y;
  }
  // Edge 11: L->F (385-419) - top to bottom
  else if (ledIndex < 420) {
    return MAX_Y - ((float)(ledIndex - 385) / 35.0) * HEIGHT;
  }
  // Edge 12: F->E (420-454) - bottom ring
  else if (ledIndex < 455) {
    return MIN_Y;
  }
  // Edge 13: E->D (455-489) - bottom ring
  else if (ledIndex < 490) {
    return MIN_Y;
  }
  // Edge 14: D->C (490-524) - bottom ring
  else if (ledIndex < 525) {
    return MIN_Y;
  }
  // Edge 15: C->B (525-559) - bottom ring
  else if (ledIndex < 560) {
    return MIN_Y;
  }
  // Edge 16: B->A (560-594) - bottom ring
  else if (ledIndex < 595) {
    return MIN_Y;
  }
  
  return 0;
}
