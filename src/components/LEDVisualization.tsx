'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LED, LEDShape } from '@/types/led';

interface LEDPointsProps {
  leds: LED[];
  shape: LEDShape | null;
  animationFn: ((leds: LED[], frame: number, shape: LEDShape) => void) | null;
  isPlaying: boolean;
  stepFrame: number;
  fps: number;
  onFpsUpdate: (fps: number) => void;
}

function LEDPoints({ leds, shape, animationFn, isPlaying, stepFrame, fps, onFpsUpdate }: LEDPointsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const frameNumber = useRef(0);
  const ledsRef = useRef<LED[]>(leds);
  const shapeRef = useRef<LEDShape | null>(shape);
  const lastPlayingState = useRef(isPlaying);
  const lastStepFrame = useRef(stepFrame);
  const lastFrameTime = useRef(0);
  
  // FPS counter
  const fpsFrameTimes = useRef<number[]>([]);

  // Update leds and shape references when they change
  useEffect(() => {
    ledsRef.current = leds;
    shapeRef.current = shape;
  }, [leds, shape]);

  // Track play/pause state changes and dump shape when animation starts
  useEffect(() => {
    // Detect when animation starts (transition from paused to playing)
    if (isPlaying && !lastPlayingState.current && shape) {
      // Store shape on window for console inspection
      (window as any).shape = shape;
      
      console.log('=== Animation Started - Shape Object ===');
      console.log('Shape Name:', shape.name);
      console.log('Total LEDs:', shape.totalLEDs);
      console.log('Nodes:', shape.nodes.size);
      console.log('Edges:', shape.edges.size);
      console.log('\nNodes:');
      shape.nodes.forEach((node, id) => {
        console.log(`  ${id}:`, {
          position: node.position,
          incomingEdges: node.incomingEdges,
          outgoingEdges: node.outgoingEdges,
        });
      });
      console.log('\nEdges (with LED indices):');
      shape.edges.forEach((edge, id) => {
        const endIndex = edge.startIndex + edge.ledCount - 1;
        console.log(`  ${id}:`, {
          from: edge.fromNodeId,
          to: edge.toNodeId,
          ledCount: edge.ledCount,
          startIndex: edge.startIndex,
          endIndex: endIndex,
          ledRange: `[${edge.startIndex}...${endIndex}]`,
        });
      });
      console.log('=== End Shape Object ===');
      console.log('Shape object is now available as window.shape for inspection\n');
    }
    lastPlayingState.current = isPlaying;
  }, [isPlaying, shape]);

  // Handle step frame changes - update buffer directly when stepping
  useEffect(() => {
    if (stepFrame !== lastStepFrame.current && !isPlaying) {
      if (!pointsRef.current || !animationFn || !shapeRef.current) {
        return;
      }

      // Increment frame number
      frameNumber.current++;
      const colorAttribute = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;

      try {
        // Run animation function with frame number
        animationFn(ledsRef.current, frameNumber.current, shapeRef.current);
        
        // Update all colors in the buffer
        ledsRef.current.forEach((led, i) => {
          const r = led.color.r / 255;
          const g = led.color.g / 255;
          const b = led.color.b / 255;
          colorAttribute.setXYZ(i, r, g, b);
        });
        
        colorAttribute.needsUpdate = true;
        lastStepFrame.current = stepFrame;
      } catch (err) {
        console.error('Step animation error:', err);
      }
    }
  }, [stepFrame, isPlaying, animationFn]);

  // Create geometry and initial colors
  const { geometry, colors } = useMemo(() => {
    if (leds.length === 0) {
      return { geometry: new THREE.BufferGeometry(), colors: new Float32Array(0) };
    }

    const positions = new Float32Array(leds.length * 3);
    const colors = new Float32Array(leds.length * 3);

    leds.forEach((led, i) => {
      positions[i * 3] = led.position.x;
      positions[i * 3 + 1] = led.position.y;
      positions[i * 3 + 2] = led.position.z;

      // Initialize with white color
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, colors };
  }, [leds]);

  useFrame((state) => {
    // Calculate actual FPS
    const now = performance.now();
    fpsFrameTimes.current.push(now);
    
    // Keep only last 30 frame times
    if (fpsFrameTimes.current.length > 30) {
      fpsFrameTimes.current.shift();
    }
    
    // Update FPS display every 10 frames
    if (fpsFrameTimes.current.length >= 10 && frameNumber.current % 10 === 0) {
      const oldestTime = fpsFrameTimes.current[0];
      const newestTime = fpsFrameTimes.current[fpsFrameTimes.current.length - 1];
      const deltaTime = newestTime - oldestTime;
      const calculatedFps = Math.round((fpsFrameTimes.current.length - 1) / (deltaTime / 1000));
      onFpsUpdate(calculatedFps);
    }
    
    // Only run animation loop when actively playing
    if (!isPlaying) {
      return;
    }

    if (!pointsRef.current || leds.length === 0 || !animationFn || !shapeRef.current) {
      return;
    }

    // Frame rate limiting based on FPS setting
    const currentTime = state.clock.elapsedTime;
    const frameDuration = 1 / fps;
    
    if (currentTime - lastFrameTime.current < frameDuration) {
      return; // Skip this frame to maintain desired FPS
    }
    
    lastFrameTime.current = currentTime;

    const colorAttribute = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
    
    // Increment frame number
    frameNumber.current++;

    try {
      // Run animation function with frame number
      animationFn(ledsRef.current, frameNumber.current, shapeRef.current);
      
      // Update colors in the buffer
      ledsRef.current.forEach((led, i) => {
        const r = led.color.r / 255;
        const g = led.color.g / 255;
        const b = led.color.b / 255;
        colorAttribute.setXYZ(i, r, g, b);
      });
      
      colorAttribute.needsUpdate = true;
    } catch (err) {
      console.error('Animation loop error:', err);
    }
  });

  if (leds.length === 0) {
    return null;
  }

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.8}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}

function WireframeCube({ size }: { size: number }) {
  const half = size / 2;
  
  return (
    <group>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
        <lineBasicMaterial color="#333333" opacity={0.3} transparent />
      </lineSegments>
    </group>
  );
}

interface LEDVisualizationProps {
  leds: LED[];
  shape: LEDShape | null;
  animationFn: ((leds: LED[], frame: number, shape: LEDShape) => void) | null;
  isPlaying: boolean;
  stepFrame: number;
  fps: number;
}

export default function LEDVisualization({ leds, shape, animationFn, isPlaying, stepFrame, fps }: LEDVisualizationProps) {
  const [actualFps, setActualFps] = React.useState(0);
  
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      {/* FPS Counter Overlay */}
      {actualFps > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '4px',
          pointerEvents: 'none'
        }}>
          {actualFps} FPS
        </div>
      )}
      <Canvas
        camera={{ position: [60, 60, 60], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} />
        
        <WireframeCube size={50} />
        <LEDPoints leds={leds} shape={shape} animationFn={animationFn} isPlaying={isPlaying} stepFrame={stepFrame} fps={fps} onFpsUpdate={setActualFps} />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
        
        <gridHelper args={[100, 20, '#222222', '#111111']} />
      </Canvas>
    </div>
  );
}

