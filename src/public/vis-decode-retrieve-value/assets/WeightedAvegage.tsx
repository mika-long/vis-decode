/* eslint-disable */
import { useMemo } from 'react';
import { Slider } from '@mantine/core';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
// https://github.com/kchapelier/poisson-disk-sampling
import PoissonDiskSampling from 'poisson-disk-sampling';
import { StimulusParams } from '../../../store/types';

/**
 * 
 * @param n : number of dots 
 * @param width : width of the svg 
 * @param height : height of the svg 
 * @returns an array
 */
function generateData(n: number = 30, width: number = 500, height: number = 500) {
  const p = new PoissonDiskSampling({
    shape: [width, height],
    minDistance: 20,
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
 * 
 * @param data 
 * @param width 
 * @param height 
 * @returns 
 */
function generateSpec(data: {x: number, y: number}[], width: number = 500, height: number = 500): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.23.0.json',
    data: { name: 'data', values: data },
    mark: { type: 'point', color: 'black', point: { fill: 'black' } },
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
  };
}

interface WeightedAverageProps {
  params: {
    n: number;
  }
}

export default function WeightedAverage({ parameters, setAnswer }: StimulusParams<WeightedAverageProps>) {
  const { params: { n } } = parameters;
  const data = useMemo(() => generateData(n), [n]);
  const spec = useMemo(() => generateSpec(data, 500, 500), [data]);

  return (
    <>
      <div style={{ width: '100%', height: '100%' }}>
        <VegaEmbed
          spec={spec}
          renderer="svg"
          width={500}
          height={500}
          padding={{
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
          }}
          actions={false}
        />
      </div>
      <Slider
        value={0}
        onChange={() => {}}
        onChangeEnd={() => {}}
        min={0}
        max={1}
        step={0.01}
      />
    </>
  );
}
