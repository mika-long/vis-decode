/* eslint-disable no-shadow */
/**
 * Enhanced implementation of the skew-t distribution with robust numerical handling
 * This version addresses issues with discontinuities and ensures smooth PDF curves
 */

import { gamma, lgamma, erf } from 'mathjs';

// Constants needed for the calculation
const pi = Math.PI;

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

/**
 * Calculates the PDF of Student's t-distribution
 * @param {number} x - The value at which to evaluate the PDF
 * @param {number} v - Degrees of freedom (must be positive)
 * @returns {number} The PDF value at x
 * @throws {Error} If degrees of freedom is not positive
 */
function studentTPDF(x: number, v: number): number {
  // Validate input
  if (v <= 0) {
    throw new Error('Degrees of freedom must be positive');
  }

  // Handle special case for infinite degrees of freedom (Normal distribution)
  if (!Number.isFinite(v)) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * pi);
  }

  // Calculate gamma functions using log space for numerical stability
  const lgammaNum = lgamma((v + 1) / 2);
  const lgammaDen = lgamma(v / 2);

  // Calculate the log of normalization term
  const lnormTerm = lgammaNum - (0.5 * Math.log(v * pi)) - lgammaDen;

  // Calculate the log main term (using log1p for better precision)
  const xSquared = x * x;
  const exponent = -(v + 1) / 2;
  const lmainTerm = exponent * Math.log1p(xSquared / v);

  // Combine logs and exponentiate
  return Math.exp(lnormTerm + lmainTerm);
}

/**
 * Improved Beta function calculation with better numerical stability
 * @param {number} a - First parameter
 * @param {number} b - Second parameter
 * @returns {number} - Beta function value
 */
function beta(a: number, b: number): number {
  // Use log gamma for better numerical stability
  return Math.exp(lgamma(a) + lgamma(b) - lgamma(a + b));
}

/**
 * Log Beta function for improved numerical stability
 * @param {number} a - First parameter
 * @param {number} b - Second parameter
 * @returns {number} - Log of Beta function value
 */
function logBeta(a: number, b: number): number {
  return lgamma(a) + lgamma(b) - lgamma(a + b);
}

/**
 * Improved incomplete Beta function with better handling of edge cases
 * @param {number} x - Upper limit of integration
 * @param {number} a - First parameter
 * @param {number} b - Second parameter
 * @returns {number} - Incomplete Beta function value
 */
function incompleteBeta(x: number, a: number, b: number): number {
  // Handle boundary cases
  if (x <= 0) return 0;
  if (x >= 1) return beta(a, b);

  // Continued fraction evaluation for the incomplete beta function
  const fpmin = 1e-30;
  let m = 1;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;

  // Improved convergence criteria with max iterations
  const maxIter = 200;
  for (m = 1; m <= maxIter; m += 1) {
    const m2 = 2 * m;

    // First term in continued fraction
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;

    // Second term in continued fraction
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;

    // Check for convergence
    if (Math.abs(del - 1) < 1e-10) break;

    // Prevent infinite loop with poor convergence
    if (m === maxIter) {
      console.warn('incompleteBeta did not converge');
    }
  }

  // Final calculation with bounds checking
  const result = (h * (x ** a) * ((1 - x) ** b)) / a;
  return Number.isFinite(result) ? result : 0;
}

/**
 * Improved regularized Beta function (also known as the incomplete beta function ratio)
 * @param {number} x - Upper limit of integration
 * @param {number} a - First parameter
 * @param {number} b - Second parameter
 * @returns {number} - Regularized Beta function value between 0 and 1
 */
function regularizedBeta(x: number, a: number, b: number): number {
  // Handle boundary cases
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (a <= 0 || b <= 0) return 0; // Parameters must be positive

  // For very small arguments, use approximation
  if (x < 1e-10 && a > 1) return 0;
  if (1 - x < 1e-10 && b > 1) return 1;

  // Calculate in log space for better numerical stability
  try {
    const logIncBeta = Math.log(incompleteBeta(x, a, b));
    const logB = logBeta(a, b);
    const result = Math.exp(logIncBeta - logB);
    return Math.min(1, Math.max(0, result)); // Ensure result is in [0,1]
  } catch (e) {
    // Fallback for numerical errors
    console.warn('Error in regularizedBeta:', e);
    return x < 0.5 ? 0 : 1;
  }
}

/**
 * Improved Student's t CDF implementation with better numerical stability
 * @param {number} x - Value to evaluate
 * @param {number} v - Degrees of freedom
 * @returns {number} - CDF value between 0 and 1
 */
function studentTCDF(x: number, v: number): number {
  // Handle special cases
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
  if (!Number.isFinite(v)) {
    // For infinite df, use normal distribution
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  }
  if (v <= 0) throw new Error('Degrees of freedom must be positive');

  // x = 0 is exactly 0.5 for any valid df
  if (x === 0) return 0.5;

  // For large |x|, return limiting values to avoid numerical issues
  if (Math.abs(x) > 1000) return x > 0 ? 1 : 0;

  // For small |x|, use a series expansion for better accuracy
  if (Math.abs(x) < 1e-6) {
    return 0.5 + (x * gamma((v + 1) / 2)) / (Math.sqrt(pi * v) * gamma(v / 2));
  }

  // Standard case using regularized beta function
  const w = v / (v + x * x);

  // Bound w to avoid numerical issues
  const boundedW = Math.max(0, Math.min(1, w));

  if (x < 0) {
    return 0.5 * regularizedBeta(boundedW, v / 2, 0.5);
  }
  return 1 - 0.5 * regularizedBeta(boundedW, v / 2, 0.5);
}

/**
 * Modified skew-t PDF implementation with improved handling around x = xi
 * @param {number} x - Value to evaluate
 * @param {number} params - Distribution parameters
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

  // Special case handling for values very close to xi with smooth transition
  const threshold = 1e-6;
  if (Math.abs(z) < threshold) {
    // At exactly z = 0
    if (Math.abs(z) < 1e-10) {
      const tPart = (1 / omega) * studentTPDF(0, nu);
      const cdfPart = 0.5; // CDF at z=0 is always 0.5
      return 2 * tPart * cdfPart;
    }

    // For values very close to z = 0, use Taylor expansion for smooth transition
    const tPart = (1 / omega) * studentTPDF(z, nu);

    // First-order approximation for skewness term
    const sqrtRatio = Math.sqrt((nu + 1) / nu);
    const cdfOffset = (alpha * z * sqrtRatio * gamma((nu + 2) / 2)) / (Math.sqrt(pi * (nu + 1)) * gamma((nu + 1) / 2));

    const cdfPart = 0.5 + cdfOffset;

    // Linear blend between approximation and exact formula based on distance from z=0
    const t = Math.abs(z) / threshold; // Transition parameter
    const exactZ = z;
    const exactZSquared = exactZ * exactZ;
    const nuPlusZSquared = nu + exactZSquared;
    const exactZScaled = exactZ * Math.sqrt((nu + 1) / nuPlusZSquared);
    const exactFt = studentTCDF(alpha * exactZScaled, nu + 1);

    const approxResult = 2 * tPart * cdfPart;
    const exactResult = 2 * tPart * exactFt;

    return approxResult * (1 - t) + exactResult * t;
  }

  // Standard calculation for values away from xi
  const tPart = (1 / omega) * studentTPDF(z, nu);

  // Calculate the skewness term with improved numerical stability
  let zScaled;
  if (Math.abs(z) > 1e3) {
    // For very large z, use an approximation
    zScaled = Math.sign(z) * Math.sqrt((nu + 1) / nu);
  } else {
    const zSquared = z * z;
    // Prevent division by very small numbers
    const nuPlusZSquared = Math.max(nu + zSquared, nu * 1e-10 + zSquared);
    zScaled = z * Math.sqrt((nu + 1) / nuPlusZSquared);
  }

  // Calculate the CDF part with bounded input
  const alphaZScaled = Math.max(-1e3, Math.min(1e3, alpha * zScaled));
  const Ft = studentTCDF(alphaZScaled, nu + 1);

  return 2 * tPart * Ft;
}

/**
 * Simple trapezoidal integration for calculating the CDF
 * @param {number} a - Lower integration bound
 * @param {number} b - Upper integration bound
 * @param {function} f - Function to integrate
 * @param {number} n - Number of intervals
 * @returns {number} - Approximate integral
 */
function trapezoidalIntegration(a: number, b: number, f: (x: number) => number, n: number = 1000): number {
  if (a >= b) return 0;
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Integration bounds must be finite');
  }

  const h = (b - a) / n;
  let sum = (f(a) + f(b)) / 2;

  for (let i = 1; i < n; i += 1) {
    const x = a + i * h;
    sum += f(x);
  }

  return h * sum;
}

/**
 * Improved skew-t CDF implementation with better numerical integration
 * @param {number} x - Value to evaluate
 * @param {number} params - Distribution parameters
 * @returns {number} - CDF value between 0 and 1
 */
export function skewTCDF(x: number, params: DistributionParams): number {
  const {
    xi, omega, nu, alpha,
  } = params;

  // Handle special cases
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;

  // For the symmetric case (alpha = 0), use the student t CDF directly
  if (Math.abs(alpha) < 1e-10) {
    const z = (x - xi) / omega;
    return studentTCDF(z, nu);
  }

  // For values very close to xi when alpha != 0
  if (Math.abs(x - xi) < 1e-10) {
    return 0.5; // The CDF at xi is always 0.5 regardless of alpha
  }

  // For general case, we need numerical integration
  // Calculate a suitable integration range
  let stdDev = omega;
  if (nu > 2) {
    // Use proper standard deviation for t distribution
    stdDev = omega * Math.sqrt(nu / (nu - 2));
  }

  // Determine appropriate lower bound based on parameter values
  const skewEffect = Math.abs(alpha) * stdDev;
  const lowerBound = Math.min(
    x - 20 * stdDev,
    xi - 20 * stdDev - Math.sign(alpha) * skewEffect,
  );

  // Safety checks
  if (x <= lowerBound) return 0;

  // Create integration function
  const integrand = (t: number) => skewTPDF(t, params);

  // Use trapezoidal rule with more points for better accuracy
  try {
    const result = trapezoidalIntegration(lowerBound, x, integrand, 1000);
    return Math.min(1, Math.max(0, result)); // Ensure result is in [0,1]
  } catch (e) {
    console.warn('Error in numerical integration:', e);
    // Fallback to approximate solution
    const z = (x - xi) / omega;
    return z < 0 ? 0.25 * (1 + Math.tanh(z)) : 0.5 + 0.25 * (1 + Math.tanh(z));
  }
}

/**
 * Generates distribution data with improved handling around the location parameter
 * @param {DistributionParams} params - Distribution parameters
 * @param {[number, number]} range - Min and max x values
 * @param {number} step - Step size between points
 * @returns {DistributionData} - x values, PDF values, and CDF values
 */
export function generateDistributionData(
  params: DistributionParams,
  range: [number, number] = [-5, 5],
  step: number = 0.1,
): DistributionData {
  const {
    xi, omega, nu, alpha,
  } = params;

  // Validate parameters
  if (omega <= 0 || nu <= 0) {
    throw new Error('Scale parameter omega and degrees of freedom nu must be positive');
  }

  // Calculate distribution's standard deviation
  let stdDev = omega;
  if (nu > 2) {
    stdDev = omega * Math.sqrt(nu / (nu - 2));
  }

  // Adjust range based on parameters to ensure coverage
  const skewEffect = Math.abs(alpha) * stdDev;
  let [min, max] = range;
  min = Math.min(min, xi - 5 * stdDev - skewEffect);
  max = Math.max(max, xi + 5 * stdDev + skewEffect);

  // Round to nearest multiple of step
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;

  // Generate x values with extra points around xi for smoother curve
  const xVals: number[] = [];

  // Add regular points
  for (let x = min; x <= max; x += step) {
    xVals.push(Number(x.toFixed(10)));
  }

  // Add extra points around xi for better resolution
  const extraPointsCount = 10;
  const extraPointsStep = step / 10;
  for (let i = -extraPointsCount; i <= extraPointsCount; i += 1) {
    // eslint-disable-next-line no-continue
    if (i === 0) continue; // Skip xi itself as it will be added separately
    const x = xi + i * extraPointsStep;
    if (x >= min && x <= max) {
      xVals.push(Number(x.toFixed(10)));
    }
  }

  // Add xi exactly
  xVals.push(Number(xi.toFixed(10)));

  // Sort all points
  xVals.sort((a, b) => a - b);

  // Remove duplicates
  const uniqueXVals = xVals.filter((x, i) => i === 0 || Math.abs(x - xVals[i - 1]) > 1e-10);

  // Calculate PDF values with error handling
  const pdfVals = uniqueXVals.map((x) => {
    try {
      return skewTPDF(x, params);
    } catch (e) {
      console.warn(`Error calculating PDF at x=${x}:`, e);
      return 0;
    }
  });

  // Calculate CDF values with incremental integration for better stability
  const cdfVals = new Array(uniqueXVals.length);

  // Find index of a value that's definitely on the left tail
  const leftTailIndex = uniqueXVals.findIndex((x) => x > min + stdDev);
  const startIndex = Math.max(0, leftTailIndex - 1);

  // Start with direct calculation for the first point
  cdfVals[startIndex] = skewTCDF(uniqueXVals[startIndex], params);

  // Use trapezoidal rule for incremental CDF calculation
  for (let i = startIndex + 1; i < uniqueXVals.length; i += 1) {
    const dx = uniqueXVals[i] - uniqueXVals[i - 1];
    const area = ((pdfVals[i] + pdfVals[i - 1]) * dx) / 2;
    cdfVals[i] = Math.min(1, Math.max(0, cdfVals[i - 1] + area));
  }

  // Calculate backward for points before startIndex
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    const dx = uniqueXVals[i + 1] - uniqueXVals[i];
    const area = ((pdfVals[i + 1] + pdfVals[i]) * dx) / 2;
    cdfVals[i] = Math.max(0, Math.min(1, cdfVals[i + 1] - area));
  }

  // One final normalization to ensure CDF spans [0,1]
  if (cdfVals[cdfVals.length - 1] < 0.99) {
    const normFactor = 1 / cdfVals[cdfVals.length - 1];
    for (let i = 0; i < cdfVals.length; i += 1) {
      cdfVals[i] = Math.min(1, cdfVals[i] * normFactor);
    }
  }

  return { xVals: uniqueXVals, pdfVals, cdfVals };
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
  if (right === left) {
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
