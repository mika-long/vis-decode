import { useScales } from './ScalesContext';

interface NearestPointMarkerProps {
  point: {
    x: number;
    y:number;
    pixelX?: number;
    pixelY?: number;
  } | null;
}

export default function NearestPointMarker({ point }: NearestPointMarkerProps) {
  const { xScale, yScale } = useScales();
  if (!point) return null;

  // Use pixelX/pixelY if available, otherwise calculate from x/y
  const cx = point.pixelX !== undefined ? point.pixelX : xScale(point.x);
  const cy = point.pixelY !== undefined ? point.pixelY : yScale(point.y);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#2563eb"
      stroke="#ffffff"
      strokeWidth={1.5}
      opacity={0.8}
      pointerEvents="none"
      data-source="NearestPointMarker"
    />
  );
}
