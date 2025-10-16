import { LEDShape, Vector3D, GraphNode, GraphEdge, ShapeGraph } from '@/types/led';

/**
 * Build a directed graph from an LED shape
 * Converts the shape's nodes and edges into a graph structure for navigation
 */
export function buildGraphFromShape(shape: LEDShape): ShapeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const nodePositions = new Map<string, Vector3D>();
  
  // Convert shape nodes to graph nodes
  shape.nodes.forEach((node, id) => {
    const connectedEdges: string[] = [];
    
    // Collect all edges connected to this node
    shape.edges.forEach((edge, edgeId) => {
      if (edge.fromNodeId === id || edge.toNodeId === id) {
        connectedEdges.push(edgeId);
      }
    });
    
    nodes.set(id, {
      id,
      position: node.position,
      connectedEdges,
    });
    
    nodePositions.set(id, node.position);
  });
  
  // Convert shape edges to graph edges
  shape.edges.forEach((edge, id) => {
    const ledIndices: number[] = [];
    for (let i = 0; i < edge.ledCount; i++) {
      ledIndices.push(edge.startIndex + i);
    }
    
    edges.set(id, {
      id,
      fromNode: edge.fromNodeId,
      toNode: edge.toNodeId,
      stripId: edge.id,
      ledIndices,
      length: edge.ledCount,
      bidirectional: true, // All edges are bidirectional by default
    });
  });
  
  return {
    nodes,
    edges,
    nodePositions,
  };
}

/**
 * Get all edges that can be traversed from a node
 * Excludes the edge we came from (to avoid immediate backtracking)
 */
export function getAvailableEdges(
  graph: ShapeGraph,
  nodeId: string,
  excludeEdgeId?: string
): GraphEdge[] {
  const node = graph.nodes.get(nodeId);
  if (!node) return [];
  
  return node.connectedEdges
    .filter(edgeId => edgeId !== excludeEdgeId)
    .map(edgeId => graph.edges.get(edgeId))
    .filter((edge): edge is GraphEdge => edge !== undefined);
}

/**
 * Select a random edge from available edges
 */
export function selectRandomEdge(edges: GraphEdge[]): GraphEdge | null {
  if (edges.length === 0) return null;
  return edges[Math.floor(Math.random() * edges.length)];
}

/**
 * Get the destination node when traversing an edge from a source node
 */
export function getEdgeDestination(edge: GraphEdge, fromNodeId: string): string {
  if (edge.fromNode === fromNodeId) {
    return edge.toNode;
  } else if (edge.toNode === fromNodeId && edge.bidirectional) {
    return edge.fromNode;
  }
  return edge.toNode; // Fallback
}

/**
 * Get LED indices along an edge, ordered from source to destination
 */
export function getEdgeLEDs(edge: GraphEdge, fromNodeId: string): number[] {
  const indices = [...edge.ledIndices];
  
  // Reverse if traversing backwards
  if (edge.toNode === fromNodeId && edge.bidirectional) {
    indices.reverse();
  }
  
  return indices;
}

