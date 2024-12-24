import React, { useEffect, useState } from 'react';
import { initJsPsych } from "jspsych";
import VirtualChinrestPlugin from "@jspsych/plugin-virtual-chinrest";

interface VirtualChinrestProps {
  parameters: any; 
  setAnswer: (answer: any) => void; 
}

const VirtualChinrestComponent: React.FC<VirtualChinrestProps> = ({ parameters, setAnswer }) => {
  const [result, setResult] = useState<any>(null); 

  useEffect(() => {
    // initlize jspsych 
    const jspsych = initJsPsych(); 
    // create hthe trial configuration 
    const trial = {
      type: VirtualChinrestPlugin, 
      ...parameters, 
      on_finish: (data: any) => {
        // process the result 
        setResult(data); 
        // use setAnswer to pass the result back to the study framework 
        setAnswer({
          status: true, 
          answer: {
            viewingDistance: data
          }
        }); 
      }
    }; 

    // run the trial 
    jspsych.run([trial]); 

    // cleanup function 
    return () => {
      jspsych.finishTrial(); 
    }; 
  }, [parameters, setAnswer]); 

  return (
    <div className="virtual-chinrest-container">
      {result ? (
        <div className="result-summary">
          <h3>Viewing Distance Measurement Complete</h3>
          <p>Estimated viewing distance: {result.view_dist_mm} mm</p>
        </div>
      ) : (
        <div>Running Virtual Chinrest Calibration...</div>
      )}
    </div>
  ); 
}; 

export default VirtualChinrestComponent; 