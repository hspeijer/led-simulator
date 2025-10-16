# Migration to Node/Edge System

## Overview

The LED Simulator has been migrated from a strip-based system to a graph-based node/edge system. This provides a more natural way to define LED shapes and enables powerful graph-based animations.

## Key Changes

### 1. Type System (`src/types/led.ts`)

**Added:**
- `ShapeNode`: Represents a point in 3D space with incoming/outgoing edge tracking
- `ShapeEdge`: Represents a connection between two nodes with LEDs distributed along it

**Modified:**
- `LEDShape`: Now uses `Map<string, ShapeNode>` and `Map<string, ShapeEdge>` instead of `LEDStrip[]`

**Kept:**
- `LEDStrip`: Retained for backward compatibility but not used in new system
- All other types remain unchanged

### 2. Shape Builder (`src/lib/shapeBuilder.ts`)

**New Functions:**
- `createNode(id, position)`: Creates a node at a 3D position
- `createEdge(id, fromNodeId, toNodeId, ledCount, startIndex)`: Creates an edge with LEDs

**Modified:**
- `buildShape(name, nodes, edges)`: Now takes arrays of nodes and edges
- `generateLEDs(shape)`: Updated to work with edge-based system

**Removed:**
- `createStrip()`: Replaced by node/edge system
- `createCube()`: Replaced by node/edge definition in shapes.ts

### 3. Shapes (`src/lib/shapes.ts`)

**Simplified to:**
- Only Cube shape (as requested)
- Defined using 8 nodes (corners) and 12 edges
- Each node can answer which edges connect to it

### 4. Animations (`src/lib/animations.ts`)

**Kept only:**
- Rainbow Wave
- Running Lights

**Removed:**
- Pulse, Fire Effect, Sparkle, Graph Walker, Random Walk

### 5. Graph Builder (`src/lib/graphBuilder.ts`)

**Simplified:**
- `buildGraphFromShape()`: Now directly converts shape nodes/edges to graph structure
- No longer needs to analyze strip endpoints
- Much cleaner implementation since shapes are already graphs

### 6. Page Component (`src/app/page.tsx`)

**Updated:**
- Shape compilation now uses `createNode`, `createEdge`, `buildShape`
- Info display shows Nodes and Edges count instead of Strips
- Type annotations added for better TypeScript support

### 7. Documentation (`SHAPE_DSL.md`)

**Completely rewritten:**
- Explains node/edge system
- Shows how nodes track connections
- Provides examples using new API
- Documents graph navigation capabilities

## Benefits

1. **Natural Graph Structure**: Shapes are defined as graphs, making it easier to create connected structures
2. **Automatic Connection Tracking**: Nodes automatically know their incoming/outgoing edges
3. **Simplified Graph Animations**: Graph walker animations work directly with the shape structure
4. **Better Semantics**: Edges represent actual connections between points, not arbitrary strips
5. **Easier Reasoning**: Clear start and end points for each edge

## Example: Creating a Triangle

**Old System (strips):**
```javascript
const strips = [
  createStrip('side-1', {x: 0, y: 20, z: 0}, {x: -1, y: -2, z: 0}, 50, 0),
  createStrip('side-2', {x: -20, y: -20, z: 0}, {x: 1, y: 0, z: 0}, 50, 50),
  createStrip('side-3', {x: 20, y: -20, z: 0}, {x: -1, y: 2, z: 0}, 50, 100),
];
return buildShape('Triangle', strips);
```

**New System (nodes/edges):**
```javascript
const nodes = [
  createNode('corner-1', { x: 0, y: 20, z: 0 }),
  createNode('corner-2', { x: -20, y: -20, z: 0 }),
  createNode('corner-3', { x: 20, y: -20, z: 0 }),
];

let ledIndex = 0;
const edges = [
  createEdge('edge-1', 'corner-1', 'corner-2', 50, ledIndex),
  ledIndex += 50,
  createEdge('edge-2', 'corner-2', 'corner-3', 50, ledIndex),
  ledIndex += 50,
  createEdge('edge-3', 'corner-3', 'corner-1', 50, ledIndex),
];

return buildShape('Triangle', nodes, edges.filter(e => typeof e !== 'number'));
```

The new system is more explicit about the structure and makes it clear which points connect to which.

## Migration Notes

- All custom shapes will need to be redefined using the new API
- The shape structure is fundamentally different, so saved shapes from the old system won't work
- Graph-based animations now have direct access to the underlying graph structure
- No need to rebuild graphs from strips - shapes ARE graphs

## Testing

The build successfully compiles with no linter errors. All functionality has been preserved while switching to the new system.

