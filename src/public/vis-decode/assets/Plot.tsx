/* eslint-disable no-shadow */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ScalesProvider, useScales } from './chartComponents/ScalesContext';
import Line from './chartComponents/Line';
import Cursor from './chartComponents/Cursor';
import ClickMarker from './chartComponents/ClickMarker';

interface PlotProps {
  // Data
  data: Array<{ x: number; y: number }>;
  // Visualization parameters (static)
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number};
  strokeColor?: string;
  strokeWidth?: number;
  axisLabels?: {
    x?: string;
    y?: string;
  }
  // Visual elements
  cursor?: {x: number; y:number; isNearCurve: boolean} | null;
  selectedPoint?: {x: number; y:number} | null;
  // Optional domain overrides
  xDomain?: [number, number];
  yDomain?: [number, number];
  // Flag for whether this plot is for training
  isTraining?: boolean;
  // Interaction handlers
  onClick?: (event: React.MouseEvent) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  // Additional stuff
  children?: React.ReactNode;
}

function PlotContent({
  data,
  strokeColor = '#2563eb',
  strokeWidth = 2,
  isTraining,
  axisLabels,
  onClick,
  onMouseMove,
  onMouseLeave,
  cursor,
  selectedPoint,
  children,
}: Omit<PlotProps, 'width' | 'height' | 'margin' | 'xDomain' | 'yDomain'>) {
  // Refs
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);
  // Get scales from Context
  const {
    xScale, yScale, width, height, margin,
  } = useScales();

  // Draw D3 axes and use scales from context
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

  return (
    <svg
      width={width}
      height={height}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ cursor: isTraining ? 'default' : 'none' }} // Hide system cursor
    >
      <Line
        data={data}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
      <g ref={xAxisRef} />
      <g ref={yAxisRef} />
      {renderAxisLabels()}
      {cursor && <Cursor position={{ x: cursor.x, y: cursor.y }} isNearCurve={cursor.isNearCurve} />}
      {selectedPoint && <ClickMarker point={selectedPoint} />}
      {children}
    </svg>
  );
}

export default function Plot({
  width = 600,
  height = 400,
  margin = {
    top: 20, right: 20, bottom: 40, left: 40,
  },
  xDomain,
  yDomain,
  data,
  ...rest
}: PlotProps) {
  // Calculate domains if not provided
  const calculatedXDomain = xDomain || [
    d3.min(data, (d) => d.x) || 0,
    d3.max(data, (d) => d.x) || 0,
  ];
  const calculatedYDomain = yDomain || [
    d3.min(data, (d) => d.y) || 0,
    d3.max(data, (d) => d.y) || 0,
  ];

  return (
    <ScalesProvider
      width={width}
      height={height}
      margin={margin}
      xDomain={calculatedXDomain}
      yDomain={calculatedYDomain}
    >
      <PlotContent data={data} {...rest} />
    </ScalesProvider>
  );
}
