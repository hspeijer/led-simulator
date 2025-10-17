import { createNode, createEdge, buildShape } from './shapeBuilder';

// Predefined shape templates as code strings
export const cubeShape = `// Cube with 50 LEDs per edge
const ledsPerEdge = 50;
const size = ledsPerEdge - 1;
const half = size / 2;

// Create 8 corner nodes of the cube
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

// Create 12 edges connecting the nodes
// Each edge tracks its startIndex in the global LED array
// Edge format: createEdge(id, fromNodeId, toNodeId, ledCount, startIndex)
let ledIndex = 0;
const edges = [
  // Bottom face edges (LEDs 0-199)
  createEdge('bottom-front', 'bottom-front-left', 'bottom-front-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 50
  createEdge('bottom-right', 'bottom-front-right', 'bottom-back-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 100
  createEdge('bottom-back', 'bottom-back-right', 'bottom-back-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 150
  createEdge('bottom-left', 'bottom-back-left', 'bottom-front-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 200
  
  // Top face edges (LEDs 200-399)
  createEdge('top-front', 'top-front-left', 'top-front-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 250
  createEdge('top-right', 'top-front-right', 'top-back-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 300
  createEdge('top-back', 'top-back-right', 'top-back-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 350
  createEdge('top-left', 'top-back-left', 'top-front-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 400
  
  // Vertical edges (LEDs 400-599)
  createEdge('vertical-front-left', 'bottom-front-left', 'top-front-left', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 450
  createEdge('vertical-front-right', 'bottom-front-right', 'top-front-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 500
  createEdge('vertical-back-right', 'bottom-back-right', 'top-back-right', ledsPerEdge, ledIndex),
  ledIndex += ledsPerEdge,  // Now at 550
  createEdge('vertical-back-left', 'bottom-back-left', 'top-back-left', ledsPerEdge, ledIndex),
  // Total: 600 LEDs (12 edges × 50 LEDs per edge)
];

return buildShape('Cube', nodes, edges.filter(e => typeof e !== 'number'));`;

export const hexagonalCylinderShape = `// Hexagonal Cylinder with 35 LEDs per edge
// Points: A,B,C,D,E,F (bottom), G,H,I,J,K,L (top)
// Path: A->G->H->B->I->C->J->D->K->E->L->F->E->D->C->B->A->F
const ledsPerEdge = 35;
const radius = 35;
const height = 35;

// Calculate hexagon vertices (6 corners) - clockwise when viewed from top
const vertices = [];
for (let i = 0; i < 6; i++) {
  const angle = -(i / 6) * Math.PI * 2; // Negative for clockwise
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  vertices.push({ x, z });
}

// Create 12 nodes (6 bottom + 6 top)
// Bottom: A=0, B=1, C=2, D=3, E=4, F=5
// Top: G=0, H=1, I=2, J=3, K=4, L=5
const nodes = [];

// Bottom hexagon nodes (A, B, C, D, E, F)
for (let i = 0; i < 6; i++) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  nodes.push(createNode(\`bottom-\${i}-\${labels[i]}\`, {
    x: vertices[i].x,
    y: -height / 2,
    z: vertices[i].z
  }));
}

// Top hexagon nodes (G, H, I, J, K, L)
for (let i = 0; i < 6; i++) {
  const labels = ['G', 'H', 'I', 'J', 'K', 'L'];
  nodes.push(createNode(\`top-\${i}-\${labels[i]}\`, {
    x: vertices[i].x,
    y: height / 2,
    z: vertices[i].z
  }));
}

// Create edges following the specific path
// Path: A->G->H->B->I->C->J->D->K->E->L->F->E->D->C->B->A->F
let ledIndex = 0;
const edges = [];

// Helper to create edge with bottom/top prefix
const b = (i) => \`bottom-\${i}-\${['A','B','C','D','E','F'][i]}\`;
const t = (i) => \`top-\${i}-\${['G','H','I','J','K','L'][i]}\`;

// Path sequence:
edges.push(createEdge('A-G', b(0), t(0), 47, ledIndex)); ledIndex += 47; // A->G
edges.push(createEdge('G-H', t(0), t(1), 48, ledIndex)); ledIndex += 48; // G->H
edges.push(createEdge('H-B', t(1), b(1), 48, ledIndex)); ledIndex += 48; // H->B
edges.push(createEdge('B-I', t(1), t(2), 48, ledIndex)); ledIndex += 48; // B->I
edges.push(createEdge('I-C', t(2), b(2), 49, ledIndex)); ledIndex += 49; // I->C
edges.push(createEdge('C-J', t(2), t(3), 50, ledIndex)); ledIndex += 50; // C->J
edges.push(createEdge('J-D', t(3), b(3), 49, ledIndex)); ledIndex += 49; // J->D
edges.push(createEdge('D-K', t(3), t(4), 48, ledIndex)); ledIndex += 48; // D->K
edges.push(createEdge('K-E', t(4), b(4), 49, ledIndex)); ledIndex += 49; // K->E
edges.push(createEdge('E-L', t(4), t(5), 48, ledIndex)); ledIndex += 48; // E->L
edges.push(createEdge('L-G', t(5), t(0), 49, ledIndex)); ledIndex += 49; // F->E
edges.push(createEdge('L-F', t(5), b(5), 48, ledIndex)); ledIndex += 48; // L->F
edges.push(createEdge('F-E', b(5), b(0), 49, ledIndex)); ledIndex += 49; // F->E
edges.push(createEdge('E-D', b(0), b(1), 48, ledIndex)); ledIndex += 48; // E->D
edges.push(createEdge('D-C', b(1), b(2), 49, ledIndex)); ledIndex += 49; // D->C
edges.push(createEdge('C-B', b(2), b(3), 49, ledIndex)); ledIndex += 49; // C->B
edges.push(createEdge('B-A', b(3), b(4), 47, ledIndex)); ledIndex += 47; // B->A
edges.push(createEdge('A-F', b(4), b(5), 48, ledIndex)); ledIndex += 48; // A->F

return buildShape('Hexagonal Cylinder', nodes, edges);
`;

export const ballShape = `// Ball (Sphere) with 20 LEDs per edge
const ledsPerEdge = 20;
const radius = 30;
const segments = 6; // Number of vertical segments (longitude lines)

// Create nodes for the sphere
const nodes = [];

// Top pole
nodes.push(createNode('top-pole', { x: 0, y: radius, z: 0 }));

// Upper ring (60 degrees latitude)
const upperY = radius * Math.cos(Math.PI / 3);
const upperRadius = radius * Math.sin(Math.PI / 3);
for (let i = 0; i < segments; i++) {
  const angle = (i / segments) * Math.PI * 2;
  nodes.push(createNode(\`upper-\${i}\`, {
    x: Math.cos(angle) * upperRadius,
    y: upperY,
    z: Math.sin(angle) * upperRadius
  }));
}

// Equator ring (0 degrees latitude)
for (let i = 0; i < segments; i++) {
  const angle = (i / segments) * Math.PI * 2;
  nodes.push(createNode(\`equator-\${i}\`, {
    x: Math.cos(angle) * radius,
    y: 0,
    z: Math.sin(angle) * radius
  }));
}

// Lower ring (-60 degrees latitude)
const lowerY = -radius * Math.cos(Math.PI / 3);
const lowerRadius = radius * Math.sin(Math.PI / 3);
for (let i = 0; i < segments; i++) {
  const angle = (i / segments) * Math.PI * 2;
  nodes.push(createNode(\`lower-\${i}\`, {
    x: Math.cos(angle) * lowerRadius,
    y: lowerY,
    z: Math.sin(angle) * lowerRadius
  }));
}

// Bottom pole
nodes.push(createNode('bottom-pole', { x: 0, y: -radius, z: 0 }));

// Create edges
let ledIndex = 0;
const edges = [];

// Edges from top pole to upper ring
for (let i = 0; i < segments; i++) {
  edges.push(createEdge(
    \`top-to-upper-\${i}\`,
    'top-pole',
    \`upper-\${i}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Edges around upper ring
for (let i = 0; i < segments; i++) {
  const nextI = (i + 1) % segments;
  edges.push(createEdge(
    \`upper-ring-\${i}\`,
    \`upper-\${i}\`,
    \`upper-\${nextI}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Edges from upper ring to equator
for (let i = 0; i < segments; i++) {
  edges.push(createEdge(
    \`upper-to-equator-\${i}\`,
    \`upper-\${i}\`,
    \`equator-\${i}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Edges around equator
for (let i = 0; i < segments; i++) {
  const nextI = (i + 1) % segments;
  edges.push(createEdge(
    \`equator-ring-\${i}\`,
    \`equator-\${i}\`,
    \`equator-\${nextI}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Edges from equator to lower ring
for (let i = 0; i < segments; i++) {
  edges.push(createEdge(
    \`equator-to-lower-\${i}\`,
    \`equator-\${i}\`,
    \`lower-\${i}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Edges around lower ring
for (let i = 0; i < segments; i++) {
  const nextI = (i + 1) % segments;
  edges.push(createEdge(
    \`lower-ring-\${i}\`,
    \`lower-\${i}\`,
    \`lower-\${nextI}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Edges from lower ring to bottom pole
for (let i = 0; i < segments; i++) {
  edges.push(createEdge(
    \`lower-to-bottom-\${i}\`,
    \`lower-\${i}\`,
    'bottom-pole',
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Total: 840 LEDs (42 edges × 20 LEDs per edge)
return buildShape('Ball', nodes, edges);`;

export const dodecahedronShape = `// Dodecahedron with 25 LEDs per edge
const ledsPerEdge = 25;
const radius = 30;

// Golden ratio for dodecahedron vertex calculations
const phi = (1 + Math.sqrt(5)) / 2;
const invPhi = 1 / phi;

// Scale factor to achieve desired radius
const scale = radius / Math.sqrt(3);

// 20 vertices of a dodecahedron
const vertices = [
  // Cube vertices (±1, ±1, ±1) scaled
  { x: scale, y: scale, z: scale },
  { x: scale, y: scale, z: -scale },
  { x: scale, y: -scale, z: scale },
  { x: scale, y: -scale, z: -scale },
  { x: -scale, y: scale, z: scale },
  { x: -scale, y: scale, z: -scale },
  { x: -scale, y: -scale, z: scale },
  { x: -scale, y: -scale, z: -scale },
  // Rectangle vertices (0, ±1/φ, ±φ) and rotations
  { x: 0, y: scale * invPhi, z: scale * phi },
  { x: 0, y: scale * invPhi, z: -scale * phi },
  { x: 0, y: -scale * invPhi, z: scale * phi },
  { x: 0, y: -scale * invPhi, z: -scale * phi },
  { x: scale * invPhi, y: scale * phi, z: 0 },
  { x: scale * invPhi, y: -scale * phi, z: 0 },
  { x: -scale * invPhi, y: scale * phi, z: 0 },
  { x: -scale * invPhi, y: -scale * phi, z: 0 },
  { x: scale * phi, y: 0, z: scale * invPhi },
  { x: scale * phi, y: 0, z: -scale * invPhi },
  { x: -scale * phi, y: 0, z: scale * invPhi },
  { x: -scale * phi, y: 0, z: -scale * invPhi }
];

// Create 20 nodes
const nodes = [];
for (let i = 0; i < vertices.length; i++) {
  nodes.push(createNode(\`v\${i}\`, vertices[i]));
}

// Define 30 edges (connecting vertices that are adjacent on the dodecahedron)
const edgeConnections = [
  [0, 8], [0, 12], [0, 16],
  [1, 9], [1, 12], [1, 17],
  [2, 10], [2, 13], [2, 16],
  [3, 11], [3, 13], [3, 17],
  [4, 8], [4, 14], [4, 18],
  [5, 9], [5, 14], [5, 19],
  [6, 10], [6, 15], [6, 18],
  [7, 11], [7, 15], [7, 19],
  [8, 10],
  [9, 11],
  [12, 14],
  [13, 15],
  [16, 17],
  [18, 19]
];

let ledIndex = 0;
const edges = [];

for (let i = 0; i < edgeConnections.length; i++) {
  const [from, to] = edgeConnections[i];
  edges.push(createEdge(
    \`edge-\${i}\`,
    \`v\${from}\`,
    \`v\${to}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Total: 750 LEDs (30 edges × 25 LEDs per edge)
return buildShape('Dodecahedron', nodes, edges);`;

export const icosahedronShape = `// Icosahedron with 25 LEDs per edge
const ledsPerEdge = 25;
const radius = 30;

// Golden ratio for icosahedron vertex calculations
const phi = (1 + Math.sqrt(5)) / 2;

// Scale factor to achieve desired radius
const scale = radius / Math.sqrt(1 + phi * phi);

// 12 vertices of an icosahedron
const vertices = [
  // Rectangle in XY plane
  { x: 0, y: scale, z: scale * phi },
  { x: 0, y: scale, z: -scale * phi },
  { x: 0, y: -scale, z: scale * phi },
  { x: 0, y: -scale, z: -scale * phi },
  // Rectangle in YZ plane
  { x: scale, y: scale * phi, z: 0 },
  { x: scale, y: -scale * phi, z: 0 },
  { x: -scale, y: scale * phi, z: 0 },
  { x: -scale, y: -scale * phi, z: 0 },
  // Rectangle in XZ plane
  { x: scale * phi, y: 0, z: scale },
  { x: scale * phi, y: 0, z: -scale },
  { x: -scale * phi, y: 0, z: scale },
  { x: -scale * phi, y: 0, z: -scale }
];

// Create 12 nodes
const nodes = [];
for (let i = 0; i < vertices.length; i++) {
  nodes.push(createNode(\`v\${i}\`, vertices[i]));
}

// Define 30 edges (connecting vertices that are adjacent on the icosahedron)
const edgeConnections = [
  [0, 2], [0, 4], [0, 6], [0, 8], [0, 10],
  [1, 3], [1, 4], [1, 6], [1, 9], [1, 11],
  [2, 5], [2, 7], [2, 8], [2, 10],
  [3, 5], [3, 7], [3, 9], [3, 11],
  [4, 6], [4, 8], [4, 9],
  [5, 7], [5, 8], [5, 9],
  [6, 10], [6, 11],
  [7, 10], [7, 11],
  [8, 9],
  [10, 11]
];

let ledIndex = 0;
const edges = [];

for (let i = 0; i < edgeConnections.length; i++) {
  const [from, to] = edgeConnections[i];
  edges.push(createEdge(
    \`edge-\${i}\`,
    \`v\${from}\`,
    \`v\${to}\`,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Total: 750 LEDs (30 edges × 25 LEDs per edge)
return buildShape('Icosahedron', nodes, edges);`;

export const defaultShapes = {
  'Cube': cubeShape,
  'Hexagonal Cylinder': hexagonalCylinderShape,
  'Ball': ballShape,
  'Dodecahedron': dodecahedronShape,
  'Icosahedron': icosahedronShape,
};

