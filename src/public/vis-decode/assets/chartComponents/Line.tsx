import * as d3 from 'd3';

interface LineProps {
  data: Array<{ x: number; y: number}>;
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  strokeColor?: string;
  strokeWidth?: number;
}

export function Line({
  data,
  xScale,
  yScale,
  strokeColor = 'currentColor',
  strokeWidth = 2,
}: LineProps) {
  const lineGenerator = d3.line<{x:number; y:number}>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  return (
    <path
      d={lineGenerator(data) || ''}
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
}
