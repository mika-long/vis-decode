import { useState, useEffect } from 'react';
import { Slider, SliderProps, Text } from '@mantine/core';
import { useChartOverlay } from './useChartOverlay';

type SliderResponseProps = {
  chartWidth: number;
  chartHeight: number;
  chartPadding: { left: number; right: number; top: number; bottom: number; };
  minValue: number;
  maxValue: number;
  onChange: (value: number, pixelY: number, committed?: boolean) => void;
  initialValue?: number;
  stepSize?: number;
  numberOfSteps?: number; // Alternative to stepSize
  disabled?: boolean;
} & Omit<SliderProps, 'value' | 'onChange' | 'min' | 'max' | 'step'>;

export default function SliderResponse({
  chartWidth,
  chartHeight,
  chartPadding,
  onChange,
  initialValue,
  minValue,
  maxValue,
  stepSize,
  numberOfSteps,
  disabled = false,
  ...sliderProps // captures all remaining slider props
}: SliderResponseProps) {
  // Calculate step size from numberOfSteps if provided, otherwise use stepSize or default
  const calculatedStep = numberOfSteps
    ? (maxValue - minValue) / numberOfSteps
    : stepSize ?? 0.1;

  const [value, setValue] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Use shared chart overlay hook for scale and positioning
  const { valueToY, overlayProps } = useChartOverlay({
    chartWidth,
    chartHeight,
    chartPadding,
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
    onChange(next, valueToY(next) - chartPadding.top, false);
  };

  const handleSliderChangeEnd = (next: number) => {
    setValue(next);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onChange(next, valueToY(next) - chartPadding.top, true);
  };

  return (
    <>
      { hasInteracted && (
        <svg {...overlayProps} data-source="overlay-svg">
          <line
            x1={chartPadding.left}
            y1={yPosition}
            x2={chartWidth + chartPadding.right}
            y2={yPosition}
            stroke="#FF0000"
            strokeWidth={2}
            strokeDasharray="4"
          />
        </svg>
      )}
      <Text style={{
        marginTop: 50,
        marginLeft: 20,
      }}
      >
        Click on the slider below to initialize:
      </Text>
      <Slider
        value={value}
        onChange={handleSliderChange}
        onChangeEnd={handleSliderChangeEnd}
        min={minValue}
        max={maxValue}
        step={calculatedStep}
        disabled={disabled}
        {...sliderProps}
        label={(val) => val.toFixed(2)}
        thumbSize={22}
        styles={{
          root: {
            width: '100%',
            marginTop: 0,
            maxWidth: chartWidth + 20,
            marginLeft: 20,
          },
          track: { width: '100%', backgroundColor: '#e9ecef' },
          bar: { backgroundColor: '#e9ecef' },
          thumb: { display: hasInteracted ? 'block' : 'none' },
        }}
        data-source="click-then-init-slider"
      />
    </>
  );
}
