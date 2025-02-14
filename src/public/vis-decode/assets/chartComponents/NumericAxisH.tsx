import * as d3 from 'd3'; 
import { useMemo } from 'react'; 

interface NumericAxisHProps {
    domain: [number, number]; 
    range: [number, number]; 
    withTick?: boolean; 
    tickLen?: number; 
}

export function NumericAxisH({
    domain = [0, 1], 
    range = [0, 100], 
    withTick = true, 
    tickLen = 5
}: NumericAxisHProps) {

}