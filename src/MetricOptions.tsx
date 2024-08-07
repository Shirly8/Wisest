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


  //FOR RADIO BUTTONS:
  const renderYesNoButtons = (optionIndex: number) => (
    <div>
      <label>
        Yes
        <input
          type="radio"
          value="Yes"
          checked={metricTypes[index] === 2 ? category.metrics[optionIndex] === 1 : category.metrics[optionIndex] === 0}
          onChange={(e) => handleMetricChange(index, optionIndex, e.target.value)}
          className='yesnobutton'
        />
      </label>
      <label>
        No
        <input
          type="radio"
          value="No"
          checked={metricTypes[index] === 2 ? category.metrics[optionIndex] === 0 : category.metrics[optionIndex] === 1}
          onChange={(e) => handleMetricChange(index, optionIndex, e.target.value)}
          className = 'yesnobutton'
        />
      </label>
    </div>
  );

  return (
    <div style = {{margin: '3%'}}>
          {/* PART 4) EXPANDING OPTIONS PER CATEGORY*/}
          <div style = {{marginBottom: '7px'}}>
          <label style = {{fontWeight: '900'}}>Metrics: </label>
          </div>
          {options.map((option, optionindex) => (
            <div key = {optionindex}>

              {/* Choices in words */}
              {option === '' ? (
                <span style = {{color: '#FB7F79'}}> Choice #{optionindex + 1} </span> 
              ): (
               <span style = {{color: '#FB7F79'}}> {option} </span> 
              )}


            {/* DISPLAYING ALL OPTIONS */}

            {/* SCALING 1 TO 10 */}
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

          {/* YES/NO BUTTONS */}
          {(metricTypes[index] === 2 || metricTypes[index] === 3) && renderYesNoButtons(optionindex)}


         {/* NUMBER INPUT */}
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
          <button className = "long-button" onClick = {() => addCategory()}> Add</button>
          <button className = "long-button" onClick = {() => deleteCategory(index)}> Delete </button>


    </div>
  );
};

export default MetricOptions;
