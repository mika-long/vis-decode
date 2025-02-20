import React from 'react';

interface CursorProps {
  position: { x: number; y: number } | null;
  isNearCurve: boolean;
}

export default function Cursor({ position, isNearCurve }: CursorProps) {
  if (!position) return null;

  return (
    <circle
      cx={position.x}
      cy={position.y}
      r={isNearCurve ? 1 : 10}
      fill="none"
      stroke="#666"
      strokeWidth={1}
      pointerEvents="none"
    />
  );
}
