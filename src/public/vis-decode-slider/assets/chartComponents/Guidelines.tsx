import { useScales } from './ScalesContext';

interface TangentLine {
  point: {x: number; y: number};
  slope: number;
}

interface GuideLinesProps {
  xValue?: number | null | undefined;
  yValue?: number | null | undefined;
  tangentLine?: TangentLine | null;
}

export default function GuideLines({
  xValue,
  yValue,
  tangentLine,
}: GuideLinesProps) {
  // Get scales from context
  const {
    xScale, yScale, width, height, margin,
  } = useScales();

  // Vertical line (for x-value)
  const renderVerticalGuideline = () => {
    if (xValue === undefined || xValue === null) return null;
    return (
      <line
        x1={xScale(xValue)}
        x2={xScale(xValue)}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke="#666"
        strokeWidth={1.5}
        strokeDasharray="4"
        data-source="Guidelines-vertical"
      />
    );
  };

  // Horizontal line (for y-value)
  const renderHorizontalGuideline = () => {
    if (yValue === undefined || yValue === null) return null;
    return (
      <line
        x1={margin.left}
        x2={width - margin.right}
        y1={yScale(yValue)}
        y2={yScale(yValue)}
        stroke="#666"
        strokeWidth={1}
        strokeDasharray="4"
        data-source="Guidelines-horizontal"
      />
    );
  };

  // Tangent line (for cdf)
  const renderTangentLine = () => {
    if (!tangentLine) return null;

    // Calculate points for a line segment extending left and right from the point
    // We'll extend the line by a reasonable amount in data space
    const extendBy = (xScale.domain()[1] - xScale.domain()[0]) * 0.2; // Extend by 20% of domain

    const x1 = tangentLine.point.x - extendBy;
    const y1 = tangentLine.point.y - (extendBy * tangentLine.slope);
    const x2 = tangentLine.point.x + extendBy;
    const y2 = tangentLine.point.y + (extendBy * tangentLine.slope);

    return (
      <line
        x1={xScale(x1)}
        y1={yScale(y1)}
        x2={xScale(x2)}
        y2={yScale(y2)}
        stroke="#666"
        strokeWidth={1.5}
        strokeDasharray="4"
        data-source="Guidelines-tangent"
      />
    );
  };

  return (
    <g>
      {renderVerticalGuideline()}
      {renderHorizontalGuideline()}
      {renderTangentLine()}
    </g>
  );
}
