declare module 'poisson-disk-sampling' {
  interface PoissonDiskSamplingOptions {
    shape: number[];
    minDistance: number;
    maxDistance?: number;
    tries?: number;
    distanceFunction?: (point: number[]) => number;
    bias?: number;
  }

  class PoissonDiskSampling {
    constructor(options: PoissonDiskSamplingOptions, rng?: () => number);

    addRandomPoint(): number[];

    addPoint(point: number[]): number[] | null;

    fill(): number[][];

    getAllPoints(): number[][];

    reset(): void;

    next(): number[] | null;
  }

  export = PoissonDiskSampling;
}
