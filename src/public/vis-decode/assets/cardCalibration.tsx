import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../../store/types';

const CARD_WIDTH_MM = 85.6; // Standard credit card width in mm
const CARD_HEIGHT_MM = 53.98; // Standard credit card height in mm
const ASPECT_RATIO = CARD_HEIGHT_MM / CARD_WIDTH_MM;

interface CardState {
  cardWidth: number;
}

function CardCalibration({ parameters, setAnswer }: StimulusParams<any>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cardWidth, setCardWidth] = useState(300); // Initial width in pixels
  const { taskid } = parameters;
  
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();

    const resizeAction = reg.register('resize', (state, resize: { cardWidth: number }) => {
      state.cardWidth = resize.cardWidth;
      return state;
    });

    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: { cardWidth: 300 }
    });

    return {
      actions: {
        resizeAction
      },
      trrack: trrackInst
    };
  }, []);

  const updateCardSize = useCallback((width: number) => {
    setCardWidth(width);
    trrack.apply('Resized', actions.resizeAction({ cardWidth: width }));

    const px2mm = width / CARD_WIDTH_MM;
    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {
        [taskid]: {
          px2mm: Number(px2mm.toFixed(2)),
          cardWidthPx: Number(width.toFixed(2))
        }
      }
    });
  }, [actions, setAnswer, taskid, trrack]);

  const drawCard = useCallback(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const centerX = 450; // Center of 900 viewBox width
    const centerY = 300; // Center of 600 viewBox height
    const startX = centerX - (cardWidth / 2);
    const startY = centerY - ((cardWidth * ASPECT_RATIO) / 2);

    const svg = d3.select(svgRef.current);
    const container = svg.append('g').attr('class', 'card-container');

    // Draw card rectangle
    const card = container.append('rect')
      .attr('class', 'card')
      .attr('x', startX)
      .attr('y', startY)
      .attr('width', cardWidth)
      .attr('height', cardWidth * ASPECT_RATIO)
      .attr('fill', 'rgb(59, 130, 246)')
      .attr('rx', 10);

    // Add corner handles (small circles at each corner)
    const corners = [
      { x: startX + cardWidth, y: startY + (cardWidth * ASPECT_RATIO) }, // Bottom right
      { x: startX + cardWidth, y: startY }, // Top right
      { x: startX, y: startY + (cardWidth * ASPECT_RATIO) }, // Bottom left
      { x: startX, y: startY } // Top left
    ];

    corners.forEach((corner, i) => {
      container.append('circle')
        .attr('class', `handle-${i}`)
        .attr('cx', corner.x)
        .attr('cy', corner.y)
        .attr('r', 6)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('cursor', i === 0 ? 'se-resize' : 'default');
    });

			// Use d3.select with proper typing for parent
			const drag = d3.drag<SVGCircleElement, unknown>()
			.on('drag', function(this: SVGCircleElement, event) {
				const dx = event.x - startX;
				const newWidth = Math.max(100, Math.min(800, dx));
				const newHeight = newWidth * ASPECT_RATIO;

				card.attr('width', newWidth)
						.attr('height', newHeight);

				// Safer type conversion
				const parentElement = this.parentElement;
				if (!(parentElement instanceof SVGGElement)) return;
				
				const parent = d3.select(parentElement);
				
				parent.select<SVGCircleElement>('.handle-0')
					.attr('cx', startX + newWidth)
					.attr('cy', startY + newHeight);
				
				parent.select<SVGCircleElement>('.handle-1')
					.attr('cx', startX + newWidth)
					.attr('cy', startY);

				parent.select<SVGCircleElement>('.handle-2')
					.attr('cx', startX)
					.attr('cy', startY + newHeight);

				parent.select<SVGCircleElement>('.handle-3')
					.attr('cx', startX)
					.attr('cy', startY);

				updateCardSize(newWidth);
			});

    // Apply drag behavior to bottom-right corner with proper typing
    container.select<SVGCircleElement>('.handle-0').each(function() {
      drag(d3.select(this));
    });

  }, [cardWidth, updateCardSize]);

  useEffect(() => {
    drawCard();
  }, [drawCard]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center space-y-2">
        <p>Drag the bottom-right corner to resize the card to match your credit card size</p>
      </div>
      <div className="w-full max-w-3xl">
        <svg
          ref={svgRef}
          viewBox="0 0 900 600"
          className="w-full h-full bg-white rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}

export default CardCalibration;