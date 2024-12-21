import { gamma } from 'mathjs';

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

  // Constants needed for the calculation
  const pi = Math.PI;

  // Calculate gamma functions and ensure they return numbers
  const gammaNum = gamma((v + 1) / 2);
  const gammaDen = gamma(v / 2);

  // Calculate the normalization term
  const normTerm = gammaNum / (Math.sqrt(v * pi) * gammaDen);

  // Calculate the main term
  const xSquared = x * x;
  const base = 1 + (xSquared / v);
  const exponent = -(v + 1) / 2;
  const mainTerm = base ** exponent;

  // Combine terms for final result
  return normTerm * mainTerm;
}

/**
 * Calculates the Beta function, given parameters a and b
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function beta(a: number, b:number): number {
  return (gamma(a) * gamma(b)) / gamma(a + b);
}

/**
 * Calculates the incompleteBeta function
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */

function incompleteBeta(x:number, a:number, b:number): number {
  if (x <= 0) return 0;
  if (x >= 1) return beta(a, b);

  const fpmin = 1e-30;
  let m = 1;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;

  for (m = 1; m <= 100; m += 1) {
    let m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < 3e-7) break;
  }

  return h * (x ** a) * ((1 - x) ** b) / a;
}

/**
 * Calculates the regularized Beta function
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function regualizedBeta(x: number, a: number, b: number): number {
  return incompleteBeta(x, a, b) / beta(a, b);
}

/**
 * Calculates the CDF of the student t distribution, using its closed form solution
 * @param {number} x
 * @param {number} v - Degree of Freedom
 * @returns {number}
 */
function studentTCDF(x:number, v: number): number {
  if (x < 0) {
    return 0.5 * regualizedBeta(v / (v + x * x), v / 2, 1 / 2);
  }
  return 1 - 0.5 * regualizedBeta(v / (v + x * x), v / 2, 1 / 2);
}

export { studentTPDF, studentTCDF };
