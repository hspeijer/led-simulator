'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LED, LEDShape } from '@/types/led';

interface LEDPointsProps {
  leds: LED[];
  shape: LEDShape | null;
  animationFn: ((leds: LED[], time: number, shape: LEDShape) => void) | null;
}

function LEDPoints({ leds, shape, animationFn }: LEDPointsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());
  const ledsRef = useRef<LED[]>(leds);
  const shapeRef = useRef<LEDShape | null>(shape);

  // Update leds and shape references when they change
  useEffect(() => {
    ledsRef.current = leds;
    shapeRef.current = shape;
  }, [leds, shape]);

  // Create geometry and initial colors
  const { geometry, colors } = useMemo(() => {
    const positions = new Float32Array(leds.length * 3);
    const colors = new Float32Array(leds.length * 3);

    leds.forEach((led, i) => {
      positions[i * 3] = led.position.x;
      positions[i * 3 + 1] = led.position.y;
      positions[i * 3 + 2] = led.position.z;

      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, colors };
  }, [leds]);

  useFrame(() => {
    if (!pointsRef.current || !animationFn || !shapeRef.current) return;

    const elapsed = Date.now() - startTime.current;
    
    // Run the animation function with shape parameter
    animationFn(ledsRef.current, elapsed, shapeRef.current);

    // Update colors
    const colorAttribute = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
    
    ledsRef.current.forEach((led, i) => {
      colorAttribute.setXYZ(i, led.color.r / 255, led.color.g / 255, led.color.b / 255);
    });

    colorAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.5}
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
  animationFn: ((leds: LED[], time: number, shape: LEDShape) => void) | null;
}

export default function LEDVisualization({ leds, shape, animationFn }: LEDVisualizationProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <Canvas
        camera={{ position: [60, 60, 60], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <WireframeCube size={50} />
        <LEDPoints leds={leds} shape={shape} animationFn={animationFn} />
        
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

