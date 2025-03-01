/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-shadow */
import * as d3 from 'd3';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Container, Space, Text } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData, DistributionData, GeneralizedDistributionParams } from './dataGeneration/DistributionCalculations';
import Plot from './Plot';
import DistributionSlider from './chartComponents/DistributionSlider';
import { ScalesProvider, useScales } from './chartComponents/ScalesContext';
import { TaskType } from './TaskTypes';

const chartSettings = {
  margin: {
    top: 15,
    right: 15,
    bottom: 40,
    left: 50,
  },
  height: 450,
  width: 600,
};

// Interface for the DistributionVisualization component props
interface DistributionVisualizationProps {
  sliderValue: number | undefined;
  setSliderValue: (value: number) => void;
  distributionData: DistributionData;
  showPDF: boolean;
  training: boolean;
  taskType: TaskType;
  currentParams: GeneralizedDistributionParams;
  setAnswer: (answer: { status: boolean; answers: Record<string, any> }) => void;
}

function generateRandomParams(): GeneralizedDistributionParams {
  return {
    mu: Number((Math.random() * 4 - 2).toFixed(1)), // mu in [-2, 2]
    sigma: Number((0.5 + Math.random() * 1.5).toFixed(1)), // sigma in [0.5, 2]
    lambda: Number((Math.random() * 2 - 1).toFixed(1)), // bounded between -1 and 1
    p: Number((2 + Math.random() * 8).toFixed(1)),
    q: Number((2 + Math.random() * 8).toFixed(1)),
  };
}

// This component receives all props it needs and has access to scales context
function DistributionVisualization({
  sliderValue,
  setSliderValue,
  distributionData,
  showPDF,
  training,
  taskType,
  currentParams,
  setAnswer,
}: DistributionVisualizationProps) {
  // Now we have access to scales here, inside the ScalesProvider
  const scales = useScales();

  const guidelines = useMemo(() => {
    if (sliderValue === undefined || training === false) return null;

    // Find the index of the closest x value to our slider
    const index = d3.bisector((d: number) => d).left(distributionData.xVals, sliderValue);

    switch (taskType) {
      case 'pdf_median':
        return { x: sliderValue, y: null, tangentLine: null };
      case 'pdf_mode':
        return { x: null, y: Math.max(...distributionData.pdfVals), tangentLine: null };
      case 'cdf_median':
        return { x: null, y: 0.5, tangentLine: null };
      case 'cdf_mode': {
        // Get the point and slope at the current sliderValue
        const point = {
          x: sliderValue,
          y: distributionData.cdfVals[index],
        };
        // PDF value at this point is the slope
        const slope = distributionData.pdfVals[index];

        return {
          x: null,
          y: null,
          tangentLine: {
            point,
            slope,
          },
        };
      }
      default:
        return null;
    }
  }, [sliderValue, training, taskType, distributionData]);

  const selectedPoint = useMemo(() => {
    if (sliderValue === undefined || !distributionData) return null;
    // Find the closest point on the line for the given x value
    const index = d3.bisector((d) => d).left(distributionData.xVals, sliderValue);
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;

    return {
      x: distributionData.xVals[index],
      y: yValues[index],
    };
  }, [sliderValue, distributionData, showPDF]);

  // Interaction logic
  // Update slider handler to set both slider value and selected point
  const handleSliderChange = useCallback((value: number) => {
    // Updated Slider UI in real time
    setSliderValue(value);
  }, [setSliderValue]);

  const handleSliderCommit = useCallback((value: number) => {
    // Only submit answer when dragging finishes
    const index = d3.bisector((d) => d).left(distributionData.xVals, value);
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
    const newSelectedPoint = {
      x: distributionData.xVals[index],
      y: yValues[index],
    };

    // Convert the logical coordinates to pixel coordinates using the scales
    const pixelX = scales.xScale(newSelectedPoint.x);
    const pixelY = scales.yScale(newSelectedPoint.y);

    setAnswer({
      status: true,
      answers: {
        'location-x': newSelectedPoint.x,
        'location-y': newSelectedPoint.y,
        'pixel-x': pixelX,
        'pixel-y': pixelY,
        'param-mu': currentParams.mu,
        'param-sigma': currentParams.sigma,
        'param-lambda': currentParams.lambda,
        'param-p': currentParams.p,
        'param-q': currentParams.q,
      },
    });
  }, [distributionData, showPDF, setAnswer, currentParams, scales]);

  return (
    <>
      <DistributionSlider
        value={sliderValue ?? 0}
        onChange={handleSliderChange}
        onChangeEnd={handleSliderCommit}
        distributionData={distributionData}
        width={chartSettings.width - chartSettings.margin.left - chartSettings.margin.right}
      />
      <Space h="lg" />
      <Plot
        distributionData={distributionData}
        showPDF={showPDF}
        isTraining={training}
        selectedPoint={selectedPoint}
        guidelines={guidelines}
        axisLabels={{
          x: 'Value',
          y: showPDF ? 'Density' : 'Cumulative Probability',
        }}
      />
    </>
  );
}

export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    params: initialParams, showPDF, training, taskType,
  } = parameters;
  const [sliderValue, setSliderValue] = useState<number>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentParams, setCurrentParams] = useState<GeneralizedDistributionParams>(() => {
    if (initialParams) return initialParams;
    return generateRandomParams();
  });

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(currentParams), [currentParams]);

  // Initialize the parameters when component mounts if not provided
  useEffect(() => {
    if (!initialParams || Object.keys(initialParams).length === 0) {
      // Record the answer
      setAnswer({
        status: true,
        answers: {
          'location-x': null,
          'location-y': null,
          'pixel-x': null,
          'pixel-y': null,
          'param-mu': currentParams.mu,
          'param-sigma': currentParams.sigma,
          'param-lambda': currentParams.lambda,
          'param-p': currentParams.p,
          'param-q': currentParams.q,
        },
      });
    }
  }, [initialParams, setAnswer, currentParams]);

  if (!distributionData) return null;

  return (
    <Container p="md">
      <div className="mt-4">
        <ScalesProvider
          width={chartSettings.width}
          height={chartSettings.height}
          margin={chartSettings.margin}
          xDomain={[-5, 5]}
          yDomain={[0, 1]}
        >
          <DistributionVisualization
            sliderValue={sliderValue}
            setSliderValue={setSliderValue}
            distributionData={distributionData}
            showPDF={showPDF || false}
            training={training || false}
            taskType={taskType || 'pdf_median'}
            currentParams={currentParams}
            setAnswer={setAnswer}
          />
        </ScalesProvider>
        {/* Optional debug information */}
        <Space h="xl" />
        <Text size="md" c="dimmed">
          Debug - Random Parameters:
          mu=
          {currentParams.mu}
          ,
          sigma=
          {currentParams.sigma}
          ,
          lambda=
          {currentParams.lambda}
          ,
          p=
          {currentParams.p}
          ,
          q=
          {currentParams.q}
        </Text>
      </div>
    </Container>
  );
}
