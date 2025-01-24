import React, { useState, useRef, useEffect } from 'react';
import { Stack, List, Text, Center, Container } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import { useStoreSelector } from '../../../store/store';

interface CalibrationItem {
  id: string, 
  value: number;
}

const ViewingDistanceCalibration: React.FC<StimulusParams<any>> = ({ parameters, setAnswer }) => {
    const ballRef = useRef<HTMLDivElement>(null);
    const squareRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const { taskid1, taskid2, blindspotAngle } = parameters;

    const ans = useStoreSelector((state) => state.answers);
    const pixelsPerMM = Number(ans.calibration_3.answer?.pixelsPerMM); 
    
    // States
    const [ballPositions, setBallPositions] = useState<number[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [viewingDistance, setViewingDistance] = useState<number | null>(null);
    const [clickCount, setClickCount] = useState<number>(5);
  
    // Utility functions
    const degToRadians = (degrees: number) => {
      return (degrees * Math.PI) / 180;
    };
  
    // Calculate viewing distance function
    const calculateViewingDistance = (positions: number[]) => {
      if (!positions.length || !pixelsPerMM || !squareRef.current) return;
  
      const avgBallPos = positions.reduce((a, b) => a + b, 0) / positions.length;
      const squareRect = squareRef.current.getBoundingClientRect();
      const squarePos = squareRect.left;
      const ballSquareDistance = Math.abs(avgBallPos - squarePos) / pixelsPerMM;
      const viewDistance = ballSquareDistance / Math.tan(degToRadians(blindspotAngle));
  
      setViewingDistance(viewDistance);
      setIsTracking(false);
    };
  
    // Reset ball to starting position
    const resetBall = () => {
      console.log("resetBall() called");
      if (ballRef.current) {
        ballRef.current.style.left = '740px';
      }
    };
  
    // Animation control functions
    const startBlindspotTracking = () => {
      if (!ballRef.current || !squareRef.current || !pixelsPerMM || ballPositions.length >= 5) return;
      setIsTracking(true);
  
      const animateBall = () => {
        if (!ballRef.current) return;
  
        const currentLeft = parseInt(ballRef.current.style.left || '740');
        const newLeft = currentLeft - 2; // Move left by decreasing left value
        ballRef.current.style.left = `${newLeft}px`;
  
        animationFrameRef.current = requestAnimationFrame(animateBall);
      };
  
      animationFrameRef.current = requestAnimationFrame(animateBall);
    };
  
    const stopTracking = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsTracking(false);
    };

    useEffect(() => {
      if (viewingDistance !== null && ballPositions.length === 5) {
        setAnswer({
          status: true,
          answers: {
            "dist-calibration-MM": viewingDistance, 
            "dist-calibration-CM": viewingDistance / 10,
            "ball-positions": JSON.stringify(ballPositions)
          }
        });
      }
    }, [viewingDistance, ballPositions, setAnswer]);
    
    useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          event.preventDefault();
    
          if (!isTracking) {
            startBlindspotTracking();
          } else {
            if (ballRef.current) {
              stopTracking();
              const ballRect = ballRef.current.getBoundingClientRect();
              const newPosition = ballRect.left;
              
              setBallPositions(prev => {
                const newPositions = [...prev, newPosition];
                if (newPositions.length >= 5) {
                  calculateViewingDistance(newPositions);
                }
                return newPositions;
              });
              
              setClickCount(prev => prev - 1);
              resetBall();
            }
          }
        }
      };
    
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isTracking]);

    // Reset state when pixelsPerMM changes
    useEffect(() => {
      // console.log("Full store state: ", storeState); 
      setViewingDistance(null);
      setIsTracking(false);
      setBallPositions([]);
      setClickCount(5);
      resetBall();
  
      return () => {
        setViewingDistance(null);
        setIsTracking(false);
        setBallPositions([]);
        setClickCount(5);
      };
    }, []);
  
    // Cleanup animation frame on unmount
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);
  
    if (!pixelsPerMM) {
      return <div>Please complete card calibration first.</div>;
    }
  
    return (
      <Container size="md">
        <Stack gap="md">
          <Text>Now we will quickly measure how far away you are sitting. </Text>
          <Stack gap="xs">
            <List>
              <List.Item>Put your left hand on the <b>space bar</b>.</List.Item>
              <List.Item>Cover your right eye with your right hand.</List.Item>
              <List.Item>Using your left eye, focus on the black square. Keep your focus on the black square.</List.Item>
              <List.Item>The <span style={{color: "red", fontWeight: "bold"}}>red ball</span> will disappear as it moves from right to left. 
              Press the space bar as soon as the ball disappears.</List.Item>
            </List>
            <Text ta="center">
              {ballPositions.length >= 5
                ? "All measurements completed!"
                : "Press the space bar when you are ready to begin."
              }
            </Text>
        </Stack>

        <div
          style={{
            position: 'relative',
            width: '900px',
            height: '100px',
            backgroundColor: '#ffffff',
          }}
        >
        <div
          ref={ballRef}
          style={{
            position: 'absolute',
            width: '30px',
            height: '30px',
            backgroundColor: 'rgb(255, 0, 0)',
            borderRadius: '30px',
            left: '740px',
          }}
        />
        <div
          ref={squareRef}
          style={{
            position: 'absolute',
            width: '30px',
            height: '30px',
            backgroundColor: 'rgb(0, 0, 0)',
            left: '870px',
          }}
        />
      </div>
      <Text ta="center">
        Remaining measurements: {5 - ballPositions.length}
      </Text>

      {viewingDistance && (
        <Stack gap="xs">
          <Text fw={700} size="lg">Viewing Distance Results</Text>
          <Text>Estimated Viewing Distance: {(viewingDistance / 10).toFixed(1)} cm</Text>
          <Text>Number of measurements: {ballPositions.length}</Text>
        </Stack>
      )}
      </Stack>
      </Container>
    );
  };

export default ViewingDistanceCalibration;