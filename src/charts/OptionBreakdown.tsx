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
    <div style={{ border: '1px solid #FF6E70', borderRadius: '8px', padding: '15px', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#FF6E70', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>Option Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px', flex: 1 }}>
        {options.map((option, index) => (
          <div key={index} style={{ padding: '6px', textAlign: 'center' }}>
            <h4 style={{ color: '#FF6E70', fontSize: '10px', marginBottom: '3px', lineHeight: '1.2' }}>{option}</h4>
            <div style={{ width: '100%', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '120px' }}>
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