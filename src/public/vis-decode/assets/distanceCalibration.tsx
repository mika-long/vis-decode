import React, { useState, useRef, useEffect } from 'react';
import { StimulusParams } from '../../../store/types';

interface ViewingDistanceCalibrationProps extends StimulusParams<any> {
    pixelsPerMM?: number;
    blindspotAngle?: number;
}

const ViewingDistanceCalibration: React.FC<ViewingDistanceCalibrationProps> = ({
    parameters,
    setAnswer,
    pixelsPerMM,
    blindspotAngle = 13.5
}) => {
    const ballRef = useRef<HTMLDivElement>(null);
    const squareRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const { taskid } = parameters;

    // States
    const [ballPositions, setBallPositions] = useState<number[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [viewingDistance, setViewingDistance] = useState<number | null>(null);
    const [clickCount, setClickCount] = useState<number>(5); // Track remaining measurements

    // Utility functions
    const degToRadians = (degrees: number) => {
        return (degrees * Math.PI) / 180;
    };

    // Calculate viewing distance function
    const calculateViewingDistance = (positions: number[]) => {
        if (!positions.length || !pixelsPerMM || !squareRef.current) return;

        // Calculate average ball disappearance position
        const avgBallPos = positions.reduce((a, b) => a + b, 0) / positions.length;

        // Get square position
        const squareRect = squareRef.current.getBoundingClientRect();
        const squarePos = squareRect.left;

        // Calculate distance between ball and square in mm
        const ballSquareDistance = Math.abs(avgBallPos - squarePos) / pixelsPerMM;

        // Calculate viewing distance using trigonometry
        const viewDistance = ballSquareDistance / Math.tan(degToRadians(blindspotAngle));

        setViewingDistance(viewDistance);
        setIsTracking(false);

        // Set answer
        setAnswer({
            status: true,
            answers: {
                [taskid]: {
                    distanceMM: viewDistance,
                    distanceCM: viewDistance / 10,
                    ballPositions: positions
                }
            }
        });
    };

    // Animation control functions
    const startBlindspotTracking = () => {
        if (!ballRef.current || !squareRef.current || !pixelsPerMM) return;

        setIsTracking(true);
        setClickCount(5); // Reset click counter

        const animateBall = () => {
            if (!ballRef.current) return;

            // Move ball left and reset when it goes too far
            const currentLeft = parseInt(ballRef.current.style.left || '0');
            const newLeft = currentLeft - 2;
            
            if (newLeft < -30) {  // Reset position when ball goes off screen
                ballRef.current.style.left = '300px';
            } else {
                ballRef.current.style.left = `${newLeft}px`;
            }

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

    // Handle spacebar press
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                
                if (!isTracking) {
                    startBlindspotTracking();
                } else {
                    // Record position
                    if (ballRef.current) {
                        const ballRect = ballRef.current.getBoundingClientRect();
                        setBallPositions(prev => {
                            const newPositions = [...prev, ballRect.left];
                            setClickCount(prevCount => {
                                const newCount = prevCount - 1;
                                if (newCount <= 0) {
                                    stopTracking();
                                    calculateViewingDistance(newPositions);
                                }
                                return newCount;
                            });
                            return newPositions;
                        });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isTracking]);

    // Reset state when pixelsPerMM changes
    useEffect(() => {
        setViewingDistance(null);
        setIsTracking(false);
        setBallPositions([]);
        setClickCount(5);
        
        return () => {
            setViewingDistance(null);
            setIsTracking(false);
            setBallPositions([]);
            setClickCount(5);
        };
    }, [pixelsPerMM]);

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
        <div className="viewing-distance-calibration">
            <div
                style={{
                    position: 'relative',
                    width: '400px',
                    height: '100px',
                    margin: '20px auto',
                    border: '1px solid gray'
                }}
            >
                <div
                    ref={ballRef}
                    style={{
                        position: 'absolute',
                        width: '30px',
                        height: '30px',
                        backgroundColor: 'red',
                        borderRadius: '50%',
                        top: '35px',
                        left: '300px'
                    }}
                />
                <div
                    ref={squareRef}
                    style={{
                        position: 'absolute',
                        width: '30px',
                        height: '30px',
                        backgroundColor: 'black',
                        top: '35px',
                        right: 0
                    }}
                />
            </div>

            <div className="instructions" style={{ marginBottom: '20px' }}>
                <p>Press spacebar to start the animation.</p>
                <p>Press spacebar again when the red ball disappears.</p>
                <p>Remaining measurements: {clickCount}</p>
            </div>

            {viewingDistance && (
                <div className="results">
                    <h3>Viewing Distance Results</h3>
                    <p>Estimated Viewing Distance: {(viewingDistance / 10).toFixed(1)} cm</p>
                    <p>Number of measurements: {ballPositions.length}</p>
                </div>
            )}
        </div>
    );
};

export default ViewingDistanceCalibration;