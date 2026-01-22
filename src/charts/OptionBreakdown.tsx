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
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 style={{ color: '#FF6E70', fontSize: '14px', marginBottom: '2px', textAlign: 'center' }}>Option Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0px', flex: 1, overflow: 'hidden' }}>
        {options.map((option, index) => (
          <div key={index} style={{ padding: '1px', textAlign: 'center', minWidth: 0 }}>
            <h4 style={{ color: '#FF6E70', fontSize: '10px', marginBottom: '1px', lineHeight: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option}</h4>
            <div style={{ width: '100%', height: '110px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: '110px', height: '105px' }}>
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
  );
}; 