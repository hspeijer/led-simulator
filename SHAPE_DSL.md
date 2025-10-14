# Shape DSL Documentation

The LED Simulator uses a Domain-Specific Language (DSL) to define LED strip shapes in 3D space.

## Core Concepts

### Vector3D

A 3D coordinate or direction:

```typescript
interface Vector3D {
  x: number;
  y: number;
  z: number;
}
```

Example:
```javascript
const point = { x: 10, y: 5, z: -3 };
const direction = { x: 1, y: 0, z: 0 }; // Points along X axis
```

### LEDStrip

Defines a linear strip of LEDs:

```typescript
interface LEDStrip {
  id: string;           // Unique identifier
  startPoint: Vector3D; // Starting position in 3D space
  direction: Vector3D;  // Directional vector (auto-normalized)
  ledCount: number;     // Number of LEDs in this strip
  startIndex: number;   // Global LED index where this strip starts
}
```

### LEDShape

A complete shape made of multiple strips:

```typescript
interface LEDShape {
  name: string;
  strips: LEDStrip[];
  totalLEDs: number;
}
```

## API Functions

### `createStrip(id, start, direction, ledCount, startIndex)`

Creates a single LED strip.

```javascript
import { createStrip } from '@/lib/shapeBuilder';

const strip = createStrip(
  'my-strip',                    // ID
  { x: 0, y: 0, z: 0 },         // Start point
  { x: 1, y: 0, z: 0 },         // Direction (will be normalized)
  50,                            // LED count
  0                              // Start index
);
```

### `buildShape(name, strips)`

Combines multiple strips into a shape.

```javascript
import { buildShape, createStrip } from '@/lib/shapeBuilder';

const strips = [
  createStrip('strip-1', { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 30, 0),
  createStrip('strip-2', { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 30, 30),
];

const shape = buildShape('L-Shape', strips);
```

### `generateLEDs(shape)`

Converts a shape definition into actual LED objects with positions.

```javascript
import { generateLEDs } from '@/lib/shapeBuilder';

const leds = generateLEDs(shape);
// Returns array of LED objects with calculated positions
```

### `normalize(vector)`

Normalizes a vector to unit length.

```javascript
import { normalize } from '@/lib/shapeBuilder';

const normalized = normalize({ x: 3, y: 4, z: 0 });
// Returns { x: 0.6, y: 0.8, z: 0 }
```

## Example Shapes

### Simple Line

```javascript
import { createStrip, buildShape } from '@/lib/shapeBuilder';

const line = buildShape('Line', [
  createStrip('line-1', { x: -25, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 50, 0)
]);
```

### Square

```javascript
const square = buildShape('Square', [
  createStrip('bottom', { x: -25, y: -25, z: 0 }, { x: 1, y: 0, z: 0 }, 50, 0),
  createStrip('right', { x: 25, y: -25, z: 0 }, { x: 0, y: 1, z: 0 }, 50, 50),
  createStrip('top', { x: 25, y: 25, z: 0 }, { x: -1, y: 0, z: 0 }, 50, 100),
  createStrip('left', { x: -25, y: 25, z: 0 }, { x: 0, y: -1, z: 0 }, 50, 150),
]);
```

### Cube (12 edges)

```javascript
import { createCube } from '@/lib/shapeBuilder';

const cube = createCube(50); // 50 LEDs per edge
```

The cube function creates:
- 4 bottom face edges
- 4 top face edges
- 4 vertical edges

### Pyramid

```javascript
const pyramid = buildShape('Pyramid', [
  // Base edges (square)
  createStrip('base-1', { x: -25, y: 0, z: 25 }, { x: 1, y: 0, z: 0 }, 50, 0),
  createStrip('base-2', { x: 25, y: 0, z: 25 }, { x: 0, y: 0, z: -1 }, 50, 50),
  createStrip('base-3', { x: 25, y: 0, z: -25 }, { x: -1, y: 0, z: 0 }, 50, 100),
  createStrip('base-4', { x: -25, y: 0, z: -25 }, { x: 0, y: 0, z: 1 }, 50, 150),
  
  // Edges to apex
  createStrip('edge-1', { x: -25, y: 0, z: 25 }, { x: 0.5, y: 1, z: -0.5 }, 50, 200),
  createStrip('edge-2', { x: 25, y: 0, z: 25 }, { x: -0.5, y: 1, z: -0.5 }, 50, 250),
  createStrip('edge-3', { x: 25, y: 0, z: -25 }, { x: -0.5, y: 1, z: 0.5 }, 50, 300),
  createStrip('edge-4', { x: -25, y: 0, z: -25 }, { x: 0.5, y: 1, z: 0.5 }, 50, 350),
]);
```

### Helix

```javascript
const helix = buildShape('Helix', 
  Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 4; // 2 full rotations
    const x = Math.cos(angle) * 20;
    const z = Math.sin(angle) * 20;
    const y = i * 5;
    
    const nextAngle = ((i + 1) / 10) * Math.PI * 4;
    const dx = Math.cos(nextAngle) * 20 - x;
    const dz = Math.sin(nextAngle) * 20 - z;
    const dy = 5;
    
    return createStrip(
      `helix-${i}`,
      { x, y, z },
      { x: dx, y: dy, z: dz },
      10,
      i * 10
    );
  })
);
```

### Star

```javascript
const points = 5;
const outerRadius = 30;
const innerRadius = 15;
const strips = [];
let ledIndex = 0;

for (let i = 0; i < points * 2; i++) {
  const angle = (i / (points * 2)) * Math.PI * 2;
  const radius = i % 2 === 0 ? outerRadius : innerRadius;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const nextAngle = ((i + 1) / (points * 2)) * Math.PI * 2;
  const nextRadius = (i + 1) % 2 === 0 ? outerRadius : innerRadius;
  const nextX = Math.cos(nextAngle) * nextRadius;
  const nextZ = Math.sin(nextAngle) * nextRadius;
  
  strips.push(createStrip(
    `star-${i}`,
    { x, y: 0, z },
    { x: nextX - x, y: 0, z: nextZ - z },
    20,
    ledIndex
  ));
  ledIndex += 20;
}

const star = buildShape('Star', strips);
```

## Shape Composition

You can combine shapes by merging their strips:

```javascript
const shape1 = createCube(30);
const shape2 = createCube(15); // Smaller cube

// Offset the second cube
const offsetStrips = shape2.strips.map(strip => ({
  ...strip,
  startPoint: {
    x: strip.startPoint.x + 50,
    y: strip.startPoint.y,
    z: strip.startPoint.z,
  },
  startIndex: strip.startIndex + shape1.totalLEDs,
}));

const combined = buildShape('TwoCubes', [
  ...shape1.strips,
  ...offsetStrips,
]);
```

## Best Practices

1. **Coordinate System**: The visualizer uses:
   - X: Left (-) to Right (+)
   - Y: Down (-) to Up (+)
   - Z: Back (-) to Front (+)

2. **Spacing**: LEDs are spaced 1 unit apart by default

3. **Direction Vectors**: Will be automatically normalized, but should point in the general direction

4. **LED Indices**: Must be consecutive and unique across all strips in a shape

5. **Strip IDs**: Should be unique within a shape for easier debugging

6. **Scale**: Keep shapes within -50 to +50 units for best visibility

## Troubleshooting

### LEDs not appearing
- Check that LED count > 0
- Verify positions are within camera view (-50 to +50)
- Ensure direction vector is not {0, 0, 0}

### Gaps in strips
- Verify consecutive startIndex values
- Check that ledCount matches intended strip length

### Unexpected positions
- Remember directions are normalized
- Check coordinate system orientation
- Verify start points are correct

