import { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Slider } from '@mantine/core';

type SliderResponseProps = {
  chartWidth: number;
  chartHeight: number;
  padding: { left: number; right: number; top: number; bottom: number; };
  minValue: number;
  maxValue: number;
  onChange: (value: number, committed?: boolean) => void;
  initialValue?: number;
  stepSize?: number;
};

export default function SliderResponse({
  chartWidth: _chartWidth,
  chartHeight: _chartHeight,
  padding: _padding,
  onChange,
  initialValue,
  minValue,
  maxValue,
  stepSize = 0.1,
}: SliderResponseProps) {
  const [value, setValue] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Create D3 scale to map slider value to y-position
  const yScale = useMemo(() => (d3.scaleLinear()
    .domain([minValue, maxValue])
    .range([_chartHeight - _padding.bottom, _padding.top])), [minValue, maxValue, _chartHeight, _padding]);

  const yPosition = value !== null ? yScale(value) : null;

  // Keep local state in sync if parent provides a new initial value.
  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleSliderChange = (next: number) => {
    setValue(next);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onChange(next, false);
  };

  const handleSliderChangeEnd = (next: number) => {
    setValue(next);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onChange(next, true);
  };

  return (
    <>
      {/* D3-drawn Horizontal Line Overlay */}
      {hasInteracted && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: _chartWidth,
            height: _chartHeight,
            pointerEvents: 'none',
          }}
        >
          <line
            x1={_padding.left}
            y1={yPosition!}
            x2={_chartWidth - _padding.right}
            y2={yPosition!}
            stroke="#FF0000"
            strokeWidth={2}
            strokeDasharray="4"
          />
        </svg>
      )}
      <Slider
        value={value}
        onChange={handleSliderChange}
        onChangeEnd={handleSliderChangeEnd}
        min={minValue}
        max={maxValue}
        step={stepSize}
        label={(val) => val.toFixed(2)}
        styles={{
          root: { width: '100%' },
          track: { width: '100%', backgroundColor: '#e9ecef' },
          bar: { backgroundColor: '#e9ecef' },
          thumb: { display: hasInteracted ? 'block' : 'none' },
        }}
        data-source="perceptual-pull-slider"
      />
    </>
  );
}
