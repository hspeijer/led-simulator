'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createCube, generateLEDs, createStrip, buildShape } from '@/lib/shapeBuilder';
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
  deleteCustomShape
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

  // Load saved patterns on mount
  useEffect(() => {
    const savedShapes = getCustomShapes();
    const savedAnimations = getCustomAnimations();
    
    const shapesMap: Record<string, string> = {};
    savedShapes.forEach(s => { shapesMap[s.name] = s.code; });
    
    const animMap: Record<string, string> = {};
    savedAnimations.forEach(a => { animMap[a.name] = a.code; });
    
    setCustomShapes(shapesMap);
    setCustomAnimations(animMap);
    setAllShapes({ ...defaultShapes, ...shapesMap });
    setAllAnimations({ ...defaultAnimations, ...animMap });
    
    // Load last used code
    const lastShape = getLastShape();
    const lastAnim = getLastAnimation();
    
    if (lastShape) setShapeCode(lastShape);
    if (lastAnim) setAnimationCode(lastAnim);
  }, []);

  // Compile the shape code
  const compileShape = useCallback((code: string) => {
    try {
      // Create a function that wraps the user code with shape builder functions
      const wrappedCode = `
        ${code}
      `;
      
      // Create function with shape builder utilities in scope
      const shapeFn = new Function('createStrip', 'buildShape', 'createCube', wrappedCode);
      const shape = shapeFn(createStrip, buildShape, createCube) as LEDShape;
      
      if (!shape || !shape.strips) {
        throw new Error('Shape must return a valid LEDShape object');
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
  const compileAnimation = useCallback((code: string) => {
    try {
      // Create a function that wraps the user code
      const wrappedCode = `
        ${code}
        return animate;
      `;
      
      const animationFn = new Function('leds', 'time', wrappedCode) as unknown as () => AnimationFunction;
      const fn = animationFn();
      
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
      saveLastShape(shapeCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [shapeCode, compileShape]);

  // Auto-compile animation when code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      compileAnimation(animationCode);
      saveLastAnimation(animationCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [animationCode, compileAnimation]);

  // Handle shape selection
  const handleShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shapeName = e.target.value;
    setSelectedShape(shapeName);
    setShapeCode(allShapes[shapeName] || '');
  };

  // Handle pattern selection
  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pattern = e.target.value;
    setSelectedPattern(pattern);
    setAnimationCode(allAnimations[pattern] || '');
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

  const handleRunAnimation = () => {
    compileAnimation(animationCode);
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
              <button className={styles.button} onClick={handleRunAnimation}>
                Run
              </button>
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
            Shape: {compiledShape.name} | LEDs: {compiledShape.totalLEDs} | Strips: {compiledShape.strips.length}
          </div>
        )}
        <LEDVisualization leds={shapeLeds} shape={compiledShape} animationFn={compiledAnimation} />
      </div>
    </div>
  );
}

