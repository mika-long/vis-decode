import {
  useEffect, useRef, useMemo, useCallback, useState,
} from 'react';
import * as d3 from 'd3';
import { Stack, Space } from '@mantine/core';
import { useGetAnswers } from '../../../store/hooks/useGetAnswers';
import { ScalesProvider } from './chartComponents/ScalesContext';
import ClickMarker from './chartComponents/ClickMarker';
import Block5Slider from './chartComponents/Block5Slider';
import { StimulusParams } from '../../../store/types';

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

function Block5Visualization({
  xSliderValue,
  setXSliderValue,
  ySliderValue,
  setYSliderValue,
  setAnswer,
  axisLabels,
  selectedPoint,
  children,
}: Block5Props) {
  // TODO
  const { margin, width, height } = chartSettings;
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

  const handleXSliderChange = useCallback((value: number) => {
    setXSliderValue(value);
  }, [setXSliderValue]);
  const handleYSliderChange = useCallback((value: number) => {
    setYSliderValue(value);
  }, [setYSliderValue]);

  const handleXSliderCommit = useCallback((value: number) => {
    // TODO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAnswer((prevAnswer) => {
      // preserve previous answer and only update x slider value
      const prevAnswers = prevAnswer?.answers || {};
      return {
        status: true,
        answers: {
          ...prevAnswers,
          'x-slider': value,
        },
      };
    });
  }, [setAnswer]);

  const handleYSliderCommit = useCallback((value: number) => {
    setAnswer((prevAnswer) => {
      const prevAnswers = prevAnswer?.answers || {};
      return {
        status: true,
        answers: {
          ...prevAnswers,
          'y-slider': value,
        },
      };
    });
  }, [setAnswer]);

  // Memoize Axis labels
  const axisElements = useMemo(() => {
    if (!axisLabels) return null;
    return (
      <>
        {axisLabels.x && (
          <text x={width / 2} y={height - 5} textAnchor="middle" style={{ fontSize: '12px', fill: '#666' }}>
            {axisLabels.x}
          </text>
        )}
        {axisLabels.y && (
          <text x={-height / 2} y={15} textAnchor="middle" transform="rotate(-90)" style={{ fontSize: '12px', fill: '#666' }}>
            {axisLabels.y}
          </text>
        )}
      </>
    );
  }, [axisLabels, width, height]);

  return (
    <>
      {/* X Slider */}
      <Block5Slider
        min={-5}
        max={5}
        value={xSliderValue ?? 0}
        onChange={handleXSliderChange}
        onChangeEnd={handleXSliderCommit}
      />
      <Space h="md" />
      {/* Y Slider */}
      <Block5Slider
        min={0}
        max={1}
        value={ySliderValue ?? 0}
        onChange={handleYSliderChange}
        onChangeEnd={handleYSliderCommit}
      />
      <svg
        width={width}
        height={height}
      >
        <g ref={xAxisRef} />
        <g ref={yAxisRef} />
        {axisElements}
        {selectedPoint && (
          <ClickMarker x={xScale(selectedPoint.x)} y={yScale(selectedPoint.y)} />
        )}
        {children}
      </svg>
    </>
  );
}

export default function Block5({ parameters, setAnswer }: StimulusParams<any>) {
  // TODO
  const {a, b} = parameters;
  const answers = useGetAnswers(['task1_test_1', 'task1_test_2', 'task1_test_3']);
  // eslint-disable-next-line no-console
  console.log(answers);

  const [xSliderValue, setXSliderValue] = useState<number>(0);
  const [ySliderValue, setYSliderValue] = useState<number>(0);

  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number} | null>(null);

  // Update selected point when sliders change
  useEffect(() => {
    setSelectedPoint({ x: xSliderValue, y: ySliderValue });
  }, [xSliderValue, ySliderValue]);

  return (
    <Stack>
      {/* X axis slider */}
      <ScalesProvider
        width={chartSettings.width}
        height={chartSettings.height}
        margin={chartSettings.margin}
        xDomain={[-5, 5]}
        yDomain={[0, 1]}
      >
        <Block5Visualization
          xSliderValue={xSliderValue}
          ySliderValue={ySliderValue}
          setXSliderValue={setXSliderValue}
          setYSliderValue={setYSliderValue}
          setAnswer={setAnswer}
          axisLabels={{ x: 'X Axis', y: 'Y Axis' }}
          selectedPoint={selectedPoint}
        />
      </ScalesProvider>
    </Stack>
  );
}
