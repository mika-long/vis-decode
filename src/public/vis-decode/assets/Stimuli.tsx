/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from 'd3';
import { useCallback, useMemo, useState } from 'react';
import { Container, Button } from '@mantine/core';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import Plot from './Plot';
import { ScalesProvider, useScales } from './chartComponents/ScalesContext';

const chartSettings = {
  height: 450,
  width: 600,
  margin: {
    top: 15,
    right: 15,
    left: 50,
    bottom: 40,
  },
};

interface Point {
  x: number,
  y: number
}

interface CursorState {
  x: number;
  y: number;
  isNearCurve: boolean;
}

interface StimuliContentProps {
  distributionData: any;
  showPDF: boolean;
  training: boolean;
  taskType: string;
  cursor: CursorState | null;
  setCursor: (cursor: CursorState | null) => void;
  selectedPoint: Point | null;
  setSelectedPoint: (point: Point | null) => void;
  setAnswer: (answer: { status: boolean; answers: any }) => void;
}

// Component moved outside
function StimuliContent({
  distributionData,
  showPDF,
  training,
  taskType,
  cursor,
  setCursor,
  selectedPoint,
  setSelectedPoint,
  setAnswer,
}: StimuliContentProps) {
  const { xScale, yScale } = useScales();

  // find closest point on the line to the clicked position
  const findClosestPoint = useCallback((
    clickX: number,
    clickY: number,
  ) => {
    if (!distributionData) return null;

    // convert pixel click coordinates to data space
    const dataX = xScale.invert(clickX);
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

  // Calculate guidelines based on cursor position or selected point
  const guidelines = useMemo(() => {
    if (!training) return { x: null, y: null, tangentLine: null };

    // Only show guidelines for selected points or when hovering near the curve
    if (!selectedPoint && (!cursor || !cursor.isNearCurve)) {
      return { x: null, y: null, tangentLine: null };
    }

    // If we have a cursor near the curve, find the closest point
    const point = cursor?.isNearCurve
      ? findClosestPoint(cursor.x, cursor.y)
      : selectedPoint;

    if (!point) return { x: null, y: null, tangentLine: null };

    // Find the index of the closest x value for tangent calculation
    const index = d3.bisector((d) => d).left(distributionData.xVals, point.x);

    switch (taskType) {
      case 'pdf_median': {
        if (!point) return { x: null, y: null, tangentLine: null };
        const slope = index > 0 && index < distributionData.pdfVals.length - 1
          ? (distributionData.pdfVals[index + 1] - distributionData.pdfVals[index - 1]) / (distributionData.xVals[index + 1] - distributionData.xVals[index - 1])
          : 0;
        return {
          x: point.x,
          y: null,
          tangentLine: {
            point,
            slope,
          },
        };
      }
      case 'pdf_mode':
        return {
          x: point.x,
          y: point.y,
          tangentLine: null,
        };
      case 'cdf_median':
        return {
          x: point.x,
          y: 0.5,
          tangentLine: null,
        };
      case 'cdf_mode':
        return {
          x: point.x,
          y: null,
          tangentLine: {
            point,
            slope: (distributionData.cdfVals[index + 1] - distributionData.cdfVals[index - 1]) / (distributionData.xVals[index + 1] - distributionData.xVals[index - 1]),
          },
        };
      default:
        return { x: null, y: null, tangentLine: null };
    }
  }, [cursor, selectedPoint, training, taskType, distributionData, findClosestPoint]);

  // Mouse move handler
  const handlePlotMouseMove = useCallback((
    event: React.MouseEvent,
  ) => {
    if (!distributionData) return;
    // Get SVG coordinates from mouse position
    const svg = event.currentTarget as SVGSVGElement;
    const pt = new DOMPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm);

    // proximity check
    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y);
    if (!closestPoint) return;

    const isNear = Math.abs(svgPoint.y - yScale(closestPoint.y)) <= 10;
    setCursor({
      x: svgPoint.x,
      y: svgPoint.y,
      isNearCurve: isNear,
    });
  }, [distributionData, findClosestPoint, yScale, setCursor]);

  // Click handler
  const handlePlotClick = useCallback((
    event: React.MouseEvent,
  ) => {
    if (!distributionData) return;

    // Get svg coordinates
    const svg = event.currentTarget as SVGSVGElement;
    const pt = new DOMPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm);

    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y);
    if (!closestPoint) return;

    // Check proximity to line
    const distance = Math.abs(svgPoint.y - yScale(closestPoint.y));
    if (distance <= 5) {
      // update point
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
  }, [distributionData, findClosestPoint, yScale, setSelectedPoint, setAnswer]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setCursor(null);
  }, [setCursor]);

  return (
    <Plot
      distributionData={distributionData}
      isTraining={training}
      showPDF={showPDF}
      onClick={handlePlotClick}
      onMouseMove={handlePlotMouseMove}
      onMouseLeave={handleMouseLeave}
      cursor={cursor}
      selectedPoint={selectedPoint}
      guidelines={guidelines}
      axisLabels={{
        x: 'Value',
        y: showPDF ? 'Density' : 'Cumulative Probability',
      }}
    />
  );
}

export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    params, showPDF, training, taskType,
  } = parameters;
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(params), [params]);

  // Calculate domains for scales - ensure they are tuples
  const xDomain: [number, number] = useMemo(() => [
    distributionData.xVals[0],
    distributionData.xVals[distributionData.xVals.length - 1],
  ], [distributionData]);

  const yDomain: [number, number] = [0, 1];

  // Handle clear point
  const handleClearPoint = useCallback(() => {
    setSelectedPoint(null);
    setAnswer({
      status: false,
      answers: {},
    });
  }, [setAnswer]);

  return (
    <Container p="md">
      <div className="mt-4">
        <ScalesProvider
          width={chartSettings.width}
          height={chartSettings.height}
          margin={chartSettings.margin}
          xDomain={xDomain}
          yDomain={yDomain}
        >
          <StimuliContent
            distributionData={distributionData}
            showPDF={showPDF}
            training={training}
            taskType={taskType}
            cursor={cursor}
            setCursor={setCursor}
            selectedPoint={selectedPoint}
            setSelectedPoint={setSelectedPoint}
            setAnswer={setAnswer}
          />
        </ScalesProvider>
        <Button
          onClick={handleClearPoint}
          mt="md"
        >
          Clear Point
        </Button>
      </div>
    </Container>
  );
}
