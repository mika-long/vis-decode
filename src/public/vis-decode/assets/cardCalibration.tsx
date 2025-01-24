import React, { useState, useRef, useEffect } from 'react';
import { Slider, Button, Container, Stack, Text, Center } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
// import cardImage from './card.png'; 
import cardImage from './costco_card.png';
// import { id } from 'vega';

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
  const [sliderRange, setSliderRange] = useState({ min: 100, max: 500 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { taskid } = parameters; 

  // Aspect ratio of the item
  const aspectRatio = itemHeightMM / itemWidthMM;

  useEffect(() => {
    const updateSliderRange = () => {
      const screenWidth = window.innerWidth;
      setSliderRange({
        min: Math.round(screenWidth * 0.1), // 10% of screen width
        max: Math.round(screenWidth * 0.8), // 80% of screen width
      });
    };

    updateSliderRange();
    window.addEventListener('resize', updateSliderRange);
    return () => window.removeEventListener('resize', updateSliderRange);
  }, []);

  // Calculate height based on width and aspect ratio
  const calculateHeight = (width: number) => {
    return Math.round(width * aspectRatio);
  };

  // Pixel to MM Conversion
  const convertPixelsToMM = (widthPx: number) => {
    return widthPx / itemWidthMM;
  };
  
  // Handle a change in the slider 
  const handleSliderChange = (value: number) => {
    setItemWidthPx(value);
  };

  const handleCalibrationComplete = () => {
    if (!containerRef.current) return;

    const pxPerMM = convertPixelsToMM(itemWidthPx);
    setPixelsPerMM(pxPerMM);

    // Prepare answer for the study framework
    setAnswer({
      status: true,
      answers: {
        [taskid]: pxPerMM, 
      }
    });

    setIsCalibrationComplete(true);
  };

  return (
    // Container component from Mantine that centers content and provides max-width
    <Container size="md">
      <Stack gap="lg">
        <Text size="md" > Drag the slider until the image is the same size as a credit card held up to the screen.</Text>
        <Text size="md" > You can use any card this is the same size as a credit card, like a membership card or driver's license.</Text>
        <Text size="md" > If you do not have access to a real card, you can use a ruler to measure the image width to 3.37 inches or 85.6mm. </Text>
        <Text size="md" > Once you are finished, click 'Confirm Size' and then 'Next'. </Text>
      <Button
          onClick={handleCalibrationComplete}
          size='lg'
          variant='transparent'
        >
          Confirm Size
        </Button>
        <Slider
          min={sliderRange.min}
          max={sliderRange.max}
          value={itemWidthPx}
          label={null}
          onChange={handleSliderChange}
          styles={{
            root: { width: '100%' },         // Makes slider full width
            track: { cursor: 'pointer' },     // Changes cursor on track
            thumb: { cursor: 'grab' },        // Changes cursor on thumb
            bar: { cursor: 'pointer' }        // Changes cursor on filled bar
          }}
        />
        <div 
          ref={containerRef}
          style={{ 
            width: `${itemWidthPx}px`,
            height: `${calculateHeight(itemWidthPx)}px`,
            margin: '20px auto',              // Centers the container
            overflow: 'hidden'                // Prevents image overflow
          }}
        >
          <img 
            src={cardImage} 
            alt="Credit Card"
            style={{ 
              width: '100%',                  // Makes image fill container
              height: '100%',
              objectFit: 'contain'            // Maintains aspect ratio
            }}
          />
        </div>

        {isCalibrationComplete && (
          <div style={{ textAlign: 'center', color: 'green' }}>
            Calibration Complete - Pixels per MM: {pixelsPerMM?.toFixed(2)}
          </div>
        )}
      </Stack>
    </Container>
  );

  // return (
  //   <div className="virtual-chinrest-calibration">
  //     {/* <p>Adjust the slider to match the size of the credit card</p> */}

  //     <div className="slider-container" style={{ 
  //       width: '400px', 
  //       margin: '0 auto',
  //       display: 'flex',
  //       alignItems: 'center',
  //       gap: '10px'
  //     }}>
  //       {/* <label htmlFor="item-width-slider">Card Width:</label> */}
  //       <input 
  //         type="range" 
  //         id="item-width-slider"
  //         min="100"
  //         max="500"
  //         value={itemWidthPx}
  //         onChange={handleSliderChange}
  //         style={{ flex: 1 }}
  //       />
  //       {/* <span>{itemWidthPx} px</span> */} 
  //       {/* the above code shows what the curent pixel value is */}
  //     </div>

  //     <div 
  //       ref={containerRef}
  //       style={{ 
  //         width: `${itemWidthPx}px`, 
  //         height: `${calculateHeight(itemWidthPx)}px`, 
  //         margin: '20px auto',
  //         overflow: 'hidden'
  //       }}
  //     >
  //       <img 
  //         src={cardImage} 
  //         alt="Credit Card" 
  //         style={{ 
  //           width: '100%', 
  //           height: '100%', 
  //           objectFit: 'contain' 
  //         }}
  //       />
  //     </div>

  //     <button 
  //       onClick={handleCalibrationComplete}
  //       style={{
  //         display: 'block',
  //         margin: '10px auto',
  //         padding: '10px 20px'
  //       }}
  //     >
  //       Click here when image is the correct size 
  //     </button>
  
  //     {isCalibrationComplete && (
  //       <div style={{ textAlign: 'center', color: 'green' }}>
  //         Calibration Complete - Pixels per MM: {pixelsPerMM?.toFixed(2)}
  //       </div>
  //     )}
  //   </div>
  // );
};

export default VirtualChinrestCalibration;