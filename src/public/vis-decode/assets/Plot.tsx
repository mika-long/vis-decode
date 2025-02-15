import { useMemo } from "react";
import * as d3 from "d3";
import { Line } from "./chartComponents/Line";
import { NumericAxisH } from "./chartComponents/NumericAxisH";
import { NumericAxisV } from "./chartComponents/NumericAxisV";

interface PlotProps {
  // Data 
  data: Array<{ x: number; y: number }>;
  // Visualization parameters 
  width?: number; 
  height?: number; 
  margin?: { top: number; right: number; bottom: number; left: number};
  strokeColor?: string;
  strokeWidth?: number; 
  curved?: boolean; 
  // Optional domain overrides 
  xDomain?: [number, number];
  yDomain?: [number, number];
}

export function Plot({
  data, 
  width = 600, 
  height = 400, 
  margin = { top: 20, right: 20, bottom: 40, left: 40 },
  strokeColor = "#2563eb",
  strokeWidth = 2, 
  xDomain, 
  yDomain
}: PlotProps) {
  // Calculate domains if not provided 
  const calculatedXDomain = xDomain || [
    d3.min(data, d => d.x) || 0, 
    d3.max(data, d => d.x) || 0
  ];
  const calculatedYDomain = yDomain || [
    d3.min(data, d => d.y) || 0,
    d3.max(data, d => d.y) || 0
  ];

  // Create scales 
  const xScale = d3.scaleLinear()
    .domain(calculatedXDomain)
    .range([margin.left, width - margin.right])

  const yScale = d3.scaleLinear()
    .domain(calculatedYDomain)
    .range([height - margin.bottom, margin.top]);

  return (
    <svg width={width} height={height}>
      <Line 
        data={data}
        xScale={xScale}
        yScale={yScale}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
      <NumericAxisH 
        domain={calculatedXDomain}
        range={[margin.left, width - margin.right]}
      />
      <NumericAxisV 
        domain={calculatedYDomain}
        range={[height - margin.bottom, margin.top]}
      />
    </svg>
  )

}