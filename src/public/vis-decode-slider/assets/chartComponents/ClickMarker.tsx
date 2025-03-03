import { useScales } from './ScalesContext';

interface ClickMarkerProps {
    point: { x: number | null; y: number | null } | null;
}

export default function ClickMarker({ point }: ClickMarkerProps) {
  const { xScale, yScale } = useScales();
  if (!point || point.x === null || point.y === null) return null;

  return (
    <circle
      cx={xScale(point.x)}
      cy={yScale(point.y)}
      r={4}
      fill="#f03b20" // red
      pointerEvents="none"
      data-source="ClickMarker"
    />
  );
}
