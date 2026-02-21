import {
  useMemo, useState, useCallback, useEffect,
} from 'react';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
import exp2Data from './data/exp2-stimuli.json';
import SliderResponse from './responseComponents/SliderResponse';
// import DragHandleResponse from './responseComponents/DragHandleResponse';
import { StimulusParams } from '../../../store/types';

const VEGA_PADDING = 5;

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
    padding: VEGA_PADDING, // this needs to be changed the same with the overlaid padding stuff below ...
    autosize: 'none',
    // mark: { type: 'point', color: 'black', point: { fill: 'black' } },
    mark: { type: 'circle', color: 'black' },
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
        type: 'quantitative',
        scale: { domain: [0, 1] },
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { params: { index, responseType = 'slider' } } = parameters;
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // use the index to get the correct stimulus data
  const chartData = useMemo(() => exp2Data[index].data, [index]);
  // ... and generate the spec
  const spec = useMemo(() => generateSpec(chartData), [chartData]);

  const handleResponseChange = useCallback((_value: number) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const handleResponseCommit = useCallback((value: number, pixelY: number) => {
    setAnswer({
      status: true,
      answers: {
        numericResponse: value,
        pixelResponse: pixelY,
      },
    });
  }, [setAnswer]);

  // initialize / reset response when params change
  useEffect(() => {
    setAnswer({
      status: false,
      answers: {
        numericResponse: 0,
        pixelResponse: 0,
      },
    });
  }, [setAnswer]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      {/* Chart */}
      <div style={{
        width: '100%',
        position: 'relative',
        lineHeight: 0,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
      >
        <VegaEmbed
          spec={spec}
          renderer="svg"
          actions={false}
        />
      </div>
      {/* Response Component */}
      <SliderResponse
        chartHeight={200}
        chartWidth={500}
        chartPadding={{
          left: VEGA_PADDING, right: VEGA_PADDING, top: VEGA_PADDING, bottom: VEGA_PADDING,
        }}
        onChange={(value, pixelY, committed) => {
          handleResponseChange(value);
          if (committed) handleResponseCommit(value, pixelY);
        }}
        minValue={0}
        maxValue={1}
        numberOfSteps={100}
      />
      {/* { responseType === 'slider'
        ? (
          <SliderResponse
            chartHeight={200}
            chartWidth={500}
            chartPadding={{
              left: VEGA_PADDING, right: VEGA_PADDING, top: VEGA_PADDING, bottom: VEGA_PADDING,
            }}
            onChange={(value, pixelY, committed) => {
              handleResponseChange(value);
              if (committed) handleResponseCommit(value, pixelY);
            }}
            minValue={0}
            maxValue={1}
            numberOfSteps={100}
          />
        )
        : (
          <DragHandleResponse
            chartHeight={200}
            chartWidth={500}
            padding={{
              left: 0, right: 0, top: 0, bottom: 0,
            }}
            onChange={(value, committed) => {
              handleResponseChange(value);
              if (committed) handleResponseCommit(value);
            }}
          />
        )} */}
    </div>
  );
}
