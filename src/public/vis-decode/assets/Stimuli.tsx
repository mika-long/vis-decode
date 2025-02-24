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
import { generateDistributionData } from './distributionCalculations';
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
  y: number
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
    xi: Math.random() * 2 - 1,
    omega: 0.5 + Math.random() * 1.5,
    nu: 3 + Math.floor(Math.random() * 20),
    alpha: Math.random() * 2 - 1,
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
  randomParams: DistributionParams;
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
  randomParams,
}: StimuliContentProps) {
  // Scales from context
  const { xScale, yScale } = useScales();
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
    setAnswer: (answerData) => {
      setAnswer({
        status: answerData.status,
        answers: {
          ...answerData.answers,
          randomParams,
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
          // tangentLine: {
          //   point,
          //   slope,
          // },
          tangentLine: null,
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
          // x: point.x,
          x: null,
          y: 0.5,
          tangentLine: null,
        };
      case 'cdf_mode':
        return {
          // x: point.x,
          x: null,
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
  // State for randomized parameters
  const [randomParams, setRandomParams] = useState<DistributionParams>(() => generateRandomParams());
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [userAnswer, setUserAnswer] = useState<any>(null);

  // Generate a new set of random parameters
  const regenerateParams = useCallback(() => {
    const newParams = generateRandomParams();
    setRandomParams(newParams);
    // Reset the selected point and answer when parameters change
    setSelectedPoint(null);
    setUserAnswer(null);
  }, []);

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(randomParams), [randomParams]);

  // Calculate domains for scales - ensure they are tuples
  const xDomain: [number, number] = useMemo(() => [
    distributionData.xVals[0],
    distributionData.xVals[distributionData.xVals.length - 1],
  ], [distributionData]);

  const yDomain: [number, number] = [0, 1];

  // Handle clear point
  const handleClearPoint = useCallback(() => {
    setSelectedPoint(null);
    // console.log(randomParams);
    setAnswer({
      status: false,
      answers: {
        randomParams,
      },
    });
  }, [setAnswer, randomParams]);

  // Custom setAnswer wrapper to track both the user's answer and the parameters
  const handleSetAnswer = useCallback((answerData: { status: boolean; answers: any }) => {
    setUserAnswer(answerData.answers);
    // Format the answers to match config.json
    const formattedAnswers = {
      ...answerData.answers,
      'param-xi': randomParams.xi,
      'param-omega': randomParams.omega,
      'param-nu': randomParams.nu,
      'param-alpha': randomParams.alpha,
      // 'taskType': taskType,
      // 'taskid': taskid
    };

    setAnswer({
      status: answerData.status,
      answers: formattedAnswers,
    });
  }, [setAnswer, randomParams]);

  // Initial answer setup to track parameters even before user interaction
  useEffect(() => {
    setAnswer({
      status: false,
      answers: {
        'param-xi': randomParams.xi,
        'param-omega': randomParams.omega,
        'param-nu': randomParams.nu,
        'param-alpha': randomParams.alpha,
      },
    });
  }, [randomParams, setAnswer]);

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
            setAnswer={handleSetAnswer}
            randomParams={randomParams}
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
          {randomParams.xi.toFixed(2)}
          ,
          omega=
          {randomParams.omega.toFixed(2)}
          ,
          nu=
          {randomParams.nu}
          ,
          alpha=
          {randomParams.alpha.toFixed(2)}
        </Text>
      </div>
    </Container>
  );
}
