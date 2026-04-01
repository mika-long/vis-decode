/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable space-infix-ops */
import betainc from '@stdlib/math-base-special-betainc'; // Incomplete Beta function
import beta from '@stdlib/math-base-special-beta'; // Beta function
import normal from '@stdlib/random-base-normal'; // Normal sampling

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
  // const m = (2 * v * sigma * lambda * (q ** (1 / p)) * beta(2 / p, q - 1 / p)) / denomBeta;
  const m = 0;

  const denomPart1 = 2 * v * sigma * (q ** (1 / p)) * denomBeta;
  const denomPart2 = (1 + (Math.abs(x - mu + m) ** p) / (q * ((v * sigma) ** p) * ((1 + lambda * sgn(x - mu + m)) ** p))) ** (q + 1 / p);

  return p / (denomPart1 * denomPart2);
}

/**
 * Cumulative density function (PDF) for the skewed generalized t-distribution
 * https://github.com/carterkd/sgt/blob/master/R/InternalSGT.R#L8
 */
export function skewGeneralizedTCDF(x: number, params: GeneralizedDistributionParams) {
  const {
    mu, sigma, lambda, p, q,
  } = params;

  const denomBeta = beta(1/p, q);

  // Calculate variance adjustment
  const v = (q ** (1/p)) * Math.sqrt((3 * (lambda ** 2) + 1) * (beta(3/p, q - 2/p) / denomBeta) - 4 * (lambda ** 2) * ((beta(2/p, q - 1/p) / denomBeta) ** 2));
  const sig = sigma / v;

  // Calcultae mean adjustment
  // const m = (2 * sigma * lambda * (q ** (1/p)) * beta(2/p, q - 1/p)) / denomBeta;
  const m = 0; // we don't need mean adjustment if we want mu to be the mode
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

export function generateRandomParams(): GeneralizedDistributionParams {
  // https://github.com/stdlib-js/random-base-normal
  const rand = normal.factory();
  let r = Number(rand(0, 0.33).toFixed(2));
  if (r >= 1) {
    r = 0.9;
  } else if (r <= -1) {
    r = -0.9;
  }

  return {
    mu: Number((Math.random() * 4 - 2).toFixed(2)), // mu in [-2, 2]
    sigma: Number((0.5 + Math.random() * 2).toFixed(2)), // sigma in [0.5, 2.5]
    // lambda: r, // bounded between -1 and 1
    lambda: Number((Math.random() * 1.7 - 0.85).toFixed(2)), // make it random sampling
    p: Number((2 + Math.random() * 3).toFixed(2)),
    q: Number((1 + Math.random() * 49).toFixed(2)),
  };
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

export function generateValidDistribution(
  initialParams: GeneralizedDistributionParams,
  threshold: number = 1e-3,
  maxAttempts: number = 20,
): {data: DistributionData, params: GeneralizedDistributionParams } {
  let currentParams = { ...initialParams };
  let attempts = 0;

  while (attempts < maxAttempts) {
    const data = generateDistributionData(currentParams);

    const leftBoundaryPDF = data.pdfVals[0];
    const rightBoudaryPDF = data.pdfVals[data.pdfVals.length - 1];

    if (leftBoundaryPDF <= threshold && rightBoudaryPDF <= threshold) {
      return { data, params: currentParams };
    }

    currentParams = generateRandomParams();
    attempts += 1;
  }

  // console.log("Still there are issues ...")
  // console.log(currentParams);

  const finalData = generateDistributionData(currentParams);
  return { data: finalData, params: currentParams };
}
