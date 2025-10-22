import React from 'react';

interface MetricOptionsProps {
  index: number;
  setMetricTypes: React.Dispatch<React.SetStateAction<number[]>>;
  options: string[];
  metricTypes: number[];
  categories: { title: string; metrics: (number | string)[]; importance: number }[];
  handleMetricChange: (index: number, optionIndex: number, value: string) => void;
  addCategory: () => void;
  deleteCategory: (index:number) => void;
}

const MetricOptions: React.FC<MetricOptionsProps> = ({ index, options, metricTypes, categories, handleMetricChange, addCategory, deleteCategory}) => {
  const category = categories[index];

  // 1) YES/NO RADIO BUTTONS
  const renderYesNoButtons = (optionIndex: number) => (
    <div>
      <label>
        Yes
        <input
          type="radio"
          value="Yes"
          checked={category.metrics[optionIndex] === 1}
          onChange={(e) => handleMetricChange(index, optionIndex, e.target.value)}
          className='yesnobutton'
        />
      </label>
      <label>
        No
        <input
          type="radio"
          value="No"
          checked={category.metrics[optionIndex] === 0}
          onChange={(e) => handleMetricChange(index, optionIndex, e.target.value)}
          className = 'yesnobutton'
        />
      </label>
    </div>
  );

  return (
    <div style = {{margin: '3%'}}>
      {/* 2) METRICS INPUT */}
      <div style = {{marginBottom: '7px'}}>
        <label style = {{fontWeight: '900'}}>Metrics: </label>
      </div>
      {options.map((option, optionindex) => (
        <div key = {optionindex}>
          {option === '' ? (
            <span style = {{color: '#FB7F79'}}> Choice #{optionindex + 1} </span> 
          ): (
           <span style = {{color: '#FB7F79'}}> {option} </span> 
          )}

          {/* 3) SCALING 1 TO 10 */}
          {metricTypes[index] === 4 && (
            <div className='scale'>
              <input
                type="range"
                min="1"
                max="10"
                value={category.metrics[optionindex] || 5}
                onChange={(e) => handleMetricChange(index, optionindex, e.target.value)}
              />
              <label>{categories[index].metrics[optionindex]}</label>
            </div>
          )}

          {/* 4) YES/NO BUTTONS */}
          {(metricTypes[index] === 2 || metricTypes[index] === 3) && renderYesNoButtons(optionindex)}

          {/* 5) NUMBER INPUT */}
          {(metricTypes[index] === 1 || metricTypes[index] === 0) && (
            <input
              type="text"
              value={categories[index].metrics[optionindex] || ''}
              onChange={(e) => handleMetricChange(index, optionindex, e.target.value)}
              className='numberInput'
            />
          )}
        </div>
      ))}
      
      {/* 6) CATEGORY ACTIONS */}
      <div style={{ display: 'flex', gap: '5px', marginTop: '10px', justifyContent: 'center' }}>
        <button className = "home-secondary-button" style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '0', border: 'none', minWidth: '80px' }} onClick = {() => addCategory()}> Add</button>
        <button className = "home-secondary-button" style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '0', border: 'none', minWidth: '80px' }} onClick = {() => deleteCategory(index)}> Delete </button>
      </div>
    </div>
  );
};

export default MetricOptions;
