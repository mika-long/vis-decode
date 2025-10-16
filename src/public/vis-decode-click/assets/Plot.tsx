import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useScales } from './chartComponents/ScalesContext';
import { Line } from './chartComponents/Line';
import Cursor from './chartComponents/Cursor';
import ClickMarker from './chartComponents/ClickMarker';
import NearestPointMarker from './chartComponents/NearestPointMarker';
import { DistributionData } from './dataGeneration/jstatDistributionCalculations';
import GuideLines from './chartComponents/Guidelines';

interface PlotProps {
  // Data
  distributionData: DistributionData;
  showPDF?: boolean;
  isTraining?: boolean;
  // Visual customization
  strokeColor?: string;
  strokeWidth?: number;
  axisLabels?: {
    x?: string;
    y?: string;
  }
  // Interaction state
  selectedPoint?: { x: number; y:number; pixelX?: number; pixelY?: number } | null;
  nearestPoint?: { x: number; y:number; pixelX?: number; pixelY?: number} | null;
  guidelines?: {
    x: number | null;
    y: number | null;
    tangentLine?: {
      point: { x: number; y: number };
      slope: number;
    } | null;
  };
  cursor?: {x: number; y:number; isNearCurve: boolean} | null;
  children?: React.ReactNode;
  // Event handlers
  onClick?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  onMouseMove?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  onMouseLeave?: () => void;
}

export default function Plot({
  distributionData,
  showPDF = true,
  isTraining = false,
  strokeColor = '#bd0026',
  strokeWidth = 2,
  axisLabels,
  selectedPoint,
  nearestPoint,
  guidelines,
  cursor,
  children,
  onClick,
  onMouseMove,
  onMouseLeave,
}: PlotProps) {
  // Get scales from context
  const {
    xScale, yScale, width, height, margin,
  } = useScales();
  // Refs
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  // Generate line points from distributionData
  const linePoints = useMemo(() => {
    if (!distributionData?.xVals || !distributionData?.pdfVals || !distributionData?.cdfVals) {
      return [];
    }
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
    return distributionData.xVals.map((x, i) => ({
      x,
      y: yValues[i],
    }));
  }, [distributionData, showPDF]);

  // Draw D3 axes
  useEffect(() => {
    if (!xScale || !yScale || !xAxisRef.current || !yAxisRef.current) return;
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(d3.axisBottom(xScale))
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .selectAll('text')
        .style('font-size', '12px');
    }
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(d3.axisLeft(yScale))
        .attr('transform', `translate(${margin.left},0)`)
        .selectAll('text')
        .style('font-size', '12px');
    }
  }, [xScale, yScale, margin, height]);

  // Axis labels
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
      // style={{ cursor: isTraining ? 'default' : 'none' }} // Hide system cursor
      style={{ cursor: 'none' }}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <g>
        <Line
          data={linePoints}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
        />
        <g ref={xAxisRef} />
        <g ref={yAxisRef} />
        {axisElements}
        {/* Interactive elements */}
        {cursor && <Cursor position={{ x: cursor.x, y: cursor.y }} />}
        {cursor?.isNearCurve && nearestPoint && <NearestPointMarker point={nearestPoint} />}
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
      </g>
    </svg>
  );
}
