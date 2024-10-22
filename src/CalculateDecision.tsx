import React, { useEffect, useState } from 'react';
import Buffer from './Buffer'
import ProgressBar from '@ramonak/react-progress-bar';
import gemini from './images/gemini.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {v4 as uuidv4} from 'uuid'
import Popup from './Popup';
import {Pie} from 'react-chartjs-2'
import 'chart.js/auto';



interface CalculateDecisionProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  options: string[];
  metricTypes: number[];
  setDecision: React.Dispatch<React.SetStateAction<boolean>>;
  reset: () => void;
  mainConsideration: string;
  choiceConsiderations: { [key: string]: string };
  setCategories: React.Dispatch<React.SetStateAction<{ title: string; metrics: number[]; importance: number }[]>>;
  setOptions: React.Dispatch<React.SetStateAction<string[]>>;
  setMetricTypes: React.Dispatch<React.SetStateAction<number[]>>;
  setMainConsideration: React.Dispatch<React.SetStateAction<string>>;
  setChoiceConsiderations: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const CalculateDecision: React.FC<CalculateDecisionProps> = ({ categories, options, metricTypes, setDecision, reset, mainConsideration, choiceConsiderations, setCategories, setOptions, setMetricTypes, setMainConsideration, setChoiceConsiderations}) => {


  //BEST DECISION: 
  const [bestDecision, setBestDecision] = useState<string>('');

  const [showContent, setShowContent] = useState<boolean>(false);


  const [feedback, setFeedback] = useState<string>('');


  function extractNumber(value: string | number): number {
    const numericValue = value.toString().match(/-?\d+(\.\d+)?/);
    return numericValue ? parseFloat(numericValue[0]) : NaN;
  }
  

  //PART 6) CALCUALATING SCORE
  const calculateScore = () => {
    //APPLYING MIN-MAX NORMALIZATION
    const minVal = categories.map(category => Math.min(...category.metrics));
    const maxVal = categories.map(category => Math.max(...category.metrics));


    //Calculate score in each item of the array
    const scores = options.map((_, optionIndex) => {
      let eachScore = 0;
      categories.forEach((category, categoryIndex) => {
        let metricValue = extractNumber(category.metrics[optionIndex]);

        //INVERT metric value if required (lower is better)
        if (metricTypes[categoryIndex] === 1) {
          metricValue = 1 / metricValue;
        }

        //Normalize the values in the metrics by dividing maximum value in each category
        const normalizedMetric = (metricValue - minVal[categoryIndex]) / (maxVal[categoryIndex] - minVal[categoryIndex]);
        
        //Apply Exponential Weightings
        const exponentialWeight = Math.pow(category.importance, 2);
        eachScore += normalizedMetric * exponentialWeight;
      });
      return eachScore;
    });

    return scores;
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };


  const preparePieChart = (optionIndex: number) => {
    const labels = categories.map(category => category.title);
    const data = categories.map(category => {
    const normalizedMetric = (category.metrics[optionIndex] - Math.min(...category.metrics)) / (Math.max(...category.metrics) - Math.min(...category.metrics));
    return normalizedMetric * Math.pow(category.importance, 2);
  });

  const colors = [
    '#FF6E70', '#C13B34',  '#EF5D7B', '#BB1933', '#EB4A25', '#6F032B' , '#FF0662'
  ];

  const generateColor = (index: number) => `hsl(${(index * 360) / categories.length}, 100%, 50%)`;


  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: categories.map((_, index) => colors[index] || generateColor(index))
      }
    ]
  };
};

  useEffect(() => {
    const scores = calculateScore();
    const final = Math.max(...scores);
    const bestOptionIndex = scores.indexOf(final);

    // setScores(scores);
    setBestDecision(options[bestOptionIndex]);



    //CALLING AI TO GET FEEDBACK: 
    const fetchFeedback = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/wisest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            options: options,
            categories: categories.map(category => ({
              title: category.title,
              metrics: category.metrics,
              importance: category.importance
            })),
            scores: scores.map((score, index) => ({
              option: options[index],
              score: score
            })),
            best_decision: options[bestOptionIndex],
            main_Consideration: mainConsideration,

            choice_Considerations: options.map((option) => ({
              option: option,
              consideration: choiceConsiderations[option]
            }))
          }),
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
        setFeedback(data.feedback);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setFeedback('Gemini API is not activated. To use this, please run it locally with API key.');
      }
    };

    fetchFeedback();


    setTimeout(() => {
      setShowContent(true);
    }, 5000);
  }, [categories, options, metricTypes]);


    // Sort categories by importance in descending order
   const sortedCategories = [...categories].sort((a, b) => b.importance - a.importance);

   //Sort options from the categories:
   const sortedOptionsByCategory = sortedCategories.map(category => {
    return options
      .map((option, optionIndex) => ({
        option,
        score: category.metrics[optionIndex]
      }))
      .sort((a, b) => b.score - a.score);
  });

  

  //PART 8) SAVING DECISION TO DATABASE:
  const saveDecisionToDatabase = async () => {
    const uniqueID = uuidv4();
    setUniqueID(uniqueID);
    const decisionData = {
      id: uniqueID,
      categories,
      options,
      metricTypes,
      mainConsideration,
      choiceConsiderations,
    };
    try {
      const response = await fetch('http://127.0.0.1:5000/save-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({body: JSON.stringify(decisionData),}),
      });

      const data = await response.json();
      console.log('Saved Decision Data:', decisionData);
      console.log(data.message);
      setShowPopup(true);
    } catch (error) {
      console.error('Error saving decision:', error);
    }
  };

  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [uniqueID, setUniqueID] = useState<string>('');

  const deleteDecisionFromDatabase = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/delete-decision/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setShowPopup(false)
      alert('Decision deleted. If you want to save it again, click Save')
    } catch (error) {
      console.error('Error deleting decision:', error);
    }
  };


  const handleSave = () => {
    const input = document.getElementById('content');
    if (input) {
      html2canvas(input).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Bestdecision.pdf');
      });
    }
  };
  

  return (
    <div>
      {!showContent ? (
        <Buffer />
      ) : (
        <div style = {{backgroundColor: '#060724'}}id = "content">

          {/* DISPLAYING BEST DECISION*/}
          <div className='final'>
          <h2 style = {{color: 'white', fontWeight: '900'}}>The best decision for you is:</h2>
            <h1 style={{ fontSize: '100px', minWidth: '100vw', minHeight: '10vw'}}>{bestDecision}</h1>
          </div>

          <h2 style = {{color: 'white', fontSize:'25px', marginTop: '5%', backgroundColor: '#FF6E70'}}>Category-Based Scoring </h2>


          {/* DISPLAY CATEGORY BASED SCORING*/}
          <div className = "categories-container">
          {sortedCategories.map((category, index) => (
            <div className = "CategoryScores" key = {index}>
              <h1 className = "rank"> {index+1}</h1>
            
            <h2 style={{fontSize: '20px', color: '#FF6E70', padding: '20px 0px', margin: '0px'}}>
              {category.title}

              <div style={{ width: '90%', textAlign: 'center', color: 'white', fontSize: '20px' }}>
              
             {sortedOptionsByCategory[index].map((sortedOption, optionIndex) => {
              
              const maxScore = Math.max(...category.metrics.map(extractNumber));
              const percentage = calculatePercentage(sortedOption.score, maxScore) * (category.importance / 10);
                      
                      
                return (
              
              <div key = {optionIndex} style = {{marginTop: '20px'}}>
                
                <ProgressBar 
                completed={isNaN(percentage) ? 0 : percentage}
                bgColor="#FF6E70"
                baseBgColor="#D3D3D3"
                width = "200px"
              />
                <span className='optionsrank'>{sortedOption.option}</span>
              </div>
                );
              })}

              </div>
           </h2>
            </div>
        ))}

      </div>
      <h2 style = {{color: 'white', fontSize:'25px', marginTop: '2%', backgroundColor: '#FF6E70'}}>Option-Based Scoring </h2>

        {/*DISPLAY OPTION BASED SCORING*/}
              <div>
        <div className = "categories-container">
          {options.map((option, index) => (
          <div key={index} className='optionScore'>
            <h3 style={{ color: '#FF6E70' }}>{option}</h3>
            <Pie data={preparePieChart(index)} />
          </div>
        ))}

        </div>

          </div>
      <div className = "geminibackground">

      <div className = 'feedback'>
        <img src = {gemini} style = {{width: '7%', height:'6%'}}></img>
        <h1 className = "Gemini">Gemini Says</h1>
      </div>

    
      <div className = "geminicontainer">
      <pre style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{feedback}</pre>
      
      </div>
      </div>

      <button className = 'startbutton' onClick ={()=>setDecision(false)}>Back</button>
      <button className='startbutton' onClick={saveDecisionToDatabase}>Save</button>
      <button className='startbutton' onClick={reset}>Reset</button>

      </div>
      )}

    {showPopup && (
            <Popup
              uniqueID={uniqueID}
              onClose={() => setShowPopup(false)}
              onDelete={() => deleteDecisionFromDatabase(uniqueID)}
              onCopy={() => navigator.clipboard.writeText(uniqueID)}
            />
          )}

    </div>
  );
};

export default CalculateDecision;
