/* eslint-disable no-shadow */
import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ScalesProvider, useScales } from './chartComponents/ScalesContext';
import Line from './chartComponents/Line';
import ClickMarker from './chartComponents/ClickMarker';
import GuideLines from './chartComponents/Guidelines';
import { DistributionData } from './distributionCalculations';

interface PlotProps {
  // Data
  distributionData: DistributionData;
  showPDF?: boolean;
  // Display settings
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number};
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
  // Optional domain overrides
  xDomain?: [number, number];
  yDomain?: [number, number];
  // Flag for whether this plot is for training
  isTraining?: boolean;
  // Additional stuff
  children?: React.ReactNode;
}

function PlotContent({
  distributionData,
  showPDF = true,
  strokeColor = '#2563eb',
  strokeWidth = 2,
  isTraining = false,
  axisLabels,
  selectedPoint,
  guidelines,
  children,
}: Omit<PlotProps, 'width' | 'height' | 'margin' | 'xDomain' | 'yDomain'>) {
  // Get scales from Context
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

export default function Plot({
  width = 600,
  height = 400,
  margin = {
    top: 20, right: 20, bottom: 40, left: 40,
  },
  xDomain,
  yDomain = [0, 1],
  distributionData,
  showPDF = true,
  isTraining = false,
  ...rest
}: PlotProps) {
  // Calculate domains if not provided
  const calculatedXDomain = xDomain || [
    distributionData.xVals[0],
    distributionData.xVals[distributionData.xVals.length - 1],
  ];

  const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
  const calculatedYDomain = yDomain || [
    0,
    Math.max(...yValues),
  ];

  return (
    <ScalesProvider
      width={width}
      height={height}
      margin={margin}
      xDomain={calculatedXDomain}
      yDomain={calculatedYDomain}
    >
      <PlotContent
        distributionData={distributionData}
        showPDF={showPDF}
        isTraining={isTraining}
        {...rest}
      />
    </ScalesProvider>
  );
}
