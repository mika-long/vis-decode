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
      r={isNearCurve ? 5 : 20}
      fill={isNearCurve ? '#2563eb' : '#666'}
      stroke={isNearCurve ? '#2563eb' : '#666'} // Blue when near curve
      strokeWidth={1}
      opacity={0.8}
      pointerEvents="none"
    />
  );
}
