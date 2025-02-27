import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useGetAnswers } from '../../../store/hooks/useGetAnswers';
import { useScales } from './chartComponents/ScalesContext';
import ClickMarker from './chartComponents/ClickMarker';
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

interface Block5Props {
  xSliderValue?: number | undefined,
  ySliderValue?: number | undefined,
  setXSliderValue: (value: number) => void;
  setYSliderValue: (value: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAnswer: (answer: {status: boolean; answers: Record<string, any> }) => void,
  axisLabels?: {
    x?: string;
    y?: string;
  }
  // Interaction state
  selectedPoint?: { x: number; y: number } | null;
  children?: React.ReactNode;
}

export default function Block5({
  xSliderValue,
  ySliderValue,
  axisLabels,
  selectedPoint,
  children,
  setXSliderValue,
  setYSliderValue,
  setAnswer,
}: Block5Props) {
  const {
    xScale, yScale, width, height, margin,
  } = useScales();
  const answers = useGetAnswers(['task1_test_1', 'task1_test_2', 'task1_test_3']);
  // eslint-disable-next-line no-console
  console.log(answers);

  // Refs
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);
  // Draw D3 axes
  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(d3.axisBottom(xScale))
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .selectAll('text') // Select all text elements (tick labels)
        .style('font-size', '12px') // Set the font size (adjust value as needed);
        .style('stroke-width', '2px');
    }
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(d3.axisLeft(yScale))
        .attr('transform', `translate(${margin.left},0)`)
        .selectAll('text')
        .style('font-size', '12px')
        .style('stroke-width', '2px');
    }
  }, [xScale, yScale, margin, height]);

  // Memoize Axis labels
  const axisElements = useMemo(() => {
    if (!axisLabels) return null;
    return (
      <>
        { axisLabels.x && (
        <text x={width / 2} y={height - 5} textAnchor="middle" style={{ fontSize: '12px', fill: '#666' }}>
          {axisLabels.x}
        </text>
        )}
        { axisLabels.y && (
          <text x={-height / 2} y={15} textAnchor="middle" transform="rotate(-90)" style={{ fontSize: '12px', fill: '#666' }}>
            {axisLabels.y}
          </text>
        )}
      </>
    );
  }, [axisLabels, width, height]);

  return (
    <svg
      width={width}
      height={height}
    >
      <g ref={xAxisRef} />
      <g ref={yAxisRef} />
      {axisElements}
      {selectedPoint && <ClickMarker point={selectedPoint} />}
      {/* Additional elements passed as children */}
      {children}
    </svg>
  );
}
