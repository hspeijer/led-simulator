// DSL for LED strip shapes
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// Node-based shape system
export interface ShapeNode {
  id: string;
  position: Vector3D;
  incomingEdges: string[]; // Edge IDs that end at this node
  outgoingEdges: string[]; // Edge IDs that start from this node
}

export interface ShapeEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  ledCount: number;
  startIndex: number; // Global LED index where this edge starts
}

export interface LEDShape {
  name: string;
  nodes: Map<string, ShapeNode>;
  edges: Map<string, ShapeEdge>;
  totalLEDs: number;
}

// Legacy strip interface (kept for backward compatibility)
export interface LEDStrip {
  id: string;
  startPoint: Vector3D;
  direction: Vector3D;
  ledCount: number;
  startIndex: number;
}

export interface LED {
  position: Vector3D;
  color: { r: number; g: number; b: number };
  stripId: string;
  index: number; // Global index
  localIndex: number; // Index within the strip
}

export type AnimationFunction = (leds: LED[], frame: number, shape: LEDShape, state?: any) => any;

export interface AnimationPattern {
  name: string;
  code: string;
  fn: AnimationFunction;
}

export interface SavedPattern {
  name: string;
  code: string;
  timestamp: number;
}

export interface SavedShape {
  name: string;
  code: string;
  timestamp: number;
}

// Graph types for shape navigation
export interface GraphNode {
  id: string;
  position: Vector3D;
  connectedEdges: string[]; // Edge IDs connected to this node
}

export interface GraphEdge {
  id: string;
  fromNode: string; // Node ID
  toNode: string;   // Node ID
  stripId: string;
  ledIndices: number[]; // LED indices along this edge
  length: number; // Number of LEDs
  bidirectional: boolean; // Can traverse in both directions
}

export interface ShapeGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  nodePositions: Map<string, Vector3D>; // Quick lookup
}

export interface GraphWalkerState {
  currentNode: string;
  previousNode: string | null;
  currentEdge: string | null;
  position: number; // 0-1 progress along current edge
  history: string[]; // Node IDs visited
}

