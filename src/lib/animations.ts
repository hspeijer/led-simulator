import { LED } from '@/types/led';

/**
 * Sample animation patterns
 */

// Rainbow wave animation
export const rainbowWave = `// Rainbow Wave Animation
function animate(leds, frame, shape) {
  leds.forEach((led, index) => {
    const hue = (index / shape.totalLEDs + frame * 0.01) % 1.0;
    const rgb = hslToRgb(hue, 1.0, 0.5);
    led.color.r = rgb.r;
    led.color.g = rgb.g;
    led.color.b = rgb.b;
  });
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}`;

// Running lights
export const runningLights = `// Running Lights Animation
function animate(leds, frame, shape) {
  const position = (frame * 0.5) % shape.totalLEDs;
  
  leds.forEach((led, index) => {
    const distance = Math.abs(index - position);
    const wrappedDistance = Math.min(distance, shape.totalLEDs - distance);
    const intensity = Math.max(0, 1 - wrappedDistance / 5);
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 50);
    led.color.b = Math.floor(intensity * 50);
  });
}`;

// Edge Walker animation
export const edgeWalker = `// Edge Walker Animation
// Walks through edges, choosing random paths at each node

function animate(leds, frame, shape) {
  // Initialize walker state (only once)
  if (!window.edgeWalker) {
    // Get first edge to start with
    const firstEdgeId = Array.from(shape.edges.keys())[0];
    const firstEdge = shape.edges.get(firstEdgeId);
    
    window.edgeWalker = {
      currentEdgeId: firstEdgeId,
      ledPositionInEdge: 0,
      speed: 2, // LEDs per frame
      previousNodeId: firstEdge.fromNodeId,
      tailLength: 15
    };
  }
  
  const walker = window.edgeWalker;
  
  // Fade all LEDs
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 10);
    led.color.g = Math.max(0, led.color.g - 10);
    led.color.b = Math.max(0, led.color.b - 10);
  });
  
  // Get current edge
  const currentEdge = shape.edges.get(walker.currentEdgeId);
  if (!currentEdge) return;
  
  // Calculate current LED index
  const currentLedIndex = currentEdge.startIndex + Math.floor(walker.ledPositionInEdge);
  
  // Draw walker with a bright head and fading tail
  for (let i = 0; i < walker.tailLength; i++) {
    const ledIdx = currentLedIndex - i;
    if (ledIdx >= currentEdge.startIndex && ledIdx < currentEdge.startIndex + currentEdge.ledCount) {
      const intensity = 1 - (i / walker.tailLength);
      leds[ledIdx].color.r = Math.floor(255 * intensity);
      leds[ledIdx].color.g = Math.floor(100 * intensity);
      leds[ledIdx].color.b = Math.floor(200 * intensity);
    }
  }
  
  // Move walker forward
  walker.ledPositionInEdge += walker.speed;
  
  // Check if we reached the end of the current edge
  if (walker.ledPositionInEdge >= currentEdge.ledCount || walker.ledPositionInEdge < 0) {
    // Determine which node we reached
    const reachedNodeId = (walker.previousNodeId === currentEdge.fromNodeId) 
      ? currentEdge.toNodeId 
      : currentEdge.fromNodeId;
    
    const reachedNode = shape.nodes.get(reachedNodeId);
    if (!reachedNode) return;
    
    // Get all connected edges to this node
    const allConnectedEdges = [
      ...reachedNode.incomingEdges,
      ...reachedNode.outgoingEdges
    ];
    
    // Filter out the edge we just came from
    const availableEdges = allConnectedEdges.filter(function(edgeId) {
      return edgeId !== walker.currentEdgeId;
    });
    
    // If no available edges, allow backtracking
    const edgesToChooseFrom = availableEdges.length > 0 ? availableEdges : allConnectedEdges;
    
    // Pick a random edge
    const nextEdgeId = edgesToChooseFrom[Math.floor(Math.random() * edgesToChooseFrom.length)];
    const nextEdge = shape.edges.get(nextEdgeId);
    
    if (nextEdge) {
      // Update walker state for the new edge
      walker.currentEdgeId = nextEdgeId;
      walker.previousNodeId = reachedNodeId;
      
      // Determine if we need to traverse the edge in reverse
      // (if we're starting from the 'to' node, we go backwards)
      if (reachedNodeId === nextEdge.toNodeId) {
        walker.ledPositionInEdge = nextEdge.ledCount - 1;
        walker.speed = -Math.abs(walker.speed);
      } else {
        walker.ledPositionInEdge = 0;
        walker.speed = Math.abs(walker.speed);
      }
    }
  }
}`;

// Knight Rider 3D animation
export const knightRider3D = `// Knight Rider 3D Animation
// Gradient that moves up and down based on Y position

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.knightRider) {
    // Find min and max Y positions
    let minY = Infinity;
    let maxY = -Infinity;
    
    leds.forEach(function(led) {
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
    });
    
    const yRange = maxY - minY;
    
    window.knightRider = {
      minY: minY,
      maxY: maxY,
      yPosition: maxY, // Start at top
      direction: -1, // -1 = going down, 1 = going up
      waitCounter: 5,
      waitFrames: 5,
      speed: yRange / 30, // Adjust speed based on shape height
      gradientWidth: yRange / 4 // Gradient width is 1/4 of total height
    };
  }
  
  const kr = window.knightRider;
  
  // If waiting, don't move
  if (kr.waitCounter > 0) {
    kr.waitCounter--;
  } else {
    // Move the Y position
    kr.yPosition += kr.speed * kr.direction;
    
    // Check if we've reached the end
    if (kr.direction === -1 && kr.yPosition <= kr.minY) {
      // Reached bottom
      kr.yPosition = kr.minY;
      kr.direction = 1;
      kr.waitCounter = kr.waitFrames;
    } else if (kr.direction === 1 && kr.yPosition >= kr.maxY) {
      // Reached top
      kr.yPosition = kr.maxY;
      kr.direction = -1;
      kr.waitCounter = kr.waitFrames;
    }
  }
  
  // Apply gradient to all LEDs based on their Y position
  leds.forEach(function(led) {
    const distance = Math.abs(led.position.y - kr.yPosition);
    
    if (distance < kr.gradientWidth) {
      // Calculate intensity based on distance
      const intensity = 1 - (distance / kr.gradientWidth);
      
      led.color.r = Math.floor(255 * intensity);
      led.color.g = Math.floor(50 * intensity);
      led.color.b = Math.floor(50 * intensity);
    } else {
      // Fade out
      led.color.r = Math.max(0, led.color.r - 15);
      led.color.g = Math.max(0, led.color.g - 15);
      led.color.b = Math.max(0, led.color.b - 15);
    }
  });
}`;

// Fireworks animation
export const fireworks = `// Fireworks Animation
// Spherical explosions that expand and contract in 3D space

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.fireworks) {
    // Find the bounds of the shape
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    leds.forEach(function(led) {
      if (led.position.x < minX) minX = led.position.x;
      if (led.position.x > maxX) maxX = led.position.x;
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
      if (led.position.z < minZ) minZ = led.position.z;
      if (led.position.z > maxZ) maxZ = led.position.z;
    });
    
    window.fireworks = {
      explosions: [],
      bounds: { minX, maxX, minY, maxY, minZ, maxZ },
      frameCounter: 0,
      spawnInterval: 20 // Spawn new firework every 20 frames
    };
  }
  
  const fw = window.fireworks;
  fw.frameCounter++;
  
  // Spawn new firework occasionally
  if (fw.frameCounter >= fw.spawnInterval) {
    fw.frameCounter = 0;
    
    // Random position within shape bounds
    const x = fw.bounds.minX + Math.random() * (fw.bounds.maxX - fw.bounds.minX);
    const y = fw.bounds.minY + Math.random() * (fw.bounds.maxY - fw.bounds.minY);
    const z = fw.bounds.minZ + Math.random() * (fw.bounds.maxZ - fw.bounds.minZ);
    
    // Random color
    const hue = Math.random();
    const rgb = hslToRgb(hue, 1.0, 0.5);
    
    fw.explosions.push({
      x: x,
      y: y,
      z: z,
      radius: 0,
      maxRadius: 20 + Math.random() * 15,
      speed: 0.8 + Math.random() * 0.4,
      phase: 'expanding', // 'expanding' or 'contracting'
      color: rgb,
      life: 1.0
    });
  }
  
  // Helper function for HSL to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  
  // Fade all LEDs
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 8);
    led.color.g = Math.max(0, led.color.g - 8);
    led.color.b = Math.max(0, led.color.b - 8);
  });
  
  // Update and render explosions
  for (let i = fw.explosions.length - 1; i >= 0; i--) {
    const explosion = fw.explosions[i];
    
    if (explosion.phase === 'expanding') {
      explosion.radius += explosion.speed;
      
      if (explosion.radius >= explosion.maxRadius) {
        explosion.phase = 'contracting';
      }
    } else {
      explosion.radius -= explosion.speed * 1.5;
      explosion.life -= 0.05;
      
      if (explosion.radius <= 0 || explosion.life <= 0) {
        fw.explosions.splice(i, 1);
        continue;
      }
    }
    
    // Check each LED for intersection with explosion sphere
    leds.forEach(function(led) {
      const dx = led.position.x - explosion.x;
      const dy = led.position.y - explosion.y;
      const dz = led.position.z - explosion.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Check if LED is within the explosion sphere shell (wider gradient)
      const shellThickness = 8; // Wider shell for more LEDs in gradient
      if (distance >= explosion.radius - shellThickness && 
          distance <= explosion.radius + shellThickness) {
        
        // Calculate intensity based on distance from shell center
        const shellCenter = explosion.radius;
        const distFromShell = Math.abs(distance - shellCenter);
        const intensity = (1 - distFromShell / shellThickness) * explosion.life;
        
        // Mix color with white based on intensity (smaller white core)
        const whiteMix = Math.pow(intensity, 3) * 0.5; // Cubic curve = smaller white center
        const r = Math.floor((explosion.color.r * (1 - whiteMix) + 255 * whiteMix) * intensity);
        const g = Math.floor((explosion.color.g * (1 - whiteMix) + 255 * whiteMix) * intensity);
        const b = Math.floor((explosion.color.b * (1 - whiteMix) + 255 * whiteMix) * intensity);
        
        // Apply color
        led.color.r = Math.min(255, led.color.r + r);
        led.color.g = Math.min(255, led.color.g + g);
        led.color.b = Math.min(255, led.color.b + b);
      }
    });
  }
}`;

// Shockwave animation
export const shockwave = `// Shockwave Animation
// Expands quickly from center, then slowly fades

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.shockwave) {
    // Find the center and max radius of the shape
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    leds.forEach(function(led) {
      if (led.position.x < minX) minX = led.position.x;
      if (led.position.x > maxX) maxX = led.position.x;
      if (led.position.z < minZ) minZ = led.position.z;
      if (led.position.z > maxZ) maxZ = led.position.z;
    });
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const maxRadius = Math.max(
      Math.sqrt(Math.pow(maxX - centerX, 2) + Math.pow(maxZ - centerZ, 2)),
      Math.sqrt(Math.pow(minX - centerX, 2) + Math.pow(minZ - centerZ, 2))
    );
    
    window.shockwave = {
      centerX: centerX,
      centerZ: centerZ,
      maxRadius: maxRadius,
      waves: [],
      frameCounter: 0,
      spawnInterval: 40 // New wave every 40 frames
    };
  }
  
  const sw = window.shockwave;
  sw.frameCounter++;
  
  // Spawn new shockwave
  if (sw.frameCounter >= sw.spawnInterval) {
    sw.frameCounter = 0;
    
    const expandSpeed = 0.2; // 20% of original speed
    const maxRadius = sw.maxRadius * 1.5;
    // Fade takes 3 seconds (180 frames at 60 FPS)
    const fadeSpeed = 1.0 / 180;
    
    sw.waves.push({
      radius: 0,
      maxRadius: maxRadius,
      expandSpeed: expandSpeed,
      fadeSpeed: fadeSpeed,
      intensity: 1.0,
      phase: 'expanding'
    });
  }
  
  // Fade all LEDs
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 12);
    led.color.g = Math.max(0, led.color.g - 12);
    led.color.b = Math.max(0, led.color.b - 12);
  });
  
  // Update and render waves
  for (let i = sw.waves.length - 1; i >= 0; i--) {
    const wave = sw.waves[i];
    
    if (wave.phase === 'expanding') {
      wave.radius += wave.expandSpeed;
      
      // When fully expanded, start fading
      if (wave.radius >= wave.maxRadius) {
        wave.phase = 'fading';
      }
    } else if (wave.phase === 'fading') {
      wave.intensity -= wave.fadeSpeed;
      
      // Remove when fully faded
      if (wave.intensity <= 0) {
        sw.waves.splice(i, 1);
        continue;
      }
    }
    
    // Apply shockwave to LEDs
    leds.forEach(function(led) {
      // Calculate radial distance from center (X-Z plane)
      const dx = led.position.x - sw.centerX;
      const dz = led.position.z - sw.centerZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Check if LED is near the wave front
      const ringThickness = 6;
      if (distance >= wave.radius - ringThickness && 
          distance <= wave.radius + ringThickness) {
        
        // Calculate intensity based on distance from ring center
        const distFromRing = Math.abs(distance - wave.radius);
        const ringIntensity = (1 - distFromRing / ringThickness) * wave.intensity;
        
        // Bright white-blue shockwave
        led.color.r = Math.min(255, led.color.r + Math.floor(200 * ringIntensity));
        led.color.g = Math.min(255, led.color.g + Math.floor(220 * ringIntensity));
        led.color.b = Math.min(255, led.color.b + Math.floor(255 * ringIntensity));
      }
    });
  }
}`;

// Color Flood animation
export const colorFlood = `// Color Flood Animation
// Spreads color from random nodes across the whole shape

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.colorFlood) {
    // Get all node positions from the shape
    const nodePositions = [];
    shape.nodes.forEach(function(node) {
      nodePositions.push({
        id: node.id,
        position: node.position
      });
    });
    
    // Find max distance in the shape for normalization
    let maxDist = 0;
    leds.forEach(function(led) {
      nodePositions.forEach(function(node) {
        const dx = led.position.x - node.position.x;
        const dy = led.position.y - node.position.y;
        const dz = led.position.z - node.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxDist) maxDist = dist;
      });
    });
    
    // Pick initial random node and color
    const randomNode = nodePositions[Math.floor(Math.random() * nodePositions.length)];
    const hue = Math.random();
    const rgb = hslToRgb(hue, 1.0, 0.5);
    
    window.colorFlood = {
      nodePositions: nodePositions,
      maxDistance: maxDist,
      currentNode: randomNode,
      targetColor: rgb,
      radius: 0,
      maxRadius: maxDist * 1.2,
      expandSpeed: maxDist / 60, // Takes ~60 frames to fill
      holdFrames: 30,
      holdCounter: 0,
      phase: 'expanding' // 'expanding' or 'holding'
    };
  }
  
  // Helper function for HSL to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  
  const cf = window.colorFlood;
  
  if (cf.phase === 'expanding') {
    cf.radius += cf.expandSpeed;
    
    // Check if fully expanded
    if (cf.radius >= cf.maxRadius) {
      cf.phase = 'holding';
      cf.holdCounter = cf.holdFrames;
    }
  } else if (cf.phase === 'holding') {
    cf.holdCounter--;
    
    if (cf.holdCounter <= 0) {
      // Pick new random node and color
      cf.currentNode = cf.nodePositions[Math.floor(Math.random() * cf.nodePositions.length)];
      const hue = Math.random();
      cf.targetColor = hslToRgb(hue, 1.0, 0.5);
      cf.radius = 0;
      cf.phase = 'expanding';
    }
  }
  
  // Apply color gradient based on distance from current node
  leds.forEach(function(led) {
    const dx = led.position.x - cf.currentNode.position.x;
    const dy = led.position.y - cf.currentNode.position.y;
    const dz = led.position.z - cf.currentNode.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance <= cf.radius) {
      // Calculate gradient intensity
      const intensity = 1 - (distance / cf.radius);
      const smoothIntensity = intensity * intensity; // Quadratic for smoother gradient
      
      // Blend with current color
      led.color.r = Math.floor(led.color.r * (1 - smoothIntensity) + cf.targetColor.r * smoothIntensity);
      led.color.g = Math.floor(led.color.g * (1 - smoothIntensity) + cf.targetColor.g * smoothIntensity);
      led.color.b = Math.floor(led.color.b * (1 - smoothIntensity) + cf.targetColor.b * smoothIntensity);
    }
  });
}`;

// Rainbow Flood animation
export const rainbowFlood = `// Rainbow Flood Animation
// Spreads rainbow from random nodes, hue changes with distance

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.rainbowFlood) {
    // Get all node positions from the shape
    const nodePositions = [];
    shape.nodes.forEach(function(node) {
      nodePositions.push({
        id: node.id,
        position: node.position
      });
    });
    
    // Find max distance in the shape for normalization
    let maxDist = 0;
    leds.forEach(function(led) {
      nodePositions.forEach(function(node) {
        const dx = led.position.x - node.position.x;
        const dy = led.position.y - node.position.y;
        const dz = led.position.z - node.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxDist) maxDist = dist;
      });
    });
    
    // Pick initial random node and starting hue
    const randomNode = nodePositions[Math.floor(Math.random() * nodePositions.length)];
    const startHue = Math.random();
    
    window.rainbowFlood = {
      nodePositions: nodePositions,
      maxDistance: maxDist,
      currentNode: randomNode,
      startHue: startHue,
      radius: 0,
      maxRadius: maxDist * 1.2,
      expandSpeed: maxDist / 60, // Takes ~60 frames to fill
      holdFrames: 30,
      holdCounter: 0,
      phase: 'expanding', // 'expanding' or 'holding'
      hueRange: 1.0 // How many full rotations through hue circle
    };
  }
  
  // Helper function for HSL to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  
  const rf = window.rainbowFlood;
  
  if (rf.phase === 'expanding') {
    rf.radius += rf.expandSpeed;
    
    // Check if fully expanded
    if (rf.radius >= rf.maxRadius) {
      rf.phase = 'holding';
      rf.holdCounter = rf.holdFrames;
    }
  } else if (rf.phase === 'holding') {
    rf.holdCounter--;
    
    if (rf.holdCounter <= 0) {
      // Pick new random node and starting hue
      rf.currentNode = rf.nodePositions[Math.floor(Math.random() * rf.nodePositions.length)];
      rf.startHue = Math.random();
      rf.radius = 0;
      rf.phase = 'expanding';
    }
  }
  
  // Apply rainbow gradient based on distance from current node
  leds.forEach(function(led) {
    const dx = led.position.x - rf.currentNode.position.x;
    const dy = led.position.y - rf.currentNode.position.y;
    const dz = led.position.z - rf.currentNode.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance <= rf.radius) {
      // Calculate gradient intensity
      const intensity = 1 - (distance / rf.radius);
      const smoothIntensity = intensity * intensity; // Quadratic for smoother gradient
      
      // Calculate hue based on distance (progresses around color wheel)
      const normalizedDist = distance / rf.maxDistance;
      const hue = (rf.startHue + normalizedDist * rf.hueRange) % 1.0;
      const targetColor = hslToRgb(hue, 1.0, 0.5);
      
      // Blend with current color
      led.color.r = Math.floor(led.color.r * (1 - smoothIntensity) + targetColor.r * smoothIntensity);
      led.color.g = Math.floor(led.color.g * (1 - smoothIntensity) + targetColor.g * smoothIntensity);
      led.color.b = Math.floor(led.color.b * (1 - smoothIntensity) + targetColor.b * smoothIntensity);
    }
  });
}`;

// Edge Flash animation
export const edgeFlash = `// Edge Flash Animation
// Randomly flashes whole edges

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.edgeFlash) {
    // Get all edges from the shape
    const edgeList = [];
    shape.edges.forEach(function(edge, id) {
      edgeList.push({
        id: id,
        startIndex: edge.startIndex,
        ledCount: edge.ledCount
      });
    });
    
    window.edgeFlash = {
      edges: edgeList,
      activeFlashes: [],
      frameCounter: 0,
      minInterval: 5,  // Minimum frames between flashes
      maxInterval: 20, // Maximum frames between flashes
      nextFlashIn: Math.floor(Math.random() * 15) + 5
    };
  }
  
  const ef = window.edgeFlash;
  ef.frameCounter++;
  
  // Check if it's time to trigger a new flash
  if (ef.frameCounter >= ef.nextFlashIn) {
    ef.frameCounter = 0;
    ef.nextFlashIn = Math.floor(Math.random() * (ef.maxInterval - ef.minInterval)) + ef.minInterval;
    
    // Pick a random edge
    const randomEdge = ef.edges[Math.floor(Math.random() * ef.edges.length)];
    
    // Random color
    const hue = Math.random();
    const rgb = hslToRgb(hue, 1.0, 0.5);
    
    // Add new flash
    ef.activeFlashes.push({
      edge: randomEdge,
      color: rgb,
      intensity: 1.0,
      fadeSpeed: 0.08 // Fast fade
    });
  }
  
  // Helper function for HSL to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  
  // Fade all LEDs
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 15);
    led.color.g = Math.max(0, led.color.g - 15);
    led.color.b = Math.max(0, led.color.b - 15);
  });
  
  // Update and render active flashes
  for (let i = ef.activeFlashes.length - 1; i >= 0; i--) {
    const flash = ef.activeFlashes[i];
    
    // Apply flash to all LEDs in the edge
    for (let j = 0; j < flash.edge.ledCount; j++) {
      const ledIndex = flash.edge.startIndex + j;
      if (ledIndex < leds.length) {
        // Add white core for brightness
        const whiteMix = flash.intensity * 0.3;
        const r = Math.floor((flash.color.r * (1 - whiteMix) + 255 * whiteMix) * flash.intensity);
        const g = Math.floor((flash.color.g * (1 - whiteMix) + 255 * whiteMix) * flash.intensity);
        const b = Math.floor((flash.color.b * (1 - whiteMix) + 255 * whiteMix) * flash.intensity);
        
        leds[ledIndex].color.r = Math.min(255, leds[ledIndex].color.r + r);
        leds[ledIndex].color.g = Math.min(255, leds[ledIndex].color.g + g);
        leds[ledIndex].color.b = Math.min(255, leds[ledIndex].color.b + b);
      }
    }
    
    // Fade the flash
    flash.intensity -= flash.fadeSpeed;
    
    // Remove if fully faded
    if (flash.intensity <= 0) {
      ef.activeFlashes.splice(i, 1);
    }
  }
}`;

// Heartbeat animation
export const heartbeat = `// Heartbeat Animation
// Pulses like a human heart with lub-dub pattern

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.heartbeat) {
    window.heartbeat = {
      frameCounter: 0,
      beatCycle: 120, // Total frames for one complete heartbeat cycle
      // Heartbeat pattern: [start, duration, intensity]
      // Lub (first beat) - systole
      beat1Start: 0,
      beat1Duration: 12,
      beat1Peak: 1.0,
      // Dub (second beat) - diastole  
      beat2Start: 20,
      beat2Duration: 10,
      beat2Peak: 0.7,
      // Rest period after the two beats
      restStart: 35,
      restDuration: 85
    };
  }
  
  const hb = window.heartbeat;
  hb.frameCounter = (hb.frameCounter + 1) % hb.beatCycle;
  
  // Calculate current intensity based on heartbeat pattern
  let intensity = 0;
  
  // First beat (LUB) - stronger, red
  if (hb.frameCounter >= hb.beat1Start && hb.frameCounter < hb.beat1Start + hb.beat1Duration) {
    const progress = (hb.frameCounter - hb.beat1Start) / hb.beat1Duration;
    // Use sine wave for smooth pulse
    intensity = Math.sin(progress * Math.PI) * hb.beat1Peak;
  }
  // Second beat (DUB) - softer, pink
  else if (hb.frameCounter >= hb.beat2Start && hb.frameCounter < hb.beat2Start + hb.beat2Duration) {
    const progress = (hb.frameCounter - hb.beat2Start) / hb.beat2Duration;
    intensity = Math.sin(progress * Math.PI) * hb.beat2Peak;
  }
  // Rest period - minimal pulse
  else {
    intensity = 0.05; // Very dim baseline
  }
  
  // Color varies with intensity - red when strong, pink when softer
  const redIntensity = intensity;
  const pinkMix = 1 - intensity; // More pink when less intense
  
  // Calculate colors
  const r = Math.floor(255 * intensity);
  const g = Math.floor(100 * pinkMix * intensity); // Add green for pink
  const b = Math.floor(120 * pinkMix * intensity); // Add blue for pink
  
  // Apply to all LEDs
  leds.forEach(function(led) {
    led.color.r = r;
    led.color.g = g;
    led.color.b = b;
  });
}`;

// Random Sparkle animation
export const randomSparkle = `// Random Sparkle Animation
// Lights up 20 groups of 3 consecutive LEDs, holds for 2 seconds, then repeats

function animate(leds, frame, shape) {
  // Initialize state (only once)
  if (!window.randomSparkle) {
    window.randomSparkle = {
      frameCounter: 0,
      holdDuration: 120, // 2 seconds at 60 FPS
      activeLEDs: [],
      color: { r: 0, g: 0, b: 0 },
      groupSize: 3,
      numGroups: 20
    };
    
    // Pick initial random LED groups
    pickRandomLEDs();
  }
  
  function pickRandomLEDs() {
    const rs = window.randomSparkle;
    rs.activeLEDs = [];
    
    // Pick 20 random starting positions for groups of 3 consecutive LEDs
    const usedStartIndices = new Set();
    while (rs.activeLEDs.length < rs.numGroups * rs.groupSize && 
           usedStartIndices.size < shape.totalLEDs - rs.groupSize + 1) {
      // Pick a random starting position (ensure room for 3 LEDs)
      const randomStart = Math.floor(Math.random() * (shape.totalLEDs - rs.groupSize + 1));
      
      if (!usedStartIndices.has(randomStart)) {
        usedStartIndices.add(randomStart);
        
        // Add 3 consecutive LEDs starting from this position
        for (let i = 0; i < rs.groupSize; i++) {
          rs.activeLEDs.push(randomStart + i);
        }
      }
    }
    
    // Pick a random bright color
    const hue = Math.random();
    const rgb = hslToRgb(hue, 1.0, 0.5);
    rs.color = rgb;
    rs.frameCounter = 0;
  }
  
  // Helper function for HSL to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  
  const rs = window.randomSparkle;
  rs.frameCounter++;
  
  // Check if it's time to pick new LEDs
  if (rs.frameCounter >= rs.holdDuration) {
    pickRandomLEDs();
  }
  
  // Turn off all LEDs
  leds.forEach(function(led) {
    led.color.r = 0;
    led.color.g = 0;
    led.color.b = 0;
  });
  
  // Light up the active LEDs
  rs.activeLEDs.forEach(function(ledIndex) {
    if (ledIndex < leds.length) {
      leds[ledIndex].color.r = rs.color.r;
      leds[ledIndex].color.g = rs.color.g;
      leds[ledIndex].color.b = rs.color.b;
    }
  });
}`;

export const defaultAnimations = {
  'Rainbow Wave': rainbowWave,
  'Running Lights': runningLights,
  'Edge Walker': edgeWalker,
  'Knight Rider 3D': knightRider3D,
  'Fireworks': fireworks,
  'Shockwave': shockwave,
  'Color Flood': colorFlood,
  'Rainbow Flood': rainbowFlood,
  'Edge Flash': edgeFlash,
  'Heartbeat': heartbeat,
  'Random Sparkle': randomSparkle,
};

