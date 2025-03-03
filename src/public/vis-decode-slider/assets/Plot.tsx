/* eslint-disable no-shadow */
import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useScales } from './chartComponents/ScalesContext';
import Line from './chartComponents/Line';
import ClickMarker from './chartComponents/ClickMarker';
import GuideLines from './chartComponents/Guidelines';
import { DistributionData } from './dataGeneration/DistributionCalculations';

interface PlotProps {
  // Data
  distributionData: DistributionData;
  showPDF?: boolean;
  // Visual customization
  strokeColor?: string;
  strokeWidth?: number;
  axisLabels?: {
    x?: string;
    y?: string;
  }
  // Interaction state
  selectedPoint?: { x: number; y: number } | null;
  guidelines?: {
    x: number | null;
    y: number | null;
    tangentLine?: {
      point: { x: number; y:number };
      slope: number;
    } | null;
  } | null;
  // Flag for whether this plot is for training
  isTraining?: boolean;
  // Additional stuff
  children?: React.ReactNode;
}

export default function Plot({
  distributionData,
  showPDF = true,
  strokeColor = '#2c7fb8',
  strokeWidth = 2,
  isTraining = false,
  axisLabels,
  selectedPoint,
  guidelines,
  children,
}: PlotProps) {
  // Get scales from Context that is now provided at a higher level
  const {
    xScale, yScale, width, height, margin,
  } = useScales();

  // Refs
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  // Generate line points from distributionData
  const linePoints = useMemo(() => {
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
    return distributionData.xVals.map((x, i) => ({
      x,
      y: yValues[i],
    }));
  }, [distributionData, showPDF]);

  // Draw D3 axes
  // https://d3js.org/d3-axis#axis_offset
  // apparently the default offset is 0.5, which made things not align
  // making it to 0 helps things better ...
  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(d3.axisBottom(xScale).offset(0))
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .selectAll('text') // Select all text elements (tick labels)
        .style('font-size', '12px'); // Set the font size (adjust value as needed);
    }
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(d3.axisLeft(yScale).offset(0))
        .attr('transform', `translate(${margin.left},0)`)
        .selectAll('text')
        .style('font-size', '12px');
    }
  }, [xScale, yScale, margin, height]);

  // Memoize Axis labels
  const axisElements = useMemo(() => {
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
  }, [axisLabels, width, height]);

  return (
    <svg
      width={width}
      height={height}
    >
      {/* Base plot elements */}
      <Line
        data={linePoints}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
      <g ref={xAxisRef} />
      <g ref={yAxisRef} />
      {axisElements}
      {/* Interactive elements */}
      {selectedPoint && <ClickMarker point={selectedPoint} />}
      {isTraining && guidelines && (
        <GuideLines
          xValue={guidelines.x}
          yValue={guidelines.y}
          tangentLine={guidelines.tangentLine}
        />
      )}
      {/* Additional elements passed as children */}
      {children}
    </svg>
  );
}
