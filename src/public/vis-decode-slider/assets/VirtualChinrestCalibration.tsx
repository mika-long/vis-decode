/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef, useEffect } from 'react';
import {
  Slider, Button, Container, Stack, Text, Alert,
} from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import cardImage from './costco_card.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface VirtualChinrestCalibrationProps extends StimulusParams<any> {
  itemWidthMM?: number;
  itemHeightMM?: number;
}

export default function VirtualChinrestCalibration({
  parameters,
  setAnswer,
  itemWidthMM = 85, // Standard credit card width (85.6)
  itemHeightMM = 54, // Standard credit card height (53.98)
}: VirtualChinrestCalibrationProps) {
  // Set states
  const [itemWidthPx, setItemWidthPx] = useState(300);
  const [initialWidthPx] = useState(300); // Store the initial width to check if it changed
  const [pixelsPerMM, setPixelsPerMM] = useState<number | null>(null);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  const [sliderRange, setSliderRange] = useState({ min: 100, max: 500 });
  const [sliderAdjusted, setSliderAdjusted] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const { taskid } = parameters;
  // Set references
  const containerRef = useRef<HTMLDivElement>(null);

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
  const calculateHeight = (width: number) => Math.round(width * aspectRatio);

  // Pixel to MM Conversion
  const convertPixelsToMM = (widthPx: number) => widthPx / itemWidthMM;

  // Handle a change in the slider
  const handleSliderChange = (value: number) => {
    setItemWidthPx(value);

    // Check if the slider has been adjusted from its initial position
    if (value !== initialWidthPx) {
      setSliderAdjusted(true);
      setShowValidationError(false);
    }
  };

  const handleCalibrationComplete = () => {
    if (!containerRef.current) return;

    // Validate that the slider has been adjusted
    if (!sliderAdjusted) {
      setShowValidationError(true);
      return;
    }

    const pxPerMM = convertPixelsToMM(itemWidthPx);
    setPixelsPerMM(pxPerMM);

    // Prepare answer for the study framework
    setAnswer({
      status: true,
      answers: {
        [taskid]: pxPerMM,
      },
    });

    setIsCalibrationComplete(true);
  };

  return (
    // Container component from Mantine that centers content and provides max-width
    <Container size="md">
      <Stack gap="lg">
        <Text size="md" fw={700}>Please calibrate the card size accurately</Text>
        <Text size="md"> Drag the slider until the image is the same size as a credit card held up to the screen.</Text>
        <Text size="md"> You can use any card this is the same size as a credit card, like a membership card or driver's license.</Text>
        <Text size="md"> If you do not have access to a real card, you can use a ruler to measure the image width to 3.37 inches or 85.6mm. </Text>
        <Text size="md"> Once you are finished, click 'Confirm Size' and then 'Next'. </Text>

        {showValidationError && (
          <Alert color="red" title="Adjustment Required">
            Please adjust the slider to match the size of a physical credit card. The initial size is just a starting point.
          </Alert>
        )}

        <Slider
          min={sliderRange.min}
          max={sliderRange.max}
          value={itemWidthPx}
          label={null}
          onChange={handleSliderChange}
          styles={{
            root: { width: '100%' }, // Makes slider full width
            track: { cursor: 'pointer' }, // Changes cursor on track
            thumb: { cursor: 'grab' }, // Changes cursor on thumb
            bar: { cursor: 'pointer' }, // Changes cursor on filled bar
          }}
        />

        <Button
          onClick={handleCalibrationComplete}
          size="lg"
          color={sliderAdjusted ? 'blue' : 'gray'}
        >
          Confirm Size
        </Button>

        <div
          ref={containerRef}
          style={{
            width: `${itemWidthPx}px`,
            height: `${calculateHeight(itemWidthPx)}px`,
            margin: '20px auto', // Centers the container
            overflow: 'hidden', // Prevents image overflow
          }}
        >
          <img
            src={cardImage}
            alt="Credit Card"
            style={{
              width: '100%', // Makes image fill container
              height: '100%',
              objectFit: 'contain', // Maintains aspect ratio
            }}
          />
        </div>
        {isCalibrationComplete && (
          <div style={{ textAlign: 'center', color: 'green' }}>
            Calibration Complete - Pixels per MM:
            {
              pixelsPerMM?.toFixed(2)
            }
          </div>
        )}
      </Stack>
    </Container>
  );
}
