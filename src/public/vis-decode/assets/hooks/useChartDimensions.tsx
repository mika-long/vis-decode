import { useRef } from "react";

interface Dimensions {
  marginTop: number, 
  marginBottom: number, 
  marginRight: number, 
  marginLeft: number, 
  height: number, 
  width: number,
}

interface BoundedDimensions extends Dimensions {
  boundedHeight: number, 
  boundedWidth: number,
}

const getChartDimensions = (dimensions: Dimensions): BoundedDimensions => {
  const parsedDimensions = {
    ... dimensions, 
    marginTop: dimensions.marginTop || 10, 
    marginRight: dimensions.marginRight || 10, 
    marginBottom: dimensions.marginBottom || 40, 
    marginLeft: dimensions.marginLeft || 75
  }; 

  return {
    ... parsedDimensions, 
    boundedHeight: Math.max(
      parsedDimensions.height - parsedDimensions.marginTop - parsedDimensions.marginBottom, 
      0
    ), 
    boundedWidth: Math.max(
      parsedDimensions.width - parsedDimensions.marginLeft - parsedDimensions.marginRight, 
      0
    )
  }
}

export const useChartDimensions = (passedSettings: Dimensions): [React.RefObject<HTMLDivElement>, BoundedDimensions] => {
  const ref = useRef<HTMLDivElement>(null); 
  const dimensions = getChartDimensions(passedSettings); 
  return [ref, dimensions];
}