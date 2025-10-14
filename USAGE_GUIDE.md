# Usage Guide

Complete guide to using the LED Simulator application.

## Interface Overview

The application has a **three-panel layout**:

```
┌─────────────────────┬─────────────────────┐
│   Shape Editor      │                     │
│   (Top Left)        │                     │
│                     │   3D Visualization  │
├─────────────────────┤   (Right)          │
│   Animation Editor  │                     │
│   (Bottom Left)     │                     │
└─────────────────────┴─────────────────────┘
```

### Shape Editor (Top Left - 40% height)

- **Purpose**: Define the 3D LED strip layout
- **Dropdown**: Select from 7 preset shapes
- **Code Area**: Edit shape definition using the DSL
- **Run Button**: Manually recompile the shape
- **Auto-compile**: Changes compile automatically after 500ms

Available preset shapes:
- **Cube**: 50 LEDs per edge (12 edges, 600 total LEDs)
- **Line**: Simple straight line of 100 LEDs
- **Square**: 2D square outline (50 LEDs per side)
- **Pyramid**: 3D pyramid with base and apex edges
- **Helix**: Spiral with 3 full rotations
- **Star**: 5-pointed star shape
- **Sphere**: Approximated with latitude/longitude lines

### Animation Editor (Bottom Left - 60% height)

- **Purpose**: Write animation patterns
- **Dropdown**: Select from 5 preset animations
- **Code Area**: Edit animation code in JavaScript
- **Run Button**: Manually recompile the animation
- **Auto-compile**: Changes compile automatically after 500ms

Available preset animations:
- **Rainbow Wave**: Cycling rainbow colors across LEDs
- **Pulse**: Breathing effect with blue tint
- **Running Lights**: Chasing red lights
- **Fire Effect**: Simulated fire with random flickering
- **Sparkle**: Random white twinkles that fade

### 3D Visualization (Right - Full height)

- **Black canvas**: Shows LEDs and wireframe guides
- **Mouse controls**:
  - **Left drag**: Rotate camera
  - **Right drag**: Pan camera
  - **Scroll**: Zoom in/out
- **Info panel** (bottom left): Shows shape name, LED count, strip count
- **Error overlay** (top): Shows compilation errors if any

## Quick Start Tutorial

### 1. Exploring Presets

**Try different shapes:**
1. In the Shape Editor dropdown, select "Helix"
2. Watch the visualization update to show a spiral
3. Try "Star", "Sphere", etc.

**Try different animations:**
1. In the Animation Editor dropdown, select "Fire Effect"
2. Watch the LEDs animate with flickering fire
3. Try "Sparkle", "Running Lights", etc.

**Mix and match:**
- Select "Star" shape + "Rainbow Wave" animation
- Select "Sphere" shape + "Pulse" animation
- Any animation works with any shape!

### 2. Editing a Shape

Let's modify the cube to have fewer LEDs:

1. Select **"Cube"** from Shape Editor dropdown
2. In the code, find the line:
   ```javascript
   const shape = createCube(50);
   ```
3. Change `50` to `20`:
   ```javascript
   const shape = createCube(20);
   ```
4. The shape recompiles automatically
5. Notice in the info panel: LED count changes to 240 (20 × 12 edges)

### 3. Creating a Custom Shape

Let's create a simple triangle:

1. In Shape Editor, clear the code and paste:
```javascript
// Triangle in 3D space
const ledsPerEdge = 30;
const strips = [
  createStrip('edge1', { x: -20, y: -15, z: 0 }, { x: 1, y: 0, z: 0 }, ledsPerEdge, 0),
  createStrip('edge2', { x: 20, y: -15, z: 0 }, { x: -0.5, y: 1, z: 0 }, ledsPerEdge, ledsPerEdge),
  createStrip('edge3', { x: -20, y: 15, z: 0 }, { x: 0.5, y: -1, z: 0 }, ledsPerEdge, ledsPerEdge * 2),
];
return buildShape('Triangle', strips);
```
2. Watch it appear in the visualization
3. The animation continues to run on the new shape

### 4. Editing an Animation

Let's modify the Pulse animation to change colors:

1. Select **"Pulse"** from Animation Editor dropdown
2. Find these lines:
   ```javascript
   const r = Math.floor(intensity * 255);
   const g = Math.floor(intensity * 100);
   const b = Math.floor(intensity * 200);
   ```
3. Change to green pulse:
   ```javascript
   const r = Math.floor(intensity * 50);
   const g = Math.floor(intensity * 255);
   const b = Math.floor(intensity * 50);
   ```
4. Watch the LEDs pulse green instead of blue

### 5. Writing a Custom Animation

Let's create a simple wave that travels along LED indices:

1. In Animation Editor, clear the code and paste:
```javascript
// Wave Animation
function animate(leds, time) {
  const wavePosition = (time * 0.1) % leds.length;
  
  leds.forEach((led, index) => {
    const distance = Math.abs(index - wavePosition);
    const wrappedDistance = Math.min(distance, leds.length - distance);
    const intensity = Math.max(0, 1 - wrappedDistance / 10);
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 255);
    led.color.b = 0;
  });
}
```
2. Watch a yellow wave travel around the shape

## Tips and Tricks

### Shape Editor Tips

1. **Always return a shape**: Your code must end with `return buildShape(...)` or `return createCube(...)`

2. **LED indices must be sequential**: 
   ```javascript
   createStrip('strip1', ..., 30, 0),      // starts at 0
   createStrip('strip2', ..., 30, 30),     // starts at 30
   createStrip('strip3', ..., 30, 60),     // starts at 60
   ```

3. **Directions are auto-normalized**: `{x: 10, y: 0, z: 0}` becomes `{x: 1, y: 0, z: 0}`

4. **Scale matters**: Keep coordinates between -50 and +50 for best visibility

5. **Use loops for complex shapes**:
   ```javascript
   const strips = Array.from({ length: 10 }, (_, i) => {
     // Generate strips programmatically
     return createStrip(...);
   });
   ```

### Animation Editor Tips

1. **Access LED properties**:
   ```javascript
   led.position.x, led.position.y, led.position.z  // 3D position
   led.index                                        // Global LED index
   led.localIndex                                   // Index in strip
   led.stripId                                      // Which strip
   ```

2. **Time-based speed**:
   ```javascript
   const slow = time * 0.001;   // Slow animation
   const fast = time * 0.01;    // Fast animation
   ```

3. **Color values are 0-255**:
   ```javascript
   led.color.r = 255;  // Full red
   led.color.g = 128;  // Half green
   led.color.b = 0;    // No blue
   ```

4. **Use helper functions**: Define functions above `animate()`:
   ```javascript
   function hslToRgb(h, s, l) { /* ... */ }
   
   function animate(leds, time) {
     const rgb = hslToRgb(0.5, 1.0, 0.5);
     // ...
   }
   ```

5. **Smooth transitions with sin/cos**:
   ```javascript
   const smooth = (Math.sin(time * 0.003) + 1) / 2;  // 0 to 1
   ```

## Common Patterns

### Gradient Along Y-Axis

```javascript
function animate(leds, time) {
  const minY = Math.min(...leds.map(l => l.position.y));
  const maxY = Math.max(...leds.map(l => l.position.y));
  
  leds.forEach((led) => {
    const t = (led.position.y - minY) / (maxY - minY);
    led.color.r = Math.floor(t * 255);
    led.color.g = Math.floor((1 - t) * 255);
    led.color.b = 128;
  });
}
```

### Rotating Color Wheel

```javascript
function animate(leds, time) {
  leds.forEach((led) => {
    const angle = Math.atan2(led.position.z, led.position.x);
    const hue = (angle / (Math.PI * 2) + time * 0.0001) % 1;
    const rgb = hslToRgb(hue, 1, 0.5);
    led.color.r = rgb.r;
    led.color.g = rgb.g;
    led.color.b = rgb.b;
  });
}
```

### Pulsing Sphere

```javascript
function animate(leds, time) {
  const pulseRadius = Math.sin(time * 0.002) * 20 + 25;
  
  leds.forEach((led) => {
    const dist = Math.sqrt(
      led.position.x ** 2 + 
      led.position.y ** 2 + 
      led.position.z ** 2
    );
    const intensity = Math.abs(dist - pulseRadius) < 3 ? 1 : 0.1;
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 100);
    led.color.b = Math.floor(intensity * 200);
  });
}
```

## Troubleshooting

### Shape not appearing
- Check for syntax errors in the red error box
- Ensure you have a `return` statement
- Verify LED counts are > 0
- Check coordinates are reasonable (-50 to +50)

### Animation not running
- Look for JavaScript errors in the error box
- Ensure you have an `animate` function defined
- Check that you're setting `led.color.r/g/b` values
- Verify values are 0-255

### Performance issues
- Reduce LED count in shape
- Simplify animation calculations
- Avoid nested loops in animations
- Cache calculations outside the LED loop

### Weird camera angle
- Click and drag to rotate
- Use scroll wheel to zoom out
- Right-click and drag to pan

## Keyboard Shortcuts

Monaco editor supports VS Code shortcuts:

- **Ctrl/Cmd + S**: Save (triggers recompile)
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Shift + Z**: Redo
- **Ctrl/Cmd + F**: Find
- **Ctrl/Cmd + H**: Replace
- **Ctrl/Cmd + /**: Toggle comment
- **Alt + Up/Down**: Move line up/down
- **Ctrl/Cmd + D**: Select next occurrence

## Next Steps

1. Read [SHAPE_DSL.md](SHAPE_DSL.md) for detailed shape DSL reference
2. Read [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) for animation examples
3. Experiment with combining different shapes and animations
4. Create your own custom shapes and save the code
5. Share your creations by copying the code!


