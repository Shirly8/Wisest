import React from 'react';
import './styles/utilities.css';

interface MetricOptionsProps {
  index: number;
  setMetricTypes: React.Dispatch<React.SetStateAction<number[]>>;
  options: string[];
  metricTypes: number[];
  categories: { title: string; metrics: (number | string)[]; importance: number }[];
  handleMetricChange: (index: number, optionIndex: number, value: string) => void;
  addCategory: () => void;
  deleteCategory: (index: number) => void;
}

const MetricOptions: React.FC<MetricOptionsProps> = ({ index, options, metricTypes, categories, handleMetricChange }) => {
  const category = categories[index];

  return (
    <div>
      <div className="t-lbl mb-6px">Values per offering</div>
      <div className="vg">
        {options.map((option, optionindex) => (
          <React.Fragment key={optionindex}>
            <span className="vo">{option || '\u2014'}</span>

            {(metricTypes[index] === 0 || metricTypes[index] === 1) && (
              <input
                className="fi-n"
                type="number"
                value={categories[index].metrics[optionindex] || ''}
                placeholder="0"
                onChange={(e) => handleMetricChange(index, optionindex, e.target.value)}
              />
            )}

            {(metricTypes[index] === 2 || metricTypes[index] === 3) && (
              <div className="metric-toggle">
                <label>
                  <input type="radio" value="Yes"
                    checked={category.metrics[optionindex] === 1}
                    onChange={(e) => handleMetricChange(index, optionindex, e.target.value)} />
                  Yes
                </label>
                <label>
                  <input type="radio" value="No"
                    checked={category.metrics[optionindex] === 0}
                    onChange={(e) => handleMetricChange(index, optionindex, e.target.value)} />
                  No
                </label>
              </div>
            )}

            {metricTypes[index] === 4 && (
              <div className="oracle-scale">
                <input type="range" min="1" max="10"
                  value={category.metrics[optionindex] || 5}
                  style={{ '--pct': `${((Number(category.metrics[optionindex]) || 5) - 1) / 9 * 100}%` } as React.CSSProperties}
                  onChange={(e) => handleMetricChange(index, optionindex, e.target.value)} />
                <span className="oracle-scale-val">{category.metrics[optionindex] || 5}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MetricOptions;
