/* eslint-disable object-curly-newline */
// SGT Distribution Comparison Tool
import * as math from 'mathjs';
// const math = require('mathjs');

// Helper function for sign
function sgn(x) {
  if (x > 0) return 1;
  if (x < 0) return -1;
  return 0;
}

// Implementation of beta function using math.js
function beta(a, b) {
  return (math.gamma(a) * math.gamma(b)) / math.gamma(a + b);
}

// Your original skewGeneralizedTPDF function
export function skewGeneralizedTPDF(x, params) {
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
  const denomPart2 = (1 + (Math.abs(x - mu + m) ** p) / (q * ((v * sigma) ** p) * ((1 + lambda * sgn(x - mu + m)) ** p))) ** (q + 1 / p);

  return p / (denomPart1 * denomPart2);
}

// Function to compare with R dsgt output
function compareWithDSGT() {
  // Test cases designed to cover various parameter values
  const testCases = [
    { x: 0, params: { mu: 0, sigma: 1, lambda: 0, p: 2, q: 10 } },
    { x: 1, params: { mu: 0, sigma: 1, lambda: 0.5, p: 2, q: 5 } },
    { x: -1, params: { mu: 0, sigma: 1, lambda: -0.5, p: 2, q: 5 } },
    { x: 2, params: { mu: 1, sigma: 2, lambda: 0.3, p: 3, q: 7 } },
    // More extreme cases
    { x: 5, params: { mu: 0, sigma: 1, lambda: 0.9, p: 1.5, q: 3 } },
    { x: -3, params: { mu: -1, sigma: 0.5, lambda: -0.7, p: 1, q: 2 } }
  ];

  console.log("JavaScript SGT PDF values:");
  console.log("===========================");
  console.log("| x | mu | sigma | lambda | p | q | JS result |");
  console.log("|---|----|----|----|----|----|----|");

  testCases.forEach(test => {
    try {
      const { x, params } = test;
      const { mu, sigma, lambda, p, q } = params;
      const jsResult = skewGeneralizedTPDF(x, params);
      console.log(`| ${x} | ${mu} | ${sigma} | ${lambda} | ${p} | ${q} | ${jsResult.toExponential(6)} |`);
    } catch (e) {
      console.log(`Error for case ${JSON.stringify(test)}: ${e.message}`);
    }
  });

  console.log("\nTo compare with R dsgt package, run this R code:");
  console.log("================================================");
  console.log("```r");
  console.log("library(sgt)");
  console.log("# Test cases");

  testCases.forEach(test => {
    const { x, params } = test;
    const { mu, sigma, lambda, p, q } = params;
    console.log(`r_result <- dsgt(${x}, mu=${mu}, sigma=${sigma}, lambda=${lambda}, p=${p}, q=${q})`);
    console.log(`cat("| ${x} | ${mu} | ${sigma} | ${lambda} | ${p} | ${q} | ", formatC(r_result, format="e", digits=6), " |\\n", sep="")`);
  });

  console.log("```");

  console.log("\nCheck for consistency between R and JavaScript results. Small differences may be due to:");
  console.log("1. Different implementations of gamma/beta functions");
  console.log("2. Floating point precision differences");
  console.log("3. Potential differences in the exact algorithm implementation");
}

// Run the comparison
compareWithDSGT();

// Debugging tool to show intermediate calculations
function debugCalculation(x, params) {
  const { mu, sigma, lambda, p, q } = params;

  console.log("DEBUG CALCULATION:");
  console.log("==================");
  console.log(`Input: x=${x}, mu=${mu}, sigma=${sigma}, lambda=${lambda}, p=${p}, q=${q}`);

  const denomBeta = beta(1 / p, q);
  console.log(`denomBeta = beta(${1/p}, ${q}) = ${denomBeta}`);

  const betaRatio1 = beta(3 / p, q - 2 / p) / denomBeta;
  console.log(`betaRatio1 = beta(${3/p}, ${q - 2/p}) / denomBeta = ${betaRatio1}`);

  const betaRatio2 = beta(2 / p, q - 1 / p) / denomBeta;
  console.log(`betaRatio2 = beta(${2/p}, ${q - 1/p}) / denomBeta = ${betaRatio2}`);

  const v_term1 = q ** (-1 / p);
  const v_term2 = (3 * lambda ** 2 + 1) * betaRatio1;
  const v_term3 = 4 * lambda ** 2 * betaRatio2 ** 2;
  const v = v_term1 * ((v_term2 - v_term3) ** (-1 / 2));

  console.log(`v_term1 = ${q}^(-1/${p}) = ${v_term1}`);
  console.log(`v_term2 = (3*${lambda}^2 + 1) * ${betaRatio1} = ${v_term2}`);
  console.log(`v_term3 = 4*${lambda}^2 * ${betaRatio2}^2 = ${v_term3}`);
  console.log(`v = ${v_term1} * ((${v_term2} - ${v_term3})^(-1/2)) = ${v}`);

  const m = (2 * v * sigma * lambda * (q ** (1 / p)) * beta(2 / p, q - 1 / p)) / denomBeta;
  console.log(`m = ${m}`);

  const denomPart1 = 2 * v * sigma * (q ** (1 / p)) * denomBeta;
  console.log(`denomPart1 = ${denomPart1}`);

  const x_term = x - mu + m;
  console.log(`x_term = ${x} - ${mu} + ${m} = ${x_term}`);
  console.log(`sgn(x_term) = ${sgn(x_term)}`);

  const denomPart2_num = Math.abs(x_term) ** p;
  const denomPart2_denom1 = q * ((v * sigma) ** p);
  const denomPart2_denom2 = ((lambda * sgn(x_term) + 1) ** p);
  const denomPart2_denom = denomPart2_denom1 * denomPart2_denom2 + 1;
  const denomPart2 = (denomPart2_num / denomPart2_denom) ** (1 / p + q);

  console.log(`denomPart2_num = |${x_term}|^${p} = ${denomPart2_num}`);
  console.log(`denomPart2_denom1 = ${q} * ((${v} * ${sigma})^${p}) = ${denomPart2_denom1}`);
  console.log(`denomPart2_denom2 = ((${lambda} * ${sgn(x_term)} + 1)^${p}) = ${denomPart2_denom2}`);
  console.log(`denomPart2_denom = ${denomPart2_denom1} * ${denomPart2_denom2} + 1 = ${denomPart2_denom}`);
  console.log(`denomPart2 = (${denomPart2_num} / ${denomPart2_denom})^(1/${p} + ${q}) = ${denomPart2}`);

  const density = p / (denomPart1 * denomPart2);
  console.log(`Final density = ${p} / (${denomPart1} * ${denomPart2}) = ${density}`);

  return density;
}

// Debug a specific case
const debugCase = { x: 1, params: { mu: 0, sigma: 1, lambda: 0.5, p: 2, q: 5 } };
debugCalculation(debugCase.x, debugCase.params);