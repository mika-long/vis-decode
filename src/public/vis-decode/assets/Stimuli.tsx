/* eslint-disable no-shadow */
import * as d3 from 'd3';
import { useCallback, useMemo, useState } from 'react';
import { Container, Button, Slider } from '@mantine/core';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import { Plot } from './Plot';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GuideLines } from './chartComponents/Guidelines';
import { TaskType } from './TaskTypes';

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

interface CursorState {
  x: number;
  y: number;
  isNearCurve: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    data, showPDF, training, taskType,
  } = parameters;
  const hasSlider = taskType === TaskType.PDF_MEDIAN || taskType === TaskType.CDF_MODE;
  const [sliderValue, setSliderValue] = useState<number | undefined>();
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Provenance related
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();

    const clickAction = reg.register('click', (state, click: {clickX:number, clickY: number}) => {
      state.clickX = click.clickX;
      state.clickY = click.clickY;
      return state;
    });

    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: { clickX: 0, clickY: 0 },
    });

    return {
      actions: { clickAction },
      trrack: trrackInst,
    };
  }, []);

  // data generation
  const distributionData = useMemo(() => generateDistributionData(data), [data]);

  // generate line points
  const linePoints = useMemo(() => {
    if (!distributionData) return [];

    const yValues = showPDF ? distributionData.pdfVals : distributionData.cdfVals;
    return distributionData.xVals.map((x, i) => ({
      x,
      y: yValues[i],
    }));
  }, [distributionData, showPDF]);

  // Create scales outside of Plot component so they can be shared
  const { xScale, yScale } = useMemo(() => {
    if (!distributionData) return { xScale: null, yScale: null };

    const calculatedXDomain = [
      d3.min(distributionData.xVals) || 0,
      d3.max(distributionData.xVals) || 0,
    ];
    // Fixed y-domain to [0,1] by default
    const calculatedYDomain = showPDF
      ? [0, d3.max(distributionData.pdfVals) || 0]
      : [0, d3.max(distributionData.cdfVals) || 0];

    // const calculatedYDomain = [0, 1];
    const xScale = d3.scaleLinear()
      .domain(calculatedXDomain)
      .range([chartSettings.marginLeft, chartSettings.width - chartSettings.marginRight]);

    const yScale = d3.scaleLinear()
      .domain(calculatedYDomain)
      .range([chartSettings.height - chartSettings.marginBottom, chartSettings.marginTop]);

    return { xScale, yScale };
  }, [distributionData, showPDF]);

  // Interaction logic
  // find closest point on the line to the clicked position
  const findClosestPoint = useCallback((
    clickX: number,
    clickY: number,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
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
    if (index >= distributionData.xVals.length) return { x: distributionData.xVals[distributionData.xVals.length - 1], y: yValues[yValues.length - 1] };
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
  }, [distributionData, showPDF]);

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

      // Update provenance and answer
      trrack.apply('Slider moved', actions.clickAction({
        clickX: point.x,
        clickY: point.y,
      }));

      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {
          'location-x': point.x,
          'location-y': point.y,
        },
      });
    }
  }, [distributionData, showPDF, actions, trrack, setAnswer]);

  // Mouse move handler
  const handlePlotMouseMove = useCallback((
    event: React.MouseEvent,
    { xScale, yScale }: { xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number> },
  ) => {
    if (!distributionData) return;
    if (training) return;

    const svg = event.currentTarget as SVGSVGElement;
    const pt = new DOMPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm);

    // proximity check
    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y, xScale, yScale);
    if (!closestPoint) return;

    const isNear = Math.abs(svgPoint.y - yScale(closestPoint.y)) <= 10;
    setCursor({
      x: svgPoint.x,
      y: svgPoint.y,
      isNearCurve: isNear,
    });
  }, [distributionData, findClosestPoint]);

  // Click handler using Plot's scales
  const handlePlotClick = useCallback((
    event: React.MouseEvent,
    { xScale, yScale }: { xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number> },
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

    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y, xScale, yScale);
    if (!closestPoint) return;

    // Check proximity to line
    const distance = Math.abs(svgPoint.y - yScale(closestPoint.y));
    if (distance <= 5) {
      // update point
      setSelectedPoint(closestPoint);
      // Track in provenance
      trrack.apply('Clicked', actions.clickAction({
        clickX: closestPoint.x,
        clickY: closestPoint.y,
      }));
      // trrack and setAnswer logic
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend, // Include provenance data
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
  }, [distributionData, actions, trrack, findClosestPoint, setAnswer]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setCursor(null);
  }, []);

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
        {/* optional slider */}
        {training && hasSlider && (
          <div style={{ width: chartSettings.width, marginBottom: '2em' }}>
            <Slider
              value={sliderValue}
              onChange={handleSliderChange}
              min={distributionData?.xVals[0]}
              max={distributionData?.xVals[distributionData.xVals.length - 1]}
              step={0.1}
              label={(value) => value.toFixed(2)}
              className="mb-4"
              styles={{
                root: { width: '100%' },
                track: { width: '100%' },
              }}
            />
          </div>
        )}
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
