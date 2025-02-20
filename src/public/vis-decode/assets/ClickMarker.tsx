interface ClickMarkerProps {
    point: { x: number; y: number } | null;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
}

export default function ClickMarker({ point, xScale, yScale }: ClickMarkerProps) {
  if (!point) return null;

  return (
    <>
      <circle
        cx={xScale(point.x)}
        cy={yScale(point.y)}
        r={4}
        fill="#2563eb"
        pointerEvents="none"
      />
      <line
        x1={xScale.range()[0]}
        x2={xScale.range()[1]}
        y1={yScale(point.y)}
        y2={yScale(point.y)}
        stroke="#2563eb"
        strokeWidth={1}
        strokeDasharray="4"
        opacity={0.5}
        pointerEvents="none"
      />
    </>
  );
}
