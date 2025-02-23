/* eslint-disable no-shadow */
import * as d3 from 'd3';
import { useCallback, useMemo, useState } from 'react';
import { Container, Space } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import Plot from './Plot';
import DistributionSlider from './chartComponents/DistributionSlider';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    params, showPDF, training, taskType,
  } = parameters;
  const [sliderValue, setSliderValue] = useState<number>();
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y:number} | null>(null);

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(params), [params]);
  // Generate guidelinse based on task type and slider value

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

  // Interaction logic
  // Update slider handler to set both slider value and selected point
  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
    if (!distributionData) return;

    // Find the closest point on the line for the given x value
    const index = d3.bisector((d) => d).left(distributionData.xVals, value);
    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;

    if (index >= 0 && index < distributionData.xVals.length) {
      const point = {
        x: distributionData.xVals[index],
        y: yValues[index],
      };
      setSelectedPoint(point);

      setAnswer({
        status: true,
        answers: {
          'location-x': point.x,
          'location-y': point.y,
        },
      });
    }
  }, [distributionData, showPDF, setAnswer]);

  if (!distributionData) return null;

  return (
    <Container p="md">
      <div className="mt-4">
        <DistributionSlider
          value={sliderValue ?? 0}
          onChange={handleSliderChange}
          distributionData={distributionData}
          width={chartSettings.width - chartSettings.margin.left - chartSettings.margin.right}
        />
        <Space h="lg" />
        <Plot
          distributionData={distributionData}
          showPDF={showPDF}
          width={chartSettings.width}
          height={chartSettings.height}
          margin={chartSettings.margin}
          yDomain={[0, 1]}
          isTraining={training}
          selectedPoint={selectedPoint}
          guidelines={guidelines}
          axisLabels={{
            x: 'Value',
            y: showPDF ? 'Density' : 'Cumulative Probability',
          }}
        />
      </div>
    </Container>
  );
}
