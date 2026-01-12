/* eslint-disable */
import { useMemo, useState, useEffect } from 'react';
import { Slider, Text } from '@mantine/core';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
import PoissonDiskSampling from 'poisson-disk-sampling'; // https://github.com/kchapelier/poisson-disk-sampling
import { StimulusParams } from '../../../store/types';
import { NoiseMask } from './NoiseMask';

/**
 * 
 * @param n : number of dots 
 * @param width : width of the svg; default 15 px  
 * @param height : height of the svg; default 15 px  
 * @returns an array
 */
function generateData(n: number = 30, width: number = 500, height: number = 500) {
  const p = new PoissonDiskSampling({
    shape: [width, height],
    minDistance: 35,
    maxDistance: height - 20,
    tries: n,
  });

  const points = p.fill();
  return points.map((point: number[]) => {
    const [x, y] = point;
    return { x, y };
  });
}

/**
 * Generate vega spec given data, width, and height 
 * @param data 
 * @param width 
 * @param height 
 * @returns 
 */
function generateSpec(data: {x: number, y: number}[], width: number = 500, height: number = 500): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.23.0.json',
    data: { name: 'data', values: data },
    mark: { type: 'point', color: 'black',
            fill: 'black', filled: true, 
            size: 15 ** 2 * Math.PI // r = 15 px 
          },
    encoding: {
      x: {
        axis: {
          labels: false,
          grid: false,
          title: null,
          tickSize: 0,
        },
        field: 'x',
        type: 'quantitative',
        scale: { domain: [0, width] },
      },
      y: {
        axis: {
          labels: false,
          grid: false,
          title: null,
          tickSize: 0,
        },
        field: 'y',
        type: 'quantitative',
        scale: { domain: [0, height] },
      },
    },
    padding: 5,
  };
}

interface WeightedAverageProps {
  taskid: string;
  taskType: string; 
  params: {
    n: number;
    visibilityDuration?: number; 
    maskDuration?: number; 
  }
}

const padding = {
  left: 0, 
  right: 0, 
  bottom: 0, 
  top: 0,
}

const chartHeight = 500;
const chartWidth = 500;

type Phase = 'stimulus' | 'mask' | 'response';

export default function WeightedAverage({ parameters, setAnswer }: StimulusParams<WeightedAverageProps>) {
  const { params: { n, visibilityDuration = 1000, maskDuration = 500 } } = parameters;
  const [phase, setPhase] = useState<Phase>('stimulus');
  
  const data = useMemo(() => generateData(n), [n]);
  const spec = useMemo(() => {
    const dataToShow = phase === 'stimulus' ? data : [];
    return generateSpec(dataToShow, chartWidth, chartHeight);
  }, [data, phase]);

  // Change Phase 
  useEffect(() => {
    if (phase === 'stimulus') {
      const timer = setTimeout(() => {
        setPhase('mask');
    }, visibilityDuration);
      // cleanup 
      return () => clearTimeout(timer);
    }
    if (phase === 'mask') {
      const timer = setTimeout(() => {
        setPhase('response');
    }, maskDuration);
      // cleanup 
      return () => clearTimeout(timer);
  }
    if (phase === 'response') return undefined;
  }, [phase, visibilityDuration, maskDuration]);

  return (
    <>
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', lineHeight: 0 }}>
        {phase !== 'mask' ? (
          <VegaEmbed
            spec={spec}
            renderer="svg"
            width={chartWidth}
            height={chartHeight}
            padding={padding}
            actions={false}
          />
        ) : (
          <NoiseMask width={chartWidth} height={chartHeight} padding={padding} />
        )}
        {/* TODO: some overlaying component that indicates selection */}
      </div>
      <div style={{width: chartWidth}}>
        <Text size='md'>Slider to control x position: </Text>
        {/* TODO */}
        <Slider
          value={0}
          onChange={() => {}}
          onChangeEnd={() => {}}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div style={{width: chartWidth}}>
        <Text size='md'>Slider to control y position: </Text>
        {/* TODO */}
        <Slider
          value={0}
          onChange={() => {}}
          onChangeEnd={() => {}}
          min={0}
          max={1}
          step={0.01}
        />
      </div>

    </>
  );
}
