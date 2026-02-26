import { useMemo, useCallback } from 'react';
import * as d3 from 'd3';

type UseChartOverlayProps = {
  chartWidth: number;
  chartHeight: number;
  chartPadding: { left: number; right: number; top: number; bottom: number };
  minValue: number;
  maxValue: number;
};

/**
 * Shared hook for response components that need to overlay visualizations on a chart.
 * Provides scale calculation and common SVG overlay positioning props.
 *
 * @param chartWidth - Width of the chart in pixels
 * @param chartHeight - Height of the chart in pixels
 * @param padding - Chart padding in all directions
 * @param minValue - Minimum value for the scale domain
 * @param maxValue - Maximum value for the scale domain
 * @returns Object containing scale, valueToY converter, and overlay props
 */
export function useChartOverlay({
  chartWidth,
  chartHeight,
  chartPadding,
  minValue,
  maxValue,
}: UseChartOverlayProps) {
  // Create D3 scale to map values to y-positions
  // Higher values map to lower y-coordinates (top of chart)
  // const scale = useMemo(
  //   () => d3.scaleLinear()
  //     .domain([minValue, maxValue])
  //     .range([chartPadding.top + chartHeight, chartPadding.top]),
  //   [minValue, maxValue, chartHeight, chartPadding],
  // );
  /* using this version because we want thigns to
  be able to map nicely, from [0, 1] on the numerical scale
  to [pixelHeight of y-axis, 0] on the pixel scale
  */
  const scale = useMemo(
    () => d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([chartHeight, 0]),
    [minValue, maxValue, chartHeight],
  );

  // Convenience function to convert a value to y-position
  const valueToY = useCallback((value: number) => scale(value), [scale]);

  // Common SVG props for absolutely positioned overlays
  const overlayProps = useMemo(
    () => ({
      width: chartWidth + chartPadding.left + chartPadding.right, // now handling padding
      height: chartHeight + chartPadding.top + chartPadding.bottom, // no handling padding
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        pointerEvents: 'none' as const,
      },
    }),
    [chartWidth, chartHeight, chartPadding],
  );

  return {
    scale,
    valueToY,
    overlayProps,
    chartWidth,
    chartHeight,
    chartPadding,
  };
}
