/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import * as d3 from 'd3';
import { DistributionData } from '../dataGeneration/jstatDistributionCalculations';

interface Point {
  // data coordinates
  x: number;
  y: number;
  // pixel coordinates
  pixelX?: number;
  pixelY?: number;
}

interface CursorState {
  x: number;
  y: number;
  isNearCurve: boolean;
}

interface UseChartInteractionProps {
  distributionData: DistributionData;
  showPDF: boolean;
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  setSelectedPoint: (point: Point | null) => void;
  setNearestPoint: (point: Point | null) => void;
  setCursor: (cursor: CursorState | null) => void;
  setAnswer: (answer: { status: boolean; answers: any }) => void;
  curveProximityThreshold?: number; // Distance threshold
}

export function useChartInteractions({
  distributionData,
  showPDF,
  xScale,
  yScale,
  setSelectedPoint,
  setNearestPoint,
  setCursor,
  setAnswer,
  curveProximityThreshold = 50,
}: UseChartInteractionProps) {
  // find closest point on the line to the clicked position
  const findClosestPoint = useCallback((
    cursorX: number,
    cursorY: number,
  ): Point | null => {
    if (!distributionData) return null;

    // Get the data values based on whether we're showing PDF or CDF
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;

    // convert cursor position from screen coordinates to data coordinates
    const dataX = xScale.invert(cursorX);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dataY = yScale.invert(cursorY);

    // Find closest x value in the data
    const bisect = d3.bisector((d: number) => d).left;
    const index = bisect(distributionData.xVals, dataX);

    // handle edge cases
    if (index <= 0) {
      return {
        x: distributionData.xVals[0],
        y: yValues[0],
      };
    }
    if (index >= distributionData.xVals.length) {
      const lastIndex = distributionData.xVals.length - 1;
      return {
        x: distributionData.xVals[lastIndex],
        y: yValues[lastIndex],
      };
    }

    // non-edge case
    const x0 = distributionData.xVals[index - 1];
    const x1 = distributionData.xVals[index];
    const y0 = yValues[index - 1];
    const y1 = yValues[index];

    // Determine which point is closest to the curosr (in data space)
    const closerToRight = Math.abs(dataX - x0) > Math.abs(dataX - x1);
    const closestPoint = closerToRight
      ? { x: x1, y: y1 }
      : { x: x0, y: y0 };

    return closestPoint;
  }, [distributionData, showPDF, xScale, yScale]);

  // Check if cursor is near the curve
  const isCursorNearCurve = useCallback((cursorX: number, cursorY: number): boolean => {
    const closestPoint = findClosestPoint(cursorX, cursorY);
    if (!closestPoint) return false;
    // Convert data point to screen coordinates
    const screenX = xScale(closestPoint.x);
    const screenY = yScale(closestPoint.y);
    // Calculate distance between cursor and closest point in pixels
    const distance = Math.sqrt((cursorX - screenX) ** 2 + (cursorY - screenY) ** 2);
    // Return true if distance is below threshold
    return distance < curveProximityThreshold;
  }, [curveProximityThreshold, findClosestPoint, xScale, yScale]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!distributionData) return;

    // Get cursor position relative to SVG
    const svgElement = event.currentTarget;
    const rect = svgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if cursor is near the curve
    const isNearCurve = isCursorNearCurve(x, y);

    // Update cursor state
    setCursor({ x, y, isNearCurve });

    // If near curve, update the nearest point
    if (isNearCurve) {
      const nearestPoint = findClosestPoint(x, y);
      setNearestPoint(nearestPoint);
    } else {
      setNearestPoint(null);
    }
  }, [distributionData, setCursor, isCursorNearCurve, findClosestPoint, setNearestPoint]);

  const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!distributionData) return;

    // Get click position relative to SVG
    const svgElement = event.currentTarget;
    const rect = svgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is near the curve
    const isNearCurve = isCursorNearCurve(x, y);

    if (isNearCurve) {
      // Find and use the closest point on the curve
      const closestPoint = findClosestPoint(x, y);
      if (closestPoint) {
        // Update selected point
        setSelectedPoint(closestPoint);
        // Update answer
        setAnswer({
          status: true,
          answers: {
            'location-x': closestPoint.x,
            'location-y': closestPoint.y,
          },
        });
      } else {
        setAnswer({
          status: false,
          answers: {
            'location-x': null,
            'location-y': null,
          },
        });
      }
    }
  }, [distributionData, findClosestPoint, setSelectedPoint, setAnswer, isCursorNearCurve]);

  const handleMouseLeave = useCallback(() => {
    setCursor(null);
    setNearestPoint(null);
  }, [setCursor, setNearestPoint]);

  return {
    handleMouseLeave,
    handleClick,
    handleMouseMove,
    findClosestPoint,
    isCursorNearCurve,
  };
}
