import * as d3 from 'd3'; 
import { useMemo } from 'react'; 

interface NumericAxisHProps {
  domain: [number, number]; 
  range: [number, number]; 
  withTick?: boolean; 
  tickLen?: number; 
  numOfTicks?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickFilter?: (t:any) => any;
}

export function NumericAxisH({
  domain = [0, 1], 
  range = [0, 100], 
  withTick = true, 
  tickLen = 5,
  numOfTicks = 10,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickFilter = (t: any) => t,
}: NumericAxisHProps) {
  const ticks = useMemo(() => {
    const xScale = d3.scaleLinear().domain(domain).range(range);
    return tickFilter(
      xScale.ticks(numOfTicks).map((value) => ({
        value,
        xOffset: xScale(value),
      })),
    );
  }, [domain, range, numOfTicks, tickFilter]);

  return(
    <g>
      <path
        d={['M', range[0], tickLen, 'v', -tickLen, 'H', range[1], 'v', tickLen,].join(' ')}
        fill='none'
        stroke='currentColor'
      />
      {
        withTick && 
        // eslint-disable-next-line react/no-unused-prop-types
        ticks.map(({ value, xOffset }: {value: string; xOffset: number}) => (
          <g key={value} transform={`translate(${xOffset}, 0)`}>
            <line y2={`${tickLen}`} stroke='currentColor' />
            <text key={value} style={{fontSize: '10px', textAnchor: 'middle', transform: 'translateY(20px)',}}>
              {value}
            </text>
          </g>
        ))
      }
    </g>
  )
}