import * as d3 from 'd3'; 
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { StimulusParams } from '../../../store/types';
import { generateDistributionData } from './distributionCalculations';
// import { useChartDimensions } from '../../demo-cleveland/assets/hooks/useChartDimensions';

const chartSettings = {
  marginBottom: 40,
  marginLeft: 40,
  marginTop: 15,
  marginRight: 15,
  height: 650,
  width: 850,
};

function Test({ parameters }: StimulusParams<any>) {
  // Destructure the parameters 
	const { data, showPDF } = parameters; 

  // Generate distribution data
  const distributionData = useMemo(() => {
    return generateDistributionData(data); 
  }, [data]); 

	// For demonstration, let's display some of the generated values
  return (
    <div className="p-4">
      <h3 className="font-bold mb-4">Distribution Parameters:</h3>
      <p>xi: {data.xi}</p>
      <p>omega: {data.omega}</p>
      <p>nu: {data.nu}</p>
      <p>alpha: {data.alpha}</p>
      <p>Showing {showPDF ? 'PDF' : 'CDF'} values</p>
      
      <h3 className="font-bold mt-4 mb-2">Generated Values (first 5 points):</h3>
      <div>
        {showPDF ? (
          <div>
            {distributionData.pdf_vals.slice(0, 5).map((val, idx) => (
              <p key={idx}>PDF at x={distributionData.x_vals[idx].toFixed(2)}: {val.toFixed(4)}</p>
            ))}
          </div>
        ) : (
          <div>
            {distributionData.cdf_vals.slice(0, 5).map((val, idx) => (
              <p key={idx}>CDF at x={distributionData.x_vals[idx].toFixed(2)}: {val.toFixed(4)}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}	

export default Test;