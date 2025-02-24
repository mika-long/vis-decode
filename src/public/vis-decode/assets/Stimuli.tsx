/* eslint-disable no-shadow */
import * as d3 from 'd3';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Container, Space } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './dataGeneration/distributionCalculations';
import Plot from './Plot';
import DistributionSlider from './chartComponents/DistributionSlider';
import { ScalesProvider } from './chartComponents/ScalesContext';

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

interface DistributionParams {
  xi: number;
  omega: number;
  nu: number;
  alpha: number;
}

function generateRandomParams(): DistributionParams {
  return {
    xi: Math.random() * 8 - 4,
    omega: 0.2 + Math.random() * 2.3,
    nu: 3 + Math.floor(Math.random() * 22),
    alpha: Math.random() * 8 - 4,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    params: initialParams, showPDF, training, taskType,
  } = parameters;
  const [sliderValue, setSliderValue] = useState<number>();
  const [currentParams, setCurrentParams] = useState<DistributionParams>(initialParams || generateRandomParams());

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(currentParams), [currentParams]);

  // // Set domain for scales
  // const xDomain = [-5, 5];
  // const yDomain = [0, 1];

  // Initialize the parameters when component mounts if not provided
  useEffect(() => {
    if (!initialParams || Object.keys(initialParams).length === 0) {
      const newParams = generateRandomParams();
      setCurrentParams(newParams);

      // Record the answer
      setAnswer({
        status: true,
        answers: {
          'param-xi': newParams.xi,
          'param-omega': newParams.omega,
          'param-nu': newParams.nu,
          'param-alpha': newParams.alpha,
          'location-x': null,
          'location-y': null,
          'pixel-x': null,
          'pixel-y': null,
        },
      });
    }
  }, [initialParams, setAnswer]);

  const guidelines = useMemo(() => {
    if (sliderValue === undefined || training === false) return null;

    // Find the index of the closest x value to our slider
    const index = d3.bisector((d) => d).left(distributionData.xVals, sliderValue);

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

  // // Handler to generate new random parameters
  // const handleGenerateNew = useCallback(() => {
  //   const newParams = generateRandomParams();
  //   setCurrentParams(newParams);
  //   setSliderValue(undefined); // reset slider

  //   // Record the answer
  //   setAnswer({
  //     status: true,
  //     answers: {
  //       'param-xi': newParams.xi,
  //       'param-omega': newParams.omega,
  //       'param-nu': newParams.nu,
  //       'param-alpha': newParams.alpha,
  //       'location-x': null,
  //       'location-y': null,
  //       'pixel-x': null,
  //       'pixel-y': null,
  //     },
  //   });
  // }, [setAnswer]);

  // Interaction logic
  // Update slider handler to set both slider value and selected point
  const handleSliderChange = useCallback((value: number) => {
    // Updated Slider UI in real time
    setSliderValue(value);
  }, []);

  const handleSliderCommit = useCallback((value: number) => {
    // Only submt answer when dragging finishes
    const index = d3.bisector((d) => d).left(distributionData.xVals, value);
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
    const newSelectedPoint = {
      x: distributionData.xVals[index],
      y: yValues[index],
    };

    setAnswer({
      status: true,
      answers: {
        'location-x': newSelectedPoint.x,
        'location-y': newSelectedPoint.y,
        'param-xi': currentParams.xi,
        'param-omega': currentParams.omega,
        'param-nu': currentParams.nu,
        'param-alpha': currentParams.alpha,
      },
    });
  }, [distributionData, showPDF, setAnswer, currentParams]);

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
        </ScalesProvider>
      </div>
    </Container>
  );
}
