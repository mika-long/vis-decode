import {
  useState, useCallback, useMemo, useEffect,
} from 'react';
// import * as d3 from 'd3';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
import normal from '@stdlib/random-base-normal'; // https://github.com/stdlib-js/random-base-normal
import { StimulusParams } from '../../../store/types';
import { NoiseMask } from './NoiseMask';
import DragHandleResponse from './responseComponents/DragHandleResponse';
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
    respnseType?: 'slider' | 'drag-handle';
  }
}

const PADDING = {
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
};

type Phase = 'stimulus' | 'mask' | 'response';

const renderResponseComponent = (
  respnseType: 'slider' | 'drag-handle',
  chartWidth: number,
  chartHeight: number,
  padding: { left: number; right: number; top: number; bottom: number },
  handleResponseChange: (value: number) => void,
  handleResponseCommit: (value: number) => void,
) => {
  switch (respnseType) {
    case 'slider':
      return (
        <SliderResponse
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          padding={PADDING}
          onChange={(value, committed) => {
            handleResponseChange(value);
            if (committed) handleResponseCommit(value);
          }}
          minValue={0}
          maxValue={140}
        />
      );
    case 'drag-handle':
      return (
        <DragHandleResponse
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          padding={PADDING}
          onChange={(value, committed) => {
            handleResponseChange(value);
            if (committed) handleResponseCommit(value);
          }}
          initialValue={10}
        />
      );
    default:
      return null;
  }
};

export default function PerceptualPull({ parameters, setAnswer }: StimulusParams<PerceptualPullProps>) {
  const {
    params: {
      chartType, bottom, level, visibilityDuration = 1000, maskDuration = 500, respnseType = 'slider',
    },
  } = parameters;
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

  const handleResponseChange = useCallback((_value: number) => {
    // Only used to record that the participant interacted; value is handled on commit
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const handleResponseCommit = useCallback((value: number) => {
    // Submit answer only when interaction is complete
    setAnswer({
      status: true,
      answers: {
        response: value,
      },
    });
  }, [setAnswer]);

  // Initialize/reset answer when params change (mirrors Stimuli.tsx pattern)
  useEffect(() => {
    setAnswer({
      status: false,
      answers: {
        response: 0,
      },
    });
  }, [setAnswer, level, chartType, bottom, respnseType]);

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
        flexDirection: 'column',
      }}
      >
        {phase !== 'mask' ? (
          <VegaEmbed
            spec={spec}
            renderer="svg"
            width={chartWidth}
            height={chartHeight}
            padding={PADDING}
            actions={false}
          />
        ) : (
          <NoiseMask width={chartWidth} height={chartHeight} padding={PADDING} />
        )}

        {phase === 'response' && renderResponseComponent(
          respnseType,
          chartWidth,
          chartHeight,
          PADDING,
          handleResponseChange,
          handleResponseCommit,
        )}
      </div>
    </div>
  );
}
