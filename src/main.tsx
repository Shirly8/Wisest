//MADE BY SHIRLEY HUANG
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
    const [categories, setCategories] = useState([{ name: '', metrics: [0], importance: 0 }]);

    const handleCategoryChange = (index: number, value: string) => {
      const newCategories = [...categories];
      newCategories[index].name = value;
      setCategories(newCategories);
    }
    
    const addCategory = () => {
      setCategories([...categories, {name: '', metrics: Array(options.length).fill(''), importance:0}]);
    };

    const deleteCategory =  (index: number) => {
      const newCategory = [...categories];
      newCategory.splice(index,1);
      setCategories(newCategory);
    };

    //PART 4) HANDLING THE METRICS
    const handleMetricChange = (numCategory: number, numOptions: number, value: string) => {
      const newCategory = [...categories];
      newCategory[numCategory].metrics[numOptions] = Number(value);
      setCategories(newCategory);
    };


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
          <div style = {{minWidth:'850px'}}>
          <img src = {logo} style = {{display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '10%', height: 'auto'}} />
          <h1 style = {{fontSize:'30px'}}> List your options: </h1>


          {/* Expands the text field dpending on the index*/}
          {options.map((option, index) => (
          <div key={index} style={{marginBottom: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                style={{width: '70vw', maxWidth: '850px', height: '40px'}}
              />

              <Buttons btnClass="small-button" onClick={() => addOption()} buttonLabel="+"/>
              <Buttons btnClass="small-button" onClick={() => deleteOption(index)} buttonLabel="-"/>
            </div>
            <label style={{fontSize:'15px', textAlign: 'center', marginTop:'3px', marginBottom:'10px'}}> Choice {index+1}: </label>
          </div>
        ))}





            {/*PART 3) CATEGORIES*/}
            <div>
            <h1 style = {{fontSize:'30px'}}>Category: </h1>
            <h2 style = {{fontSize:'20px'}}> Define custom categories and metrics for each option: </h2>

              <div style = {{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap:'15px', borderRadius: '20px'}}>
          
              {categories.map((category, categoryindex) => (
                <div key={categoryindex} style={{marginBottom: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid gray', borderRadius: '20px'}}>

                <div style = {{backgroundColor: '#C13B34', width:'100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0px', borderRadius: '20px 20px 0 0'}}>
                <label style = {{fontWeight: '900', color: 'white'}}> Category #{categoryindex+1}: </label>
                <input
                value = {category.name}
                onChange = {(e) => handleCategoryChange(categoryindex, e.target.value)}           
                className = "categoryText"/>
              </div>

 
            {/* PART 4) EXPANDING OPTIONS PER CATEGORY*/}
            <label style = {{margin: '10px', fontWeight: '900'}}>Metrics </label>
            {options.map((option, optionindex) => (
                <div key={optionindex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               
                <span style = {{color: '#FB7F79'}}> {option} </span>  {/* Display option*/}
              <input
              value = {category.metrics[optionindex]} //CREATES A TEXT FIELD ARRAY OF AN ARRAY
              onChange = {(e) => handleMetricChange(categoryindex, optionindex, e.target.value)}
              style = {{width: '130%', height:'30px', marginBottom:'10px'}}
           />
           </div>
            ))}
              <Buttons btnClass="long-button" onClick={() => addCategory()} buttonLabel="Add Category"/>
              <Buttons btnClass="long-button" onClick={() => deleteCategory(categoryindex)} buttonLabel="Delete Category"/>

            </div>
              ))}

              </div>
              </div>
              
        </div>
        
        )}
        </div>
    );
  };
export default WiserChoice;
