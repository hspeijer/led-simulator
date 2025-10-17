'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { generateLEDs, createNode, createEdge, buildShape } from '@/lib/shapeBuilder';
import { defaultAnimations } from '@/lib/animations';
import { defaultShapes } from '@/lib/shapes';
import { LED, AnimationFunction, LEDShape } from '@/types/led';
import { 
  saveCustomAnimation, 
  saveCustomShape, 
  getCustomAnimations, 
  getCustomShapes,
  getLastAnimation,
  getLastShape,
  saveLastAnimation,
  saveLastShape,
  deleteCustomAnimation,
  deleteCustomShape,
  clearOldCachedCode
} from '@/lib/storage';
import styles from './page.module.css';

// Dynamically import components that use Three.js and Monaco (client-side only)
const LEDVisualization = dynamic(() => import('@/components/LEDVisualization'), {
  ssr: false,
});

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
});

const ShapeEditor = dynamic(() => import('@/components/ShapeEditor'), {
  ssr: false,
});

export default function Home() {
  // Shape state
  const [selectedShape, setSelectedShape] = useState<string>('Cube');
  const [shapeCode, setShapeCode] = useState<string>(defaultShapes['Cube']);
  const [compiledShape, setCompiledShape] = useState<LEDShape | null>(null);
  const [shapeLeds, setShapeLeds] = useState<LED[]>([]);
  const [customShapes, setCustomShapes] = useState<Record<string, string>>({});
  const [allShapes, setAllShapes] = useState<Record<string, string>>({ ...defaultShapes });
  
  // Animation state
  const [selectedPattern, setSelectedPattern] = useState<string>('Rainbow Wave');
  const [animationCode, setAnimationCode] = useState<string>(defaultAnimations['Rainbow Wave']);
  const [compiledAnimation, setCompiledAnimation] = useState<AnimationFunction | null>(null);
  const [customAnimations, setCustomAnimations] = useState<Record<string, string>>({});
  const [allAnimations, setAllAnimations] = useState<Record<string, string>>({ ...defaultAnimations });
  
  // Error state
  const [shapeError, setShapeError] = useState<string | null>(null);
  const [animationError, setAnimationError] = useState<string | null>(null);
  
  // Animation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stepFrame, setStepFrame] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);

  // Load saved patterns on mount
  useEffect(() => {
    // Clear old cached code from previous version
    clearOldCachedCode();
    
    const savedShapes = getCustomShapes();
    const savedAnimations = getCustomAnimations();
    
    const shapesMap: Record<string, string> = {};
    savedShapes.forEach(s => { shapesMap[s.name] = s.code; });
    
    const animMap: Record<string, string> = {};
    savedAnimations.forEach(a => { animMap[a.name] = a.code; });
    
    setCustomShapes(shapesMap);
    setCustomAnimations(animMap);
    
    const allShapesMap: Record<string, string> = { ...defaultShapes, ...shapesMap };
    const allAnimationsMap: Record<string, string> = { ...defaultAnimations, ...animMap };
    
    setAllShapes(allShapesMap);
    setAllAnimations(allAnimationsMap);
    
    // Load last selected items (always load fresh code from presets or custom)
    const lastShapeName = getLastShape();
    const lastAnimName = getLastAnimation();
    
    if (lastShapeName && allShapesMap[lastShapeName]) {
      setSelectedShape(lastShapeName);
      setShapeCode(allShapesMap[lastShapeName]);
    }
    
    if (lastAnimName && allAnimationsMap[lastAnimName]) {
      setSelectedPattern(lastAnimName);
      setAnimationCode(allAnimationsMap[lastAnimName]);
    }
  }, []);

  // Compile the shape code
  const compileShape = useCallback((code: string) => {
    try {
      // Create a function that wraps the user code with shape builder functions
      const wrappedCode = `
        ${code}
      `;
      
      // Create function with shape builder utilities in scope
      const shapeFn = new Function('createNode', 'createEdge', 'buildShape', wrappedCode);
      const shape = shapeFn(createNode, createEdge, buildShape) as LEDShape;
      
      if (!shape || !shape.nodes || !shape.edges) {
        throw new Error('Shape must return a valid LEDShape object with nodes and edges');
      }
      
      const leds = generateLEDs(shape);
      setCompiledShape(shape);
      setShapeLeds(leds);
      setShapeError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setShapeError(`Shape Error: ${errorMessage}`);
      console.error('Shape compilation error:', err);
    }
  }, []);

  // Compile the animation code
  const compileAnimation = useCallback(async (code: string) => {
    try {
      // Create a function that wraps the user code with graph utilities injected
      const wrappedCode = `
        ${code}
        return animate;
      `;
      
      // Dynamically import graph utilities (client-side only)
      const graphBuilderModule = await import('@/lib/graphBuilder');
      const { GraphWalker } = await import('@/lib/graphWalker');
      
      // Create function with graph utilities in scope
      const animationFn = new Function(
        'leds', 
        'frame', 
        'shape',
        'graphUtils', 
        'walkerUtils',
        wrappedCode
      ) as unknown as (
        leds: any, 
        frame: any, 
        shape: any,
        graphUtils: any,
        walkerUtils: any
      ) => AnimationFunction;
      
      const fn = (leds: LED[], frame: number, shape: LEDShape, state?: any) => {
        const animateFn = animationFn(leds, frame, shape, graphBuilderModule, { GraphWalker });
        if (typeof animateFn === 'function') {
          return animateFn(leds, frame, shape, state);
        }
        return state;
      };
      
      setCompiledAnimation(() => fn);
      setAnimationError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setAnimationError(`Animation Error: ${errorMessage}`);
      console.error('Animation compilation error:', err);
    }
  }, []);

  // Auto-compile shape when code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      compileShape(shapeCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [shapeCode, compileShape]);

  // Auto-compile animation when code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      compileAnimation(animationCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [animationCode, compileAnimation]);

  // Handle shape selection
  const handleShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shapeName = e.target.value;
    setSelectedShape(shapeName);
    setShapeCode(allShapes[shapeName] || '');
    saveLastShape(shapeName); // Save selected name, not code
  };

  // Handle pattern selection
  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pattern = e.target.value;
    setSelectedPattern(pattern);
    setAnimationCode(allAnimations[pattern] || '');
    saveLastAnimation(pattern); // Save selected name, not code
  };

  // Save handlers
  const handleSaveShape = () => {
    const name = prompt('Enter a name for this shape:');
    if (!name) return;
    
    saveCustomShape(name, shapeCode);
    const newCustom = { ...customShapes, [name]: shapeCode };
    setCustomShapes(newCustom);
    setAllShapes({ ...defaultShapes, ...newCustom });
    setSelectedShape(name);
  };

  const handleSaveAnimation = () => {
    const name = prompt('Enter a name for this animation:');
    if (!name) return;
    
    saveCustomAnimation(name, animationCode);
    const newCustom = { ...customAnimations, [name]: animationCode };
    setCustomAnimations(newCustom);
    setAllAnimations({ ...defaultAnimations, ...newCustom });
    setSelectedPattern(name);
  };

  // Delete handlers
  const handleDeleteShape = () => {
    if (!(selectedShape in customShapes)) {
      alert('Cannot delete preset shapes');
      return;
    }
    
    if (!confirm(`Delete "${selectedShape}"?`)) return;
    
    deleteCustomShape(selectedShape);
    const newCustom = { ...customShapes };
    delete newCustom[selectedShape];
    setCustomShapes(newCustom);
    setAllShapes({ ...defaultShapes, ...newCustom });
    setSelectedShape('Cube');
    setShapeCode(defaultShapes['Cube']);
  };

  const handleDeleteAnimation = () => {
    if (!(selectedPattern in customAnimations)) {
      alert('Cannot delete preset animations');
      return;
    }
    
    if (!confirm(`Delete "${selectedPattern}"?`)) return;
    
    deleteCustomAnimation(selectedPattern);
    const newCustom = { ...customAnimations };
    delete newCustom[selectedPattern];
    setCustomAnimations(newCustom);
    setAllAnimations({ ...defaultAnimations, ...newCustom });
    setSelectedPattern('Rainbow Wave');
    setAnimationCode(defaultAnimations['Rainbow Wave']);
  };

  // Handle manual run
  const handleRunShape = () => {
    compileShape(shapeCode);
  };

  // Combined error display
  const error = shapeError || animationError;

  return (
    <div className={styles.container}>
      <div className={styles.editorPanel}>
        {/* Shape Editor Section */}
        <div className={styles.shapeSection}>
          <div className={styles.header}>
            <h1 className={styles.title}>Shape Editor</h1>
            <div className={styles.controls}>
              <select 
                className={styles.select}
                value={selectedShape}
                onChange={handleShapeChange}
              >
                <optgroup label="Presets">
                  {Object.keys(defaultShapes).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
                {Object.keys(customShapes).length > 0 && (
                  <optgroup label="Custom">
                    {Object.keys(customShapes).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button className={styles.button} onClick={handleSaveShape} title="Save current shape">
                💾
              </button>
              {selectedShape in customShapes && (
                <button className={styles.button} onClick={handleDeleteShape} title="Delete custom shape">
                  🗑️
                </button>
              )}
              <button className={styles.button} onClick={handleRunShape}>
                Run
              </button>
            </div>
          </div>
          <div className={styles.shapeEditorWrapper}>
            <ShapeEditor
              value={shapeCode}
              onChange={setShapeCode}
              onError={setShapeError}
            />
          </div>
        </div>

        {/* Animation Editor Section */}
        <div className={styles.animationSection}>
          <div className={styles.header}>
            <h1 className={styles.title}>Animation Editor</h1>
            <div className={styles.controls}>
              <select 
                className={styles.select}
                value={selectedPattern}
                onChange={handlePatternChange}
              >
                <optgroup label="Presets">
                  {Object.keys(defaultAnimations).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
                {Object.keys(customAnimations).length > 0 && (
                  <optgroup label="Custom">
                    {Object.keys(customAnimations).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button className={styles.button} onClick={handleSaveAnimation} title="Save current animation">
                💾
              </button>
              {selectedPattern in customAnimations && (
                <button className={styles.button} onClick={handleDeleteAnimation} title="Delete custom animation">
                  🗑️
                </button>
              )}
              <button 
                className={styles.playButton} 
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause animation' : 'Play animation'}
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <button 
                className={styles.button} 
                onClick={() => setStepFrame(prev => prev + 1)}
                title="Step forward one frame"
                disabled={isPlaying}
              >
                ⏭️ Step
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                <label htmlFor="fps-slider" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                  FPS: {fps}
                </label>
                <input
                  id="fps-slider"
                  type="range"
                  min="1"
                  max="100"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  style={{ width: '100px' }}
                  title={`Animation speed: ${fps} frames per second`}
                />
              </div>
            </div>
          </div>
          <div className={styles.animationEditorWrapper}>
            <CodeEditor
              value={animationCode}
              onChange={setAnimationCode}
              onError={setAnimationError}
            />
          </div>
        </div>
      </div>

      <div className={styles.visualizationPanel}>
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        {compiledShape && (
          <div className={styles.info}>
            Shape: {compiledShape.name} | LEDs: {compiledShape.totalLEDs} | Nodes: {compiledShape.nodes.size} | Edges: {compiledShape.edges.size}
          </div>
        )}
        <LEDVisualization 
          leds={shapeLeds} 
          shape={compiledShape} 
          animationFn={compiledAnimation} 
          isPlaying={isPlaying} 
          stepFrame={stepFrame}
          fps={fps}
        />
      </div>
    </div>
  );
}

