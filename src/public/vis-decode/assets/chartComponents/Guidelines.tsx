import React from 'react';
import * as d3 from 'd3';
import { TaskType } from '../TaskTypes';
import { useScales } from './ScalesContext';

interface GuideLinesProps {
  sliderValue?: number;
  taskType: TaskType;
  training: boolean;
  distributionData?: {
    xVals: number[];
    pdfVals: number[];
    cdfVals: number[];
  };
}

export default function GuideLines({
  sliderValue,
  taskType,
  training,
  distributionData,
}: GuideLinesProps) {
  // Get scales from context
  const {
    xScale, yScale, width, height, margin,
  } = useScales();

  if (!training || !distributionData) return null;
  if (!sliderValue) return null;

  switch (taskType) {
    case TaskType.PDF_MEDIAN: {
      return (
        <line
          x1={xScale(sliderValue)}
          x2={xScale(sliderValue)}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="10"
          data-source="Guidelines"
        />
      );
    }
    case TaskType.PDF_MODE: {
      const maxY = Math.max(...distributionData.pdfVals);
      return (
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={yScale(maxY)}
          y2={yScale(maxY)}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="4"
          data-source="Guidelines"
        />
      );
    }
    case TaskType.CDF_MEDIAN: {
      return (
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={yScale(0.5)}
          y2={yScale(0.5)}
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="4"
          data-source="Guidelines"
        />
      );
    }
    case TaskType.CDF_MODE: {
      if (sliderValue === undefined) return null;
      // Calculate tangent line at the given x-value
      const index = d3.bisector((d) => d).left(distributionData.xVals, sliderValue);
      if (index < 1 || index >= distributionData.xVals.length) return null;

      const x0 = distributionData.xVals[index - 1];
      const x1 = distributionData.xVals[index];
      const y0 = distributionData.cdfVals[index - 1];
      const y1 = distributionData.cdfVals[index];

      const slope = (y1 - y0) / (x1 - x0);
      const y = distributionData.cdfVals[index - 1];

      // Draw tangent line extending a bit in both directions
      const extendX = 1; // Extend line by 1 unit in both directions
      const xStart = sliderValue - extendX;
      const xEnd = sliderValue + extendX;
      const yStart = y - (slope * extendX);
      const yEnd = y + (slope * extendX);

      return (
        <line
          x1={xScale(xStart)}
          y1={yScale(yStart)}
          x2={xScale(xEnd)}
          y2={yScale(yEnd)}
          stroke="#666"
          strokeWidth={1}
          data-source="Guidelines"
        />
      );
    }
    default:
      return null;
  }
}
