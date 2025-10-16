/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect, useRef, useMemo, useCallback, useState,
} from 'react';
import * as d3 from 'd3';
import {
  Stack, Space, Text, Container,
} from '@mantine/core';
import { useGetAnswers } from '../../../store/hooks/useGetAnswers';
import { ScalesProvider, useScales } from './chartComponents/ScalesContext';
import Block5Slider from './chartComponents/Block5Slider';
import { StimulusParams } from '../../../store/types';
import ClickMarker from './chartComponents/ClickMarker';
import GuideLines from './chartComponents/Guidelines';

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

  setAnswer: (answer: {status: boolean; answers: Record<string, any> }) => void,
  axisLabels?: {
    x?: string;
    y?: string;
  }
  children?: React.ReactNode;
  isTraining?: boolean;
}

function Block5Visualization({
  setAnswer,
  axisLabels,
  children,
  isTraining = false,
}: Block5Props) {
  // Use the scales from context
  const {
    xScale, yScale, width, height, margin,
  } = useScales();
  // Refs for axes
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);
  // Initialize slider values as null (no selection)
  const [xSliderValue, setXSliderValue] = useState<number | null>(null);
  const [ySliderValue, setYSliderValue] = useState<number | null>(null);
  const [xHasInteracted, setXHasInteracted] = useState<boolean>(false);
  const [yHasInteracted, setYHasInteracted] = useState<boolean>(false);

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

  // Set initial answer state with status=false (important for framework to track answers)
  useEffect(() => {
    setAnswer({
      status: false,
      answers: {
        'slider-x': null,
        'slider-y': null,
        'location-x': null,
        'location-y': null,
      },
    });
  }, [setAnswer]);

  // Update answer whenever both sliders have values
  useEffect(() => {
    if (xHasInteracted && yHasInteracted && xSliderValue !== null && ySliderValue !== null) {
      setAnswer({
        status: true,
        answers: {
          'slider-x': xSliderValue,
          'slider-y': ySliderValue,
        },
      });
    }
  }, [xSliderValue, ySliderValue, xHasInteracted, yHasInteracted, setAnswer]);

  const handleXSliderChange = useCallback((value: number) => {
    if (!xHasInteracted) {
      setXHasInteracted(true);
    }
    setXSliderValue(value);
  }, [xHasInteracted]);

  const handleYSliderChange = useCallback((value: number) => {
    if (!yHasInteracted) {
      setYHasInteracted(true);
    }
    setYSliderValue(value);
  }, [yHasInteracted]);

  // Simplified commit handlers
  const handleXSliderCommit = useCallback((value: number) => {
    setXSliderValue(value);
  }, []);

  const handleYSliderCommit = useCallback((value: number) => {
    setYSliderValue(value);
  }, []);

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

  // Calculate guidelines based on slider value
  const guidelines = useMemo(() => {
    if (!isTraining) return null;

    return {
      x: xSliderValue,
      y: ySliderValue,
      tangentLine: null,
    };
  }, [isTraining, xSliderValue, ySliderValue]);

  return (
    <>
      <div style={{ width: width - margin.left - margin.right }}>
        {/* X Slider */}
        <Text size="md"> X Slider </Text>
        <Block5Slider
          min={-5}
          max={5}
          value={xSliderValue ?? 0}
          onChange={handleXSliderChange}
          onChangeEnd={handleXSliderCommit}
        />
        {/* Y Slider */}
        <Text size="md"> Y Slider </Text>
        <Block5Slider
          min={0}
          max={1}
          value={ySliderValue ?? 0}
          onChange={handleYSliderChange}
          onChangeEnd={handleYSliderCommit}
        />
      </div>
      <Space />
      <svg
        width={width}
        height={height}
      >
        <g ref={xAxisRef} />
        <g ref={yAxisRef} />
        {axisElements}
        {/* Dot on the x-axis - only display after user interaction */}
        {xSliderValue !== null && xHasInteracted && (
          <circle
            cx={xScale(xSliderValue)}
            cy={yScale(0)}
            r={5}
            fill="blue"
            fillOpacity={0.6}
            stroke="white"
            strokeWidth={1.5}
            pointerEvents="none"
          />
        )}
        {/* Dot on the y-axis - only display after user interaction */}
        {ySliderValue !== null && yHasInteracted && (
          <circle
            cx={xScale(-5)}
            cy={yScale(ySliderValue)}
            r={5}
            fill="green"
            stroke="white"
            strokeWidth={1.5}
            fillOpacity={0.6}
            pointerEvents="none"
          />
        )}
        {/* guidelines */}
        {isTraining && guidelines && (
          <GuideLines
            xValue={guidelines.x}
            yValue={guidelines.y}
            tangentLine={guidelines.tangentLine}
          />
        )}
        {children}
      </svg>
    </>
  );
}

export default function Block5({ parameters, setAnswer }: StimulusParams<any>) {
  // const { trial_id: trialId, taskid } = parameters;
  const { params } = parameters;
  const trialId = params.trial_id;
  const isTraining = params.training || false; // default to false

  const answers = useGetAnswers([trialId.toString()]);
  const n = Object.keys(answers)[0];
  const point = useMemo(() => {
    let p = { x: null as number | null, y: null as number | null };
    if (answers[n]) {
      const answer = answers[n] as { 'location-x': number, 'location-y': number };
      const xVal = answer['location-x'];
      const yVal = answer['location-y'];
      if (xVal && yVal) {
        p = { x: xVal, y: yVal };
      }
    }
    return p;
  }, [answers, n]);

  // Wrap the original setAnswer to include both slider and point values
  const handleSetAnswer = useCallback((answerData: {status: boolean; answers: Record<string, any> }) => {
    const combinedAnswer = {
      status: answerData.status,
      answers: {
        ...answerData.answers,
        'location-x': point.x, // Include the point's x value
        'location-y': point.y, // Include the point's y value
      },
    };

    // Only override with slider values if point values are null
    if (point.x === null && answerData.answers['slider-x'] !== null) {
      combinedAnswer.answers['location-x'] = answerData.answers['slider-x'];
    }

    if (point.y === null && answerData.answers['slider-y'] !== null) {
      combinedAnswer.answers['location-y'] = answerData.answers['slider-y'];
    }

    setAnswer(combinedAnswer);
  }, [point, setAnswer]);

  return (
    <Container p="md">
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
            setAnswer={handleSetAnswer}
            axisLabels={{ x: 'X Axis', y: 'Y Axis' }}
            isTraining={isTraining}
          >
            <ClickMarker point={point} />
          </Block5Visualization>
        </ScalesProvider>
      </Stack>
    </Container>
  );
}
