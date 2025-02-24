/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
import { DistributionData } from '../dataGeneration/libRDistributionCalculations';

interface Point {
  x: number;
  y: number;
}

interface CursorState {
  x: number;
  y: number;
  isNearCurve: boolean;
}

interface UseChartInteractionProps {
  distributionData: DistributionData;
  showPDF: boolean;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  setSelectedPoint: (point: Point | null) => void;
  setCursor: (cursor: CursorState | null) => void;
  setAnswer: (answer: { status: boolean; answers: any }) => void;
}

export function useChartInteractions({
  distributionData,
  showPDF,
  xScale,
  yScale,
  setSelectedPoint,
  setCursor,
  setAnswer,
}: UseChartInteractionProps) {
  // find closest point on the line to the clicked position
  const findClosestPoint = useCallback((
    clickX: number,
    clickY: number,
  ) => {
    if (!distributionData) return null;

    // convert pixel click coordinates to data space
    const dataX = xScale.invert(clickX);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dataY = yScale.invert(clickY);

    // Find closest x value in the data
    const index = d3.bisector((d) => d).left(distributionData.xVals, dataX);
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;

    // handle edge cases
    if (index === 0) return { x: distributionData.xVals[0], y: yValues[0] };
    if (index >= distributionData.xVals.length) {
      return {
        x: distributionData.xVals[distributionData.xVals.length - 1],
        y: yValues[yValues.length - 1],
      };
    }

    // non-edge case
    const x0 = distributionData.xVals[index - 1];
    const x1 = distributionData.xVals[index];

    if (!x0 || !x1) return null;

    const closest = Math.abs(dataX - x0) < Math.abs(dataX - x1) ? index - 1 : index;
    const closestPoint = {
      x: distributionData.xVals[closest],
      y: (showPDF ? distributionData.pdfVals : distributionData.cdfVals)[closest],
    };
    return closestPoint;
  }, [distributionData, showPDF, xScale, yScale]);

  // Get SVG coordinates from mouse event
  const getSVGCoordinates = useCallback((
    event: React.MouseEvent,
    svg: SVGSVGElement,
  ): DOMPoint | null => {
    const pt = new DOMPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return null;
    return pt.matrixTransform(ctm);
  }, []);

  const handleMouseMove = useCallback((
    event: React.MouseEvent<SVGSVGElement>,
  ) => {
    if (!distributionData) return;

    const svgPoint = getSVGCoordinates(event, event.currentTarget);
    if (!svgPoint) return;

    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y);
    if (!closestPoint) return;

    // Check if mouse is near the curve
    const isNear = Math.abs(svgPoint.y - yScale(closestPoint.y)) <= 10;

    setCursor({
      x: svgPoint.x,
      y: svgPoint.y,
      isNearCurve: isNear,
    });
  }, [distributionData, findClosestPoint, yScale, setCursor, getSVGCoordinates]);

  const handleClick = useCallback((
    event: React.MouseEvent<SVGSVGElement>,
  ) => {
    if (!distributionData) return;

    const svgPoint = getSVGCoordinates(event, event.currentTarget);
    if (!svgPoint) return;

    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y);
    if (!closestPoint) return;

    // Check if click is near the curve
    const distance = Math.abs(svgPoint.y - yScale(closestPoint.y));
    if (distance <= 5) {
      setSelectedPoint(closestPoint);
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
        answers: {},
      });
    }
  }, [distributionData, findClosestPoint, yScale, setSelectedPoint, setAnswer, getSVGCoordinates]);

  const handleMouseLeave = useCallback(() => {
    setCursor(null);
  }, [setCursor]);

  return {
    handleMouseLeave,
    handleClick,
    handleMouseMove,
    findClosestPoint,
  };
}
