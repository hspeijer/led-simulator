# Shape DSL Documentation

The LED Simulator uses a Domain-Specific Language (DSL) to define LED shapes in 3D space using a **graph-based node/edge system**.

## Core Concepts

### Vector3D

A 3D coordinate:

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
```

### ShapeNode

A node represents a point in 3D space where edges connect:

```typescript
interface ShapeNode {
  id: string;                  // Unique identifier
  position: Vector3D;          // 3D position
  incomingEdges: string[];     // Edge IDs that end at this node
  outgoingEdges: string[];     // Edge IDs that start from this node
}
```

**Key Features:**
- Each node tracks which edges connect to it
- Nodes can answer which edges come in and which go out
- Multiple edges can connect to the same node

### ShapeEdge

An edge connects two nodes and contains LEDs along its length:

```typescript
interface ShapeEdge {
  id: string;           // Unique identifier
  fromNodeId: string;   // ID of the starting node
  toNodeId: string;     // ID of the ending node
  ledCount: number;     // Number of LEDs along this edge
  startIndex: number;   // Global LED index where this edge starts
}
```

**Key Features:**
- LEDs are evenly distributed between the two nodes
- Each edge knows its start and end nodes
- Edges can be traversed in both directions

### LEDShape

A complete shape made of nodes and edges:

```typescript
interface LEDShape {
  name: string;
  nodes: Map<string, ShapeNode>;
  edges: Map<string, ShapeEdge>;
  totalLEDs: number;
}
```

## API Functions

### `createNode(id, position)`

Creates a node at a specific 3D position.

```javascript
const node = createNode('corner-1', { x: 0, y: 0, z: 0 });
```

**Parameters:**
- `id` (string): Unique identifier for the node
- `position` (Vector3D): 3D coordinates of the node

### `createEdge(id, fromNodeId, toNodeId, ledCount, startIndex)`

Creates an edge connecting two nodes with LEDs.

```javascript
const edge = createEdge(
  'edge-1',           // Edge ID
  'corner-1',         // From node ID
  'corner-2',         // To node ID
  50,                 // Number of LEDs
  0                   // Start index
);
```

**Parameters:**
- `id` (string): Unique identifier for the edge
- `fromNodeId` (string): ID of the starting node
- `toNodeId` (string): ID of the ending node
- `ledCount` (number): Number of LEDs along this edge
- `startIndex` (number): Global LED index where this edge starts

### `buildShape(name, nodes, edges)`

Combines nodes and edges into a complete shape.

```javascript
const shape = buildShape('MyShape', nodes, edges);
```

**Parameters:**
- `name` (string): Name of the shape
- `nodes` (ShapeNode[]): Array of nodes
- `edges` (ShapeEdge[]): Array of edges

**Returns:** LEDShape object with automatically connected nodes

The `buildShape` function automatically:
- Links nodes to their incoming and outgoing edges
- Calculates the total number of LEDs
- Creates Map structures for efficient lookup

### `generateLEDs(shape)`

Converts a shape definition into actual LED objects with positions.

```javascript
const leds = generateLEDs(shape);
// Returns array of LED objects with calculated positions
```

LEDs are distributed evenly along each edge between the two nodes.

## Example Shapes

### Simple Line (2 nodes, 1 edge)

```javascript
const nodes = [
  createNode('start', { x: -25, y: 0, z: 0 }),
  createNode('end', { x: 25, y: 0, z: 0 }),
];

const edges = [
  createEdge('line', 'start', 'end', 100, 0),
];

return buildShape('Line', nodes, edges);
```

### Triangle (3 nodes, 3 edges)

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

### Cube (8 nodes, 12 edges)

The default cube shape demonstrates a complete graph structure:

```javascript
const ledsPerEdge = 50;
const size = ledsPerEdge - 1;
const half = size / 2;

// Create 8 corner nodes
const nodes = [
  createNode('bottom-front-left', { x: -half, y: -half, z: half }),
  createNode('bottom-front-right', { x: half, y: -half, z: half }),
  createNode('bottom-back-right', { x: half, y: -half, z: -half }),
  createNode('bottom-back-left', { x: -half, y: -half, z: -half }),
  createNode('top-front-left', { x: -half, y: half, z: half }),
  createNode('top-front-right', { x: half, y: half, z: half }),
  createNode('top-back-right', { x: half, y: half, z: -half }),
  createNode('top-back-left', { x: -half, y: half, z: -half }),
];

// Create 12 edges (4 bottom, 4 top, 4 vertical)
let ledIndex = 0;
const edges = [
  // Bottom face
  createEdge('bottom-front', 'bottom-front-left', 'bottom-front-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('bottom-right', 'bottom-front-right', 'bottom-back-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('bottom-back', 'bottom-back-right', 'bottom-back-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('bottom-left', 'bottom-back-left', 'bottom-front-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  
  // Top face
  createEdge('top-front', 'top-front-left', 'top-front-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('top-right', 'top-front-right', 'top-back-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('top-back', 'top-back-right', 'top-back-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('top-left', 'top-back-left', 'top-front-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  
  // Vertical edges
  createEdge('vertical-front-left', 'bottom-front-left', 'top-front-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('vertical-front-right', 'bottom-front-right', 'top-front-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('vertical-back-right', 'bottom-back-right', 'top-back-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,
  createEdge('vertical-back-left', 'bottom-back-left', 'top-back-left', ledsPerEdge, ledIndex),
];

return buildShape('Cube', nodes, edges.filter(e => typeof e !== 'number'));
```

### Pyramid (5 nodes, 8 edges)

```javascript
const base = 25;
const nodes = [
  // Base corners
  createNode('base-1', { x: -base, y: -20, z: base }),
  createNode('base-2', { x: base, y: -20, z: base }),
  createNode('base-3', { x: base, y: -20, z: -base }),
  createNode('base-4', { x: -base, y: -20, z: -base }),
  // Apex
  createNode('apex', { x: 0, y: 30, z: 0 }),
];

let ledIndex = 0;
const edges = [
  // Base square
  createEdge('base-1-2', 'base-1', 'base-2', 40, ledIndex), ledIndex += 40,
  createEdge('base-2-3', 'base-2', 'base-3', 40, ledIndex), ledIndex += 40,
  createEdge('base-3-4', 'base-3', 'base-4', 40, ledIndex), ledIndex += 40,
  createEdge('base-4-1', 'base-4', 'base-1', 40, ledIndex), ledIndex += 40,
  // Edges to apex
  createEdge('apex-1', 'base-1', 'apex', 40, ledIndex), ledIndex += 40,
  createEdge('apex-2', 'base-2', 'apex', 40, ledIndex), ledIndex += 40,
  createEdge('apex-3', 'base-3', 'apex', 40, ledIndex), ledIndex += 40,
  createEdge('apex-4', 'base-4', 'apex', 40, ledIndex),
];

return buildShape('Pyramid', nodes, edges.filter(e => typeof e !== 'number'));
```

## Understanding Node Connections

Each node automatically tracks its connections when you build a shape:

```javascript
const nodes = [
  createNode('center', { x: 0, y: 0, z: 0 }),
  createNode('north', { x: 0, y: 10, z: 0 }),
  createNode('east', { x: 10, y: 0, z: 0 }),
  createNode('south', { x: 0, y: -10, z: 0 }),
];

const edges = [
  createEdge('e1', 'center', 'north', 20, 0),
  createEdge('e2', 'center', 'east', 20, 20),
  createEdge('e3', 'south', 'center', 20, 40),
];

const shape = buildShape('Star', nodes, edges.filter(e => typeof e !== 'number'));

// After building, the 'center' node will have:
// - outgoingEdges: ['e1', 'e2']  (edges starting from center)
// - incomingEdges: ['e3']         (edges ending at center)
```

This graph structure allows animations to:
- Navigate along edges
- Find which paths lead out from a node
- Traverse the shape intelligently

## Best Practices

1. **Coordinate System**: The visualizer uses:
   - X: Left (-) to Right (+)
   - Y: Down (-) to Up (+)
   - Z: Back (-) to Front (+)

2. **LED Distribution**: LEDs are evenly distributed along each edge between the two nodes

3. **LED Indices**: 
   - Must be consecutive across all edges
   - Use the pattern: `ledIndex += ledCount` after each edge
   - Filter out the `ledIndex` numbers when building: `edges.filter(e => typeof e !== 'number')`

4. **Node IDs**: Should be unique and descriptive (e.g., 'corner-1', 'apex', 'center')

5. **Edge IDs**: Should be unique within a shape for easier debugging

6. **Scale**: Keep shapes within -50 to +50 units for best visibility

7. **Graph Structure**:
   - Each edge connects exactly two nodes
   - Nodes can have multiple incoming and outgoing edges
   - The graph can be disconnected (multiple separate components)

## Advanced: Working with the Graph

The node/edge structure enables powerful graph-based animations:

```javascript
// Access node connections
shape.nodes.get('corner-1').outgoingEdges  // Array of edge IDs
shape.nodes.get('corner-1').incomingEdges  // Array of edge IDs

// Access edge information
shape.edges.get('edge-1').fromNodeId  // Starting node ID
shape.edges.get('edge-1').toNodeId    // Ending node ID
shape.edges.get('edge-1').ledCount    // Number of LEDs on this edge
```

## Troubleshooting

### LEDs not appearing
- Check that `ledCount > 0` for all edges
- Verify node positions are within camera view (-50 to +50)
- Ensure `fromNodeId` and `toNodeId` reference existing nodes

### Gaps in shape
- Verify consecutive `startIndex` values across edges
- Check that you're filtering out numbers from the edges array
- Ensure all edges are included in the final array

### Edges not connecting properly
- Verify node IDs match exactly (case-sensitive)
- Ensure nodes are created before being referenced in edges
- Check that `buildShape` receives both nodes and filtered edges arrays

