import React from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

interface OptionBreakdownProps {
  options: string[];
  preparePieChart: (optionIndex: number) => any;
}

export const OptionBreakdown: React.FC<OptionBreakdownProps> = ({
  options,
  preparePieChart
}) => {
  return (
    <div className="analysis-box">
      <h3>Option Breakdown</h3>
      <div className="chart-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', width: '100%', height: '100%', padding: '8px' }}>
          {options.map((option, index) => (
            <div key={index} style={{ padding: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255, 110, 112, 0.2)', borderRadius: '8px', backgroundColor: 'rgba(255, 110, 112, 0.05)' }}>
              <h4 style={{ color: '#FF6E70', fontSize: '10px', marginBottom: '4px', lineHeight: '1.2', wordBreak: 'break-word' }}>{option}</h4>
              <div style={{ width: '100%', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                  <Pie 
                    data={preparePieChart(index)} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="analysis-description">
        <strong>How to read:</strong> Each slice = contribution from one category.<br/>
        <strong>Look for:</strong> Larger slices = categories where this option excels.
      </p>
    </div>
  );
}; 