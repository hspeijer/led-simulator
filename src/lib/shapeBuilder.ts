import { LEDShape, LEDStrip, Vector3D, LED } from '@/types/led';

/**
 * Normalizes a vector to unit length
 */
export function normalize(v: Vector3D): Vector3D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

/**
 * Creates a LED strip definition
 */
export function createStrip(
  id: string,
  start: Vector3D,
  direction: Vector3D,
  ledCount: number,
  startIndex: number
): LEDStrip {
  return {
    id,
    startPoint: start,
    direction: normalize(direction),
    ledCount,
    startIndex,
  };
}

/**
 * Builds a complete LED shape from strips
 */
export function buildShape(name: string, strips: LEDStrip[]): LEDShape {
  const totalLEDs = strips.reduce((sum, strip) => sum + strip.ledCount, 0);
  return {
    name,
    strips,
    totalLEDs,
  };
}

/**
 * Generates actual LED positions from a shape definition
 */
export function generateLEDs(shape: LEDShape): LED[] {
  const leds: LED[] = [];
  
  shape.strips.forEach((strip) => {
    const spacing = 1.0; // Distance between LEDs
    
    for (let i = 0; i < strip.ledCount; i++) {
      const position: Vector3D = {
        x: strip.startPoint.x + strip.direction.x * i * spacing,
        y: strip.startPoint.y + strip.direction.y * i * spacing,
        z: strip.startPoint.z + strip.direction.z * i * spacing,
      };
      
      leds.push({
        position,
        color: { r: 0, g: 0, b: 0 },
        stripId: strip.id,
        index: strip.startIndex + i,
        localIndex: i,
      });
    }
  });
  
  return leds;
}

/**
 * Creates a cube shape with specified LEDs per edge
 */
export function createCube(ledsPerEdge: number): LEDShape {
  const size = ledsPerEdge - 1; // Actual size in units
  const half = size / 2;
  
  const strips: LEDStrip[] = [];
  let ledIndex = 0;
  
  // Bottom face edges (4 strips)
  strips.push(createStrip('bottom-front', { x: -half, y: -half, z: half }, { x: 1, y: 0, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('bottom-right', { x: half, y: -half, z: half }, { x: 0, y: 0, z: -1 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('bottom-back', { x: half, y: -half, z: -half }, { x: -1, y: 0, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('bottom-left', { x: -half, y: -half, z: -half }, { x: 0, y: 0, z: 1 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  // Top face edges (4 strips)
  strips.push(createStrip('top-front', { x: -half, y: half, z: half }, { x: 1, y: 0, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('top-right', { x: half, y: half, z: half }, { x: 0, y: 0, z: -1 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('top-back', { x: half, y: half, z: -half }, { x: -1, y: 0, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('top-left', { x: -half, y: half, z: -half }, { x: 0, y: 0, z: 1 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  // Vertical edges (4 strips)
  strips.push(createStrip('vertical-front-left', { x: -half, y: -half, z: half }, { x: 0, y: 1, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('vertical-front-right', { x: half, y: -half, z: half }, { x: 0, y: 1, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('vertical-back-right', { x: half, y: -half, z: -half }, { x: 0, y: 1, z: 0 }, ledsPerEdge, ledIndex));
  ledIndex += ledsPerEdge;
  
  strips.push(createStrip('vertical-back-left', { x: -half, y: -half, z: -half }, { x: 0, y: 1, z: 0 }, ledsPerEdge, ledIndex));
  
  return buildShape('Cube', strips);
}

