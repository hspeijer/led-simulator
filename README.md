# LED Simulator

A Next.js application for simulating and visualizing LED animation patterns in 3D using Three.js.

## 🎮 Live Demo

Try it now: **[https://led-simulator-gray.vercel.app/](https://led-simulator-gray.vercel.app/)**

## Features

- **3D Visualization**: Real-time LED animation rendering using Three.js and React Three Fiber
- **Dual Live Editors**: Two Monaco editors (VS Code) for editing both shapes and animations
  - **Shape Editor** (top): Define and edit LED strip layouts using the DSL
  - **Animation Editor** (bottom): Write animation patterns in JavaScript
- **DSL for LED Shapes**: Domain-specific language for defining LED strip layouts as graphs with directional vectors
- **Pre-built Shapes**: 7 sample shapes (Cube, Line, Square, Pyramid, Helix, Star, Sphere)
- **Pre-built Patterns**: 7 sample animations including graph-based navigation
- **Linked System**: Animation patterns automatically work with the currently selected shape
- **Graph Navigation**: Shapes are automatically converted to directed graphs
  - Walkers navigate from node to node
  - Random edge selection at junctions
  - Perfect for path-based animations
- **Persistence**: Save/load custom shapes and animations using localStorage
  - 💾 Save button to store your creations
  - 🗑️ Delete button for custom items
  - Auto-restore last session on reload
- **Shape Parameter in Animations**: Access shape properties (name, LED count, strips) in animation code
- **Split-screen Layout**: Dual editors on the left, 3D visualization on the right

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Run the development server:
```bash
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## User Guide

See the documentation for detailed guides:
- [USAGE_GUIDE.md](USAGE_GUIDE.md) - Complete tutorial and interface guide
- [PERSISTENCE.md](PERSISTENCE.md) - Save/load features and shape parameter
- [SHAPE_DSL.md](SHAPE_DSL.md) - Shape definition language reference
- [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) - Animation examples and patterns
- [GRAPH_NAVIGATION.md](GRAPH_NAVIGATION.md) - Graph-based navigation system (NEW!)

## How It Works

The application has a **dual-editor system**:

1. **Shape Editor** (top left): Edit the 3D shape definition
   - Select from preset shapes or write custom ones
   - Uses the shape DSL with `createStrip()`, `buildShape()`, and `createCube()`
   - Real-time compilation and visualization
   
2. **Animation Editor** (bottom left): Edit the animation pattern
   - Select from preset animations or write custom ones
   - Animations automatically apply to the current shape
   - Access to all LEDs with positions and colors
   - Use graph navigation for path-based animations

3. **3D Visualization** (right): See the result in real-time
   - Rotate, zoom, and pan with mouse
   - LEDs update at 60 FPS
   - Info panel shows shape statistics

## Architecture

### DSL Structure

The LED shape DSL is based on the following concepts:

- **Vector3D**: 3D coordinates (x, y, z)
- **LEDStrip**: Defines a strip of LEDs with:
  - `id`: Unique identifier
  - `startPoint`: Starting position in 3D space
  - `direction`: Normalized directional vector
  - `ledCount`: Number of LEDs in the strip
  - `startIndex`: Global index where this strip starts

- **LEDShape**: A collection of strips forming a complete shape
- **LED**: Individual LED with position, color, and strip reference

### Animation Function Format

Animations are JavaScript functions with the signature:
```javascript
function animate(leds, time, shape) {
  // leds: Array of LED objects
  // time: Elapsed time in milliseconds
  // shape: The current LED shape object
  
  leds.forEach((led, index) => {
    // Modify led.color.r, led.color.g, led.color.b (0-255)
    // Access shape.name, shape.totalLEDs, shape.strips
  });
}
```

### Graph Navigation (Advanced)

Use the graph navigation system for path-based animations:

```javascript
const { buildGraphFromShape } = graphUtils;
const { GraphWalker } = walkerUtils;

// Create a walker
if (!window.walker) {
  const graph = buildGraphFromShape(shape);
  window.walker = new GraphWalker(graph, undefined, 1.0);
}

function animate(leds, time, shape) {
  walker.update();  // Move to next position
  const ledIndex = walker.getCurrentLEDIndex();
  // Animate based on walker position
}
```

See [GRAPH_NAVIGATION.md](GRAPH_NAVIGATION.md) for complete documentation.

### Creating Custom Shapes

Use the shape builder API to create custom LED arrangements:

```javascript
import { createStrip, buildShape } from '@/lib/shapeBuilder';

const strips = [
  createStrip('strip1', { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 50, 0),
  // ... more strips
];

const shape = buildShape('MyShape', strips);
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application page with dual editors
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   └── page.module.css   # Page-specific CSS module
├── components/
│   ├── LEDVisualization.tsx  # Three.js 3D rendering component
│   ├── CodeEditor.tsx        # Monaco editor wrapper (animations)
│   └── ShapeEditor.tsx       # Monaco editor wrapper (shapes)
├── lib/
│   ├── shapeBuilder.ts   # DSL for creating LED shapes
│   ├── shapes.ts         # Preset shape definitions
│   └── animations.ts     # Preset animation patterns
└── types/
    └── led.ts           # TypeScript type definitions
```

## Technologies

- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety and better DX
- **Three.js**: 3D graphics library
- **React Three Fiber**: React renderer for Three.js
- **Monaco Editor**: VS Code's editor component
- **CSS Modules**: Scoped styling

## License

MIT

