import * as d3 from 'd3';
import { useScales } from './ScalesContext';

interface LineProps {
  data: Array<{ x: number; y: number}>;
  strokeColor?: string;
  strokeWidth?: number;
}

export default function Line({
  data,
  strokeColor = 'currentColor',
  strokeWidth = 2,
}: LineProps) {
  const { xScale, yScale } = useScales();

  const lineGenerator = d3.line<{x:number; y:number}>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  return (
    <path
      d={lineGenerator(data) || ''}
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      data-source="Line"
    />
  );
}
