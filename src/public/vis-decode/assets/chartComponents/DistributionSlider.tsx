import { Slider } from '@mantine/core';
import { DistributionData } from '../distributionCalculations';

interface DistributionSliderProps {
  value: number;
  onChange: (value:number) => void;
  distributionData: DistributionData;
  width?: string | number;
  showGuideLine?: boolean;
  axis?: 'x' | 'y';
}

export default function DistributionSlider({
  value,
  onChange,
  distributionData,
  width = '100%',
  showGuideLine,
  axis
}: DistributionSliderProps) {
  if (!distributionData!.xVals!.length) return null;

  return (
    <div style={{ width }}>
      <Slider
        value={value}
        onChange={onChange}
        min={distributionData?.xVals[0]}
        max={distributionData?.xVals[distributionData.xVals.length - 1]}
        step={0.1}
        label={(val) => val.toFixed(2)}
        data-source="slider-check"
      />
    </div>
  );
}

// {/* optional slider */}
// {training && hasSlider && (
//   <div style={{ width: chartSettings.width, marginBottom: '2em' }}>
//     <Slider
//       value={sliderValue}
//       onChange={handleSliderChange}
//       min={distributionData?.xVals[0]}
//       max={distributionData?.xVals[distributionData.xVals.length - 1]}
//       step={0.1}
//       label={(value) => value.toFixed(2)}
//       className="mb-4"
//       styles={{
//         root: { width: '100%' },
//         track: { width: '100%' },
//       }}
//     />
//   </div>
// )}
