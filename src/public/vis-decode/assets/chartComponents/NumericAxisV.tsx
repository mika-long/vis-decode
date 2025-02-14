import * as d3 from 'd3';
import { useMemo } from 'react';
import { XOFFSET } from 'vega-lite/build/src/channel';

interface NumericAxisVProps {
	domain: [number, number]; // data domain
	range: [number, number];  // pixel domain
	withTick?: boolean;       // whether it contains ticks or no
	tickLen?: number;        // how long are the ticks
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	tickFilter?: (t:any) => any;
}

export function NumericAxisV({
	domain = [0, 1],
	range = [10, 100],
	withTick = true,
	tickLen = 5,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	tickFilter = (t: any) => t,
}: NumericAxisVProps) {
	const ticks = useMemo(() => {
		const yScale = d3.scaleLinear().domain(domain).range(range);
		const height = range[1] - range[0]; 
		const numberOfTicks = 10; 
		return tickFilter(
			yScale.ticks(numberOfTicks).map((value) => ({
				value, 
				xOffset: yScale(value),
			})),
		);
	}, [domain, range, tickFilter]);

	return (
		<g>
			<path
				d = {[].join(' ')}
				fill = "none"
				stroke = "currentColor"
			/>

			{
			withTick && 
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, react/no-unused-prop-types
			ticks.map(({ value, xOffset }: {value: any; xOffset: any}) => (
				<g key={value} transform={`translate(0,${xOffset})`}>
					<line x2={`${tickLen}`} stroke='currentColor'/>
					<text key={value} style={{fontSize: '10px', textAnchor: 'middle', transform: 'translateX(-10px)',}}>
						{value}
					</text>
				</g>
				))
			}
		</g>
	);
}