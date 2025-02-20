/* eslint-disable no-shadow */
import { useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Line } from './chartComponents/Line';

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
  // interaction handlers
  onClick?: (event: React.MouseEvent, scales: {
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  }) => void;
  onMouseMove?: (event: React.MouseEvent, scales: {
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  }) => void;
  onMouseLeave?: () => void;
  // Visual elements
  cursor?: {x: number; y:number; isNearCurve: boolean} | null;
  selectedPoint?: {x: number; y:number} | null;
}

export function Plot({
  data,
  width = 600,
  height = 400,
  margin = {
    top: 20, right: 20, bottom: 40, left: 40,
  },
  strokeColor = '#2563eb',
  strokeWidth = 2,
  axisLabels,
  xDomain,
  yDomain,
  onClick,
  onMouseMove,
  onMouseLeave,
  cursor,
  selectedPoint,
}: PlotProps) {
  // Refs
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  const { xScale, yScale } = useMemo(() => {
    // Calculate domains if not provided
    const calculatedXDomain = xDomain || [
      d3.min(data, (d) => d.x) || 0,
      d3.max(data, (d) => d.x) || 0,
    ];
    const calculatedYDomain = yDomain || [
      d3.min(data, (d) => d.y) || 0,
      d3.max(data, (d) => d.y) || 0,
    ];
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(calculatedXDomain)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(calculatedYDomain)
      .range([height - margin.bottom, margin.top]);

    return { xScale, yScale };
  }, [data, xDomain, yDomain, margin, width, height]);

  // Draw D3 axes
  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(d3.axisBottom(xScale))
        .attr('transform', `translate(0,${height - margin.bottom})`);
    }
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(d3.axisLeft(yScale))
        .attr('transform', `translate(${margin.left},0)`);
    }
  }, [xScale, yScale, margin, height]);

  // Axis labels
  const renderAxisLabels = () => {
    if (!axisLabels) return null;
    return (
      <>
        { axisLabels.x && (
        <text x={width / 2} y={height - 5} textAnchor="middle" style={{ fontSize: '12px', fill: '#666' }}>
          {axisLabels.x}
        </text>
        )}
        { axisLabels.y && (
          <text x={-height / 2} y={15} textAnchor="middle" transform="rotate(-90)" style={{ fontSize: '12px', fill: '#666' }}>
            {axisLabels.y}
          </text>
        )}
      </>
    );
  };

  // Render cursor
  const renderCursor = () => {
    if (!cursor) return null;
    return (
      <circle
        cx={cursor.x}
        cy={cursor.y}
        r={cursor.isNearCurve ? 1 : 10}
        fill="none"
        stroke="#666"
        strokeWidth={1}
        pointerEvents="none"
      />
    );
  };

  // Render selected point and guide line
  const renderSelectedPoint = () => {
    if (!selectedPoint) return null;
    return (
      <circle
        cx={xScale(selectedPoint.x)}
        cy={yScale(selectedPoint.y)}
        r={4}
        fill="#2563eb"
        pointerEvents="none"
      />
    );
  };

  return (
    <svg
      width={width}
      height={height}
      onClick={(e) => onClick?.(e, { xScale, yScale })}
      onMouseMove={(e) => onMouseMove?.(e, { xScale, yScale })}
      onMouseLeave={onMouseLeave}
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
      {renderCursor()}
      {renderSelectedPoint()}
    </svg>
  );
}
