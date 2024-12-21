// import * as d3 from 'd3';
// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { StimulusParams } from '../../../store/types';
// import { generateDistributionData } from './distributionCalculations';
// import { initializeTrrack, Registry } from '@trrack/core';

// const chartSettings = {
//   marginBottom: 40,
//   marginLeft: 50,
//   marginTop: 15,
//   marginRight: 15,
//   height: 450,
//   width: 600,
// };

// function Train({ parameters }: StimulusParams<any>) {
//   const svgRef = useRef<SVGSVGElement>(null);
//   const { data, showPDF, taskid } = parameters;

//   const scalesRef = useRef<{
//     xScale: d3.ScaleLinear<number, number> | null;
//     yScale: d3.ScaleLinear<number, number> | null;
//   }>({
//       xScale: null,
//       yScale: null
//   });

//   const distributionData = useMemo(() => {
//     return generateDistributionData(data);
//   }, [data]);
// }

// export default Train;
