// DSL for LED strip shapes
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface LEDStrip {
  id: string;
  startPoint: Vector3D;
  direction: Vector3D;
  ledCount: number;
  startIndex: number; // Global LED index where this strip starts
}

export interface LEDShape {
  name: string;
  strips: LEDStrip[];
  totalLEDs: number;
}

export interface LED {
  position: Vector3D;
  color: { r: number; g: number; b: number };
  stripId: string;
  index: number; // Global index
  localIndex: number; // Index within the strip
}

export type AnimationFunction = (leds: LED[], time: number) => void;

export interface AnimationPattern {
  name: string;
  code: string;
  fn: AnimationFunction;
}

