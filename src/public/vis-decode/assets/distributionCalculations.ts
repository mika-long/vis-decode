import { studentTPDF, studentTCDF } from './customT';

export interface DistributionData {
  xVals: number[];
  pdfVals: number[];
  cdfVals: number[];
}
/**
 * Parameters for the skew-t distribution
 * @param {number} xi - location parameter
 * @param {number} omega - scale parameter
 * @param {number} nu - degrees of freedom
 * @param {number} alpha - skewness parameter
 */
export interface DistributionParams {
  xi: number;
  omega: number;
  nu: number;
  alpha: number;
}

/**
 * Generates random parameters for the skew-t distribution
 * location parameter (xi) between -2 and 2
 * scale parameter (omega) between 0.1 and 4
 * degrees of freedom (nu) between 1 and 10
 * skewness parameter (alpha) between -5 and 5
 * @returns {DistributionParams}
 */
export function generateRandomParams(): DistributionParams {
  return {
    xi: Math.random() * 4 - 2,
    omega: Math.random() * 3.9 + 0.1,
    nu: Math.floor(Math.random() * 9) + 1,
    alpha: Math.random() * 10 - 5,
  };
}

// Skew-t PDF according to Azzalini (2014)
export function skewTPDF(x: number, params: DistributionParams): number {
  const { xi, omega, nu, alpha } = params;
  const z = (x - xi) / omega; // normalized value x

  // First calculate the t-distribution part
  // const tPart = (1/omega) * dt(z, nu);
  const tPart = (1 / omega) * studentTPDF(z, nu);

  // Then calculate the cumulative t-distribution part for the skewness
  const Ft = studentTCDF(alpha * z * Math.sqrt((nu + 1) / (nu + z * z)), nu + 1);

  return 2 * tPart * Ft;
}

export function generateDistributionData(
  params: DistributionParams,
  nPoints: number = 1000,
  range: [number, number] = [-5, 5],
): DistributionData {
  const [min, max] = range;

  // Generate x values
  const xVals = Array.from(
    { length: nPoints },
    (_, i) => min + (i * (max - min)) / (nPoints - 1),
  );

  // Calculate PDF values using libRmath
  const pdfVals = xVals.map((x) => skewTPDF(x, params));

  // Calculate CDF values using numerical integration (trapezoidal rule)
  const cdfVals: number[] = [0];
  let sum = 0;

  for (let i = 1; i < xVals.length; i += 1) {
    const dx = xVals[i] - xVals[i - 1];
    const trapezoid = (pdfVals[i] + pdfVals[i - 1]) * dx / 2;
    sum += trapezoid;
    cdfVals.push(sum);
  }

  // Normalize CDF
  const maxCDF = cdfVals[cdfVals.length - 1];
  const normalizedCDF = cdfVals.map((v) => v / maxCDF);

  return { xVals, pdfVals, cdfVals: normalizedCDF };
}

export function findDistributionValue(
  data: DistributionData,
  x:number,
): {pdf: number; cdf: number} {
  const index = Math.round(
    (x - data.xVals[0]) / (data.xVals[1] - data.xVals[0])
  );

  if (index < 0 || index >= data.xVals.length) {
    return { pdf: 0, cdf: index < 0 ? 0 : 1 };
  }

  return {
    pdf: data.pdfVals[index],
    cdf: data.cdfVals[index]
  };
}
