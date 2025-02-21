import React from 'react';
import * as d3 from 'd3';
import { TaskType } from '../TaskTypes';

interface GuideLinesProps {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  taskType: TaskType;
  training: boolean;
  selectedPoint: {x: number; y: number} | null;
  distributionData?: {
    xVals: number[];
    pdfVals: number[];
    cdfVals: number[];
  };
}

export function GuideLines({
  xScale,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  yScale,
  width,
  height,
  margin,
  taskType,
  training,
  selectedPoint,
  distributionData,
}: GuideLinesProps) {
  if (!training || !distributionData) return null;

  // Create task-specific scales for PDF and CDF
  const pdfYScale = d3.scaleLinear()
    .domain([0, Math.max(...distributionData.pdfVals)])
    .range([height - margin.bottom, margin.top]);

  const cdfYScale = d3.scaleLinear()
    .domain([0, 1])
    .range([height - margin.bottom, margin.top]);

  switch (taskType) {
    case TaskType.PDF_MEDIAN: {
      if (!selectedPoint) return null;
      return (
        <line
          x1={xScale(selectedPoint.x)}
          x2={xScale(selectedPoint.x)}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="4"
        />
      );
    }
    case TaskType.PDF_MODE: {
      const maxY = Math.max(...distributionData.pdfVals);
      // TODO
      return (
        <line
          x1={margin.left}
          x2={width - margin.right}
          // y1={pdfYScale(maxY)}
          // y2={pdfYScale(maxY)}
          y1={maxY}
          y2={maxY}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="4"
        />
      );
    }
    case TaskType.CDF_MEDIAN: {
      return (
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={cdfYScale(0.5)}
          y2={cdfYScale(0.5)}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="4"
        />
      );
    }
    case TaskType.CDF_MODE: {
      if (!selectedPoint) return null;

      // Calculate tangent line at the given x-value
      const index = d3.bisector((d) => d).left(distributionData.xVals, selectedPoint.x);
      if (index < 1 || index >= distributionData.xVals.length) return null;

      const x0 = distributionData.xVals[index - 1];
      const x1 = distributionData.xVals[index];
      const y0 = distributionData.cdfVals[index - 1];
      const y1 = distributionData.cdfVals[index];

      const slope = (y1 - y0) / (x1 - x0);
      // const y = distributionData.cdfVals[index - 1];
      const y = selectedPoint.y;

      // Draw tangent line extending a bit in both directions
      const extendX = 1; // Extend line by 1 unit in both directions
      const xStart = selectedPoint.x - extendX;
      const xEnd = selectedPoint.x + extendX;
      const yStart = y - (slope * extendX);
      const yEnd = y + (slope * extendX);

      return (
        <line
          x1={xScale(xStart)}
          y1={cdfYScale(yStart)}
          x2={xScale(xEnd)}
          y2={cdfYScale(yEnd)}
          stroke="#666"
          strokeWidth={1}
        />
      );
    }
    default:
      return null;
  }
}
