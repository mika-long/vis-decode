import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
import { initializeTrrack, Registry } from '@trrack/core';

const chartSettings = {
  marginBottom: 40,
  marginLeft: 50,
  marginTop: 15,
  marginRight: 15,
  height: 450,
  width: 600,
};

interface Point {
  x: number,
  y: number
}

function Test({ parameters, setAnswer }: StimulusParams<any>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data, showPDF, taskid } = parameters;  // Extract taskid from parameters
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  // Store scales in a ref so we can access them in click handler
  const scalesRef = useRef<{
    xScale: d3.ScaleLinear<number, number> | null;
    yScale: d3.ScaleLinear<number, number> | null;
  }>({
    xScale: null,
    yScale: null
  });

  const distributionData = useMemo(() => {
    return generateDistributionData(data);
  }, [data]);

  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create(); 

    const clickAction = reg.register('click', (state, click: {clickX:number, clickY: number}) => {
      state.clickX = click.clickX; 
      state.clickY = click.clickY; 
      return state; 
    }); 

    const trrackInst = initializeTrrack({
      registry: reg, 
      initialState: { clickX: 0, clickY: 0 }
    }); 

    return {
      actions: {
        clickAction
      }, 
      trrack: trrackInst
    }; 
  }, []); 

  const drawChart = useCallback(() => {
    console.log('Drawing chart');
    
    if (!distributionData || !svgRef.current) {
      console.log('Cannot draw chart - missing:', {
        distributionData: !!distributionData,
        svgRef: !!svgRef.current
      });
      return;
    }

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
    console.log('Scales created:', scalesRef.current);

    const yValues = showPDF ? distributionData.pdf_vals : distributionData.cdf_vals;

    // Create array of [x,y] points for the line
    const linePoints = distributionData.x_vals.map((x, i) => ({
      x: x,
      y: yValues[i]
    }));

    // Create line generator
    const line = d3.line<{ x: number, y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    // Add the line path
    svg.append('path')
      .datum(linePoints)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Create a group for points that we'll update separately
    svg.append('g')
      .attr('class', 'points-group');

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
      .text("Probability");

    console.log('Chart drawing completed');
  }, [distributionData, showPDF]);

  // find closest point on the line to the clicked position
  const findClosestPoint = useCallback((clickX: number, clickY: number) => {
    console.log('Finding closest point for:', { clickX, clickY });
    
    if (!distributionData || !scalesRef.current.xScale || !scalesRef.current.yScale) {
      console.log('Missing required data:', {
        distributionData: !!distributionData,
        xScale: !!scalesRef.current.xScale,
        yScale: !!scalesRef.current.yScale
      });
      return null;
    }

    const { xScale, yScale } = scalesRef.current;
    const yValues = showPDF ? distributionData.pdf_vals : distributionData.cdf_vals;

    // convert click coordinates to data space
    const dataX = xScale.invert(clickX);
    const dataY = yScale.invert(clickY);

    console.log('Converted to data space:', { dataX, dataY });

    // Find closest x value in the data
    const index = d3.bisector(d => d).left(distributionData.x_vals, dataX);
    const x0 = distributionData.x_vals[index - 1];
    const x1 = distributionData.x_vals[index];

    if (!x0 || !x1) {
      console.log('Could not find bracketing x values');
      return null;
    }

    const closest = Math.abs(dataX - x0) < Math.abs(dataX - x1) ? index - 1 : index;
    const closestPoint = {
      x: distributionData.x_vals[closest],
      y: yValues[closest]
    };

    console.log('Found closest point:', closestPoint);
    return closestPoint;
  }, [distributionData, showPDF]);

  // Effect for updating the current point
  useEffect(() => {
    console.log('Point update effect triggered', currentPoint);
    
    if (!svgRef.current || !scalesRef.current.xScale || !scalesRef.current.yScale) {
      console.log('Missing refs for point update');
      return;
    }

    const { xScale, yScale } = scalesRef.current;
    
    // Remove any existing points
    d3.select(svgRef.current)
      .select('.points-group')
      .selectAll('circle')
      .remove();

    // Add the current point if it exists
    if (currentPoint) {
      console.log('Adding new point:', currentPoint);
      d3.select(svgRef.current)
        .select('.points-group')
        .append('circle')
        .attr('cx', xScale(currentPoint.x))
        .attr('cy', yScale(currentPoint.y))
        .attr('r', 4)
        .attr('fill', 'red');
    }
  }, [currentPoint]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log('Click event triggered');
    console.log('Current taskid:', taskid);
  
    if (!svgRef.current || !distributionData) {
      console.log('Missing required refs');
      return;
    }
  
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Calculate click coordinates relative to the chart area
    const clickX = e.clientX - rect.left - chartSettings.marginLeft;
    const clickY = e.clientY - rect.top - chartSettings.marginTop;
    console.log('Click coordinates:', { clickX, clickY });
  
    const closestPoint = findClosestPoint(clickX, clickY);
    console.log('Closest point found:', closestPoint);
  
    if (closestPoint) {
      const { xScale, yScale } = scalesRef.current;
      if (!xScale || !yScale) {
        console.log('Scales not available');
        return;
      }
      
      const lineY = yScale(closestPoint.y);
      const distance = Math.abs(clickY - lineY);
      console.log('Distance from line:', distance);
      
      if (distance <= 5) {
        // Track in provenance
        trrack.apply('Clicked', actions.clickAction({ 
          clickX: closestPoint.x, 
          clickY: closestPoint.y 
        }));
  
        // Update visual point
        setCurrentPoint(closestPoint);
  
        // Use setAnswer prop instead of postMessage
        setAnswer({
          status: true,  // Indicates a valid answer
          provenanceGraph: trrack.graph.backend,  // Include provenance data
          answers: {
            [taskid]: closestPoint.x  // Use taskid from parameters
          }
        });
      } else {
        console.log('Click too far from line:', distance);
        // Optionally set status to false if click is invalid
        setAnswer({
          status: false,
          answers: {}
        });
      }
    } else {
      console.log('No valid closest point found');
      setAnswer({
        status: false,
        answers: {}
      });
    }
  }, [distributionData, actions, trrack, findClosestPoint, taskid, setAnswer]);

  // Effect to draw initial chart
  useEffect(() => {
    console.log('Initial chart draw effect triggered');
    drawChart();
  }, [drawChart]);

  return (
    <div className="p-4">
      <div className="mt-4">
        <svg 
          ref={svgRef} 
          onClick={handleClick} 
          className="bg-white rounded-lg shadow-lg"
        />
      </div>
      <button
        onClick={() => {
          setCurrentPoint(null);
          // Clear answer when point is cleared
          setAnswer({
            status: false,
            answers: {}
          });
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Clear Point
      </button>
    </div>
  );
}

export default Test;