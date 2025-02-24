/* eslint-disable no-shadow */
import * as d3 from 'd3';
import { useCallback, useMemo, useState } from 'react';
import { Container, Button } from '@mantine/core';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import Plot from './Plot';
import GuideLines from './chartComponents/Guidelines';
import { useScales } from './chartComponents/ScalesContext';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Stimuli({ parameters, setAnswer }: StimulusParams<any>) {
  const {
    params, showPDF, training, taskType,
  } = parameters;
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Generate distribution data
  const distributionData = useMemo(() => generateDistributionData(params), [params]);

  const guidelines = useMemo(() => {
    if (training === false) return null;
    // Find the index of the closest x value
    const index = d3.bisector((d) => d).left(distributionData.xVals, selectedPoint);

    switch (taskType) {
      case 'pdf_median':
        return { x: sliderValue, y: null, tangentLine: null };
      case 'pdf_mode':
        return null;
      case 'cdf_median':
        return null;
      case 'cdf_mode':
        return null;
      default:
        return null;
    }
  }, [sliderValue, training, taskType, distributionData]);

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
  }, [distributionData, findClosestPoint, training]);

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
        <Plot
          distributionData={distributionData}
          width={chartSettings.width}
          height={chartSettings.height}
          margin={chartSettings.margin}
          isTraining={training}
          showPDF={showPDF}
          yDomain={[0, 1]}
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

