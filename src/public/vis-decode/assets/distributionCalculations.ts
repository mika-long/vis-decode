/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { studentTPDF, studentTCDF } from './customT';
// import libR from 'lib-r-math.js';

type IntegrandFunction = (x: number) => number;

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

// Gauss-Kronrod
function gaussKronrod(f: IntegrandFunction, a:number, b:number, tolerance = 1e-8) {
  // 7-15 point Gauss-Kronrod quadrature
  const xgk = [
    0.991455371120813, 0.949107912342759, 0.864864423359769,
    0.741531185599394, 0.586087235467691, 0.405845151377397,
    0.207784955007898, 0.000000000000000, -0.207784955007898,
    -0.405845151377397, -0.586087235467691, -0.741531185599394,
    -0.864864423359769, -0.949107912342759, -0.991455371120813,
  ];
  const wgk = [
    0.022935322010529, 0.063092092629979, 0.104790010322250,
    0.140653259715525, 0.169004726639267, 0.190350578064785,
    0.204432940075298, 0.209482141084728, 0.204432940075298,
    0.190350578064785, 0.169004726639267, 0.140653259715525,
    0.104790010322250, 0.063092092629979, 0.022935322010529,
  ];

  const mid = (a + b) / 2;
  const scale = (b - a) / 2;

  let result = 0;
  for (let i = 0; i < xgk.length; i += 1) {
    const x = mid + scale * xgk[i];
    result += wgk[i] * f(x);
  }

  return scale * result;
}

function adaptiveSimpsons(f:IntegrandFunction, a:number, b:number, tolerance = 1e-8, maxDepth = 50) {
  function simpson(a:number, b:number) {
    const c = (a + b) / 2;
    const h = (b - a) / 6;
    return h * (f(a) + 4 * f(c) + f(b));
  }

  function adapt(a:number, b:number, fa:number, fb:number, fc:number, depth:number):number {
    const c = (a + b) / 2;
    const h = (b - a) / 12;
    const d = (a + c) / 2;
    const e = (c + b) / 2;
    const fd = f(d);
    const fe = f(e);

    const left = h * (fa + 4 * fd + fc);
    const right = h * (fc + 4 * fe + fb);
    const whole = simpson(a, b);

    if (depth >= maxDepth) {
      return left + right;
    }

    if (Math.abs((left + right) - whole) <= tolerance) {
      return left + right;
    }

    return adapt(a, c, fa, fc, fd, depth + 1) + adapt(c, b, fc, fb, fe, depth + 1);
  }

  const c = (a + b) / 2;
  return adapt(a, b, f(a), f(b), f(c), 0);
}

// Skew-t PDF according to Azzalini (2014)
export function skewTPDF(x: number, params: DistributionParams): number {
  const {
    xi,
    omega,
    nu,
    alpha,
  } = params;
  const z = (x - xi) / omega; // normalized value x

  // First calculate the t-distribution part
  const tPart = (1 / omega) * studentTPDF(z, nu); // custom code
  // const tPart = (1 / omega) * libR.dt(z, nu); // libR code

  // Calculate the skewness term with proper scaling
  // The key change is in handling the denominator
  const zScaled = z * Math.sqrt((nu + 1) / (nu + z * z));

  // Then calculate the cumulative t-distribution part for the skewness
  const Ft = studentTCDF(alpha * z * Math.sqrt((nu + 1) / (nu + z * z)), nu + 1);
  // const Ft = libR.pt(alpha * z * Math.sqrt((nu + 1) / (nu + z * z)), nu + 1); // libR

  return 2 * tPart * Ft;
}

function skewTCDF(x: number, params: DistributionParams): number {
  // Create a functino that captures parameters and calls skewTPDF
  const pdf: IntegrandFunction = (t:number) => skewTPDF(t, params);
  // Choose reasonable lowerbound
  const lowerBound = -100;
  // return gaussKronrod(pdf, -1000, x);
  return adaptiveSimpsons(pdf, -1000, x);
}

export function generateDistributionData(
  params: DistributionParams,
  nPoints: number = 1001,
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

  // Calculate CDF
  const cdfVals = xVals.map((x) => skewTCDF(x, params));

  return { xVals, pdfVals, cdfVals };
}

export function findDistributionValue(
  data: DistributionData,
  x:number,
): {pdf: number; cdf: number} {
  const index = Math.round(
    (x - data.xVals[0]) / (data.xVals[1] - data.xVals[0]),
  );

  if (index < 0 || index >= data.xVals.length) {
    return { pdf: 0, cdf: index < 0 ? 0 : 1 };
  }

  return {
    pdf: data.pdfVals[index],
    cdf: data.cdfVals[index],
  };
}
