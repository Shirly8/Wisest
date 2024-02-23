import React, { useState } from 'react';
import Buttons from './Buttons'; 
import '../css/WiserChoice.css';
import logo from '../images/logo.png';


const WiserChoice = () => {

    //PART 1) 
    const [start, setStart] = useState(false);

    //PART 2) OPTIONS
    const [options, setOptions] = useState(['']);

    const handleOptionChange = (index: number, value: string) => {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
    };

    const addOption = () => {
      setOptions([...options, '']);
    };

    const deleteOption = (index:number) => {
      const newOptions = [...options];
      newOptions.splice(index,1);
      setOptions(newOptions);
    };

    //PART 3) CATEGORIES: 

    

    // RENDER COMPONENT JSX
    return (
      <div>
        {!start ? (
          //PART 1) GET STARTED 
          <div>
          <img src = {logo} style = {{display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '30%', height: 'auto'}} />
          <h1> Wiser Choices </h1>
          <h2 style={{ textAlign: 'center' }}>Stuck between endless options and possibilities. WiserChoice guides you to the Wisest Choice! Here's how it works: </h2>
          <div className = "container">
          <Buttons btnClass = "main-button" onClick={() => setStart(true)} buttonLabel="Start Now"/> 
          </div>
        </div>
        ):(
          // PART 2) OPTIONS
          <div>
          <h2> Enter your options: </h2>

          {options.map((option, index) => (
            <div key={index}>
              <input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <Buttons btnClass = "main-button" onClick={() => deleteOption(index)} buttonLabel = "Delete Options"/>
            </div>
          ))}
              <Buttons btnClass = "main-button" onClick={() => addOption()} buttonLabel = "Add Options"/>
        </div>
        )}
        </div>
    );
  };
export default WiserChoice;
