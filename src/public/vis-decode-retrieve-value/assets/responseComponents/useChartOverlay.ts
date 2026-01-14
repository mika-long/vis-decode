import { useMemo, useCallback } from 'react';
import * as d3 from 'd3';

type UseChartOverlayProps = {
  chartWidth: number;
  chartHeight: number;
  padding: { left: number; right: number; top: number; bottom: number };
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
  padding,
  minValue,
  maxValue,
}: UseChartOverlayProps) {
  // Create D3 scale to map values to y-positions
  // Higher values map to lower y-coordinates (top of chart)
  const scale = useMemo(
    () => d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([chartHeight - padding.bottom, padding.top]),
    [minValue, maxValue, chartHeight, padding],
  );

  // Convenience function to convert a value to y-position
  const valueToY = useCallback((value: number) => scale(value), [scale]);

  // Common SVG props for absolutely positioned overlays
  const overlayProps = useMemo(
    () => ({
      width: chartWidth,
      height: chartHeight,
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        pointerEvents: 'none' as const,
      },
    }),
    [chartWidth, chartHeight],
  );

  return {
    scale,
    valueToY,
    overlayProps,
    chartWidth,
    chartHeight,
    padding,
  };
}
