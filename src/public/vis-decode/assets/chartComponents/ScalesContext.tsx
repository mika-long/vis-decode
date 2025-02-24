import { createContext, useContext, useMemo } from 'react';
import * as d3 from 'd3';

interface ScalesContextType {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  margin: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  };
}

const ScalesContext = createContext<ScalesContextType | null>(null);

interface ScalesProviderProps {
  width: number;
  height: number;
  margin: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  };
  xDomain: [number, number];
  yDomain: [number, number];
  children: React.ReactNode;
}

export function ScalesProvider({
  width,
  height,
  margin,
  xDomain,
  yDomain,
  children,
}: ScalesProviderProps) {
  const scales = useMemo(() => {
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([margin.left, width - margin.right]);

    return {
      xScale,
      yScale,
      width,
      height,
      margin,
    };
  }, [width, height, margin, xDomain, yDomain]);

  return (
    <ScalesContext.Provider value={scales}>
      {children}
    </ScalesContext.Provider>
  );
}

export function useScales() {
  const context = useContext(ScalesContext);
  if (!context) {
    throw new Error('useScales must be used within a ScalesProvider');
  }
  return context;
}
