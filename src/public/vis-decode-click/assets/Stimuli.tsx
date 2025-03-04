/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from 'd3';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import {
  Container, Button, Text, Space,
} from '@mantine/core';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './dataGeneration/jstatDistributionCalculations';
import Plot from './Plot';
import { ScalesProvider, useScales } from './chartComponents/ScalesContext';
import { useChartInteractions } from './hooks/useChartInteractions';

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
  y: number,
  pixelX?: number,
  pixelY?: number,
}

interface CursorState {
  x: number;
  y: number;
  isNearCurve: boolean;
}

interface DistributionParams {
  xi: number;
  omega: number;
  nu: number;
  alpha: number;
}

function generateRandomParams(): DistributionParams {
  return {
    xi: Number((Math.random() * 8 - 4).toFixed(3)),
    omega: Number((0.3 + Math.random() * 1.2).toFixed(3)),
    nu: 3 + Math.floor(Math.random() * 27),
    alpha: Number((Math.random() * 10 - 5).toFixed(3)),
  };
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
  currentParams: DistributionParams;
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
  currentParams,
}: StimuliContentProps) {
  // Scales from context
  const { xScale, yScale } = useScales();
  const [nearestPoint, setNearestPoint] = useState<Point | null>(null);

  // Use the chart interaction hooks
  const {
    handleMouseMove,
    handleClick,
    handleMouseLeave,
    findClosestPoint,
  } = useChartInteractions({
    distributionData,
    showPDF,
    xScale,
    yScale,
    setSelectedPoint,
    setCursor,
    setNearestPoint,
    setAnswer: (answerData) => {
      setAnswer({
        status: answerData.status,
        answers: {
          ...answerData.answers,
          currentParams,
        },
      });
    },
  });

  // Calculate guidelines based on cursor position or selected point
  const guidelines = useMemo(() => {
    if (!training) return { x: null, y: null, tangentLine: null };

    // Only show guidelines for selected points or when hovering near the curve
    if (!selectedPoint && (!cursor || !cursor.isNearCurve)) {
      return { x: null, y: null, tangentLine: null };
    }

    // If we have a cursor near the curve, find the closest point
    const point = cursor?.isNearCurve
      ? nearestPoint
      : selectedPoint;

    if (!point) return { x: null, y: null, tangentLine: null };

    // Find the index of the closest x value for tangent calculation
    const index = d3.bisector((d) => d).left(distributionData.xVals, point.x);

    switch (taskType) {
      case 'pdf_median': {
        if (!point) return { x: null, y: null, tangentLine: null };
        return {
          x: point.x,
          y: null,
          tangentLine: null,
        };
      }
      case 'pdf_mode':
        return {
          x: null,
          y: point.y,
          tangentLine: null,
        };
      case 'cdf_median':
        return {
          x: null,
          y: 0.5,
          tangentLine: null,
        };
      case 'cdf_mode':
        return {
          x: null,
          y: null,
          tangentLine: {
            point,
            // TODO: fix the following ...
            slope: (distributionData.cdfVals[index + 1] - distributionData.cdfVals[index - 1]) / (distributionData.xVals[index + 1] - distributionData.xVals[index - 1]),
          },
        };
      default:
        return { x: null, y: null, tangentLine: null };
    }
  }, [cursor, selectedPoint, training, taskType, distributionData, nearestPoint]);

  return (
    <Plot
      distributionData={distributionData}
      isTraining={training}
      showPDF={showPDF}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      cursor={cursor}
      selectedPoint={selectedPoint}
      nearestPoint={nearestPoint}
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
    params: initialParams, showPDF, training, taskType,
  } = parameters;
  // State for parameters; if data specifies then yes else no
  const [currentParams, setCurrentParams] = useState<DistributionParams>(() => {
    if (initialParams) return initialParams;
    return generateRandomParams();
  });
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [userAnswer, setUserAnswer] = useState<any>(null);

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(currentParams), [currentParams]);

  // Calculate domains for scales - ensure they are tuples
  const xDomain: [number, number] = useMemo(() => [
    distributionData.xVals[0],
    distributionData.xVals[distributionData.xVals.length - 1],
  ], [distributionData]);

  const yDomain: [number, number] = [0, 1];

  /**
   * Clears the selected point and resets the answer state
   *
   * @function handleClearPoint
   * @returns {void}
   *
   * @description
   * This callback function:
   * 1. Sets the selected point to null
   * 2. Updates the answer state with the current parameters and a false status
   *
   * @dependencies
   * - setSelectedPoint
   * - setAnswer
   * - currentParams
   */
  const handleClearPoint = useCallback(() => {
    setSelectedPoint(null);
    setAnswer({
      status: false,
      answers: {
        'param-xi': currentParams.xi,
        'param-omega': currentParams.omega,
        'param-nu': currentParams.nu,
        'param-alpha': currentParams.alpha,
      },
    });
  }, [setAnswer, currentParams]);

  // Custom setAnswer wrapper to track both the user's answer and the parameters
  const handleSetAnswer = useCallback((answerData: { status: boolean; answers: any }) => {
    setUserAnswer(answerData.answers);
    // Format the answers to match config.json
    const formattedAnswers = {
      ...answerData.answers,
      'param-xi': currentParams.xi,
      'param-omega': currentParams.omega,
      'param-nu': currentParams.nu,
      'param-alpha': currentParams.alpha,
      // 'taskType': taskType,
      // 'taskid': taskid
    };

    setAnswer({
      status: answerData.status,
      answers: formattedAnswers,
    });
  }, [setAnswer, currentParams]);

  // Initial answer setup to track parameters even before user interaction
  useEffect(() => {
    setAnswer({
      status: false,
      answers: {
        'param-xi': currentParams.xi,
        'param-omega': currentParams.omega,
        'param-nu': currentParams.nu,
        'param-alpha': currentParams.alpha,
      },
    });
  }, [currentParams, setAnswer]);

  return (
    <Container p="md">
      <div className="mt-4">
        <ScalesProvider
          width={chartSettings.width}
          height={chartSettings.height}
          margin={chartSettings.margin}
          xDomain={[-5, 5]} // xDomain
          yDomain={[0, 1]} // yDomain
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
            setAnswer={handleSetAnswer}
            currentParams={currentParams}
          />
        </ScalesProvider>
        <Button
          onClick={handleClearPoint}
          mt="md"
        >
          Clear Point
        </Button>
        {/* Optional debug information */}
        <Space h="xl" />
        <Text size="md" c="dimmed">
          Debug - Random Parameters:
          xi=
          {currentParams.xi.toFixed(2)}
          ,
          omega=
          {currentParams.omega.toFixed(2)}
          ,
          nu=
          {currentParams.nu}
          ,
          alpha=
          {currentParams.alpha.toFixed(2)}
        </Text>
      </div>
    </Container>
  );
}
