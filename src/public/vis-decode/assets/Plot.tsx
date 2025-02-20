import { useMemo, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Line } from "./chartComponents/Line";

interface PlotProps {
  // Data
  data: Array<{ x: number; y: number }>;
  // Visualization parameters
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number};
  strokeColor?: string;
  strokeWidth?: number;
  axisLabels?: {
    x?: string;
    y?: string;
  }
  // Optional domain overrides
  xDomain?: [number, number];
  yDomain?: [number, number];
  // interactivty
  onClick?: (event: React.MouseEvent, scales: {
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  }) => void;
  onMouseMove?: (event: React.MouseEvent, scales: {
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  }) => void;
  additionalElements?: React.ReactNode;
}

export function Plot({
  data,
  width = 600,
  height = 400,
  margin = { top: 20, right: 20, bottom: 40, left: 40 },
  strokeColor = "#2563eb",
  strokeWidth = 2,
  axisLabels,
  xDomain,
  yDomain,
  onClick,
  onMouseMove,
  additionalElements
}: PlotProps) {
  // Refs
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  const { xScale, yScale } = useMemo(() => {
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

    return { xScale, yScale };

  }, [data, xDomain, yDomain, margin, width, height]);

  // Axis labels 
  const renderAxisLabels = () => {
    if (!axisLabels) return null;
    return(
      <>
      { axisLabels.x && (
        <text x = {width/2} y={height - 5} textAnchor="middle" className="axis-label">
          {axisLabels.x}
        </text>
      )}
      { axisLabels.y && (
        <text x = {-height/2} y = {15} textAnchor="middle" transform="rotate(-90)" className="axis-label">
          {axisLabels.y}
        </text>
      )}
      </>
    );
  };

  // Draw D3 axes
  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(d3.axisBottom(xScale))
        .attr("transform", `translate(0,${height - margin.bottom})`);
    }
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(d3.axisLeft(yScale))
        .attr("transform", `translate(${margin.left},0)`);
    }
  }, [xScale, yScale, margin, height]);

  return (
    <svg
      width={width}
      height={height}
      onClick={(e) => onClick?.(e, { xScale, yScale })}
      onMouseMove={(e) => onMouseMove?.(e, { xScale ,yScale })}
    >
      <Line
        data={data}
        xScale={xScale}
        yScale={yScale}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
      <g ref={xAxisRef} />
      <g ref={yAxisRef} />
      {renderAxisLabels()}
      {additionalElements}
    </svg>
  )

}