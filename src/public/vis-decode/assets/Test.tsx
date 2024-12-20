import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';

const chartSettings = {
  marginBottom: 40,
  marginLeft: 40,
  marginTop: 15,
  marginRight: 15,
  height: 400,
  width: 600,
};

function Test({ parameters }: StimulusParams<any>) {
  const svgRef = useRef(null);
  const { data, showPDF } = parameters;

  // Generate distribution data
  const distributionData = useMemo(() => {
    return generateDistributionData(data);
  }, [data]);

  const drawChart = useCallback(() => {
    if (!distributionData || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = chartSettings.width - margin.left - margin.right;
    const height = chartSettings.height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, distributionData.x_vals.length - 1])
      .range([0, width]);

    const yValues = showPDF ? distributionData.pdf_vals : distributionData.cdf_vals;
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Create line generator
    const line = d3.line<number>()
      .x((d, i) => xScale(i))
      .y((d: number) => yScale(d));

    // Add the line path
    svg.append('path')
      .datum(yValues)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

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
      .text(showPDF ? 'PDF Values' : 'CDF Values');

  }, [distributionData, showPDF]);

  // Effect to draw chart
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="p-4">
      <h3 className="font-bold mb-4">Distribution Parameters:</h3>
      <p>xi: {data.xi}  omega: {data.omega}  nu: {data.nu}  alpha: {data.alpha}  Showing {showPDF ? 'PDF' : 'CDF'} values</p>

      <div className="mt-4">
        <svg ref={svgRef} className="bg-white rounded-lg shadow-lg"></svg>
      </div>
    </div>
  );
}

export default Test;