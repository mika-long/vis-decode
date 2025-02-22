import { useScales } from './ScalesContext';

interface ClickMarkerProps {
    point: { x: number; y: number } | null;
}

export default function ClickMarker({ point }: ClickMarkerProps) {
  const { xScale, yScale } = useScales();
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
