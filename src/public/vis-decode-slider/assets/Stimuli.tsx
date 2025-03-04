/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-shadow */
import * as d3 from 'd3';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Container, Space, Text } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import {
  generateValidDistribution, DistributionData, GeneralizedDistributionParams, generateRandomParams,
} from './dataGeneration/DistributionCalculations';
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
  sliderValue: number | null;
  setSliderValue: (value: number | null) => void;
  hasInteracted: boolean;
  setHasInteracted: (value: boolean) => void;
  distributionData: DistributionData;
  showPDF: boolean;
  training: boolean;
  taskType: TaskType;
  currentParams: GeneralizedDistributionParams;
  setAnswer: (answer: { status: boolean; answers: Record<string, any> }) => void;
}

// This component receives all props it needs and has access to scales context
function DistributionVisualization({
  sliderValue,
  setSliderValue,
  hasInteracted,
  setHasInteracted,
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
    if (sliderValue === null || training === false) return null;

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
    if (sliderValue === null || !distributionData) return null;
    // Find the closest point on the line for the given x value
    const index = d3.bisector((d) => d).left(distributionData.xVals, sliderValue);
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;

    return {
      x: distributionData.xVals[index] === 0 ? 0 : distributionData.xVals[index],
      y: Number(yValues[index].toFixed(3)),
    };
  }, [sliderValue, distributionData, showPDF]);

  // Interaction logic
  // Update slider handler to set both slider value and selected point
  const handleSliderChange = useCallback((value: number) => {
    // Mark that user has interacted with the slider
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    // Update Slider UI in real time
    setSliderValue(value);
  }, [setSliderValue, hasInteracted, setHasInteracted]);

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

    // Update the answer state with status true
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
        value={sliderValue !== null ? sliderValue : 0}
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

  // Initialize slider value as null (no selection)
  const [sliderValue, setSliderValue] = useState<number | null>(null);

  // Track whether user has interacted with the slider
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentParams, setCurrentParams] = useState<GeneralizedDistributionParams>(() => {
    if (initialParams) return initialParams;
    return generateRandomParams();
  });

  // Generate distribution data
  const { distributionData, adjustedParam } = useMemo(() => {
    const result = generateValidDistribution(currentParams);
    return {
      distributionData: result.data,
      adjustedParam: result.params,
    };
  }, [currentParams]);

  // Always set initial answer state regardless of initialParams
  useEffect(() => {
    // Set a default initial state with status: false
    setAnswer({
      status: false, // Start with status false until user makes a selection
      answers: {
        'location-x': null,
        'location-y': null,
        'pixel-x': null,
        'pixel-y': null,
        'param-mu': adjustedParam.mu,
        'param-sigma': adjustedParam.sigma,
        'param-lambda': adjustedParam.lambda,
        'param-p': adjustedParam.p,
        'param-q': adjustedParam.q,
      },
    });
  }, [setAnswer, adjustedParam]);

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
            hasInteracted={hasInteracted}
            setHasInteracted={setHasInteracted}
            distributionData={distributionData}
            showPDF={showPDF || false}
            training={training || false}
            taskType={taskType || 'pdf_median'}
            currentParams={adjustedParam}
            setAnswer={setAnswer}
          />
        </ScalesProvider>
        {/* Optional debug information */}
        {/* <Space h="xl" />
        <Text size="md" c="dimmed">
          Debug - Random Parameters:
          mu=
          {adjustedParam.mu}
          ,
          sigma=
          {adjustedParam.sigma}
          ,
          lambda=
          {adjustedParam.lambda}
          ,
          p=
          {adjustedParam.p}
          ,
          q=
          {adjustedParam.q}
        </Text> */}
      </div>
    </Container>
  );
}
