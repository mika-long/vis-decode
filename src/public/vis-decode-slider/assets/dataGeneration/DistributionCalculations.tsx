/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable space-infix-ops */
import betainc from '@stdlib/math-base-special-betainc'; // Incomplete Beta function
import beta from '@stdlib/math-base-special-beta'; // Beta function

export interface DistributionData {
  xVals: number[];
  pdfVals: number[];
  cdfVals: number[];
}

export interface GeneralizedDistributionParams {
  mu: number;
  sigma: number;
  lambda: number;
  p: number;
  q: number
}

// Help function
// Return the sign of x
function sgn(x: number) {
  // get the sign of a value
  if (x > 0) return 1;
  if (x === 0) return 0;
  return -1;
}

function pbeta(
  q: number,
  shape1: number,
  shape2: number,
): number {
  // Parameter validation
  if (shape1 <= 0 || shape2 <= 0) return NaN;

  // Camp q to valid range [0, 1]
  if (q <= 0) return 0;
  if (q >= 1) return 1;

  // Calculate the regularized incomplete beta function
  const prob = betainc(q, shape1, shape2, true);

  return prob;
}

/**
 * Probability density function (PDF) for the skewed generalized t-distribution
 */
export function skewGeneralizedTPDF(x: number, params: GeneralizedDistributionParams) {
  // https://github.com/carterkd/sgt/blob/master/R/InternalSGT.R
  const {
    mu, sigma, lambda, p, q,
  } = params;

  // Calculate variance adjustment
  const denomBeta = beta(1 / p, q);
  const v = (q ** (-1 / p)) * ((3 * lambda ** 2 + 1) * (beta(3 / p, q - 2 / p) / denomBeta) - 4 * lambda ** 2 * (beta(2 / p, q - 1 / p) / denomBeta) ** 2) ** (-1 / 2);

  // Calculate mean adjustment
  const m = (2 * v * sigma * lambda * (q ** (1 / p)) * beta(2 / p, q - 1 / p)) / denomBeta;

  const denomPart1 = 2 * v * sigma * (q ** (1 / p)) * denomBeta;
  const denomPart2 = (1 + (Math.abs(x - mu + m) ** p) / (q * ((v * sigma) ** p) * ((1 + lambda * sgn(x - mu + m)) ** p))) ** (q + 1 / p);

  return p / (denomPart1 * denomPart2);
}

/**
 * Cumulative density function (PDF) for the skewed generalized t-distribution
 */
export function skewGeneralizedTCDF(x: number, params: GeneralizedDistributionParams) {
  const {
    mu, sigma, lambda, p, q,
  } = params;

  const denomBeta = beta(1/p, q);

  // Calculate variance adjustment
  const v = (q ** (-1/p)) * Math.sqrt(1 / ((3 * (lambda ** 2) + 1) * (beta(3/p, q - 2/p) / denomBeta) - 4 * (lambda ** 2) * (beta(2/p, q - 1/p) / denomBeta) ** 2));
  const sig = sigma / v;

  // Calcultae mean adjustment
  const m = (2 * sigma * lambda * (q ** (1/p)) * beta(2/p, q - 1/p)) / denomBeta;
  let z = x - mu + m;

  // Track if we need to flip the result
  const flip = z > 0;
  let lam = lambda;

  if (flip) {
    lam = -lam;
    z = -z;
  }
  let out = (1 - lam) / 2 + ((lam - 1) / 2) * pbeta(
    1 / (1 + q * ((sig * (1 - lam)) / (-z)) ** p),
    1/p,
    q,
  );

  if (flip) {
    out = 1 - out;
  }
  return out;
}

/**
 * Generates distribution data with even spacing and handles numerical issues
 * @param {DistributionParams} params - Distribution parameters
 * @param {[number, number]} range - Min and max x values
 * @param {number} step - Step size between points
 * @returns {DistributionData} - x values, PDF values, and CDF values
 */
export function generateDistributionData(
  params: GeneralizedDistributionParams,
  range: [number, number] = [-5, 5],
  step: number = 0.01,
): DistributionData {
  const {
    mu, sigma, lambda, p, q,
  } = params;
  // Check parameters
  if (lambda < -1 || lambda > 1) throw new Error('lambda should be bewteen -1 and 1');
  if (p <= 0 || q <= 0) throw new Error('p and/or q should be positive values');
  if (sigma <= 0) throw new Error('sigma should be positive');

  // Generate x values with exactly even spacing to ensure integer x values are included
  const xVals: number[] = [];

  // Ensure we start and end at multiples of step
  const start = Math.floor(range[0] / step) * step;
  const end = Math.ceil(range[1] / step) * step;

  for (let x = start; x <= end; x += step) {
    // Use toFixed to avoid floating-point precision issues, then convert back to number
    const roundedX = Number(x.toFixed(10));
    xVals.push(roundedX);
  }

  // Calculate PDF values with error handling
  const pdfVals = xVals.map((x) => {
    try {
      return skewGeneralizedTPDF(x, params);
    } catch (e) {
      console.warn(`Error calculating PDF at x=${x}:`, e);
      return 0;
    }
  });

  // Calculate CDF values with error handling
  const cdfVals = xVals.map((x) => {
    try {
      return skewGeneralizedTCDF(x, params);
    } catch (e) {
      console.warn(`Error calculating CDF at x=${x}:`, e);
      return 0;
    }
  });

  return { xVals, pdfVals, cdfVals };
}

// /**
//  * Finds the distribution values at a specific point with interpolation
//  * @param {DistributionData} data - Distribution data
//  * @param {number} x - Point to evaluate
//  * @returns {object} - PDF and CDF values at x
//  */
// export function findDistributionValue(
//   data: DistributionData,
//   x: number,
// ): { pdf: number; cdf: number } {
//   // Find the closest index using binary search
//   let left = 0;
//   let right = data.xVals.length - 1;

//   // Direct match
//   const exactIndex = data.xVals.findIndex((val) => Math.abs(val - x) < 1e-10);
//   if (exactIndex >= 0) {
//     return {
//       pdf: data.pdfVals[exactIndex],
//       cdf: data.cdfVals[exactIndex],
//     };
//   }

//   // Binary search for closest points
//   while (left <= right) {
//     const mid = Math.floor((left + right) / 2);
//     if (data.xVals[mid] < x) {
//       left = mid + 1;
//     } else {
//       right = mid - 1;
//     }
//   }

//   // Ensure indices are within bounds
//   right = Math.max(0, right);
//   left = Math.min(data.xVals.length - 1, left);

//   // If we're at the boundaries, return the boundary value
//   if (right >= left) {
//     return {
//       pdf: data.pdfVals[left],
//       cdf: data.cdfVals[left],
//     };
//   }

//   // Linear interpolation between points
//   const t = (x - data.xVals[right]) / (data.xVals[left] - data.xVals[right]);
//   const pdf = data.pdfVals[right] * (1 - t) + data.pdfVals[left] * t;
//   const cdf = data.cdfVals[right] * (1 - t) + data.cdfVals[left] * t;

//   return { pdf, cdf };
// }

// export function findModeFromPDF(xValues: number[], pdfValues: number[]) {
//   let maxPDFIndex = 0;

//   for (let i = 0; i < pdfValues.length; i += 1) {
//     if (pdfValues[i] > pdfValues[maxPDFIndex]) {
//       maxPDFIndex = i;
//     }
//   }
//   return xValues[maxPDFIndex];
// }

// export function findMedianFromCDF(xValues: number[], cdfValues: number[]) {
//   let closestIndex = 0;
//   let minDifference = Math.abs(cdfValues[0] - 0.5);

//   for (let i = 0; i < cdfValues.length; i += 1) {
//     const difference = Math.abs(cdfValues[i] - 0.5);
//     if (difference < minDifference) {
//       minDifference = difference;
//       closestIndex = i;
//     }
//   }
//   if (Math.abs(cdfValues[closestIndex] - 0.5) < 1e-6) {
//     return xValues[closestIndex];
//   }

//   let leftIndex = 0;
//   let rightIndex = cdfValues.length - 1;

//   for (let i = 0; i < cdfValues.length - 1; i += 1) {
//     if (cdfValues[i] <= 0.5 && cdfValues[i + 1] >= 0.5) {
//       leftIndex = i;
//       rightIndex = i + 1;
//       break;
//     }
//   }
//   const t = (0.5 - cdfValues[leftIndex]) / (cdfValues[rightIndex] - cdfValues[leftIndex]);
//   return xValues[leftIndex] + t * (xValues[rightIndex] - xValues[leftIndex]);
// }
