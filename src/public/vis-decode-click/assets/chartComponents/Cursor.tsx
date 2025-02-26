/**
 * @param position: the position of the cursor
 */
interface CursorProps {
    position: { x: number; y: number } | null;
}

export default function Cursor({ position }: CursorProps) {
  if (!position) return null;

  return (
    <circle
      cx={position.x}
      cy={position.y}
      r={10}
      fill="#666"
      stroke="none"
      opacity={0.8}
      pointerEvents="none"
    />
  );
}
