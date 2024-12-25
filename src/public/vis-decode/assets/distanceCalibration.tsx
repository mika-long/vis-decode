import React, { useState, useRef, useEffect } from 'react';
import { StimulusParams } from '../../../store/types';
import { square } from 'mathjs';

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
    const { taskid } = parameters;

    const [ballPositions, setBallPositions] = useState<number[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [viewingDistance, setViewingDistance] = useState<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Degrees to Radians conversion
    const degToRadians = (degrees: number) => {
        return (degrees * Math.PI) / 180;
    };

    // Calculate viewing distance function
    const calculateViewingDistance = (positions: number[]) => {
        if (!positions.length || !pixelsPerMM || !squareRef.current) return;

        // Cancel any ongoing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

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

        // set answer
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

    // Blindspot Measurement
    const startBlindspotTracking = () => {
        if (!ballRef.current || !squareRef.current || !pixelsPerMM) return;

        setIsTracking(true);
        setBallPositions([]);

        const animateBall = () => {
            if (!ballRef.current || !squareRef.current) return;

            // Move ball left
            const currentLeft = parseInt(ballRef.current.style.left || '0');
            const newLeft = currentLeft - 2;
            ballRef.current.style.left = `${newLeft}px`;

            const ballRect = ballRef.current.getBoundingClientRect();
            const squareRect = squareRef.current.getBoundingClientRect();

            // if ball disappears behind square, record position
            if (ballRect.right <= squareRect.left) {
                setBallPositions(prev => {
                    const newPositions = [...prev, ballRect.left];
                    // stop tracking after a few measurements
                    if (newPositions.length >= 5) {
                        calculateViewingDistance(newPositions);
                        return newPositions;
                    }
                    return newPositions;
                });
            } else {
                animationFrameRef.current = requestAnimationFrame(animateBall);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animateBall);
    };

    // Reset state when pixelsPerMM changes
    useEffect(() => {
        setViewingDistance(null);
        setIsTracking(false);
        setBallPositions([]);
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
            <button
                onClick={startBlindspotTracking}
                disabled={isTracking || !pixelsPerMM}
            >
                Start Blindspot Tracking
            </button>

            {viewingDistance && (
                <div className="results">
                    <h3>Viewing Distance Results</h3>
                    <p>Estimated Viewing Distance: {(viewingDistance / 10).toFixed(1)} cm</p>
                </div>
            )}
        </div>
    );
};

export default ViewingDistanceCalibration;