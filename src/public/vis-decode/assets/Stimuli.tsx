/* eslint-disable no-shadow */
import * as d3 from 'd3';
import { useCallback, useMemo, useState } from 'react';
import { Container, Button } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import Plot from './Plot';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import GuideLines from './chartComponents/Guidelines';
import { TaskType } from './TaskTypes';
import DistributionSlider from './chartComponents/DistributionSlider';
import { useScales } from './chartComponents/ScalesContext';

const chartSettings = {
  marginBottom: 40,
  marginLeft: 50,
  marginTop: 15,
  marginRight: 15,
  height: 450,
  width: 600,
};

interface Point {
  x: number,
  y: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    data, showPDF, training, taskType,
  } = parameters;
  const [sliderValue, setSliderValue] = useState<number | undefined>();
  const { xScale, yScale } = useScales();

  // Generate data
  const distributionData = useMemo(() => generateDistributionData(data), [data]);

  // Generate line points
  const linePoints = useMemo(() => {
    if (!distributionData) return [];

    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
    return distributionData.xVals.map((x, i) => ({
      x,
      y: yValues[i],
    }));
  }, [distributionData, showPDF]);

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
        <DistributionSlider />
        <Plot
          data={linePoints}
          width={chartSettings.width}
          height={chartSettings.height}
          margin={{
            top: chartSettings.marginTop,
            right: chartSettings.marginRight,
            left: chartSettings.marginLeft,
            bottom: chartSettings.marginBottom,
          }}
          yDomain={[0, 1]}
          onClick={handlePlotClick}
          onMouseMove={handlePlotMouseMove}
          onMouseLeave={handleMouseLeave}
          cursor={cursor}
          selectedPoint={selectedPoint}
          isTraining={training}
        >
          {xScale && yScale && (
            <GuideLines
              xScale={xScale}
              yScale={yScale}
              width={chartSettings.width}
              height={chartSettings.height}
              margin={{
                top: chartSettings.marginTop,
                right: chartSettings.marginRight,
                left: chartSettings.marginLeft,
                bottom: chartSettings.marginBottom,
              }}
              sliderValue={sliderValue}
              taskType={taskType}
              training={training}
              distributionData={distributionData}
            />
          )}
        </Plot>
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
