import { useState } from 'react';
import { Slider } from '@mantine/core';

interface TwoDSliderProps {
  value: number | undefined,
  min: number | undefined,
  max: number | undefined,
  onChange: (value:number) => void,
  onChangeEnd: (value:number) => void,
}

export default function TwoDSlider({
  value,
  min,
  max,
  onChange,
  onChangeEnd,
}: TwoDSliderProps) {
  const [thumbVisible, setThumbVisible] = useState(false);

  const handleChangeEnd = (newValue: number) => {
    setThumbVisible(true);
    onChangeEnd(newValue);
  };

  return (
    <Slider
      value={thumbVisible ? value : 0}
      onChange={onChange}
      onChangeEnd={handleChangeEnd}
      min={min}
      max={max}
      step={0.01}
      label={(val) => val.toFixed(2)}
      styles={{
        root: { width: '100%' },
        track: { width: '100%', backgroundColor: '#e9ecef' },
        bar: { backgroundColor: '#e9ecef' },
        thumb: { display: thumbVisible ? 'block' : 'none' },
      }}
      data-source="2Dsliders"
    />

  );
}
