import { LED } from '@/types/led';

/**
 * Sample animation patterns
 */

// Rainbow wave animation
export const rainbowWave = `// Rainbow Wave Animation
function animate(leds, frame, shape, state) {
  leds.forEach((led, index) => {
    const hue = (index / shape.totalLEDs + frame * 0.01) % 1.0;
    const rgb = hslToRgb(hue, 1.0, 0.5);
    led.color.r = rgb.r;
    led.color.g = rgb.g;
    led.color.b = rgb.b;
  });
  
  // No state needed for this animation
  return state;
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
function animate(leds, frame, shape, state) {
  const position = (frame * 0.5) % shape.totalLEDs;
  
  leds.forEach((led, index) => {
    const distance = Math.abs(index - position);
    const wrappedDistance = Math.min(distance, shape.totalLEDs - distance);
    const intensity = Math.max(0, 1 - wrappedDistance / 5);
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 50);
    led.color.b = Math.floor(intensity * 50);
  });
  
  // No state needed for this animation
  return state;
}`;

// Edge Walker animation
export const edgeWalker = `// Edge Walker Animation
// Walks through edges, choosing random paths at each node

function animate(leds, frame, shape, state) {
  // Initialize walker state on first call
  if (!state) {
    // Get first edge to start with
    const firstEdgeId = Array.from(shape.edges.keys())[0];
    const firstEdge = shape.edges.get(firstEdgeId);
    
    state = {
      currentEdgeId: firstEdgeId,
      ledPositionInEdge: 0,
      speed: 2, // LEDs per frame
      previousNodeId: firstEdge.fromNodeId,
      tailLength: 15
    };
  }
  
  const walker = state;
  
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
  
  // Return the updated state
  return state;
}`;

// Knight Rider 3D animation
export const knightRider3D = `// Knight Rider 3D Animation
// Gradient that moves up and down based on Y position

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Find min and max Y positions
    let minY = Infinity;
    let maxY = -Infinity;
    
    leds.forEach(function(led) {
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
    });
    
    const yRange = Math.max(maxY - minY, 10); // Ensure minimum range of 10
    
    state = {
      minY: minY,
      maxY: maxY,
      yPosition: maxY, // Start at top
      direction: -1, // -1 = going down, 1 = going up
      waitCounter: 0, // Start moving immediately
      waitFrames: 5,
      speed: yRange / 30, // Adjust speed based on shape height
      gradientWidth: yRange / 4 // Gradient width is 1/4 of total height
    };
  }
  
  const kr = state;
  
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
  
  // Return the updated state
  return state;
}`;

// Fireworks animation
export const fireworks = `// Fireworks Animation
// Spherical explosions that expand and contract in 3D space

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
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
    
    state = {
      explosions: [],
      bounds: { minX, maxX, minY, maxY, minZ, maxZ },
      frameCounter: 0,
      spawnInterval: 20 // Spawn new firework every 20 frames
    };
  }
  
  const fw = state;
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
  
  // Return the updated state
  return state;
}`;

// Shockwave animation
export const shockwave = `// Shockwave Animation
// Expands quickly from center, then slowly fades

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
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
    
    state = {
      centerX: centerX,
      centerZ: centerZ,
      maxRadius: maxRadius,
      waves: [],
      frameCounter: 0,
      spawnInterval: 120 // New wave every 2 seconds (120 frames at 60 FPS)
    };
  }
  
  const sw = state;
  sw.frameCounter++;
  
  // Spawn new shockwave
  if (sw.frameCounter >= sw.spawnInterval) {
    sw.frameCounter = 0;
    
    const expandSpeed = 0.2; // 20% of original speed
    const maxRadius = sw.maxRadius * 1.5;
    // Fade takes 1 second (60 frames at 60 FPS) - faster fade
    const fadeSpeed = 1.0 / 60;
    
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
  
  // Return the updated state
  return state;
}`;

// Color Flood animation
export const colorFlood = `// Color Flood Animation
// Spreads color from random nodes across the whole shape

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
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
    
    state = {
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
  
  const cf = state;
  
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
  
  // Return the updated state
  return state;
}`;

// Rainbow Flood animation
export const rainbowFlood = `// Rainbow Flood Animation
// Spreads rainbow from random nodes, hue changes with distance

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
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
    
    state = {
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
  
  const rf = state;
  
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
  
  // Return the updated state
  return state;
}`;

// Edge Flash animation
export const edgeFlash = `// Edge Flash Animation
// Randomly flashes whole edges

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Get all edges from the shape
    const edgeList = [];
    shape.edges.forEach(function(edge, id) {
      edgeList.push({
        id: id,
        startIndex: edge.startIndex,
        ledCount: edge.ledCount
      });
    });
    
    state = {
      edges: edgeList,
      activeFlashes: [],
      frameCounter: 0,
      minInterval: 5,  // Minimum frames between flashes
      maxInterval: 20, // Maximum frames between flashes
      nextFlashIn: Math.floor(Math.random() * 15) + 5
    };
  }
  
  const ef = state;
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
  
  // Return the updated state
  return state;
}`;

// Heartbeat animation
export const heartbeat = `// Heartbeat Animation
// Pulses like a human heart with lub-dub pattern

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    state = {
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
  
  const hb = state;
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
  
  // Return the updated state
  return state;
}`;

// Random Sparkle animation
export const randomSparkle = `// Random Sparkle Animation
// Lights up 20 groups of 3 consecutive LEDs, holds for 2 seconds, then repeats

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    state = {
      frameCounter: 0,
      holdDuration: 120, // 2 seconds at 60 FPS
      activeLEDs: [],
      color: { r: 0, g: 0, b: 0 },
      groupSize: 3,
      numGroups: 20
    };
    
    // Pick initial random LED groups
    pickRandomLEDs(state);
  }
  
  function pickRandomLEDs(rs) {
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
  
  const rs = state;
  rs.frameCounter++;
  
  // Check if it's time to pick new LEDs
  if (rs.frameCounter >= rs.holdDuration) {
    pickRandomLEDs(rs);
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
  
  // Return the updated state
  return state;
}`;

// Multi Walker animation
export const multiWalker = `// Multi Walker Animation
// 10 points of light moving erratically through the shape

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    const numWalkers = 10;
    const walkers = [];
    
    // Get all edge IDs
    const edgeIds = Array.from(shape.edges.keys());
    
    // Create 10 walkers with random colors and starting positions
    for (let i = 0; i < numWalkers; i++) {
      const randomEdgeId = edgeIds[Math.floor(Math.random() * edgeIds.length)];
      const edge = shape.edges.get(randomEdgeId);
      
      // Generate a random bright color (HSL)
      const hue = i / numWalkers; // Distribute colors evenly around color wheel
      const rgb = hslToRgb(hue, 1.0, 0.5);
      
      walkers.push({
        currentEdgeId: randomEdgeId,
        ledPositionInEdge: Math.floor(Math.random() * edge.ledCount),
        speed: 0.3 + Math.random() * 0.7, // Random speed between 0.3-1.0 (slower)
        previousNodeId: edge.fromNodeId,
        tailLength: 8,
        color: rgb
      });
    }
    
    state = { walkers: walkers };
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
    led.color.r = Math.max(0, led.color.r - 20);
    led.color.g = Math.max(0, led.color.g - 20);
    led.color.b = Math.max(0, led.color.b - 20);
  });
  
  // Update and draw each walker
  state.walkers.forEach(function(walker) {
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
        
        // Add color (allowing multiple walkers to blend)
        leds[ledIdx].color.r = Math.min(255, leds[ledIdx].color.r + Math.floor(walker.color.r * intensity));
        leds[ledIdx].color.g = Math.min(255, leds[ledIdx].color.g + Math.floor(walker.color.g * intensity));
        leds[ledIdx].color.b = Math.min(255, leds[ledIdx].color.b + Math.floor(walker.color.b * intensity));
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
        if (reachedNodeId === nextEdge.toNodeId) {
          walker.ledPositionInEdge = nextEdge.ledCount - 1;
          walker.speed = -Math.abs(walker.speed);
        } else {
          walker.ledPositionInEdge = 0;
          walker.speed = Math.abs(walker.speed);
        }
      }
    }
  });
  
  // Return the updated state
  return state;
}`;

// Breathing Spheres animation
export const breathingSpheres = `// Breathing Spheres Animation
// Spheres expand from each node, mixing colors when they overlap

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Assign each node a color
    const nodeColors = [];
    const nodeList = [];
    let nodeIndex = 0;
    
    shape.nodes.forEach(function(node, id) {
      const hue = nodeIndex / shape.nodes.size;
      const rgb = hslToRgb(hue, 1.0, 0.5);
      
      nodeColors.push(rgb);
      nodeList.push({
        id: id,
        position: node.position,
        color: rgb
      });
      nodeIndex++;
    });
    
    // Find max distance in the shape for sphere sizing
    let maxDist = 0;
    leds.forEach(function(led) {
      nodeList.forEach(function(node) {
        const dx = led.position.x - node.position.x;
        const dy = led.position.y - node.position.y;
        const dz = led.position.z - node.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxDist) maxDist = dist;
      });
    });
    
    state = {
      nodeList: nodeList,
      maxRadius: maxDist * 0.45, // Max expansion is 45% of shape size - less overlap
      minRadius: 0,
      breathePhase: 0,
      breatheCycle: 460, // Full cycle: 100 expand + 180 hold + 100 contract + 80 hold
      expandFrames: 100, // Frames to expand
      contractFrames: 100, // Frames to contract
      holdFrames: 180 // 3 seconds hold at peak (180 frames at 60 FPS)
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
  
  const bs = state;
  bs.breathePhase = (bs.breathePhase + 1) % bs.breatheCycle;
  
  // Calculate current radius using smooth sine wave for breathing effect
  let currentRadius;
  if (bs.breathePhase < bs.expandFrames) {
    // Expanding phase - ease in/out
    const progress = bs.breathePhase / bs.expandFrames;
    const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Smooth ease
    currentRadius = bs.minRadius + eased * (bs.maxRadius - bs.minRadius);
  } else if (bs.breathePhase < bs.expandFrames + bs.holdFrames) {
    // Hold at max
    currentRadius = bs.maxRadius;
  } else if (bs.breathePhase < bs.expandFrames + bs.holdFrames + bs.contractFrames) {
    // Contracting phase
    const progress = (bs.breathePhase - bs.expandFrames - bs.holdFrames) / bs.contractFrames;
    const eased = 0.5 + 0.5 * Math.cos(progress * Math.PI); // Smooth ease
    currentRadius = bs.minRadius + eased * (bs.maxRadius - bs.minRadius);
  } else {
    // Hold at min
    currentRadius = bs.minRadius;
  }
  
  // Clear all LEDs
  leds.forEach(function(led) {
    led.color.r = 0;
    led.color.g = 0;
    led.color.b = 0;
  });
  
  // Apply sphere effects from each node
  leds.forEach(function(led) {
    let totalR = 0, totalG = 0, totalB = 0;
    let totalWeight = 0;
    
    // Check distance from each node
    bs.nodeList.forEach(function(node) {
      const dx = led.position.x - node.position.x;
      const dy = led.position.y - node.position.y;
      const dz = led.position.z - node.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Check if LED is within this sphere
      if (distance <= currentRadius) {
        // Calculate intensity based on distance from sphere surface
        // LEDs near the surface are brightest
        const shellThickness = bs.maxRadius * 0.3; // Thick shell for soft edges
        const distFromSurface = Math.abs(distance - currentRadius);
        
        if (distFromSurface <= shellThickness) {
          const intensity = 1 - (distFromSurface / shellThickness);
          const smoothIntensity = intensity * intensity; // Quadratic for softer gradient
          
          // Add this node's color contribution
          totalR += node.color.r * smoothIntensity;
          totalG += node.color.g * smoothIntensity;
          totalB += node.color.b * smoothIntensity;
          totalWeight += smoothIntensity;
        }
      }
    });
    
    // Mix colors if multiple spheres overlap
    if (totalWeight > 0) {
      led.color.r = Math.min(255, Math.floor(totalR));
      led.color.g = Math.min(255, Math.floor(totalG));
      led.color.b = Math.min(255, Math.floor(totalB));
    }
  });
  
  // Return the updated state
  return state;
}`;

// Spiral Sphere animation
export const spiralSphere = `// Spiral Sphere Animation
// A sphere moves in a spiral pattern up and down through the shape

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
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
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const yRange = maxY - minY;
    
    // Calculate radius for spiral path - ball center on cylinder edges
    // For hexagonal cylinder with radius 35, edges are at distance 35 from center
    const spiralRadius = Math.max(
      Math.abs(maxX - centerX),
      Math.abs(maxZ - centerZ)
    ); // 100% - ball center exactly on cylinder edge
    
    // Calculate rotation speed: 15 full turns over the full height (more turns)
    // Travel time for full height is yRange / speed frames
    // We want 15 * 2π radians in that time
    const travelFrames = 960; // 16 seconds to travel full height (very slow)
    const rotationSpeed = (15 * Math.PI * 2) / travelFrames;
    
    state = {
      minY: minY,
      maxY: maxY,
      centerX: centerX,
      centerZ: centerZ,
      yPosition: maxY, // Start at top
      direction: -1, // -1 = going down, 1 = going up
      angle: 0, // Rotation angle for spiral
      spiralRadius: spiralRadius, // Spiral like a ball on a rope
      sphereRadius: 20, // Bigger ball (at least 10 LEDs will light up)
      speed: yRange / travelFrames, // Speed to match rotation
      rotationSpeed: rotationSpeed // 10 turns for full height
    };
  }
  
  const ss = state;
  
  // Move Y position
  ss.yPosition += ss.speed * ss.direction;
  
  // Rotate for spiral effect
  ss.angle += ss.rotationSpeed * ss.direction;
  
  // Check if we've reached the end
  if (ss.direction === -1 && ss.yPosition <= ss.minY) {
    ss.yPosition = ss.minY;
    ss.direction = 1;
  } else if (ss.direction === 1 && ss.yPosition >= ss.maxY) {
    ss.yPosition = ss.maxY;
    ss.direction = -1;
  }
  
  // Calculate sphere center position (spiral path)
  const sphereX = ss.centerX + Math.cos(ss.angle) * ss.spiralRadius;
  const sphereZ = ss.centerZ + Math.sin(ss.angle) * ss.spiralRadius;
  
  // Fade all LEDs
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 20);
    led.color.g = Math.max(0, led.color.g - 20);
    led.color.b = Math.max(0, led.color.b - 20);
  });
  
  // Apply sphere effect - light up LEDs within sphere
  leds.forEach(function(led) {
    const dx = led.position.x - sphereX;
    const dy = led.position.y - ss.yPosition;
    const dz = led.position.z - sphereZ;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Check if LED is within sphere
    if (distance <= ss.sphereRadius) {
      // Calculate intensity based on distance from center
      // Center is brightest, edges fade out
      const intensity = 1 - (distance / ss.sphereRadius);
      
      // Bright fire colors: white hot center -> yellow -> orange -> red edges
      let r, g, b;
      if (intensity > 0.7) {
        // Core: bright white/yellow
        r = 255;
        g = 255;
        b = 255;
      } else if (intensity > 0.4) {
        // Middle: yellow to orange
        r = 255;
        g = 200;
        b = 50;
      } else {
        // Outer: orange to red
        r = 255;
        g = Math.floor(80 * intensity / 0.4);
        b = 0;
      }
      
      // Apply intensity without quadratic dimming - keep it bright
      led.color.r = Math.min(255, Math.floor(r * intensity));
      led.color.g = Math.min(255, Math.floor(g * intensity));
      led.color.b = Math.min(255, Math.floor(b * intensity));
    }
  });
  
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
  
  // Return the updated state
  return state;
}`;

// Cylinder Trace animation
export const cylinderTrace = `// Cylinder Trace Animation
// Traces around the cylinder using 3D coordinates: up, right, down, right pattern

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Find bounds
    let minY = Infinity, maxY = -Infinity;
    let centerX = 0, centerZ = 0;
    
    leds.forEach(function(led) {
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
      centerX += led.position.x;
      centerZ += led.position.z;
    });
    
    centerX /= leds.length;
    centerZ /= leds.length;
    
    // Calculate cylindrical coordinates for each LED
    const ledData = leds.map(function(led, index) {
      const dx = led.position.x - centerX;
      const dz = led.position.z - centerZ;
      let angle = Math.atan2(dz, dx);
      if (angle < 0) angle += Math.PI * 2;
      
      return {
        index: index,
        angle: angle,
        y: led.position.y,
        x: led.position.x,
        z: led.position.z
      };
    });
    
    state = {
      ledData: ledData,
      minY: minY,
      maxY: maxY,
      centerX: centerX,
      centerZ: centerZ,
      yRange: maxY - minY,
      progress: 0, // Progress through the pattern (0-12 for full cylinder, 4 phases × 3 rectangles)
      speed: 0.02, // Speed of movement
      tailLength: 70
    };
  }
  
  const ct = state;
  
  // Fade all LEDs
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 10);
    led.color.g = Math.max(0, led.color.g - 10);
    led.color.b = Math.max(0, led.color.b - 10);
  });
  
  // Move progress
  ct.progress += ct.speed;
  if (ct.progress >= 12) ct.progress = 0; // 12 phases total (3 rectangles × 4 moves each)
  
  // Determine current target position based on pattern phase
  // Pattern: up, right, down, right, repeating 3 times around the cylinder
  // Each rectangle covers 2 hexagon edges (120°)
  const localPhase = Math.floor(ct.progress) % 4; // Which of the 4 moves (up/right/down/right)
  const rectangleIndex = Math.floor(ct.progress / 4); // Which rectangle (0-2)
  const phaseProgress = ct.progress - Math.floor(ct.progress);
  
  let targetY, targetAngle;
  const angleStep = (Math.PI * 2) / 6; // One edge of hexagon (60 degrees)
  const baseAngle = rectangleIndex * angleStep * 2; // Each rectangle advances by 2 edges (120°)
  
  if (localPhase === 0) {
    // Phase 0: Going UP (one edge)
    targetY = ct.minY + phaseProgress * ct.yRange;
    targetAngle = baseAngle;
  } else if (localPhase === 1) {
    // Phase 1: Going RIGHT (one edge around)
    targetY = ct.maxY;
    targetAngle = baseAngle + phaseProgress * angleStep;
  } else if (localPhase === 2) {
    // Phase 2: Going DOWN (one edge)
    targetY = ct.maxY - phaseProgress * ct.yRange;
    targetAngle = baseAngle + angleStep;
  } else {
    // Phase 3: Going RIGHT (one edge around) to next starting position
    targetY = ct.minY;
    targetAngle = baseAngle + angleStep + phaseProgress * angleStep;
  }
  
  // Normalize angle
  while (targetAngle >= Math.PI * 2) targetAngle -= Math.PI * 2;
  
  // Create trail positions - 70 steps back in the pattern
  const trailPositions = [];
  for (let i = 0; i < ct.tailLength; i++) {
    let trailProgress = ct.progress - (i * 0.015); // Trail spacing
    while (trailProgress < 0) trailProgress += 12;
    
    const trailLocalPhase = Math.floor(trailProgress) % 4;
    const trailRectangleIndex = Math.floor(trailProgress / 4);
    const trailPhaseProgress = trailProgress - Math.floor(trailProgress);
    
    let trailY, trailAngle;
    const trailBaseAngle = trailRectangleIndex * angleStep * 2;
    
    if (trailLocalPhase === 0) {
      trailY = ct.minY + trailPhaseProgress * ct.yRange;
      trailAngle = trailBaseAngle;
    } else if (trailLocalPhase === 1) {
      trailY = ct.maxY;
      trailAngle = trailBaseAngle + trailPhaseProgress * angleStep;
    } else if (trailLocalPhase === 2) {
      trailY = ct.maxY - trailPhaseProgress * ct.yRange;
      trailAngle = trailBaseAngle + angleStep;
    } else {
      trailY = ct.minY;
      trailAngle = trailBaseAngle + angleStep + trailPhaseProgress * angleStep;
    }
    
    while (trailAngle >= Math.PI * 2) trailAngle -= Math.PI * 2;
    
    trailPositions.push({ y: trailY, angle: trailAngle, intensity: 1 - (i / ct.tailLength) });
  }
  
  // Light up LEDs closest to each trail position
  trailPositions.forEach(function(pos) {
    // Find closest LED to this position
    let closestDist = Infinity;
    let closestIndex = -1;
    
    ct.ledData.forEach(function(ledInfo) {
      // Calculate angular distance (accounting for wrap-around)
      let angleDiff = Math.abs(ledInfo.angle - pos.angle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      
      const yDiff = Math.abs(ledInfo.y - pos.y);
      const dist = Math.sqrt(angleDiff * angleDiff + (yDiff / ct.yRange) * (yDiff / ct.yRange));
      
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = ledInfo.index;
      }
    });
    
    if (closestIndex >= 0) {
      const smoothIntensity = pos.intensity * pos.intensity;
      
      // Color gradient from cyan to blue
      const hue = 0.5 + (1 - pos.intensity) * 0.2;
      const rgb = hslToRgb(hue, 1.0, 0.5);
      
      leds[closestIndex].color.r = Math.min(255, leds[closestIndex].color.r + Math.floor(rgb.r * smoothIntensity * 255));
      leds[closestIndex].color.g = Math.min(255, leds[closestIndex].color.g + Math.floor(rgb.g * smoothIntensity * 255));
      leds[closestIndex].color.b = Math.min(255, leds[closestIndex].color.b + Math.floor(rgb.b * smoothIntensity * 255));
    }
  });
  
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
  
  // Return the updated state
  return state;
}`;

// Music Beat animation
export const musicBeat = `// Music Beat Animation
// VU meter style - sides pulse upward like sound level indicators at 120 BPM

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Find bounds and calculate cylindrical coordinates
    let minY = Infinity, maxY = -Infinity;
    let centerX = 0, centerZ = 0;
    
    leds.forEach(function(led) {
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
      centerX += led.position.x;
      centerZ += led.position.z;
    });
    
    centerX /= leds.length;
    centerZ /= leds.length;
    const yRange = maxY - minY;
    
    // Calculate which side (0-5) each LED belongs to and its normalized Y position
    const ledData = leds.map(function(led, index) {
      const dx = led.position.x - centerX;
      const dz = led.position.z - centerZ;
      let angle = Math.atan2(dz, dx);
      if (angle < 0) angle += Math.PI * 2;
      
      // Map angle to side (0-5 for hexagon)
      const side = Math.floor((angle + Math.PI / 6) / (Math.PI / 3)) % 6;
      
      // Normalize Y position (0 = bottom, 1 = top)
      const yNorm = (led.position.y - minY) / yRange;
      
      return {
        index: index,
        side: side,
        yNorm: yNorm
      };
    });
    
    state = {
      ledData: ledData,
      minY: minY,
      maxY: maxY,
      yRange: yRange,
      beatFrame: 0,
      beatCycle: 30, // 120 BPM at 60 FPS = 30 frames per beat
      sideOffsets: [0, 5, 10, 15, 20, 25] // Offset each side slightly for wave effect
    };
  }
  
  const mb = state;
  mb.beatFrame = (mb.beatFrame + 1) % (mb.beatCycle * 6); // Full cycle across all sides
  
  // Calculate beat level (0-1) for each side - how high the VU meter fills
  const sideLevels = [];
  for (let side = 0; side < 6; side++) {
    // Each side beats with a slight offset
    const sideFrame = (mb.beatFrame + mb.sideOffsets[side]) % mb.beatCycle;
    const progress = sideFrame / mb.beatCycle;
    
    // Create a sharp attack and slower decay (like a kick drum)
    let level;
    if (progress < 0.1) {
      // Quick rise (attack)
      level = progress / 0.1;
    } else {
      // Slower decay
      level = 1 - ((progress - 0.1) / 0.9);
    }
    
    // Cap at 95% so top doesn't light up
    level = level * 0.95;
    
    // Ensure level is between 0 and 0.95
    level = Math.max(0, Math.min(0.95, level));
    
    sideLevels[side] = level;
  }
  
  // Apply VU meter effect to LEDs on each side with green->yellow->red gradient
  mb.ledData.forEach(function(ledInfo) {
    const led = leds[ledInfo.index];
    const sideLevel = sideLevels[ledInfo.side];
    
    // Check if this LED is below the current level for its side
    if (ledInfo.yNorm <= sideLevel) {
      // LED is lit - distinct color sections: green (bottom) -> yellow (middle) -> red (top at 70%)
      // The color is based on absolute Y position, not the level
      let r, g;
      
      if (ledInfo.yNorm < 0.35) {
        // Bottom section: green
        r = 0;
        g = 255;
      } else if (ledInfo.yNorm < 0.7) {
        // Middle section: yellow
        r = 255;
        g = 255;
      } else {
        // Top section (70%+): red
        r = 255;
        g = 0;
      }
      
      led.color.r = r;
      led.color.g = g;
      led.color.b = 0;
    } else {
      // LED is above the level - turn off
      led.color.r = 0;
      led.color.g = 0;
      led.color.b = 0;
    }
  });
  
  // Return the updated state
  return state;
}`;

// Winter Freeze animation
export const winterFreeze = `// Winter Freeze Animation
// Sparkly ice effect spreading from top to bottom

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Find Y bounds
    let minY = Infinity, maxY = -Infinity;
    
    leds.forEach(function(led) {
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
    });
    
    const yRange = maxY - minY;
    
    // Store normalized Y position for each LED
    const ledData = leds.map(function(led, index) {
      return {
        index: index,
        yNorm: (led.position.y - minY) / yRange
      };
    });
    
    state = {
      ledData: ledData,
      minY: minY,
      maxY: maxY,
      yRange: yRange,
      freezeLevel: 0, // How far down the freeze has progressed (0 = top, 1 = bottom)
      freezeSpeed: 0.005, // Speed of freeze progression
      sparkles: [] // Array of active sparkles
    };
  }
  
  const wf = state;
  
  // Progress the freeze downward
  wf.freezeLevel += wf.freezeSpeed;
  if (wf.freezeLevel >= 1.2) {
    wf.freezeLevel = 0; // Restart from top
    wf.sparkles = []; // Clear sparkles
  }
  
  // Add new sparkles throughout the frozen area - more frequent
  if (wf.freezeLevel > 0 && Math.random() < 0.5) {
    wf.sparkles.push({
      yNorm: 1 - Math.random() * wf.freezeLevel, // Anywhere in frozen zone
      lifetime: 0,
      maxLifetime: 15 + Math.floor(Math.random() * 25),
      brightness: 0.8 + Math.random() * 0.2,
      ledIndex: Math.floor(Math.random() * leds.length) // Specific LED to sparkle
    });
  }
  
  // Update sparkles
  wf.sparkles = wf.sparkles.filter(function(sparkle) {
    sparkle.lifetime++;
    return sparkle.lifetime < sparkle.maxLifetime;
  });
  
  // Apply freeze effect to LEDs
  wf.ledData.forEach(function(ledInfo) {
    const led = leds[ledInfo.index];
    
    // Check if this LED is in the frozen zone (from top down)
    const distanceFromTop = 1 - ledInfo.yNorm; // 0 = bottom, 1 = top
    
    if (distanceFromTop <= wf.freezeLevel) {
      // Frozen zone - varying shades of blue (more pronounced)
      // Create variation using LED index for consistent pattern
      const variation = (ledInfo.index * 17) % 100 / 100.0; // Pseudo-random but stable
      
      // Different shades of blue: light ice blue, cyan, deep blue
      let r, g, b;
      if (variation < 0.33) {
        // Light ice blue
        r = 150;
        g = 200;
        b = 255;
      } else if (variation < 0.67) {
        // Cyan blue
        r = 50;
        g = 180;
        b = 255;
      } else {
        // Deep blue
        r = 30;
        g = 100;
        b = 200;
      }
      
      // Add sparkle if this LED has one
      let hasSparkle = false;
      wf.sparkles.forEach(function(sparkle) {
        if (sparkle.ledIndex === ledInfo.index) {
          // Sparkle intensity based on lifetime (fade in and out)
          const progress = sparkle.lifetime / sparkle.maxLifetime;
          let intensity;
          if (progress < 0.2) {
            intensity = progress / 0.2;
          } else if (progress < 0.5) {
            intensity = 1;
          } else {
            intensity = 1 - ((progress - 0.5) / 0.5);
          }
          
          // Make sparkle bright white
          if (intensity > 0.3) {
            r = 255;
            g = 255;
            b = 255;
            hasSparkle = true;
          }
        }
      });
      
      led.color.r = r;
      led.color.g = g;
      led.color.b = b;
    } else {
      // Not frozen yet - dark/off
      led.color.r = 0;
      led.color.g = 0;
      led.color.b = 0;
    }
  });
  
  // Return the updated state
  return state;
}`;

// Flames animation
export const flames = `// Flames Animation
// Flickering fire rising from bottom to top

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    // Find bounds
    let minY = Infinity, maxY = -Infinity;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let centerX = 0, centerZ = 0;
    
    leds.forEach(function(led) {
      if (led.position.y < minY) minY = led.position.y;
      if (led.position.y > maxY) maxY = led.position.y;
      if (led.position.x < minX) minX = led.position.x;
      if (led.position.x > maxX) maxX = led.position.x;
      if (led.position.z < minZ) minZ = led.position.z;
      if (led.position.z > maxZ) maxZ = led.position.z;
      centerX += led.position.x;
      centerZ += led.position.z;
    });
    
    centerX /= leds.length;
    centerZ /= leds.length;
    const yRange = maxY - minY;
    
    // Store 3D position data for volumetric effect
    const ledData = leds.map(function(led, index) {
      const dx = led.position.x - centerX;
      const dz = led.position.z - centerZ;
      const distFromCenter = Math.sqrt(dx * dx + dz * dz);
      
      return {
        index: index,
        yNorm: (led.position.y - minY) / yRange,
        distFromCenter: distFromCenter,
        flicker: Math.random(), // Random starting flicker
        heightOffset: Math.random() * 1.0, // Large height variation (0-1.0) - can go completely black
        heightVelocity: (Math.random() - 0.5) * 0.06, // Higher initial velocity
        turbulence: Math.random() * 0.3 // 3D turbulence factor
      };
    });
    
    state = {
      ledData: ledData,
      minY: minY,
      maxY: maxY,
      yRange: yRange,
      centerX: centerX,
      centerZ: centerZ,
      time: 0
    };
  }
  
  const fl = state;
  fl.time += 0.1;
  
  // Apply volumetric flame effect to LEDs
  fl.ledData.forEach(function(ledInfo) {
    const led = leds[ledInfo.index];
    
    // Update turbulence for 3D volumetric effect
    ledInfo.turbulence += (Math.random() - 0.5) * 0.1;
    if (ledInfo.turbulence < 0) ledInfo.turbulence = 0;
    if (ledInfo.turbulence > 0.5) ledInfo.turbulence = 0.5;
    
    // Update flicker more dramatically
    ledInfo.flicker += (Math.random() - 0.5) * 0.6;
    if (ledInfo.flicker < 0) ledInfo.flicker = 0;
    if (ledInfo.flicker > 1) ledInfo.flicker = 1;
    
    // Animate height offset with velocity for extreme dynamic movement
    // Add strong random acceleration - flames surge and die down
    ledInfo.heightVelocity += (Math.random() - 0.5) * 0.025;
    
    // Less damping for more dramatic movement
    ledInfo.heightVelocity *= 0.92;
    
    // Update height offset
    ledInfo.heightOffset += ledInfo.heightVelocity;
    
    // Bounce at boundaries with more energy
    if (ledInfo.heightOffset < -0.2) {
      ledInfo.heightOffset = -0.2;
      ledInfo.heightVelocity = Math.abs(ledInfo.heightVelocity) * 0.7;
    }
    if (ledInfo.heightOffset > 1.1) {
      ledInfo.heightOffset = 1.1;
      ledInfo.heightVelocity = -Math.abs(ledInfo.heightVelocity) * 0.7;
    }
    
    // Volumetric effect: outer edges have more turbulent flames
    const radialEffect = ledInfo.turbulence * (ledInfo.distFromCenter / 40);
    
    // Effective height with variation and 3D turbulence
    const effectiveHeight = ledInfo.yNorm - ledInfo.heightOffset + radialEffect;
    
    // Check if this LED should be lit (within the varying flame height)
    if (effectiveHeight > 0.7) {
      // Above flame or flame died down - black
      led.color.r = 0;
      led.color.g = 0;
      led.color.b = 0;
    } else if (effectiveHeight < 0) {
      // Way below flame base - also reduce intensity
      const belowFade = Math.max(0, 1 + effectiveHeight * 2);
      const baseIntensity = belowFade;
      const flickerAmount = ledInfo.flicker;
      const intensity = baseIntensity * (0.5 + flickerAmount * 0.5);
      
      // Deep red at base
      led.color.r = Math.floor(255 * intensity);
      led.color.g = Math.floor(25 * intensity);
      led.color.b = 0;
    } else {
      // Volumetric fire intensity - considers height and distance from center
      const baseIntensity = 1 - (effectiveHeight * 0.8); // Bottom is brightest
      const flickerAmount = ledInfo.flicker;
      
      // Outer flames are more diffuse/turbulent
      const radialIntensityMod = 1 - (ledInfo.distFromCenter / 80) * ledInfo.turbulence;
      
      const intensity = baseIntensity * (0.5 + flickerAmount * 0.5) * radialIntensityMod;
      
      // Fire colors with more contrast and volumetric depth
      let r, g, b;
      
      if (effectiveHeight < 0.25) {
        // Bottom: deep red to red-orange (high contrast)
        r = 255;
        g = Math.floor(effectiveHeight * 100); // 0-25
        b = 0;
      } else if (effectiveHeight < 0.5) {
        // Lower-middle: red-orange to bright orange
        const progress = (effectiveHeight - 0.25) / 0.25;
        r = 255;
        g = Math.floor(25 + progress * 130); // 25-155
        b = 0;
      } else if (effectiveHeight < 0.75) {
        // Upper-middle: bright orange to yellow
        const progress = (effectiveHeight - 0.5) / 0.25;
        r = 255;
        g = Math.floor(155 + progress * 80); // 155-235
        b = 0;
      } else {
        // Top: bright yellow to white-hot tips
        const progress = (effectiveHeight - 0.75) / 0.15;
        r = 255;
        g = Math.floor(235 + progress * 20); // 235-255
        b = Math.floor(progress * 100); // Add some blue for white tips
      }
      
      // Apply intensity with flicker
      led.color.r = Math.floor(r * intensity);
      led.color.g = Math.floor(g * intensity);
      led.color.b = Math.floor(b * intensity);
    }
  });
  
  // Return the updated state
  return state;
}`;

// Star Sprinkle animation
export const starSprinkle = `// Star Sprinkle Animation
// Random twinkling stars appearing throughout the shape

function animate(leds, frame, shape, state) {
  // Initialize state on first call
  if (!state) {
    state = {
      stars: [], // Active stars
      starsPerFrame: 3 // Spawn 3 stars per frame for many stars
    };
  }
  
  const ss = state;
  
  // Fade all LEDs slightly
  leds.forEach(function(led) {
    led.color.r = Math.max(0, led.color.r - 15);
    led.color.g = Math.max(0, led.color.g - 15);
    led.color.b = Math.max(0, led.color.b - 15);
  });
  
  // Spawn multiple new stars each frame
  for (let i = 0; i < ss.starsPerFrame; i++) {
    if (Math.random() < 0.5) { // 50% chance for each of the 3 attempts
      ss.stars.push({
        ledIndex: Math.floor(Math.random() * leds.length),
        brightness: 0,
        age: 0,
        maxAge: 20 + Math.floor(Math.random() * 30), // 20-50 frames
        color: {
          r: 200 + Math.floor(Math.random() * 55), // White-ish colors
          g: 200 + Math.floor(Math.random() * 55),
          b: 200 + Math.floor(Math.random() * 55)
        }
      });
    }
  }
  
  // Update and render stars
  ss.stars = ss.stars.filter(function(star) {
    star.age++;
    
    // Calculate brightness with twinkle effect
    const ageProgress = star.age / star.maxAge;
    let brightness;
    
    if (ageProgress < 0.2) {
      // Fast fade in
      brightness = ageProgress / 0.2;
    } else if (ageProgress < 0.8) {
      // Twinkle at peak
      const twinkle = Math.sin(star.age * 0.5) * 0.2 + 0.8;
      brightness = twinkle;
    } else {
      // Fade out
      brightness = (1 - ageProgress) / 0.2;
    }
    
    star.brightness = brightness;
    
    // Apply star to LED
    if (star.ledIndex >= 0 && star.ledIndex < leds.length) {
      const led = leds[star.ledIndex];
      const r = Math.floor(star.color.r * brightness);
      const g = Math.floor(star.color.g * brightness);
      const b = Math.floor(star.color.b * brightness);
      
      // Use max to prevent dimming existing brighter LEDs
      led.color.r = Math.max(led.color.r, r);
      led.color.g = Math.max(led.color.g, g);
      led.color.b = Math.max(led.color.b, b);
    }
    
    // Keep star if not expired
    return star.age < star.maxAge;
  });
  
  // Return the updated state
  return state;
}`;

export const defaultAnimations = {
  'Rainbow Wave': rainbowWave,
  'Running Lights': runningLights,
  'Edge Walker': edgeWalker,
  'Multi Walker': multiWalker,
  'Knight Rider 3D': knightRider3D,
  'Fireworks': fireworks,
  'Shockwave': shockwave,
  'Color Flood': colorFlood,
  'Rainbow Flood': rainbowFlood,
  'Edge Flash': edgeFlash,
  'Heartbeat': heartbeat,
  'Random Sparkle': randomSparkle,
  'Breathing Spheres': breathingSpheres,
  'Spiral Sphere': spiralSphere,
  'Cylinder Trace': cylinderTrace,
  'Music Beat': musicBeat,
  'Winter Freeze': winterFreeze,
  'Flames': flames,
  'Star Sprinkle': starSprinkle,
};

