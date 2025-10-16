import { LEDShape, ShapeNode, ShapeEdge, Vector3D, LED } from '@/types/led';

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
 * Creates a node at a specific position
 */
export function createNode(id: string, position: Vector3D): ShapeNode {
  return {
    id,
    position,
    incomingEdges: [],
    outgoingEdges: [],
  };
}

/**
 * Creates an edge between two nodes with a specific number of LEDs
 */
export function createEdge(
  id: string,
  fromNodeId: string,
  toNodeId: string,
  ledCount: number,
  startIndex: number
): ShapeEdge {
  return {
    id,
    fromNodeId,
    toNodeId,
    ledCount,
    startIndex,
  };
}

/**
 * Builds a complete LED shape from nodes and edges
 */
export function buildShape(
  name: string,
  nodes: ShapeNode[],
  edges: ShapeEdge[]
): LEDShape {
  const nodeMap = new Map<string, ShapeNode>();
  const edgeMap = new Map<string, ShapeEdge>();
  
  // Add all nodes to the map
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });
  
  // Add all edges and update node connections
  edges.forEach(edge => {
    edgeMap.set(edge.id, edge);
    
    // Update incoming/outgoing edges for nodes
    const fromNode = nodeMap.get(edge.fromNodeId);
    const toNode = nodeMap.get(edge.toNodeId);
    
    if (fromNode) {
      fromNode.outgoingEdges.push(edge.id);
    }
    if (toNode) {
      toNode.incomingEdges.push(edge.id);
    }
  });
  
  const totalLEDs = edges.reduce((sum, edge) => sum + edge.ledCount, 0);
  
  return {
    name,
    nodes: nodeMap,
    edges: edgeMap,
    totalLEDs,
  };
}

/**
 * Generates actual LED positions from a shape definition
 * Returns a sequential array of LEDs with 3D positions ready for Three.js
 */
export function generateLEDs(shape: LEDShape): LED[] {
  const leds: LED[] = [];
  
  shape.edges.forEach((edge) => {
    const fromNode = shape.nodes.get(edge.fromNodeId);
    const toNode = shape.nodes.get(edge.toNodeId);
    
    if (!fromNode || !toNode) {
      console.error(`Edge ${edge.id} references missing nodes`);
      return;
    }
    
    // Calculate direction vector from start to end
    const dx = toNode.position.x - fromNode.position.x;
    const dy = toNode.position.y - fromNode.position.y;
    const dz = toNode.position.z - fromNode.position.z;
    
    // Distribute LEDs evenly along the edge
    for (let i = 0; i < edge.ledCount; i++) {
      const t = edge.ledCount === 1 ? 0.5 : i / (edge.ledCount - 1);
      
      const position: Vector3D = {
        x: fromNode.position.x + dx * t,
        y: fromNode.position.y + dy * t,
        z: fromNode.position.z + dz * t,
      };
      
      leds.push({
        position,
        color: { r: 255, g: 255, b: 255 }, // Default to white
        stripId: edge.id,
        index: edge.startIndex + i,
        localIndex: i,
      });
    }
  });
  
  return leds;
}

