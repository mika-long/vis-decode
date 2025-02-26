import { useState } from 'react';
import { Slider } from '@mantine/core';
import { DistributionData } from '../dataGeneration/jstatDistributionCalculations';

interface DistributionSliderProps {
  value: number;
  onChange: (value:number) => void;
  onChangeEnd: (value:number) => void;
  distributionData: DistributionData;
  width?: string | number;
}

export default function DistributionSlider({
  value,
  onChange,
  onChangeEnd,
  distributionData,
  width = '100%',
}: DistributionSliderProps) {
  if (!distributionData?.xVals?.length) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [thumbVisible, setThumbVisible] = useState(false);

  const handleChangeEnd = (newValue: number) => {
    setThumbVisible(true);
    onChangeEnd(newValue);
  };

  return (
    <div style={{ width }}>
      <Slider
        value={thumbVisible ? value : -5}
        onChange={onChange}
        onChangeEnd={handleChangeEnd}
        min={distributionData.xVals[0]}
        max={distributionData.xVals[distributionData.xVals.length - 1]}
        step={0.01}
        label={(val) => val.toFixed(2)}
        styles={{
          root: { width: '100%' },
          track: { width: '100%', backgroundColor: '#e9ecef' },
          bar: { backgroundColor: '#e9ecef' },
          thumb: { display: thumbVisible ? 'block' : 'none' },
        }}
        data-source="slider-check"
      />
    </div>
  );
}
