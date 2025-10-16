# Animation Guide

This guide explains how to create custom LED animations for the LED Simulator.

## Animation Function Structure

Every animation must define an `animate` function with this signature:

```javascript
function animate(leds, frame, shape) {
  // Your animation logic here
}
```

### Parameters

- **leds**: Array of LED objects, each with:
  - `position`: `{x, y, z}` - 3D coordinates of the LED
  - `color`: `{r, g, b}` - RGB color values (0-255)
  - `index`: Global LED index in the entire shape
  - `localIndex`: Index within its strip
  - `stripId`: String identifier of the strip this LED belongs to

- **frame**: Frame number (incremented each animation tick, ~60fps)

- **shape**: The LED shape object with:
  - `name`: Name of the shape
  - `strips`: Array of LED strips
  - `totalLEDs`: Total number of LEDs in the shape

## Examples

### 1. Simple Solid Color

```javascript
function animate(leds, frame, shape) {
  leds.forEach((led) => {
    led.color.r = 255;
    led.color.g = 0;
    led.color.b = 0;
  });
}
```

### 2. Breathing Effect

```javascript
function animate(leds, frame, shape) {
  const intensity = (Math.sin(frame * 0.05) + 1) / 2;
  const value = Math.floor(intensity * 255);
  
  leds.forEach((led) => {
    led.color.r = value;
    led.color.g = value;
    led.color.b = value;
  });
}
```

### 3. Position-based Gradient

```javascript
function animate(leds, frame, shape) {
  const minY = Math.min(...leds.map(l => l.position.y));
  const maxY = Math.max(...leds.map(l => l.position.y));
  const range = maxY - minY;
  
  leds.forEach((led) => {
    const normalized = (led.position.y - minY) / range;
    led.color.r = Math.floor(normalized * 255);
    led.color.g = Math.floor((1 - normalized) * 255);
    led.color.b = 128;
  });
}
```

### 4. Wave Effect

```javascript
function animate(leds, frame, shape) {
  leds.forEach((led) => {
    const wave = Math.sin(led.index * 0.1 + frame * 0.1);
    const intensity = (wave + 1) / 2;
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 128);
    led.color.b = Math.floor((1 - intensity) * 255);
  });
}
```

### 5. Strip-based Animation

```javascript
function animate(leds, frame, shape) {
  const activeStrip = Math.floor(frame * 0.02) % 12;
  
  leds.forEach((led) => {
    const stripIndex = parseInt(led.stripId.split('-').pop() || '0');
    
    if (stripIndex === activeStrip) {
      led.color.r = 255;
      led.color.g = 255;
      led.color.b = 255;
    } else {
      led.color.r = 20;
      led.color.g = 20;
      led.color.b = 20;
    }
  });
}
```

### 6. 3D Distance Effect

```javascript
function animate(leds, frame, shape) {
  const center = { x: 0, y: 0, z: 0 };
  const pulse = Math.sin(frame * 0.03) * 25 + 25;
  
  leds.forEach((led) => {
    const dx = led.position.x - center.x;
    const dy = led.position.y - center.y;
    const dz = led.position.z - center.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    const intensity = Math.abs(distance - pulse) < 5 ? 1 : 0.1;
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 100);
    led.color.b = Math.floor(intensity * 200);
  });
}
```

## Helper Functions

You can define helper functions in your animation code:

```javascript
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { 
    r: Math.round(r * 255), 
    g: Math.round(g * 255), 
    b: Math.round(b * 255) 
  };
}

function animate(leds, frame, shape) {
  leds.forEach((led, index) => {
    const hue = (index / leds.length + frame * 0.005) % 1.0;
    const rgb = hslToRgb(hue, 1.0, 0.5);
    led.color.r = rgb.r;
    led.color.g = rgb.g;
    led.color.b = rgb.b;
  });
}
```

## Performance Tips

1. **Avoid expensive calculations in loops**: Pre-calculate values outside the forEach when possible
2. **Use Math functions efficiently**: Cache sin/cos values if used multiple times
3. **Consider frame rate**: Animations run at ~60 FPS, frame numbers increment each tick
4. **Use randomness carefully**: `Math.random()` for every LED every frame can be slow
5. **Frame number calculations**: Since `frame` increments faster than milliseconds, adjust your multipliers accordingly (e.g., `frame * 0.01` instead of `time * 0.0005`)

## Debugging

Use console.log to debug your animations:

```javascript
function animate(leds, frame, shape) {
  // Log every 60 frames (~once per second at 60fps)
  if (frame % 60 === 0) {
    console.log('Frame:', frame);
    console.log('LED count:', leds.length);
    console.log('First LED:', leds[0]);
    console.log('Shape:', shape.name);
  }
  
  // Your animation code
}
```

## Common Patterns

### Frame-based Speed Control

```javascript
const speed = 0.05; // Adjust this value
const value = Math.sin(frame * speed);
```

### Normalized Values

```javascript
// Convert -1 to 1 range to 0 to 1
const normalized = (value + 1) / 2;

// Convert to 0-255
const colorValue = Math.floor(normalized * 255);
```

### Wrapping Values

```javascript
const wrapped = value % maxValue;
```

### Distance Calculation

```javascript
const distance = Math.sqrt(
  Math.pow(x2 - x1, 2) + 
  Math.pow(y2 - y1, 2) + 
  Math.pow(z2 - z1, 2)
);
```

