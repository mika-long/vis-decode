import { useState, useEffect } from 'react';
import { Slider } from '@mantine/core';
import { useChartOverlay } from './useChartOverlay';

type SliderResponseProps = {
  chartWidth: number;
  chartHeight: number;
  padding: { left: number; right: number; top: number; bottom: number; };
  minValue: number;
  maxValue: number;
  onChange: (value: number, committed?: boolean) => void;
  initialValue?: number;
  stepSize?: number;
  disabled?: boolean;
};

export default function SliderResponse({
  chartWidth,
  chartHeight,
  padding,
  onChange,
  initialValue,
  minValue,
  maxValue,
  stepSize = 0.1,
  disabled = false,
}: SliderResponseProps) {
  const [value, setValue] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Use shared chart overlay hook for scale and positioning
  const { valueToY, overlayProps } = useChartOverlay({
    chartWidth,
    chartHeight,
    padding,
    minValue,
    maxValue,
  });

  const yPosition = valueToY(value);

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
      { hasInteracted && (
        <svg {...overlayProps}>
          <line
            x1={padding.left}
            y1={yPosition}
            x2={chartWidth - padding.right}
            y2={yPosition}
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
        disabled={disabled}
        label={(val) => val.toFixed(2)}
        styles={{
          root: {
            width: '100%',
            marginTop: 50,
            maxWidth: chartWidth + 20,
            marginLeft: 20,
          },
          track: { width: '100%', backgroundColor: '#e9ecef' },
          bar: { backgroundColor: '#e9ecef' },
          thumb: { display: hasInteracted ? 'block' : 'none' },
        }}
        data-source="perceptual-pull-slider"
      />
    </>
  );
}
