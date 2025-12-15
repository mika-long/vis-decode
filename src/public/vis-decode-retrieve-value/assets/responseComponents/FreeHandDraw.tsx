// TODO --- double check
/* eslint-disable */
import { useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@mantine/core';

interface DrawInteractionProps {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  onDrawComplete: (path: {x: number, y: number}[]) => void;
}

export default function DrawInteration({
  xScale,
  yScale,
  width,
  height,
  onDrawComplete
}: DrawInteractionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<{x: number, y: number}[]>([]);

  const handleMouseDown = () => {};

  const handleMouseMove = () => {};

  const handleMouseUp = () => {};

  const handleButtonClick = () => {};

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'crosshair',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {/* reset button */}
      <Button variant="light" onClick={handleButtonClick}>Clear and redraw</Button>
    </>
  );
}
