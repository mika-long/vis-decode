import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StimulusParams } from '../../../store/types';

interface BubbleClick {
  cx: number;
  cy: number;
  timestamp: number;
}

interface BubbleViewProps {
  taskid: string;
  taskType: string;
  params: {
    imagePath: string;
    canvasWidth?: number;
    canvasHeight?: number;
    bubbleRadius?: number;
    blurRadius?: number;
    maxClicks?: number;
    showBubbleOutline?: boolean;
  };
}

interface DrawBox {
  dx: number;
  dy: number;
  drawWidth: number;
  drawHeight: number;
}

const DEFAULT_CANVAS_WIDTH = 720;
const DEFAULT_CANVAS_HEIGHT = 480;
const DEFAULT_BUBBLE_RADIUS = 45;
const DEFAULT_BLUR_RADIUS = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveAssetPath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
}

function computeContainBox(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): DrawBox {
  const imageRatio = imageWidth / imageHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  if (imageRatio > canvasRatio) {
    const drawWidth = canvasWidth;
    const drawHeight = drawWidth / imageRatio;
    return {
      dx: 0,
      dy: (canvasHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    };
  }

  const drawHeight = canvasHeight;
  const drawWidth = drawHeight * imageRatio;
  return {
    dx: (canvasWidth - drawWidth) / 2,
    dy: 0,
    drawWidth,
    drawHeight,
  };
}

export default function BubbleView({ parameters, setAnswer }: StimulusParams<BubbleViewProps>) {
  const {
    params: {
      imagePath,
      canvasWidth = DEFAULT_CANVAS_WIDTH,
      canvasHeight = DEFAULT_CANVAS_HEIGHT,
      bubbleRadius = DEFAULT_BUBBLE_RADIUS,
      blurRadius = DEFAULT_BLUR_RADIUS,
      maxClicks,
      showBubbleOutline = false,
    },
  } = parameters;

  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blurredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawBoxRef = useRef<DrawBox | null>(null);
  const clicksRef = useRef<BubbleClick[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  const normalizedImagePath = useMemo(() => resolveAssetPath(imagePath), [imagePath]);

  const resetAnswer = useCallback(() => {
    setAnswer({
      status: false,
      answers: {
        bubbleClickCount: 0,
        bubbleClicksJson: '[]',
        lastClickX: -1,
        lastClickY: -1,
        lastClickTimestamp: -1,
      },
    });
  }, [setAnswer]);

  const redrawBaseLayer = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    const blurredCanvas = blurredCanvasRef.current;
    if (!displayCanvas || !blurredCanvas) {
      return;
    }

    const displayContext = displayCanvas.getContext('2d');
    if (!displayContext) {
      return;
    }

    displayContext.clearRect(0, 0, canvasWidth, canvasHeight);
    displayContext.drawImage(blurredCanvas, 0, 0);
  }, [canvasHeight, canvasWidth]);

  const replayClicks = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    const drawBox = drawBoxRef.current;

    if (!displayCanvas || !sourceCanvas || !drawBox) {
      return;
    }

    const displayContext = displayCanvas.getContext('2d');
    if (!displayContext) {
      return;
    }

    redrawBaseLayer();

    clicksRef.current.forEach(({ cx, cy }) => {
      displayContext.save();
      displayContext.beginPath();
      displayContext.arc(cx, cy, bubbleRadius, 0, Math.PI * 2);
      displayContext.clip();
      displayContext.drawImage(sourceCanvas, 0, 0);
      displayContext.restore();

      if (showBubbleOutline) {
        displayContext.save();
        displayContext.strokeStyle = 'rgba(255,255,255,0.9)';
        displayContext.lineWidth = 1.5;
        displayContext.beginPath();
        displayContext.arc(cx, cy, bubbleRadius, 0, Math.PI * 2);
        displayContext.stroke();
        displayContext.restore();
      }
    });

    if (drawBox.drawWidth < canvasWidth || drawBox.drawHeight < canvasHeight) {
      displayContext.save();
      displayContext.strokeStyle = 'rgba(0,0,0,0.15)';
      displayContext.lineWidth = 1;
      displayContext.strokeRect(drawBox.dx, drawBox.dy, drawBox.drawWidth, drawBox.drawHeight);
      displayContext.restore();
    }
  }, [bubbleRadius, canvasHeight, canvasWidth, redrawBaseLayer, showBubbleOutline]);

  useEffect(() => {
    resetAnswer();
    clicksRef.current = [];
    startTimeRef.current = Date.now();
    setClickCount(0);
    setLoadError(null);
    setIsReady(false);

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = canvasWidth;
    sourceCanvas.height = canvasHeight;
    sourceCanvasRef.current = sourceCanvas;

    const blurredCanvas = document.createElement('canvas');
    blurredCanvas.width = canvasWidth;
    blurredCanvas.height = canvasHeight;
    blurredCanvasRef.current = blurredCanvas;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const sourceContext = sourceCanvas.getContext('2d');
      const blurredContext = blurredCanvas.getContext('2d');

      if (!sourceContext || !blurredContext) {
        setLoadError('Unable to initialize canvas context.');
        return;
      }

      const drawBox = computeContainBox(img.width, img.height, canvasWidth, canvasHeight);
      drawBoxRef.current = drawBox;

      sourceContext.clearRect(0, 0, canvasWidth, canvasHeight);
      sourceContext.fillStyle = '#ffffff';
      sourceContext.fillRect(0, 0, canvasWidth, canvasHeight);
      sourceContext.drawImage(img, drawBox.dx, drawBox.dy, drawBox.drawWidth, drawBox.drawHeight);

      blurredContext.clearRect(0, 0, canvasWidth, canvasHeight);
      blurredContext.filter = `blur(${blurRadius}px)`;
      blurredContext.drawImage(sourceCanvas, 0, 0);
      blurredContext.filter = 'none';

      setIsReady(true);
    };

    img.onerror = () => {
      setLoadError(`Could not load image: ${normalizedImagePath}`);
    };

    img.src = normalizedImagePath;

    return () => {
      sourceCanvasRef.current = null;
      blurredCanvasRef.current = null;
      drawBoxRef.current = null;
    };
  }, [
    blurRadius,
    canvasHeight,
    canvasWidth,
    normalizedImagePath,
    resetAnswer,
  ]);

  useEffect(() => {
    if (isReady) {
      replayClicks();
    }
  }, [isReady, replayClicks]);

  const handleCanvasClick = useCallback((event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!isReady) {
      return;
    }

    if (typeof maxClicks === 'number' && clicksRef.current.length >= maxClicks) {
      return;
    }

    const canvas = displayCanvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const rawX = (event.clientX - rect.left) * scaleX;
    const rawY = (event.clientY - rect.top) * scaleY;

    const cx = clamp(rawX, 0, canvasWidth);
    const cy = clamp(rawY, 0, canvasHeight);
    const timestamp = Date.now() - startTimeRef.current;

    clicksRef.current = [...clicksRef.current, { cx, cy, timestamp }];
    setClickCount(clicksRef.current.length);

    setAnswer({
      status: true,
      answers: {
        bubbleClickCount: clicksRef.current.length,
        bubbleClicksJson: JSON.stringify(clicksRef.current),
        lastClickX: Number(cx.toFixed(2)),
        lastClickY: Number(cy.toFixed(2)),
        lastClickTimestamp: timestamp,
      },
    });

    replayClicks();
  }, [canvasHeight, canvasWidth, isReady, maxClicks, replayClicks, setAnswer]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      <canvas
        ref={displayCanvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          maxWidth: `${canvasWidth}px`,
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          border: '1px solid rgba(0,0,0,0.2)',
          cursor: isReady ? 'crosshair' : 'not-allowed',
          background: '#ffffff',
        }}
      />

      <div style={{ fontSize: '0.9rem', color: '#444' }}>
        {loadError || `${clickCount} ${clickCount === 1 ? 'bubble' : 'bubbles'} added${typeof maxClicks === 'number' ? ` / ${maxClicks}` : ''}.`}
      </div>
    </div>
  );
}
