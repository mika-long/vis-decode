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

// /**
//  * Example usage and tests
//  */
// function runTests(): void {
//   // Test case 1: Standard values
//   console.log('PDF at x=0, v=1 (Cauchy distribution):', studentTPDF(0, 1));
//   console.log('PDF at x=0, v=2:', studentTPDF(0, 2));

//   // Test case 2: Various x values with v=3
//   const xValues = [-2, -1, 0, 1, 2];
//   console.log('\nPDF values for v=3:');
//   xValues.forEach(x => {
//     console.log(`x=${x}: ${studentTPDF(x, 3)}`);
//   });

//   // Test case 3: Error handling
//   try {
//     studentTPDF(0, -1);
//   } catch (error) {
//     if (error instanceof Error) {
//         console.log('\nError test:', error.message);
//     } else {
//         console.log('\nError test:', String(error));
//     }
//   }
// }

// Export the function and test runner
// export { studentTPDF, runTests };
export { studentTPDF };
