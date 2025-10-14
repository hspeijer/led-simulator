import { SavedPattern, SavedShape } from '@/types/led';

const STORAGE_KEYS = {
  CUSTOM_ANIMATIONS: 'led-simulator-custom-animations',
  CUSTOM_SHAPES: 'led-simulator-custom-shapes',
  LAST_ANIMATION: 'led-simulator-last-animation',
  LAST_SHAPE: 'led-simulator-last-shape',
};

// Animation Storage
export function saveCustomAnimation(name: string, code: string): void {
  if (typeof window === 'undefined') return;
  
  const animations = getCustomAnimations();
  const existing = animations.find(a => a.name === name);
  
  if (existing) {
    existing.code = code;
    existing.timestamp = Date.now();
  } else {
    animations.push({ name, code, timestamp: Date.now() });
  }
  
  localStorage.setItem(STORAGE_KEYS.CUSTOM_ANIMATIONS, JSON.stringify(animations));
}

export function getCustomAnimations(): SavedPattern[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_ANIMATIONS);
  return data ? JSON.parse(data) : [];
}

export function deleteCustomAnimation(name: string): void {
  if (typeof window === 'undefined') return;
  
  const animations = getCustomAnimations().filter(a => a.name !== name);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_ANIMATIONS, JSON.stringify(animations));
}

// Shape Storage
export function saveCustomShape(name: string, code: string): void {
  if (typeof window === 'undefined') return;
  
  const shapes = getCustomShapes();
  const existing = shapes.find(s => s.name === name);
  
  if (existing) {
    existing.code = code;
    existing.timestamp = Date.now();
  } else {
    shapes.push({ name, code, timestamp: Date.now() });
  }
  
  localStorage.setItem(STORAGE_KEYS.CUSTOM_SHAPES, JSON.stringify(shapes));
}

export function getCustomShapes(): SavedShape[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_SHAPES);
  return data ? JSON.parse(data) : [];
}

export function deleteCustomShape(name: string): void {
  if (typeof window === 'undefined') return;
  
  const shapes = getCustomShapes().filter(s => s.name !== name);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_SHAPES, JSON.stringify(shapes));
}

// Last used state
export function saveLastAnimation(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_ANIMATION, code);
}

export function getLastAnimation(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_ANIMATION);
}

export function saveLastShape(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_SHAPE, code);
}

export function getLastShape(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_SHAPE);
}


