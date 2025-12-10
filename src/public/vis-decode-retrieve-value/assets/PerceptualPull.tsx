import { useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
// https://github.com/stdlib-js/random-base-normal
import normal from '@stdlib/random-base-normal';
import { Slider } from '@mantine/core';
import { StimulusParams } from '../../../store/types';

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
 * ```t s
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
interface PerceptualPullProps {
  taskid: string;
  taskType: string;
  params: {
    level: 'H' | 'M' | 'L';
    chartType: 'line' | 'bar';
    bottom: boolean;
  }
}

const padding = {
  left: 10,
  right: 10,
  bottom: 10,
  top: 10,
};

export default function PerceptualPull({ parameters, setAnswer }: StimulusParams<PerceptualPullProps>) {
  const { params: { chartType, bottom, level } } = parameters;
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const data = useMemo(() => generateData(level), [level]);
  const spec = useMemo(() => generateSpec(data, chartType, bottom), [data, chartType, bottom]);

  // Chart dimensions (matching your VegaEmbed props)
  const chartWidth = 518;
  const chartHeight = 140;

  // Create D3 scale to map slider value to y-position
  const yScale = useMemo(() => (d3.scaleLinear()
    .domain([0, 140])
    .range([padding.top, chartHeight - padding.bottom])), [chartHeight]);

  // Calculate y-position from slider value
  const yPosition = sliderValue !== null ? yScale(sliderValue) : null;

  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
    setHasInteracted(true);
  }, []);

  const handleSliderChangeEnd = useCallback((value: number) => {
    setSliderValue(value);
    setHasInteracted(true);
    setAnswer({
      status: true,
      answers: {
        'perceptualPull-value': value,
      },
    });
  }, [setAnswer]);

  return (
    <>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <VegaEmbed
          spec={spec}
          renderer="svg"
          width={chartWidth}
          height={chartHeight}
          padding={{
            left: padding.left,
            right: padding.right,
            bottom: padding.bottom,
            top: padding.top,
          }}
          actions={false}
        />
        {/* D3-drawn Horizontal Line Overlay */}
        {hasInteracted && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: chartWidth,
              height: chartHeight,
              pointerEvents: 'none',
            }}
          >
            <line
              x1={padding.left}
              y1={yPosition!}
              x2={chartWidth - padding.right}
              y2={yPosition!}
              stroke="#FF0000"
              strokeWidth={2}
              strokeDasharray="4"
            />
          </svg>
        )}
      </div>
      {/* Slider for perceptual pull */}
      <div style={{ width: '140px' }}>
        <Slider
          value={sliderValue ?? 0}
          onChange={handleSliderChange}
          onChangeEnd={handleSliderChangeEnd}
          min={0}
          max={140}
          step={1}
          label={(val) => val.toFixed(2)}
          styles={{
            root: { width: '100%' },
            track: { width: '100%', backgroundColor: '#e9ecef' },
            bar: { backgroundColor: '#e9ecef' },
            thumb: { display: sliderValue !== null ? 'block' : 'none' },
          }}
          data-source="perceptual-pull-slider"
        />
      </div>
    </>
  );
}
