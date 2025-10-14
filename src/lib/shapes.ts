import { createStrip, buildShape, createCube } from './shapeBuilder';

// Predefined shape templates as code strings
export const cubeShape = `// Cube with 50 LEDs per edge
const shape = createCube(50);
return shape;`;

export const lineShape = `// Simple line
const strips = [
  createStrip('line', { x: -25, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 100, 0)
];
return buildShape('Line', strips);`;

export const squareShape = `// Square in XY plane
const ledsPerEdge = 50;
const half = (ledsPerEdge - 1) / 2;
const strips = [
  createStrip('bottom', { x: -half, y: -half, z: 0 }, { x: 1, y: 0, z: 0 }, ledsPerEdge, 0),
  createStrip('right', { x: half, y: -half, z: 0 }, { x: 0, y: 1, z: 0 }, ledsPerEdge, ledsPerEdge),
  createStrip('top', { x: half, y: half, z: 0 }, { x: -1, y: 0, z: 0 }, ledsPerEdge, ledsPerEdge * 2),
  createStrip('left', { x: -half, y: half, z: 0 }, { x: 0, y: -1, z: 0 }, ledsPerEdge, ledsPerEdge * 3),
];
return buildShape('Square', strips);`;

export const pyramidShape = `// Pyramid
const ledsPerEdge = 40;
const base = 25;
const strips = [
  // Base
  createStrip('base-1', { x: -base, y: -20, z: base }, { x: 1, y: 0, z: 0 }, ledsPerEdge, 0),
  createStrip('base-2', { x: base, y: -20, z: base }, { x: 0, y: 0, z: -1 }, ledsPerEdge, ledsPerEdge),
  createStrip('base-3', { x: base, y: -20, z: -base }, { x: -1, y: 0, z: 0 }, ledsPerEdge, ledsPerEdge * 2),
  createStrip('base-4', { x: -base, y: -20, z: -base }, { x: 0, y: 0, z: 1 }, ledsPerEdge, ledsPerEdge * 3),
  
  // Edges to apex at (0, 30, 0)
  createStrip('edge-1', { x: -base, y: -20, z: base }, { x: 0.5, y: 1, z: -0.5 }, ledsPerEdge, ledsPerEdge * 4),
  createStrip('edge-2', { x: base, y: -20, z: base }, { x: -0.5, y: 1, z: -0.5 }, ledsPerEdge, ledsPerEdge * 5),
  createStrip('edge-3', { x: base, y: -20, z: -base }, { x: -0.5, y: 1, z: 0.5 }, ledsPerEdge, ledsPerEdge * 6),
  createStrip('edge-4', { x: -base, y: -20, z: -base }, { x: 0.5, y: 1, z: 0.5 }, ledsPerEdge, ledsPerEdge * 7),
];
return buildShape('Pyramid', strips);`;

export const helixShape = `// Helix spiral
const turns = 3;
const segments = 20;
const radius = 15;
const height = 50;
const ledsPerSegment = 10;

const strips = Array.from({ length: segments }, (_, i) => {
  const angle = (i / segments) * Math.PI * 2 * turns;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = (i / segments) * height - height / 2;
  
  const nextAngle = ((i + 1) / segments) * Math.PI * 2 * turns;
  const dx = Math.cos(nextAngle) * radius - x;
  const dz = Math.sin(nextAngle) * radius - z;
  const dy = height / segments;
  
  return createStrip(
    \`helix-\${i}\`,
    { x, y, z },
    { x: dx, y: dy, z: dz },
    ledsPerSegment,
    i * ledsPerSegment
  );
});

return buildShape('Helix', strips);`;

export const starShape = `// Star (5-pointed)
const points = 5;
const outerRadius = 25;
const innerRadius = 12;
const ledsPerEdge = 30;
const strips = [];
let ledIndex = 0;

for (let i = 0; i < points * 2; i++) {
  const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
  const radius = i % 2 === 0 ? outerRadius : innerRadius;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const nextAngle = ((i + 1) / (points * 2)) * Math.PI * 2 - Math.PI / 2;
  const nextRadius = (i + 1) % 2 === 0 ? outerRadius : innerRadius;
  const nextX = Math.cos(nextAngle) * nextRadius;
  const nextZ = Math.sin(nextAngle) * nextRadius;
  
  strips.push(createStrip(
    \`star-\${i}\`,
    { x, y: 0, z },
    { x: nextX - x, y: 0, z: nextZ - z },
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

return buildShape('Star', strips);`;

export const sphereShape = `// Sphere (approximated with latitude/longitude lines)
const latLines = 8;
const longLines = 12;
const radius = 20;
const ledsPerLine = 30;
const strips = [];
let ledIndex = 0;

// Latitude lines (horizontal circles)
for (let lat = 1; lat < latLines; lat++) {
  const phi = (lat / latLines) * Math.PI;
  const y = Math.cos(phi) * radius;
  const ringRadius = Math.sin(phi) * radius;
  
  const segments = 20;
  for (let seg = 0; seg < segments; seg++) {
    const angle = (seg / segments) * Math.PI * 2;
    const x = Math.cos(angle) * ringRadius;
    const z = Math.sin(angle) * ringRadius;
    
    const nextAngle = ((seg + 1) / segments) * Math.PI * 2;
    const dx = Math.cos(nextAngle) * ringRadius - x;
    const dz = Math.sin(nextAngle) * ringRadius - z;
    
    strips.push(createStrip(
      \`lat-\${lat}-\${seg}\`,
      { x, y, z },
      { x: dx, y: 0, z: dz },
      Math.ceil(ledsPerLine / segments),
      ledIndex
    ));
    ledIndex += Math.ceil(ledsPerLine / segments);
  }
}

// Longitude lines (vertical semicircles)
for (let long = 0; long < longLines; long++) {
  const theta = (long / longLines) * Math.PI * 2;
  const segments = 15;
  
  for (let seg = 0; seg < segments; seg++) {
    const phi = (seg / segments) * Math.PI;
    const y = Math.cos(phi) * radius;
    const ringRadius = Math.sin(phi) * radius;
    const x = Math.cos(theta) * ringRadius;
    const z = Math.sin(theta) * ringRadius;
    
    const nextPhi = ((seg + 1) / segments) * Math.PI;
    const nextY = Math.cos(nextPhi) * radius;
    const nextRingRadius = Math.sin(nextPhi) * radius;
    const nextX = Math.cos(theta) * nextRingRadius;
    const nextZ = Math.sin(theta) * nextRingRadius;
    
    strips.push(createStrip(
      \`long-\${long}-\${seg}\`,
      { x, y, z },
      { x: nextX - x, y: nextY - y, z: nextZ - z },
      Math.ceil(ledsPerLine / segments),
      ledIndex
    ));
    ledIndex += Math.ceil(ledsPerLine / segments);
  }
}

return buildShape('Sphere', strips);`;

export const hexagonalCylinder = `// Hexagonal Cylinder
const ledsPerEdge = 35;
const radius = 20;
const height = 40;
const strips = [];
let ledIndex = 0;

// Calculate hexagon vertices
const vertices = [];
for (let i = 0; i < 6; i++) {
  const angle = (i / 6) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  vertices.push({ x, z });
}

// Bottom hexagon edges (6 strips)
for (let i = 0; i < 6; i++) {
  const start = vertices[i];
  const end = vertices[(i + 1) % 6];
  const direction = {
    x: end.x - start.x,
    y: 0,
    z: end.z - start.z
  };
  
  strips.push(createStrip(
    \`bottom-edge-\${i}\`,
    { x: start.x, y: -height / 2, z: start.z },
    direction,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Top hexagon edges (6 strips)
for (let i = 0; i < 6; i++) {
  const start = vertices[i];
  const end = vertices[(i + 1) % 6];
  const direction = {
    x: end.x - start.x,
    y: 0,
    z: end.z - start.z
  };
  
  strips.push(createStrip(
    \`top-edge-\${i}\`,
    { x: start.x, y: height / 2, z: start.z },
    direction,
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

// Vertical edges (6 strips)
for (let i = 0; i < 6; i++) {
  const vertex = vertices[i];
  
  strips.push(createStrip(
    \`vertical-edge-\${i}\`,
    { x: vertex.x, y: -height / 2, z: vertex.z },
    { x: 0, y: 1, z: 0 },
    ledsPerEdge,
    ledIndex
  ));
  ledIndex += ledsPerEdge;
}

return buildShape('Hexagonal Cylinder', strips);`;

export const defaultShapes = {
  'Cube': cubeShape,
  'Line': lineShape,
  'Square': squareShape,
  'Pyramid': pyramidShape,
  'Helix': helixShape,
  'Star': starShape,
  'Sphere': sphereShape,
  'Hexagonal Cylinder': hexagonalCylinder,
};

