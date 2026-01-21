import React from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

interface OptionBreakdownProps {
  options: string[];
  preparePieChart: (optionIndex: number) => any;
}

export const OptionBreakdown: React.FC<OptionBreakdownProps> = ({
  options,
  preparePieChart
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#FF6E70', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>Option Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', flex: 1 }}>
        {options.map((option, index) => (
          <div key={index} style={{ padding: '6px', textAlign: 'center' }}>
            <h4 style={{ color: '#FF6E70', fontSize: '12px', marginBottom: '6px', lineHeight: '1.2' }}>{option}</h4>
            <div style={{ width: '100%', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '90px' }}>
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
      <p style={{ color: '#999', textAlign: 'center', fontSize: '10px', marginTop: '8px', lineHeight: '1.3' }}>
        <strong>How to read:</strong> Each slice = contribution from one category.<br/>
        <strong>Look for:</strong> Larger slices = categories where this option excels.
      </p>
    </div>
  );
}; 