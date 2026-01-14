import {
  useState, useCallback, useMemo, useEffect,
} from 'react';
// import * as d3 from 'd3';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
import normal from '@stdlib/random-base-normal'; // https://github.com/stdlib-js/random-base-normal
import { StimulusParams } from '../../../store/types';
import { NoiseMask } from './NoiseMask';
// import DragHandleResponse from './responseComponents/DragHandleResponse';
import SliderResponse from './responseComponents/SliderResponse';

/**
 * Generates data points for perceptual pull visualization with configurable difficulty levels.
 *
 * @param level - Difficulty level: 'H' (high), 'M' (medium), or 'L' (low)
 * @param numPoints - Number of data points to generate (default: 12)
 * @param noiseStd - Standard deviation for noise generation (default: 4)
 * @param seed - Optional seed for reproducible random number generation
 * @returns Array of {x, y} coordinate pairs
 *
 * @example
 * ```ts
 * const data = generateData('H', 12, 4, 42);
 * // Returns: [{x: 0, y: 48.23}, {x: 1, y: 47.89}, ...]
 * ```
 * @returns Array of {x, y} coordinate pairs
 */
function generateData(
  level: 'H' | 'M' | 'L',
  numPoints: number = 12,
  noiseStd: number = 4,
  seed?: number, // optional seed for reproducibility
): { x: number; y: number }[] {
  const rand = seed !== undefined
    ? normal.factory({ seed })
    : normal.factory();

  const levelDict = { H: 48, M: 36, L: 24 };
  const baseMean = levelDict[level];

  return Array.from({ length: numPoints }, (_, i) => {
    const noise = rand(0, noiseStd);
    const val = baseMean + noise;
    return {
      x: i,
      y: Math.round(val * 100) / 100,
    };
  });
}

/**
 * Generates a Vega-Lite specification for a perceptual pull visualization.
 *
 * @param data - Array of {x: number, y: number} coordinate pairs
 * @param chartType - Type of chart: 'line' or 'bar'
 * @param bottom - Whether to reverse the y-axis
 * @returns Vega-Lite specification
 *
 * @example
 * ```ts
 * const spec = generateSpec(data, 'line');
 * // Returns: Vega-Lite specification
 * ```
 */
function generateSpec(data: { x: number; y: number }[], chartType: 'line' | 'bar', bottom: boolean): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.23.0.json',
    data: { name: 'data', values: data },
    mark: { type: chartType, color: 'black', point: { fill: 'black' } },
    encoding: {
      x: {
        axis: {
          labels: false,
          grid: false,
          title: null,
          tickSize: 0,
        },
        field: 'x',
        type: 'ordinal',
        scale: { paddingInner: chartType === 'bar' ? 0 : undefined },
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
        scale: {
          domain: [0, 140],
          reverse: bottom,
        },
      },
    },
  };
}

/**
 * Props for PerceptualPull component
 */
interface PerceptualPullProps {
  taskid: string;
  taskType: string;
  /** Parameters for the perceptual pull task */
  params: {
    /** Difficulty level: 'H' (high), 'M' (medium), or 'L' (low) */
    level: 'H' | 'M' | 'L';
    chartType: 'line' | 'bar';
    bottom: boolean;
    visibilityDuration?: number;
    maskDuration?: number;
  }
}

const padding = {
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
};

type Phase = 'stimulus' | 'mask' | 'response';

export default function PerceptualPull({ parameters, setAnswer }: StimulusParams<PerceptualPullProps>) {
  const {
    params: {
      chartType, bottom, level, visibilityDuration = 1000, maskDuration = 500,
    },
  } = parameters;
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('stimulus');

  const data = useMemo(() => generateData(level), [level]);
  const spec = useMemo(() => {
    const dataToShow = phase === 'stimulus' ? data : [];
    return generateSpec(dataToShow, chartType, bottom);
  }, [data, chartType, bottom, phase]);

  // Chart dimensions
  const chartWidth = 518;
  const chartHeight = 140;

  const handleResponseChange = useCallback((value: number) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    setSliderValue(value);
  }, [hasInteracted]);

  // Get slider response components (overlay + control)
  const sliderResponse = useMemo(
    () => SliderResponse({
      chartWidth,
      chartHeight,
      padding,
      minValue: 0,
      maxValue: 140,
      onChange: handleResponseChange,
      disabled: phase !== 'response',
    }),
    [chartWidth, chartHeight, handleResponseChange, phase],
  );

  // set initial answer with status = false
  useEffect(() => {
    setAnswer({
      status: false,
      answers: {
        slider: '',
      },
    });
  }, [setAnswer]);

  // update answer when slider has value
  useEffect(() => {
    if (hasInteracted && sliderValue !== null) {
      setAnswer({
        status: true,
        answers: {
          slider: sliderValue,
        },
      });
    }
  }, [hasInteracted, sliderValue, setAnswer]);

  // Phase transitions
  useEffect(() => {
    if (phase === 'stimulus') {
      const stimulusTimer = setTimeout(() => {
        setPhase('mask');
      }, visibilityDuration);
      return () => clearTimeout(stimulusTimer);
    }

    if (phase === 'mask') {
      const maskTimer = setTimeout(() => {
        setPhase('response');
      }, maskDuration);
      return () => clearTimeout(maskTimer);
    }

    return undefined;
  }, [phase, visibilityDuration, maskDuration]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      {/* Chart container with overlays */}
      <div style={{
        width: '100%',
        position: 'relative',
        lineHeight: 0,
        justifyContent: 'center',
        display: 'flex',
      }}
      >
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

        {/* Visual overlay - red dashed line positioned absolutely over the chart */}
        {sliderResponse.overlay}

        {/* DragHandleResponse alternative (commented out) */}
        {/* {phase === 'response' && (
          <DragHandleResponse
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            padding={padding}
            onChange={handleResponseChange}
            initialValue={10}
          />
        )} */}
      </div>

      {/* Slider control positioned below the chart */}
      <div style={{ marginTop: '20px', width: '100%' }}>
        {sliderResponse.control}
      </div>
    </div>
  );
}
