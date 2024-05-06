//MADE BY SHIRLEY HUANG
import React, { useState, useEffect } from 'react';
import Buttons from './Buttons'; 
import Buffer from './Buffer'; 
import '../css/WiserChoice.css';
import logo from '../images/logo.png';
import mainimg from '../images/main.png';
import final from '../images/final.png';

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
    const [metricTypes, setMetricTypes] = useState(Array(options.length).fill(0));

    const handleMetricChange = (numCategory: number, numOptions: number, value: string) => {
      setCategories(prevCategories => {
        const newCategories = [...prevCategories];


        //IF STATEMENT FOR THE RANKING
        switch (metricTypes[numCategory]) {
          case 0: //Higher the better
              newCategories[numCategory].metrics[numOptions] = Number(value);
          break;
          
          case 1: //Lower the better
            newCategories[numCategory].metrics[numOptions] = Number(value);
            break;

       case 2: //Yes is good
        newCategories[numCategory].metrics[numOptions] = value === 'Yes' ? 1 : 0;
        break;

      case 3:  //No is good
      newCategories[numCategory].metrics[numOptions] = value === 'No' ? 1 : 0;
      break;
    

          case 4: // User-defined ranking
          newCategories[numCategory].metrics[numOptions] = Number(value);
          break;

          default:
            break;

        }
        return newCategories;
      });
    };


    //PART 5) HANDLING IMPORTANCE
    const [rank, setRank] = useState(false);

    const handleImportance = (index:number, value:number) => {
      const newCategories = [...categories];
      newCategories[index].importance = value;
      setCategories(newCategories);
    };

    
    //PART 6) MAKING THE FINAL DECISION
    const [decisionmade, setDecisionPage] = useState(false);

    const [scores, setScores] = useState ([0]);

    //6.A) CALCULATE SCORES
    const calculateScore = () => {
      //APPLY NOMALIZATION: Find the maximum value in each cateogry
      const maxVal = categories.map(category => Math.max(...category.metrics));
    
      //Calculate scores in each item of the array
      const scores = options.map ((option, optionindex) => {
        let Eachscore = 0;
        categories.forEach((category,categoryIndex) => {
    
          let metricValue = category.metrics[optionindex];
          // Invert the metric value if lower is better
          if (metricTypes[categoryIndex] === 1) {
            metricValue = 1 / metricValue;
          }
    
          //Normalize the values in the metrics by dividing maximum value in each category
          const normalizedMetric = metricValue/maxVal[categoryIndex];
          Eachscore += normalizedMetric*category.importance;
        }) 
        return Eachscore; //Return score for each option
      })
    
      return scores;
    };
    

    //6.B) Determine the best score
    const [bestDecision, setBestDecision] = useState('');

    useEffect(() => {
      if (decisionmade) {
        const scores = calculateScore();
        const final  = Math.max(... scores);
        const bestOptionIndex = scores.indexOf(final);

        setScores(scores);
        setBestDecision(options[bestOptionIndex]);
      }

    }, [decisionmade]);

    //DISPLAY THE RESULT
      const sortedCategories = [...categories].sort((a, b) => b.importance - a.importance);
    

    //PART 7) RESET
    const reset = () => {
      setStart(false);
      setOptions(['']);
      setCategories([{ name: '', metrics: [0], importance: 0 }]);
      setRank(false);
      setDecisionPage(false);
      setScores([0]);
      setBestDecision('');    
    }
    
    // RENDER COMPONENT JSX
    return (
    <div>
          {
          !decisionmade ? (
          !rank ? (
          !start ? (
            //PART 1) GET STARTED 
             <div style={{ flex: 1 }}>
            <img src = {mainimg} style = {{display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '100vw', height: '38vw', objectFit: 'cover'}} />
            <div style = {{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '-50px', marginRight: '10px'}}> <img src = {logo} style = {{width: '5%'}}></img><h1> Wisest </h1> </div>
            <h2 style={{ marginBottom: '10px',textAlign: 'center'}}>Stuck between endless options and possibilities? Wisest guides you to the wisest choice! Our simple decision-making algorithm takes account of all your metrics and categories. See how it works </h2>
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
                className = "optionText"
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

                   {/*Dropdown Option*/}
                   <label style={{ fontWeight: '900', color: 'white' }}> Metric Type: </label>

              <select
              onChange = {(e) => setMetricTypes(prevTypes => {
                const newTypes = [...prevTypes];
                newTypes[categoryindex] = Number(e.target.value);
                return newTypes;
              })}
              className = "dropdown"
              >
          <option value={0}>Higher values are optimal</option>
            <option value={1}>Lower values are optimal</option>
            <option value={2}>'Yes' is optimal</option>
            <option value={3}>'No' is optimal</option>
            <option value={4}>Assign ratings to each option</option>

              </select>

              </div>

 
            {/* PART 4) EXPANDING OPTIONS PER CATEGORY*/}
            <label style = {{margin: '10px', fontWeight: '900'}}>Metrics: </label>
            {options.map((option, optionindex) => (
                <div key={optionindex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
               
                <span style = {{color: '#FB7F79'}}> {option} </span>  {/* Display option*/}
              
           
   {/*Scale 1 to 10*/}
{metricTypes[categoryindex] === 4 ? (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', marginTop:'5px'}}>
    <input type="range" min="1" max="10" value={categories[categoryindex].metrics[optionindex] || ''} onChange={(e) => handleMetricChange(categoryindex, optionindex, e.target.value)} />
    <label>{categories[categoryindex].metrics[optionindex]}</label>
  </div>
) : metricTypes[categoryindex] ===2 || metricTypes[categoryindex] ===3 ? (
  <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px', marginBottom:'15px' }}>
    <label>
      Yes
      <input type="radio" value="Yes" checked={metricTypes[categoryindex] === 2 ? categories[categoryindex].metrics[optionindex] === 1 : categories[categoryindex].metrics[optionindex] === 0} onChange={(e) => handleMetricChange(categoryindex, optionindex, e.target.value)} />
    </label>
    <label>
      No
      <input type="radio" value="No" checked={metricTypes[categoryindex] === 2 ? categories[categoryindex].metrics[optionindex] === 0 : categories[categoryindex].metrics[optionindex] === 1} onChange={(e) => handleMetricChange(categoryindex, optionindex, e.target.value)} />
    </label>
  </div>
) : (
  <input type="number" step="any" value={categories[categoryindex].metrics[optionindex] || ''} onChange={(e) => handleMetricChange(categoryindex, optionindex, e.target.value)} style={{ width: '130%', height: '30px', marginBottom: '10px' }} />
)}
</div>

            ))}
              <Buttons btnClass="long-button" onClick={() => addCategory()} buttonLabel="Add Category"/>
              <Buttons btnClass="long-button" onClick={() => deleteCategory(categoryindex)} buttonLabel="Delete Category"/>

            </div>
              ))}

              </div>
              </div>
              <div className = "container">
              <Buttons btnClass = "main-button" onClick={() => setRank(true)} buttonLabel="Next"/> 

              </div>

              
        </div>
        
        )
        ): (

          //PART 5) HANDLING THE IMPORTANCE
          <div className = "container2">
          <img src = {logo} style = {{display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '10%', height: 'auto'}} />
          <h1 style = {{fontSize:'30px'}}>Category Importance: </h1>
          <h2 style={{ textAlign: 'center', fontSize:'20px'}}>Rank the importance of each category on the scale from 1 to 10.</h2>

          {categories.map ((category, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style = {{width: '20%'}}>
          <label> <h2>{category.name}:</h2></label>
          </div>
          <div style={{ width: '80%' }}>
              <input
              type = "range"
              min ="0"
              max = "10"
              value = {category.importance}
              onChange = {(e) => handleImportance(index, Number(e.target.value))}
              className = "scale"
              />
                 </div>

              <span className = "scaleText">{category.importance}</span>
              </div>
              
          ))}

        <div className = "container" style = {{display: 'fixed', bottom: '10px'}}>

             <Buttons btnClass = "main-button" onClick={() => setRank(false)} buttonLabel="Back"/> 
              <Buttons btnClass = "main-button" onClick={() => setDecisionPage(true)} buttonLabel="Next"/> 

              </div>
          </div>

          )

          ) : (

            <div>
              <Buffer />
        

              <h2 style = {{padding: "0px"}}> The best decision for you is: </h2>
     

              <div style={{
              backgroundImage: `url(${final})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              padding: '50px'
            }}>   
                  
              <h1 style = {{fontSize: '100px'}}>{bestDecision}</h1>

              </div>
              <div className="container" style={{display: 'flex', flexDirection: 'column'}}>

                <h2 style = {{color: 'white'}}> Find out your ranks and scores below: </h2>

              {sortedCategories.map((category, categoryIndex) => (
      <div className="CategoryScores" key={categoryIndex}>
      <h2 style={{backgroundColor: '#E46859', fontSize: '20px', color: 'white', fontWeight: '900', padding: '15px', margin: '0px'}}>
        {category.name} (Importance: {category.importance})
      </h2>
        <div style={{width: '90%', textAlign: 'center', color: 'white', fontSize:'20px'}}>
      {options
              .map((option, optionIndex) => ({
                name: option,
                metric: category.metrics[optionIndex],
              }))
              .sort((a, b) => b.metric - a.metric)
              .map((option, optionIndex) => (
                <p style = {{textAlign: 'center'}} key={optionIndex}>
                  {option.name} - {option.metric}
                </p>
              ))}
          </div>
          </div>

        ))}
  </div>
                <div className = "container">
                <Buttons btnClass = "main-button" onClick={reset} buttonLabel="Restart"/>
         <Buttons btnClass = "main-button" onClick={() => setDecisionPage(false)} buttonLabel="Back"/> 
                </div>
            </div>
        
        
        )}
            {/* <img src={logo} style={{ position: 'fixed', bottom: '5px', right: '5px', width: '5%' }} /> */}

        </div>
        
    );
  };
  
export default WiserChoice;