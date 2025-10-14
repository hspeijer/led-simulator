import { LED } from '@/types/led';

/**
 * Sample animation patterns
 */

// Rainbow wave animation
export const rainbowWave = `// Rainbow Wave Animation
function animate(leds, time, shape) {
  leds.forEach((led, index) => {
    const hue = (index / shape.totalLEDs + time * 0.0005) % 1.0;
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

// Pulse animation
export const pulse = `// Pulse Animation
function animate(leds, time, shape) {
  const intensity = (Math.sin(time * 0.003) + 1) / 2;
  const r = Math.floor(intensity * 255);
  const g = Math.floor(intensity * 100);
  const b = Math.floor(intensity * 200);
  
  leds.forEach((led) => {
    led.color.r = r;
    led.color.g = g;
    led.color.b = b;
  });
}`;

// Running lights
export const runningLights = `// Running Lights Animation
function animate(leds, time, shape) {
  const position = (time * 0.05) % shape.totalLEDs;
  
  leds.forEach((led, index) => {
    const distance = Math.abs(index - position);
    const wrappedDistance = Math.min(distance, shape.totalLEDs - distance);
    const intensity = Math.max(0, 1 - wrappedDistance / 5);
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 50);
    led.color.b = Math.floor(intensity * 50);
  });
}`;

// Fire effect
export const fire = `// Fire Effect Animation
function animate(leds, time, shape) {
  // Find min/max Y for this shape
  const minY = Math.min(...leds.map(l => l.position.y));
  const maxY = Math.max(...leds.map(l => l.position.y));
  const range = maxY - minY || 1;
  
  leds.forEach((led) => {
    const flicker = Math.random() * 0.3 + 0.7;
    const yFactor = (led.position.y - minY) / range;
    const intensity = flicker * yFactor;
    
    led.color.r = Math.floor(intensity * 255);
    led.color.g = Math.floor(intensity * 100);
    led.color.b = 0;
  });
}`;

// Sparkle effect
export const sparkle = `// Sparkle Effect Animation
function animate(leds, time, shape) {
  leds.forEach((led) => {
    if (Math.random() < 0.02) {
      led.color.r = 255;
      led.color.g = 255;
      led.color.b = 255;
    } else {
      led.color.r = Math.max(0, led.color.r - 20);
      led.color.g = Math.max(0, led.color.g - 20);
      led.color.b = Math.max(0, led.color.b - 20);
    }
  });
}`;

export const defaultAnimations = {
  'Rainbow Wave': rainbowWave,
  'Pulse': pulse,
  'Running Lights': runningLights,
  'Fire Effect': fire,
  'Sparkle': sparkle,
};

