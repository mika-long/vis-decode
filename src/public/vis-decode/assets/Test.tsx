import * as d3 from 'd3';
import { useCallback, useMemo, useState } from 'react';
import { Container, Button } from '@mantine/core';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import { Plot } from './Plot';
import { GuideLines } from './Guidelines';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TestProps extends StimulusParams<any> {
  taskType: TaskType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Test({ parameters, setAnswer }: StimulusParams<any>) {
  const { data, showPDF, taskid, training, } = parameters;
  const [sliderValue, setSliderValue] = useState<number | undefined>();
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isNearCurve, setIsNearCurve] = useState(false);

  // track actions
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
      actions: {
        clickAction,
      },
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
      x: x,
      y: yValues[i],
    }));
  }, [distributionData, showPDF]);

  // Interaction logic
  // find closest point on the line to the clicked position
  const findClosestPoint = useCallback((
    clickX: number,
    clickY: number,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) => {
    if (!distributionData) return null;

    // convert pixel click coordinates to data space
    const dataX = xScale.invert(clickX);
    const dataY = yScale.invert(clickY);

    // Find closest x value in the data
    const index = d3.bisector(d => d).left(distributionData.xVals, dataX);
    const x0 = distributionData.xVals[index - 1];
    const x1 = distributionData.xVals[index];

    if (!x0 || !x1) return null;

    const closest = Math.abs(dataX - x0) < Math.abs(dataX - x1) ? index - 1 : index;
    const closestPoint = {
      x: distributionData.xVals[closest],
      y: (showPDF ? distributionData.pdfVals : distributionData.cdfVals)[closest]
    };
    return closestPoint;
  }, [distributionData, showPDF]);

  // Click handler using Plot's scales
  const handlePlotClick = useCallback((
    event: React.MouseEvent,
    { xScale, yScale }: { xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number> }
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
    const lineY = yScale(closestPoint.y);
    const distance = Math.abs(svgPoint.y - lineY);

    if (distance <= 5) {
      // update point
      setCurrentPoint(closestPoint);
      // Track in provenance
      trrack.apply('Clicked', actions.clickAction({
        clickX: closestPoint.x,
        clickY: closestPoint.y
      }));
      // trrack and setAnswer logic
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend, // Include provenance data
        answers: {
          "location-x": closestPoint.x,
          "location-y": closestPoint.y
        }
      });
    } else {
      setAnswer({
        status: false,
        answers: {},
      });
    }
  }, [distributionData, actions, trrack, findClosestPoint, setAnswer]);

  // Mouse move handler
  const handlePlotMouseMove = useCallback((
    event: React.MouseEvent,
    { xScale, yScale }: { xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number> }
  ) => {
    if (!distributionData) return;

    const svg = event.currentTarget as SVGSVGElement;
    const pt = new DOMPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const svgPoint = pt.matrixTransform(ctm);

    // proximity check
    const closestPoint = findClosestPoint(svgPoint.x, svgPoint.y, xScale, yScale);
    setIsNearCurve(!!closestPoint && Math.abs(svgPoint.y - yScale(closestPoint.y)) <= 5);
  }, [distributionData, findClosestPoint]);

  const handleClearPoint = useCallback(() => {
    setCurrentPoint(null);
    setAnswer({
      status: false,
      answers: {},
    });
  }, [setAnswer]);

  return (
    <Container p="md">
      <div className="mt-4">
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
          onClick={handlePlotClick}
          onMouseMove={handlePlotMouseMove}
        />
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

export default Test;
