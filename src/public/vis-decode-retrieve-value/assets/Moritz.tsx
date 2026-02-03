/* eslint-disable */
import { useMemo } from 'react';
import { StimulusParams } from '../../../store/types';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
import exp2Data from './data/exp2-stimuli.json';
import SliderResponse from './responseComponents/SliderResponse';

/**
 * 
 * See https://vega.github.io/vega-lite/docs/size.html for details on defaults.
 * @param data 
 * @returns 
 */
function generateSpec(data: {x: number, y: number}[]): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.23.0.json',
    data: { name: 'data', values: data },
    width: 500,
    height: 200,
    padding: 5,
    autosize: 'none',
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
      },
      y: {
        axis: {
          labels: false,
          grid: false,
          title: null,
          tickSize: 0,
        },
        field: 'y',
        type: 'quantitative'
      },
    },
  };
}

interface MoritzProps {
  taskid: string;
  taskType: string;
  params: {
    index: number; // the index inside of the original data 
    responseType?: 'slider' | 'drag-handle';
  }
}

export default function Moritz({ parameters, setAnswer }: StimulusParams<MoritzProps>) {
  const { params: { index, responseType = 'slider' } } = parameters;
  
  // use the index to get the correct stimulus data 
  const chartData = useMemo(() => {
    return exp2Data[index].data;
  }, [index]);
  // ... and generate the spec 
  const spec = useMemo(() => generateSpec(chartData), [chartData]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Chart */}
      <div style={{
        width: '100%',
        position: 'relative',
        lineHeight: 0,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <VegaEmbed 
          spec={spec}
          renderer='svg'
          actions={false}
        />
      </div>
      {/* Response Component */}
      <SliderResponse 
        chartHeight={200}
        chartWidth={500}
        padding={{left: 0, right: 0, top: 0, bottom: 0}}
        onChange={() => {}}
        minValue={0}
        maxValue={1}
      />
    </div>
  )
}