import { create, all } from 'mathjs';

// Initialize mathjs with all functions
const math = create(all);

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
    const pi = math.pi;
    
    // Calculate gamma functions and ensure they return numbers
    const gamma_num = Number(math.gamma((v + 1) / 2));
    const gamma_den = Number(math.gamma(v / 2));
    
    // Calculate the normalization term
    const norm_term = gamma_num / (Math.sqrt(v * Number(pi)) * gamma_den);
    
    // Calculate the main term
    const x_squared = x * x;
    const base = 1 + (x_squared / v);
    const exponent = -(v + 1) / 2;
    const main_term = Number(math.pow(base, exponent));
    
    // Combine terms for final result
    return norm_term * main_term;
}

/**
 * Example usage and tests
 */
function runTests(): void {
    // Test case 1: Standard values
    console.log('PDF at x=0, v=1 (Cauchy distribution):', studentTPDF(0, 1));
    console.log('PDF at x=0, v=2:', studentTPDF(0, 2));
    
    // Test case 2: Various x values with v=3
    const xValues = [-2, -1, 0, 1, 2];
    console.log('\nPDF values for v=3:');
    xValues.forEach(x => {
        console.log(`x=${x}: ${studentTPDF(x, 3)}`);
    });
    
    // Test case 3: Error handling
    try {
        studentTPDF(0, -1);
    } catch (error) {
        if (error instanceof Error) {
            console.log('\nError test:', error.message);
        } else {
            console.log('\nError test:', String(error));
        }
    }
}

// Export the function and test runner
export { studentTPDF, runTests };