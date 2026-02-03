/* eslint-disable */
import { useState } from 'react';
import { StimulusParams } from '../../../store/types';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';

/**
 * 
 * See https://vega.github.io/vega-lite/docs/size.html for details on defaults.
 * @param data 
 * @param chartType 
 * @returns 
 */
function generateSpec(data: {x: number, y: number}[], chartType: 'dot' | 'pointarc'): VisualizationSpec {
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
    data: {x:number, y:number}[];
    responseType?: 'slider' | 'drag-handle';
  }
}

export default function Moritz({ parameters, setAnswer }: StimulusParams<MoritzProps>) {
  const { params: { data, responseType = 'slider' } } = parameters;
  
}