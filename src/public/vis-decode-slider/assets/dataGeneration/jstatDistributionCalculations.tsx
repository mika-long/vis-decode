// Import jStat for the Student's t distribution functions
import jStat from 'jstat';
import * as math from 'mathjs';

// Interface definitions
export interface DistributionData {
  xVals: number[];
  pdfVals: number[];
  cdfVals: number[];
}

export interface DistributionParams {
  xi: number;
  omega: number;
  nu: number;
  alpha: number;
}

export interface GeneralizedDistributionParams {
  mu: number;
  sigma: number;
  lambda: number;
  p: number;
  q: number
}

// Helper function
function beta(a: number, b:number) {
  return (math.gamma(a) * math.gamma(b)) / math.gamma(a + b);
}

function sgn(x: number) {
  // get the sign of a value
  if (x >= 0) return 1;
  return -1;
}

/**
 * Improved skew-t PDF implementation that fixes issues around x = xi
 * @param {number} x - Value to evaluate
 * @param {DistributionParams} params - Distribution parameters
 * @returns {number} - PDF value
 */
export function skewTPDF(x: number, params: DistributionParams): number {
  const {
    xi, omega, nu, alpha,
  } = params;

  // Validate parameters
  if (omega <= 0) throw new Error('Scale parameter omega must be positive');
  if (nu <= 0) throw new Error('Degrees of freedom nu must be positive');
  if (!Number.isFinite(xi) || !Number.isFinite(omega) || !Number.isFinite(nu) || !Number.isFinite(alpha)) {
    throw new Error('All parameters must be finite');
  }

  // Calculate standardized value
  const z = (x - xi) / omega;

  // Calculate the standard t density part using jStat
  const tDensity = jStat.studentt.pdf(z, nu);

  // Calculate the skewing function part using jStat
  const scaledZ = alpha * z * Math.sqrt((nu + 1) / (nu + z * z));
  const FPart = jStat.studentt.cdf(scaledZ, nu + 1);

  return (2 / omega) * tDensity * FPart;
}

export function skewGeneralizedTPDF(x: number, params: GeneralizedDistributionParams) {
  // https://github.com/carterkd/sgt/blob/master/R/InternalSGT.R
  const {
    mu, sigma, lambda, p, q,
  } = params;
  // Error checks
  if (lambda < -1 || lambda > 1) throw new Error('lambda should be bewteen -1 and 1');
  if (p < 0 || q < 0) throw new Error('p and/or q should be positive values');
  if (sigma < 0) throw new Error('sigma should be positive');

  const denomBeta = beta(1 / p, q);

  const v = (q ** (-1 / p)) * ((3 * lambda ** 2 + 1) * (beta(3 / p, q - 2 / p) / denomBeta) - 4 * lambda ** 2 * (beta(2 / p, q - 1 / p) / denomBeta) ** 2) ** (-1 / 2);

  const m = (2 * v * sigma * lambda * (q ** (1 / p)) * beta(2 / p, q - 1 / p)) / denomBeta;

  const denomPart1 = 2 * v * sigma * (q ** (1 / p)) * denomBeta;
  const denomPart2 = ((Math.abs(x - mu + m) ** p) / (q * ((v * sigma) ** p) * ((lambda * sgn(x - mu + m) + 1) ** p) + 1)) ** (1 / p + q);

  return p / (denomPart1 * denomPart2);
}

/**
 * Skew-t CDF implementation using numerical integration of the PDF
 * @param {number} x - Value to evaluate
 * @param {DistributionParams} params - Distribution parameters
 * @returns {number} - CDF value between 0 and 1
 */
export function skewTCDF(x: number, params: DistributionParams): number {
  const {
    xi, omega, nu, alpha,
  } = params;

  // Validate parameters
  if (omega <= 0) throw new Error('Scale parameter omega must be positive');
  if (nu <= 0) throw new Error('Degrees of freedom nu must be positive');
  if (!Number.isFinite(xi) || !Number.isFinite(omega) || !Number.isFinite(nu) || !Number.isFinite(alpha)) {
    throw new Error('All parameters must be finite');
  }

  // Handle special cases
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;

  // Special case for symmetric distribution (alpha = 0)
  if (Math.abs(alpha) < 1e-10) {
    const z = (x - xi) / omega;
    return jStat.studentt.cdf(z, nu);
  }

  // For values at the location parameter
  if (Math.abs(x - xi) < 1e-10) {
    return 0.5; // The CDF at xi is always 0.5
  }

  // For extremely large negative or positive values
  const z = (x - xi) / omega;
  if (z < -100) return 0;
  if (z > 100) return 1;

  // Perform numerical integration using the trapezoidal rule
  // We'll integrate from a sufficiently small value to x

  // Choose a lower bound that's sufficiently far to the left
  // Based on the parameters, we want to capture almost all the probability mass
  // For heavy-tailed distributions (small nu), we need a wider range
  const lowerBound = Math.min(xi - 10 * omega, x - 0.1);

  // Number of integration points - more points give higher accuracy
  const numPoints = 1000;

  // Step size for integration
  const step = (x - lowerBound) / numPoints;

  // Trapezoidal rule implementation
  let integral = 0;
  let prevY = skewTPDF(lowerBound, params);

  for (let i = 1; i <= numPoints; i += 1) {
    const currentX = lowerBound + i * step;
    const currentY = skewTPDF(currentX, params);

    // Trapezoid area: average height × width
    integral += (prevY + currentY) * 0.5 * step;
    prevY = currentY;
  }

  // Ensure the result is between 0 and 1
  return Math.max(0, Math.min(1, integral));
}

/**
 * Generates distribution data with even spacing and handles numerical issues
 * @param {DistributionParams} params - Distribution parameters
 * @param {[number, number]} range - Min and max x values
 * @param {number} step - Step size between points
 * @returns {DistributionData} - x values, PDF values, and CDF values
 */
export function generateDistributionData(
  params: DistributionParams,
  range: [number, number] = [-5, 5],
  step: number = 0.01,
): DistributionData {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    xi, omega, nu, alpha,
  } = params;

  // Validate parameters
  if (omega <= 0 || nu <= 0) {
    throw new Error('Scale parameter omega and degrees of freedom nu must be positive');
  }

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
      return skewTPDF(x, params);
    } catch (e) {
      console.warn(`Error calculating PDF at x=${x}:`, e);
      return 0;
    }
  });

  // Calculate CDF values with error handling
  const cdfVals = xVals.map((x) => {
    try {
      return skewTCDF(x, params);
    } catch (e) {
      console.warn(`Error calculating CDF at x=${x}:`, e);
      // Fallback approximation
      const z = (x - xi) / omega;
      return z < 0 ? 0.5 * (1 + Math.tanh(z)) : 0.5 + 0.5 * (1 - Math.exp(-z));
    }
  });

  return { xVals, pdfVals, cdfVals };
}

/**
 * Finds the distribution values at a specific point with interpolation
 * @param {DistributionData} data - Distribution data
 * @param {number} x - Point to evaluate
 * @returns {object} - PDF and CDF values at x
 */
export function findDistributionValue(
  data: DistributionData,
  x: number,
): { pdf: number; cdf: number } {
  // Find the closest index using binary search
  let left = 0;
  let right = data.xVals.length - 1;

  // Direct match
  const exactIndex = data.xVals.findIndex((val) => Math.abs(val - x) < 1e-10);
  if (exactIndex >= 0) {
    return {
      pdf: data.pdfVals[exactIndex],
      cdf: data.cdfVals[exactIndex],
    };
  }

  // Binary search for closest points
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (data.xVals[mid] < x) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Ensure indices are within bounds
  right = Math.max(0, right);
  left = Math.min(data.xVals.length - 1, left);

  // If we're at the boundaries, return the boundary value
  if (right >= left) {
    return {
      pdf: data.pdfVals[left],
      cdf: data.cdfVals[left],
    };
  }

  // Linear interpolation between points
  const t = (x - data.xVals[right]) / (data.xVals[left] - data.xVals[right]);
  const pdf = data.pdfVals[right] * (1 - t) + data.pdfVals[left] * t;
  const cdf = data.cdfVals[right] * (1 - t) + data.cdfVals[left] * t;

  return { pdf, cdf };
}

export function findModeFromPDF(xValues: number[], pdfValues: number[]) {
  let maxPDFIndex = 0;

  for (let i = 0; i < pdfValues.length; i += 1) {
    if (pdfValues[i] > pdfValues[maxPDFIndex]) {
      maxPDFIndex = i;
    }
  }
  return xValues[maxPDFIndex];
}

export function findMedianFromCDF(xValues: number[], cdfValues: number[]) {
  let closestIndex = 0;
  let minDifference = Math.abs(cdfValues[0] - 0.5);

  for (let i = 0; i < cdfValues.length; i += 1) {
    const difference = Math.abs(cdfValues[i] - 0.5);
    if (difference < minDifference) {
      minDifference = difference;
      closestIndex = i;
    }
  }
  if (Math.abs(cdfValues[closestIndex] - 0.5) < 1e-6) {
    return xValues[closestIndex];
  }

  let leftIndex = 0;
  let rightIndex = cdfValues.length - 1;

  for (let i = 0; i < cdfValues.length - 1; i += 1) {
    if (cdfValues[i] <= 0.5 && cdfValues[i + 1] >= 0.5) {
      leftIndex = i;
      rightIndex = i + 1;
      break;
    }
  }
  const t = (0.5 - cdfValues[leftIndex]) / (cdfValues[rightIndex] - cdfValues[leftIndex]);
  return xValues[leftIndex] + t * (xValues[rightIndex] - xValues[leftIndex]);
}
