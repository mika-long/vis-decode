interface ClickMarkerProps {
    point: { x: number; y: number } | null;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
}

export default function ClickMarker({ point, xScale, yScale }: ClickMarkerProps) {
  if (!point) return null;

  return (
    <circle
      cx={xScale(point.x)}
      cy={yScale(point.y)}
      r={4}
      fill="#ff0000" // red
      pointerEvents="none"
      data-source="ClickMarker"
    />
  );
}
