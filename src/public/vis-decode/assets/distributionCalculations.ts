// import {dt, pt} from 'lib-r-math.js';  
import { studentTPDF } from "./customT";

export interface DistributionData { 
    x_vals: number[]; 
    pdf_vals: number[]; 
    cdf_vals: number[]; 
}

export interface DistributionParams {
    xi: number;     // location 
    omega: number;  // scale 
    nu: number;     // degrees of freedom 
    alpha: number;  // scale 
}

// function for generating random params 
export function generateRandomParams(): DistributionParams {
    return {
        // location parameter (xi) between -2 and 2 
        xi: Math.random() * 4 - 2,
        // scale parameter (omega) between 0.1 and 4
        omega: Math.random() * 3.9 + 0.1, 
        // degrees of freedom (nu) between 1 and 10
        nu: Math.floor(Math.random() * 9) + 1,
        // skewness parameter (alpha) between -5 and 5
        alpha: Math.random() * 10 - 5
    }
}

// Skew-t PDF according to Azzalini (2014)
export function skewTPDF(x: number, params: DistributionParams): number {
    const {xi, omega, nu, alpha} = params; 
    const z = (x - xi)/omega; // normalized value x 

    // First calculate the t-distribution part 
    // const tPart = libR.dt(x, nu); 
    // const tPart = (1/omega) * dt(z, nu);
    const tPart = (1/omega) * studentTPDF(z, nu);

    // Then calculate the cumulative t-distribution part for the skewness 
    const Ft = studentTPDF(alpha * z * Math.sqrt((nu + 1) / (nu + z * z)), nu + 1); 

    return 2 * tPart * Ft; 
}

export function generateDistributionData(
    params: DistributionParams, 
    nPoints: number = 1000, 
    range: [number, number] = [-5, 5]
): DistributionData {
    const [min, max] = range;    

    // Generate x values 
    const x_vals = Array.from(
        { length: nPoints }, 
        (_, i) => min + (i * (max - min)) / (nPoints - 1) 
    ); 

    // Calculate PDF values using libRmath 
    const pdf_vals = x_vals.map(x => skewTPDF(x, params)); 

    // Calculate CDF values using numerical integration (trapezoidal rule) 
    const cdf_vals: number[] = [0]; 
    let sum = 0; 

    for (let i = 1; i < x_vals.length; i++) {
        const dx = x_vals[i] - x_vals[i-1]; 
        const trapezoid = (pdf_vals[i] + pdf_vals[i-1]) * dx / 2; 
        sum += trapezoid; 
        cdf_vals.push(sum); 
    }

    // Normalize CDF 
    const maxCDF = cdf_vals[cdf_vals.length - 1]; 
    const normalized_cdf = cdf_vals.map(v => v / maxCDF); 

    return { x_vals, pdf_vals, cdf_vals: normalized_cdf }; 
}

export function findDistributionValue(
    data: DistributionData, 
    x:number
): {pdf: number; cdf: number} {
    const index = Math.round(
        (x - data.x_vals[0]) / (data.x_vals[1] - data.x_vals[0])
    ); 

    if (index < 0 || index >= data.x_vals.length) { 
        return {pdf: 0, cdf: index < 0 ? 0 : 1}; 
    }

    return {
        pdf: data.pdf_vals[index],  
        cdf: data.cdf_vals[index] 
    }
}