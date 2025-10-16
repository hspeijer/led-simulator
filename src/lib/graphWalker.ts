import { ShapeGraph, GraphWalkerState, LED } from '@/types/led';
import { 
  getAvailableEdges, 
  selectRandomEdge, 
  getEdgeDestination,
  getEdgeLEDs 
} from './graphBuilder';

/**
 * Graph Walker - navigates through a shape graph
 */
export class GraphWalker {
  private graph: ShapeGraph;
  private state: GraphWalkerState;
  private speed: number; // LEDs per update
  
  constructor(graph: ShapeGraph, startNodeId?: string, speed: number = 0.5) {
    this.graph = graph;
    this.speed = speed;
    
    // Start at a random node if not specified
    const nodeIds = Array.from(graph.nodes.keys());
    const startNode = startNodeId || nodeIds[Math.floor(Math.random() * nodeIds.length)];
    
    this.state = {
      currentNode: startNode,
      previousNode: null,
      currentEdge: null,
      position: 0,
      history: [startNode],
    };
  }
  
  /**
   * Update walker position
   */
  update(): void {
    // If we're at a node, choose next edge
    if (this.state.currentEdge === null) {
      this.chooseNextEdge();
      this.state.position = 0;
      return;
    }
    
    // Move along current edge
    const edge = this.graph.edges.get(this.state.currentEdge);
    if (!edge) {
      this.state.currentEdge = null;
      return;
    }
    
    this.state.position += this.speed / edge.length;
    
    // If we reached the end of the edge, move to next node
    if (this.state.position >= 1.0) {
      this.state.previousNode = this.state.currentNode;
      this.state.currentNode = getEdgeDestination(edge, this.state.currentNode);
      this.state.currentEdge = null;
      this.state.position = 0;
      this.state.history.push(this.state.currentNode);
      
      // Limit history size
      if (this.state.history.length > 20) {
        this.state.history.shift();
      }
    }
  }
  
  /**
   * Choose next edge to traverse
   */
  private chooseNextEdge(): void {
    const availableEdges = getAvailableEdges(
      this.graph,
      this.state.currentNode,
      this.state.currentEdge || undefined
    );
    
    const nextEdge = selectRandomEdge(availableEdges);
    if (nextEdge) {
      this.state.currentEdge = nextEdge.id;
    }
  }
  
  /**
   * Get current LED index
   */
  getCurrentLEDIndex(): number | null {
    if (!this.state.currentEdge) return null;
    
    const edge = this.graph.edges.get(this.state.currentEdge);
    if (!edge) return null;
    
    const leds = getEdgeLEDs(edge, this.state.currentNode);
    const index = Math.floor(this.state.position * leds.length);
    
    return leds[Math.min(index, leds.length - 1)];
  }
  
  /**
   * Get LEDs within a radius of current position
   */
  getNearbyLEDs(radius: number): number[] {
    if (!this.state.currentEdge) return [];
    
    const edge = this.graph.edges.get(this.state.currentEdge);
    if (!edge) return [];
    
    const leds = getEdgeLEDs(edge, this.state.currentNode);
    const centerIndex = Math.floor(this.state.position * leds.length);
    
    const nearby: number[] = [];
    for (let i = Math.max(0, centerIndex - radius); i < Math.min(leds.length, centerIndex + radius + 1); i++) {
      nearby.push(leds[i]);
    }
    
    return nearby;
  }
  
  /**
   * Get walker state (for debugging)
   */
  getState(): GraphWalkerState {
    return { ...this.state };
  }
  
  /**
   * Set walker speed
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }
  
  /**
   * Reset walker to a new start position
   */
  reset(startNodeId?: string): void {
    const nodeIds = Array.from(this.graph.nodes.keys());
    const startNode = startNodeId || nodeIds[Math.floor(Math.random() * nodeIds.length)];
    
    this.state = {
      currentNode: startNode,
      previousNode: null,
      currentEdge: null,
      position: 0,
      history: [startNode],
    };
  }
}

/**
 * Helper function to create a walker from a shape (includes graph building)
 */
export function createWalkerFromShape(
  shape: any,
  startNodeId?: string,
  speed: number = 0.5
): { walker: GraphWalker; graph: ShapeGraph } {
  const { buildGraphFromShape } = require('./graphBuilder');
  const graph = buildGraphFromShape(shape);
  const walker = new GraphWalker(graph, startNodeId, speed);
  
  return { walker, graph };
}

