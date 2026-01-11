import { useEffect, useRef } from 'react';
import uniform from '@stdlib/random-base-uniform';
import normal from '@stdlib/random-base-normal';

interface NoiseMaskProps {
  width: number;
  height: number;
  seed?: number; // Optional seed for reproducibility
  dist?: 'uniform' | 'normal'; // underlying distribution for generating noise
  padding?: {top: number; right: number; bottom: number; left: number; }; // optional padding
}

export function NoiseMask({
  width, height, seed, dist = 'normal', padding,
}: NoiseMaskProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate white noise
    const imageData = ctx.createImageData(width, height);
    const { data } = imageData;

    // Construct random number generator
    let rand: () => number;
    if (dist === 'uniform') {
      rand = seed !== undefined
        ? uniform.factory(0, 255, { seed })
        : () => Math.random() * 255;
    } else {
      // Gaussian with mean 127.5 and stddev 40
      const gaussianRand = seed !== undefined
        ? normal.factory(127.5, 40, { seed })
        : normal.factory(127.5, 40);
      rand = () => Math.max(0, Math.min(255, gaussianRand()));
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] = rand(); // Red
      data[i + 1] = rand(); // Green
      data[i + 2] = rand(); // Blue
      data[i + 3] = 255; // Alpha
    }
    ctx.putImageData(imageData, 0, 0);
  }, [width, height, seed, dist]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', padding: padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined }}
    />
  );
}
