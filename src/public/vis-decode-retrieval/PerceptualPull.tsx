// import { useEffect, useRef, useMemo } from 'react';
// import * as d3 from 'd3';
import VegaEmbed from 'react-vega/lib/VegaEmbed';
import { VisualizationSpec } from 'react-vega';
// https://github.com/stdlib-js/random-base-normal
import normal from '@stdlib/random-base-normal';

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
    $schema: 'https://vega.github.io/schema/vega-lite/v6.1.0.json',
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

export default function PerceptualPull({ level, chartType, bottom }: { level: 'H' | 'M' | 'L', chartType: 'line' | 'bar', bottom: boolean }) {
  const data = generateData(level);
  const spec = generateSpec(data, chartType, bottom);
  return (
    <VegaEmbed
      spec={spec}
      renderer="svg"
      width={518}
      height={140}
      padding={{
        left: 10,
        right: 10,
        bottom: 10,
        top: 10,
      }}
    />
  );
}
