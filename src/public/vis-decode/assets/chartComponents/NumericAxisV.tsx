import * as d3 from 'd3'; 
import { useMemo } from 'react'; 

interface NumericAxisVProps {
    domain: [number, number]; 
    range: [number, number]; 
}

export function NumericAxisV({
    domain = [0, 1], 
    range = [0, 100]
}: NumericAxisVProps) {

}