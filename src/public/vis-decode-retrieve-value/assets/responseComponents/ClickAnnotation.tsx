// TODO
/* eslint-disable */ 

import * as d3 from 'd3';
import { useState } from 'react';

interface ClickInteractionProps {
  xScale: d3.ScaleLinear<number, number>; 
  yScale: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  padding: {left: number, right: number; top: number; bottom: number}, 
  onPointSelect: (point: {x: number, y:number}) => void;
  radius?: number;
  dot_color?: string;
}

export default function ClickInteraction({
  xScale, 
  yScale, 
  width, 
  height, 
  padding, 
  onPointSelect, 
  radius = 5,
  dot_color = 'red'
}: ClickInteractionProps) {
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number} | null>(null);

  const handleClick = () => {};

  return (
    <svg style={{
      position: 'absolute', 
      top: 0, 
      left: 0,
      width, 
      height, 
    //   pointerEvents: 'a11', // not sure what a11 maps to here ... 
      cursor: 'crosshair'
    }} onClick={handleClick}>
      {selectedPoint && (
        <circle cx={xScale(selectedPoint.x)} cy={yScale(selectedPoint.y)} r={radius} fill={dot_color} />
      )}
    </svg>
  );

}
