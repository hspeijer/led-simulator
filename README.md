# LED Simulator

A Next.js application for simulating and visualizing LED animation patterns in 3D using Three.js.

## Features

- **3D Visualization**: Real-time LED animation rendering using Three.js and React Three Fiber
- **Live Code Editor**: Monaco editor for writing and editing animation patterns in JavaScript
- **DSL for LED Shapes**: Domain-specific language for defining LED strip layouts as graphs with directional vectors
- **Pre-built Patterns**: Includes sample animations like Rainbow Wave, Pulse, Running Lights, Fire Effect, and Sparkle
- **Cube Demo**: Visualizes a cube with 50 LEDs per edge (12 edges = 600 total LEDs)
- **Split-screen Layout**: Code editor on the left, 3D visualization on the right

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
function animate(leds, time) {
  // leds: Array of LED objects
  // time: Elapsed time in milliseconds
  
  leds.forEach((led, index) => {
    // Modify led.color.r, led.color.g, led.color.b (0-255)
  });
}
```

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
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   └── page.module.css   # Page-specific CSS module
├── components/
│   ├── LEDVisualization.tsx  # Three.js 3D rendering component
│   └── CodeEditor.tsx        # Monaco editor wrapper
├── lib/
│   ├── shapeBuilder.ts   # DSL for creating LED shapes
│   └── animations.ts     # Sample animation patterns
└── types/
    └── led.ts           # TypeScript type definitions
```

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and better DX
- **Three.js**: 3D graphics library
- **React Three Fiber**: React renderer for Three.js
- **Monaco Editor**: VS Code's editor component
- **CSS Modules**: Scoped styling

## License

MIT

