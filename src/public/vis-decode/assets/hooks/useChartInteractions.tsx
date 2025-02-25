/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3';
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
    if (index === 0) {
      return {
        x: distributionData.xVals[0],
        y: yValues[0],
        pixelX: xScale(distributionData.xVals[0]),
        pixelY: yScale(yValues[0]),
      };
    }
    if (index >= distributionData.xVals.length) {
      return {
        x: distributionData.xVals[distributionData.xVals.length - 1],
        y: yValues[yValues.length - 1],
        pixelX: xScale(distributionData.xVals[distributionData.xVals.length - 1]),
        pixelY: yScale(yValues[yValues.length - 1]),
      };
    }

    // non-edge case
    const x0 = distributionData.xVals[index - 1];
    const x1 = distributionData.xVals[index];

    if (!x0 || !x1) return null;

    const closest = Math.abs(dataX - x0) < Math.abs(dataX - x1) ? index - 1 : index;
    const closestX = distributionData.xVals[closest];
    const closestY = (showPDF ? distributionData.pdfVals : distributionData.cdfVals)[closest];
    const closestPoint = {
      x: closestX,
      y: closestY,
      pixelX: xScale(closestX),
      pixelY: yScale(closestY),
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

    // Check if mouse is near the curve using Euclidean distance
    const curvePixelX = closestPoint.pixelX || xScale(closestPoint.x);
    const curvePixelY = closestPoint.pixelY || yScale(closestPoint.y);
    const euclideanDistance = Math.sqrt((svgPoint.x - curvePixelX) ** 2 + (svgPoint.y - curvePixelY) ** 2);
    const isNear = euclideanDistance <= 15;

    setCursor({
      x: svgPoint.x,
      y: svgPoint.y,
      isNearCurve: isNear,
    });
  }, [distributionData, xScale, yScale, findClosestPoint, setCursor, getSVGCoordinates]);

  const handleClick = useCallback((
    event: React.MouseEvent<SVGSVGElement>,
  ) => {
    if (!distributionData) return;

    const svgPoint = getSVGCoordinates(event, event.currentTarget);
    if (!svgPoint) return;

    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y);
    if (!closestPoint) return;

    // Check if click is near the curve using Euclidean distance
    const curvePixelX = closestPoint.pixelX || xScale(closestPoint.x);
    const curvePixelY = closestPoint.pixelY || yScale(closestPoint.y);
    const euclideanDistance = Math.sqrt((svgPoint.x - curvePixelX) ** 2 + (svgPoint.y - curvePixelY) ** 2);
    if (euclideanDistance <= 10) {
      setSelectedPoint(closestPoint);
      setAnswer({
        status: true,
        answers: {
          'location-x': closestPoint.x,
          'location-y': closestPoint.y,
          'pixel-x': closestPoint.pixelX,
          'pixel-y': closestPoint.pixelY,
        },
      });
    } else {
      setAnswer({
        status: false,
        answers: {},
      });
    }
  }, [distributionData, xScale, yScale, findClosestPoint, setSelectedPoint, setAnswer, getSVGCoordinates]);

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
