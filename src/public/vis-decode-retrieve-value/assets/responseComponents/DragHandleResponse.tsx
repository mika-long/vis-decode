import { useState, useEffect, useRef } from 'react';
import { useChartOverlay } from './useChartOverlay';

type DragHandleResponseProps = {
  chartWidth: number;
  chartHeight: number;
  padding: { left: number; right: number; top: number; bottom: number };
  onChange: (value: number, committed?: boolean) => void;
  initialValue?: number;
  width?: number;
};

export default function DragHandleResponse({
  chartWidth,
  chartHeight,
  padding,
  onChange,
  initialValue,
  width = 50, // 50 pixels
}: DragHandleResponseProps) {
  // Use shared chart overlay hook for positioning
  // Note: DragHandle works in pixel coordinates (y-position), not values
  // So we use the hook mainly for consistent overlay props
  const { overlayProps } = useChartOverlay({
    chartWidth,
    chartHeight,
    padding,
    minValue: 0,
    maxValue: chartHeight, // Not really used for drag handle, but required by hook
  });

  // Store the y position of the top of the bar (in SVG coords)
  // If initialValue is undefined, bar starts collapsed at bottom
  const [topY, setTopY] = useState<number>(initialValue ?? chartHeight - padding.bottom);
  const dragging = useRef(false);

  useEffect(() => {
    if (initialValue !== undefined) setTopY(initialValue);
  }, [initialValue]);

  const bottomY = chartHeight - padding.bottom; // base of bar
  const barHeight = Math.max(0, bottomY - topY); // height from top to base

  const clampY = (clientY: number, svgTop: number) => {
    const raw = clientY - svgTop;
    return Math.max(padding.top, Math.min(chartHeight - padding.bottom, raw));
  };

  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    dragging.current = true;
    const svgTop = svgRef.current?.getBoundingClientRect().top ?? 0;
    const nextY = clampY(e.clientY, svgTop);
    setTopY(nextY);
    onChange(nextY, false);
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const svgTop = svgRef.current?.getBoundingClientRect().top ?? 0;
    const nextY = clampY(e.clientY, svgTop);
    setTopY(nextY);
    onChange(nextY, false);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    const svgTop = svgRef.current?.getBoundingClientRect().top ?? 0;
    const nextY = clampY(e.clientY, svgTop);
    setTopY(nextY);
    onChange(nextY, true);
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <svg
      ref={svgRef}
      {...overlayProps}
      style={{
        ...overlayProps.style,
        pointerEvents: 'auto', // Override to allow interaction
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Full-width bar from bottom to topY */}
      <rect
        x={padding.left}
        y={topY}
        // width={chartWidth - padding.left - padding.right}
        width={width}
        height={barHeight}
        fill="rgba(255, 77, 79, 0.3)"
      />
      {/* Draggable handle at the top of the bar */}
      <rect
        x={padding.left}
        y={topY - 10}
        // width={chartWidth - padding.left - padding.right}
        width={width}
        height={20}
        fill="none"
        stroke="rgba(255, 77, 79, 0.5)"
        strokeWidth={2}
        cursor="grab"
        pointerEvents="auto"
        onPointerDown={handlePointerDown}
      />
    </svg>
  );
}
