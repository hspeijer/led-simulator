'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createCube, generateLEDs } from '@/lib/shapeBuilder';
import { defaultAnimations } from '@/lib/animations';
import { LED, AnimationFunction } from '@/types/led';
import styles from './page.module.css';

// Dynamically import components that use Three.js and Monaco (client-side only)
const LEDVisualization = dynamic(() => import('@/components/LEDVisualization'), {
  ssr: false,
});

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
});

export default function Home() {
  const [selectedPattern, setSelectedPattern] = useState<string>('Rainbow Wave');
  const [code, setCode] = useState<string>(defaultAnimations['Rainbow Wave']);
  const [compiledAnimation, setCompiledAnimation] = useState<AnimationFunction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate the cube shape and LEDs
  const { shape, leds } = useMemo(() => {
    const shape = createCube(50);
    const leds = generateLEDs(shape);
    return { shape, leds };
  }, []);

  // Compile the animation code
  const compileCode = useCallback((code: string) => {
    try {
      // Create a function that wraps the user code
      const wrappedCode = `
        ${code}
        return animate;
      `;
      
      const animationFn = new Function('leds', 'time', wrappedCode) as unknown as () => AnimationFunction;
      const fn = animationFn();
      
      setCompiledAnimation(() => fn);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Compilation Error: ${errorMessage}`);
      console.error('Animation compilation error:', err);
    }
  }, []);

  // Auto-compile when code changes (with debounce would be better for production)
  useEffect(() => {
    const timer = setTimeout(() => {
      compileCode(code);
    }, 500);

    return () => clearTimeout(timer);
  }, [code, compileCode]);

  // Handle pattern selection
  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pattern = e.target.value;
    setSelectedPattern(pattern);
    setCode(defaultAnimations[pattern as keyof typeof defaultAnimations] || '');
  };

  // Handle manual run
  const handleRun = () => {
    compileCode(code);
  };

  return (
    <div className={styles.container}>
      <div className={styles.editorPanel}>
        <div className={styles.header}>
          <h1 className={styles.title}>LED Simulator - Animation Editor</h1>
          <div className={styles.controls}>
            <select 
              className={styles.select}
              value={selectedPattern}
              onChange={handlePatternChange}
            >
              {Object.keys(defaultAnimations).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button className={styles.button} onClick={handleRun}>
              Run
            </button>
          </div>
        </div>
        <div className={styles.editorWrapper}>
          <CodeEditor
            value={code}
            onChange={setCode}
            onError={setError}
          />
        </div>
      </div>

      <div className={styles.visualizationPanel}>
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        <div className={styles.info}>
          Shape: {shape.name} | LEDs: {shape.totalLEDs} | Strips: {shape.strips.length}
        </div>
        <LEDVisualization leds={leds} animationFn={compiledAnimation} />
      </div>
    </div>
  );
}

