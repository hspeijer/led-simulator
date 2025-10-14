# Persistence and Save/Load Features

The LED Simulator now includes localStorage-based persistence for your custom shapes and animations!

## Features

### 💾 Save Custom Shapes and Animations

- Click the **💾 Save button** next to the dropdown to save your current code
- Enter a name when prompted
- Your custom creations appear in the "Custom" section of the dropdown

### 🗑️ Delete Custom Creations

- Select a custom shape or animation
- Click the **🗑️ Delete button** (only visible for custom items)
- Preset shapes/animations cannot be deleted

### 🔄 Auto-Restore Last Session

- Your most recent shape and animation code are automatically saved
- When you reload the page, your last work is restored
- Continue right where you left off!

## How It Works

### localStorage Keys

The app uses these localStorage keys:
- `led-simulator-custom-animations` - Your saved animation patterns
- `led-simulator-custom-shapes` - Your saved shape definitions  
- `led-simulator-last-animation` - Auto-saved animation code
- `led-simulator-last-shape` - Auto-saved shape code

### Data Persistence

All data is stored locally in your browser using localStorage:
- ✅ **Private**: Data stays on your machine
- ✅ **Fast**: Instant save and load
- ✅ **Simple**: No server or account needed
- ❌ **Local only**: Not synced across devices/browsers

## Usage Examples

### Save a Custom Animation

1. Write or modify an animation in the Animation Editor
2. Click the 💾 button next to the dropdown
3. Enter a name: "My Rainbow Spin"
4. Your animation now appears in the dropdown under "Custom"

### Save a Custom Shape

1. Create a shape in the Shape Editor
2. Click the 💾 button
3. Enter a name: "Helix Tower"
4. Select it anytime from the "Custom" section

### Delete Saved Items

1. Select your custom animation/shape from the dropdown
2. Click the 🗑️ button  
3. Confirm the deletion
4. The item is removed from localStorage

## Animation Shape Parameter

### New Feature: Access Shape in Animations!

All animation functions now receive the `shape` parameter:

```javascript
function animate(leds, time, shape) {
  // NEW: Access shape properties
  console.log(shape.name);        // "Cube"
  console.log(shape.totalLEDs);   // 600
  console.log(shape.strips.length); // 12
  
  // Use shape data in your animation
  leds.forEach((led, index) => {
    const progress = index / shape.totalLEDs;
    // ... animation logic
  });
}
```

### Shape Object Structure

```typescript
shape = {
  name: string;           // Name of the shape
  totalLEDs: number;      // Total number of LEDs
  strips: LEDStrip[];     // Array of strip definitions
}
```

### Why This Matters

**Before**: Animations had to use `leds.length` which might not match the actual LED count if some LEDs aren't rendered.

**Now**: Animations can use `shape.totalLEDs` for accurate calculations and access strip information for more complex effects.

### Example: Strip-Based Animation

```javascript
function animate(leds, time, shape) {
  // Animate each strip independently
  const stripCount = shape.strips.length;
  const activeStrip = Math.floor(time * 0.001) % stripCount;
  
  leds.forEach((led) => {
    // Find which strip this LED belongs to
    let stripIndex = 0;
    for (let i = 0; i < shape.strips.length; i++) {
      const strip = shape.strips[i];
      if (led.index >= strip.startIndex && 
          led.index < strip.startIndex + strip.ledCount) {
        stripIndex = i;
        break;
      }
    }
    
    // Light up only the active strip
    if (stripIndex === activeStrip) {
      led.color.r = 255;
      led.color.g = 255;
      led.color.b = 255;
    } else {
      led.color.r = 10;
      led.color.g = 10;
      led.color.b = 10;
    }
  });
}
```

### Example: Shape-Aware Wave

```javascript
function animate(leds, time, shape) {
  // Use totalLEDs for proper wrapping
  const position = (time * 0.05) % shape.totalLEDs;
  
  leds.forEach((led) => {
    const distance = Math.abs(led.index - position);
    const wrappedDistance = Math.min(
      distance, 
      shape.totalLEDs - distance
    );
    const intensity = Math.max(0, 1 - wrappedDistance / 10);
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 128);
    led.color.b = 0;
  });
}
```

## Tips

### Organizing Your Library

Use descriptive names:
- ✅ "Rainbow Wave Fast"
- ✅ "Helix 3 Turns 50 LEDs"
- ✅ "Fire Effect Bottom to Top"
- ❌ "Animation 1"
- ❌ "Test"
- ❌ "asdf"

### Backup Your Work

To export your creations:

1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Find the `led-simulator-*` keys
4. Copy the values to a text file

To import:
1. Open DevTools
2. Go to Console
3. Paste:
```javascript
localStorage.setItem('led-simulator-custom-animations', 'YOUR_EXPORTED_DATA');
localStorage.setItem('led-simulator-custom-shapes', 'YOUR_EXPORTED_DATA');
```

### Clear All Data

To reset everything:

```javascript
// In browser console
localStorage.removeItem('led-simulator-custom-animations');
localStorage.removeItem('led-simulator-custom-shapes');
localStorage.removeItem('led-simulator-last-animation');
localStorage.removeItem('led-simulator-last-shape');
```

Or clear all localStorage for this site in DevTools.

## Limitations

- **Browser-specific**: Saved data only exists in the current browser
- **No sync**: Data doesn't sync across devices
- **Storage limit**: ~5-10 MB total (very generous for code)
- **Clearing data**: Clearing browser data will delete saved items
- **Incognito mode**: Data is lost when closing incognito windows

## Future Enhancements

Potential future features:
- Export/import as JSON files
- Share animations via URL
- Cloud sync (requires backend)
- Version history
- Categories and tags
- Search functionality


