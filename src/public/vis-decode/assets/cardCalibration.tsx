import React, { useState, useRef } from 'react';
import { StimulusParams } from '../../../store/types';
import cardImage from './card.png'; 

interface VirtualChinrestCalibrationProps extends StimulusParams<any> {
  itemWidthMM?: number;
  itemHeightMM?: number;
}

const VirtualChinrestCalibration: React.FC<VirtualChinrestCalibrationProps> = ({
  parameters, 
  setAnswer,
  itemWidthMM = 85.6,  // Standard credit card width
  itemHeightMM = 53.98 // Standard credit card height
}) => {
  const [itemWidthPx, setItemWidthPx] = useState(300);
  const [pixelsPerMM, setPixelsPerMM] = useState<number | null>(null);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { taskid } = parameters; 

  // Aspect ratio of the item
  const aspectRatio = itemHeightMM / itemWidthMM;

  // Calculate height based on width and aspect ratio
  const calculateHeight = (width: number) => {
    return Math.round(width * aspectRatio);
  };

  // Pixel to MM Conversion
  const convertPixelsToMM = (widthPx: number) => {
    return widthPx / itemWidthMM;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidthPx = parseInt(e.target.value);
    setItemWidthPx(newWidthPx);
  };

  const handleCalibrationComplete = () => {
    if (!containerRef.current) return;

    const pxPerMM = convertPixelsToMM(itemWidthPx);
    setPixelsPerMM(pxPerMM);

    // Prepare answer for the study framework
    setAnswer({
      status: true,
      answers: {
        [taskid]: {
          widthPx: itemWidthPx,
          heightPx: calculateHeight(itemWidthPx),
          widthMM: itemWidthMM,
          heightMM: itemHeightMM,
          pixelsPerMM: pxPerMM
        }
      }
    });

    setIsCalibrationComplete(true);
  };

  return (
    <div className="virtual-chinrest-calibration">
      {/* <p>Adjust the slider to match the size of the credit card</p> */}

      <div className="slider-container" style={{ 
        width: '400px', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* <label htmlFor="item-width-slider">Card Width:</label> */}
        <input 
          type="range" 
          id="item-width-slider"
          min="100"
          max="500"
          value={itemWidthPx}
          onChange={handleSliderChange}
          style={{ flex: 1 }}
        />
        {/* <span>{itemWidthPx} px</span> */} 
        {/* the above code shows what the curent pixel value is */}
      </div>

      <div 
        ref={containerRef}
        style={{ 
          width: `${itemWidthPx}px`, 
          height: `${calculateHeight(itemWidthPx)}px`, 
          margin: '20px auto',
          overflow: 'hidden'
        }}
      >
        <img 
          src={cardImage} 
          alt="Credit Card" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain' 
          }}
        />
      </div>

      <button 
        onClick={handleCalibrationComplete}
        style={{
          display: 'block',
          margin: '10px auto',
          padding: '10px 20px'
        }}
      >
        Click here when image is the correct size 
      </button>
  
      {isCalibrationComplete && (
        <div style={{ textAlign: 'center', color: 'green' }}>
          Calibration Complete - Pixels per MM: {pixelsPerMM?.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default VirtualChinrestCalibration;