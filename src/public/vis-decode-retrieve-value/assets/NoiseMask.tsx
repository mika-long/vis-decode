import { useEffect, useRef } from 'react';

interface NoiseMaskProps {
  width: number;
  height: number;
}

export function NoiseMask({ width, height }: NoiseMaskProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate white noise
    const imageData = ctx.createImageData(width, height);
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.random() * 255;
      data[i] = gray; // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      data[i + 3] = 255; // Alpha
    }
    ctx.putImageData(imageData, 0, 0);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
}
