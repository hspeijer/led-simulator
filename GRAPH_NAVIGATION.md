# Graph-Based Navigation for Animations

The LED Simulator includes a powerful graph navigation system that allows animations to traverse shapes as directed graphs, moving from node to node and choosing random paths.

## Concept

### What is a Shape Graph?

When you create an LED shape, the simulator can automatically build a **directed graph** from it:

- **Nodes**: Connection points where multiple LED strips meet
- **Edges**: The LED strips themselves connecting nodes
- **Graph**: The complete network of nodes and edges

For example, a cube has:
- **8 nodes** (the 8 corners)
- **12 edges** (the 12 strips along cube edges)

### Graph Walker

A **GraphWalker** is an entity that:
1. Starts at a random node
2. Chooses a random edge to traverse
3. Moves along that edge (LED by LED)
4. Reaches the next node
5. Repeats (avoids immediate backtracking)

## API Reference

### Building a Graph

```javascript
const { buildGraphFromShape } = graphUtils;

// Build graph from shape
const graph = buildGraphFromShape(shape);

// Graph structure
console.log(graph.nodes);    // Map of nodes
console.log(graph.edges);    // Map of edges
```

### Creating a Walker

```javascript
const { GraphWalker } = walkerUtils;

// Create a walker
const walker = new GraphWalker(
  graph,              // The shape graph
  undefined,          // Start node (undefined = random)
  0.8                 // Speed (LEDs per frame)
);
```

### Walker Methods

```javascript
// Update walker position
walker.update();

// Get current LED index
const ledIndex = walker.getCurrentLEDIndex();

// Get nearby LEDs (within radius)
const nearby = walker.getNearbyLEDs(5);  // Returns LED indices

// Get walker state
const state = walker.getState();
console.log(state.currentNode);    // Current node ID
console.log(state.currentEdge);    // Current edge ID
console.log(state.position);       // 0-1 progress along edge
console.log(state.history);        // Recent nodes visited

// Change speed
walker.setSpeed(1.5);

// Reset to random start
walker.reset();
```

## Example Animations

### Single Walker with Trail

```javascript
// Random Walk Animation
const { buildGraphFromShape } = graphUtils;
const { GraphWalker } = walkerUtils;

// Initialize (only once)
if (!window.walker) {
  window.graph = buildGraphFromShape(shape);
  window.walker = new GraphWalker(window.graph, undefined, 1.0);
}

function animate(leds, time, shape) {
  // Fade all LEDs
  leds.forEach(led => {
    led.color.r = Math.max(0, led.color.r - 10);
    led.color.g = Math.max(0, led.color.g - 10);
    led.color.b = Math.max(0, led.color.b - 10);
  });
  
  // Update walker
  window.walker.update();
  
  // Light up current position
  const currentLED = window.walker.getCurrentLEDIndex();
  if (currentLED !== null && leds[currentLED]) {
    leds[currentLED].color.r = 255;
    leds[currentLED].color.g = 255;
    leds[currentLED].color.b = 255;
  }
}
```

### Multiple Walkers

```javascript
// Multi-Walker Animation
const { buildGraphFromShape } = graphUtils;
const { GraphWalker } = walkerUtils;

if (!window.walkers) {
  window.graph = buildGraphFromShape(shape);
  window.walkers = [
    new GraphWalker(window.graph, undefined, 0.8),
    new GraphWalker(window.graph, undefined, 1.2),
  ];
  window.colors = [
    { r: 255, g: 0, b: 0 },    // Red
    { r: 0, g: 0, b: 255 },    // Blue
  ];
}

function animate(leds, time, shape) {
  // Fade
  leds.forEach(led => {
    led.color.r = Math.max(0, led.color.r - 15);
    led.color.g = Math.max(0, led.color.g - 15);
    led.color.b = Math.max(0, led.color.b - 15);
  });
  
  // Update each walker
  window.walkers.forEach((walker, i) => {
    walker.update();
    
    const nearbyIndices = walker.getNearbyLEDs(3);
    const color = window.colors[i];
    
    nearbyIndices.forEach(ledIndex => {
      const led = leds[ledIndex];
      if (!led) return;
      
      led.color.r = Math.min(255, led.color.r + color.r);
      led.color.g = Math.min(255, led.color.g + color.g);
      led.color.b = Math.min(255, led.color.b + color.b);
    });
  });
}
```

### Walker with Gradient Trail

```javascript
// Gradient Trail Animation
const { buildGraphFromShape } = graphUtils;
const { GraphWalker } = walkerUtils;

if (!window.walker) {
  window.graph = buildGraphFromShape(shape);
  window.walker = new GraphWalker(window.graph, undefined, 1.5);
}

function animate(leds, time, shape) {
  // Fade
  leds.forEach(led => {
    led.color.r = Math.max(0, led.color.r - 12);
    led.color.g = Math.max(0, led.color.g - 12);
    led.color.b = Math.max(0, led.color.b - 12);
  });
  
  window.walker.update();
  
  // Create gradient trail
  const nearbyIndices = window.walker.getNearbyLEDs(10);
  const centerIndex = window.walker.getCurrentLEDIndex();
  
  nearbyIndices.forEach(ledIndex => {
    const led = leds[ledIndex];
    if (!led || centerIndex === null) return;
    
    const distance = Math.abs(ledIndex - centerIndex);
    const intensity = Math.max(0, 1 - distance / 10);
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 150);
    led.color.b = Math.floor(intensity * 255);
  });
}
```

### Collision Detection

```javascript
// Collision Animation - walkers change color on collision
const { buildGraphFromShape } = graphUtils;
const { GraphWalker } = walkerUtils;

if (!window.walkers) {
  window.graph = buildGraphFromShape(shape);
  window.walkers = [
    new GraphWalker(window.graph, undefined, 0.9),
    new GraphWalker(window.graph, undefined, 0.7),
  ];
  window.colors = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
  ];
}

function animate(leds, time, shape) {
  leds.forEach(led => {
    led.color.r = Math.max(0, led.color.r - 20);
    led.color.g = Math.max(0, led.color.g - 20);
    led.color.b = Math.max(0, led.color.b - 20);
  });
  
  // Update walkers
  const positions = window.walkers.map(w => {
    w.update();
    return w.getCurrentLEDIndex();
  });
  
  // Check for collision (same LED)
  const collision = positions[0] === positions[1] && positions[0] !== null;
  
  window.walkers.forEach((walker, i) => {
    const nearbyIndices = walker.getNearbyLEDs(3);
    const color = collision ? 
      { r: 255, g: 255, b: 0 } :  // Yellow on collision
      window.colors[i];
    
    nearbyIndices.forEach(ledIndex => {
      const led = leds[ledIndex];
      if (!led) return;
      
      led.color.r = Math.min(255, led.color.r + color.r);
      led.color.g = Math.min(255, led.color.g + color.g);
      led.color.b = Math.min(255, led.color.b + color.b);
    });
  });
}
```

## Advanced Usage

### Custom Navigation Logic

You can create custom walkers that make intelligent decisions:

```javascript
// Smart walker that prefers certain edges
class SmartWalker extends GraphWalker {
  chooseNextEdge() {
    const availableEdges = getAvailableEdges(
      this.graph,
      this.state.currentNode
    );
    
    // Prefer edges with more LEDs
    availableEdges.sort((a, b) => b.length - a.length);
    
    // Take the longest edge (or random if multiple)
    const maxLength = availableEdges[0]?.length || 0;
    const longestEdges = availableEdges.filter(e => e.length === maxLength);
    
    return selectRandomEdge(longestEdges);
  }
}
```

### Accessing Graph Structure

```javascript
function animate(leds, time, shape) {
  const { buildGraphFromShape } = graphUtils;
  
  if (!window.graph) {
    window.graph = buildGraphFromShape(shape);
    
    // Log graph information
    console.log('Nodes:', window.graph.nodes.size);
    console.log('Edges:', window.graph.edges.size);
    
    // Analyze graph structure
    window.graph.nodes.forEach((node, id) => {
      console.log(`Node ${id}:`, {
        position: node.position,
        connections: node.connectedEdges.length
      });
    });
  }
  
  // Your animation...
}
```

## Tips and Best Practices

### 1. Initialize Once

Always check if objects exist before creating:

```javascript
if (!window.walker) {
  window.walker = new GraphWalker(...);
}
```

### 2. Fade for Trails

Use gradual fade for smooth trails:

```javascript
led.color.r = Math.max(0, led.color.r - 10);  // Not led.color.r = 0
```

### 3. Handle Null Values

Always check LED indices:

```javascript
const ledIndex = walker.getCurrentLEDIndex();
if (ledIndex !== null && leds[ledIndex]) {
  // Safe to use
}
```

### 4. Performance

Multiple walkers can impact performance. For complex shapes:
- Limit to 3-5 walkers
- Reduce nearby LED radius
- Increase fade rate to limit lit LEDs

### 5. Reset on Shape Change

If shapes can change, reset walkers:

```javascript
if (window.lastShapeName !== shape.name) {
  window.walker = new GraphWalker(buildGraphFromShape(shape));
  window.lastShapeName = shape.name;
}
```

## Shape Compatibility

### Works Best With

- **Cube**: 8 nodes, 12 edges - perfect graph
- **Hexagonal Cylinder**: 12 nodes, 18 edges - great structure
- **Pyramid**: 5 nodes, 8 edges - simple but effective
- **Star**: 10 nodes, 10 edges - interesting paths

### Limited Support

- **Line**: Only 2 nodes - walker just bounces back and forth
- **Single Strip**: No graph structure
- **Disconnected shapes**: Walkers can't cross gaps

## Troubleshooting

### Walker Not Moving

- Check graph has nodes: `console.log(window.graph.nodes.size)`
- Verify walker speed > 0
- Ensure `walker.update()` is called each frame

### LEDs Not Lighting

- Check LED indices are valid
- Verify nearby radius is reasonable (3-10)
- Ensure colors are being set (0-255 range)

### Performance Issues

- Reduce number of walkers
- Decrease nearby LED radius
- Increase fade rate
- Simplify shape (fewer strips)

## Future Enhancements

Potential features to add:
- Weighted edge selection (prefer certain paths)
- Pathfinding between nodes
- Walker collision interactions
- Graph visualization overlay
- Custom graph definitions (not auto-generated)

