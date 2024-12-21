import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';

const chartSettings = {
  marginBottom: 40,
  marginLeft: 40,
  marginTop: 15,
  marginRight: 15,
  height: 450, // in terms of asepct ratio, we could have 1:1, 4:3, 16:9
  width: 600,
};

interface Point {
  x: number,
  y: number
}

function Test({ parameters, setAnswer }: StimulusParams<any>) {
  const svgRef = useRef<SVGSVGElement>(null);
  // extract the parameters
  const { data, showPDF } = parameters;
  const [points, setPoints] = useState<Point[]>([]);

  // Store scales in a ref so we can access them in click handler
  const scalesRef = useRef<{
    xScale: d3.ScaleLinear<number, number> | null;
    yScale: d3.ScaleLinear<number, number> | null;
  }>({
    xScale: null,
    yScale: null
  });

  // Generate distribution data using parameters
  const distributionData = useMemo(() => {
    return generateDistributionData(data);
  }, [data]);

  const drawChart = useCallback(() => {
    if (!distributionData || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = chartSettings.width - chartSettings.marginLeft - chartSettings.marginRight;
    const height = chartSettings.height - chartSettings.marginTop - chartSettings.marginBottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + chartSettings.marginLeft + chartSettings.marginRight)
      .attr('height', height + chartSettings.marginTop + chartSettings.marginBottom)
      .append('g')
      .attr('transform', `translate(${chartSettings.marginLeft},${chartSettings.marginTop})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([distributionData.x_vals[0], distributionData.x_vals[distributionData.x_vals.length - 1]])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Store scales for click handler
    scalesRef.current = { xScale, yScale };

    const yValues = showPDF ? distributionData.pdf_vals : distributionData.cdf_vals;

    // Create array of [x,y] points
    const points = distributionData.x_vals.map((x, i) => ({
      x: x,
      y: yValues[i]
    }));

    // Create line generator using actual x values
    const line = d3.line<{ x: number, y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))

     // Add the line path with points array
    svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add the clicked points
    points.forEach(point => {
      svg.append('circle')
        .attr('cx', xScale(point.x))
        .attr('cy', yScale(point.y))
        .attr('r', 4)
        .attr('fill', 'red')
    })

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('X Values');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      // .text(showPDF ? 'PDF Values' : 'CDF Values');
      .text("Probability");

  }, [distributionData, showPDF, points]);

  // find closetst point on the line to the clicked position
  const findClosestPoint = useCallback((clickX:number, clickY:number) => {
    if (!distributionData || !scalesRef.current.xScale || !scalesRef.current.yScale ) return null;

    const { xScale, yScale } = scalesRef.current;
    const yValues = showPDF ? distributionData.pdf_vals : distributionData.cdf_vals;

    // convert click coordinates to data space
    const dataX = xScale.invert(clickX);
    const dataY = yScale.invert(clickY);

    // Find closest x value in the data
    const index = d3.bisector(d => d).left(distributionData.x_vals, dataX);
    const x0 = distributionData.x_vals[index - 1];
    const x1 = distributionData.x_vals[index];

    if (!x0 || !x1) return null;

    const closest = Math.abs(dataX - x0) < Math.abs(dataX - x1) ? index - 1: index;

    return {
      x: distributionData.x_vals[closest],
      y: yValues[closest]
    };
  }, [distributionData, showPDF]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !distributionData) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    // Get click position relative to the chart area
    const clickX = e.clientX - rect.left - chartSettings.marginLeft;
    const clickY = e.clientY - rect.top - chartSettings.marginTop;

    const closestPoint = findClosestPoint(clickX, clickY);
    if (closestPoint) {
      // Check if click is close enough to the line (in pixel space)
      const { xScale, yScale } = scalesRef.current;
      const lineY = scalesRef.current.yScale!(closestPoint.y);
      const distance = Math.abs(clickY - lineY);

      if (distance <= 5) {
        setPoints(prevPoints => [...prevPoints, closestPoint]);
      }
    }
  }, [distributionData, findClosestPoint]);

  // Effect to draw chart
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="p-4">
      <div className="mt-4">
        <svg ref={svgRef} onClick={handleClick} className="bg-white rounded-lg shadow-lg"></svg>
      </div>
      <button
        onClick={() => setPoints([])}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Clear Points
        </button>
    </div>
  );
}

export default Test;