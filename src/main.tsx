import React, {useState, useEffect} from 'react';
import logo from './images/logo.png'
import MetricOptions from './MetricOptions';
import Importance from './Importance';
import CalculateDecision from './CalculateDecision';
import Gemini from './Gemini'
import gemini from './images/gemini.png';



const Main: React.FC <{reset: () => void, id: string}>= ({reset, id}) => {

  //PART 2) OPTIONS -> Ability to add or delete Options
  const [options, setOptions] = useState(['']);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, '']);
  }

  const deleteOption = (index: number) => {
    const newoptions = [...options];
    newoptions.splice(index,1);
    setOptions(newoptions)
  }

  //PART 3) CATEGORIES - Ability to add/delete categories
  // BASED ON TITLE, Metrics (Array) and Importance
  const [categories, setCategories] = useState([{ title: '', metrics: Array(options.length).fill(''), importance: 0 }]);

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index].title= value;
    setCategories(newCategories)
  }

  const addCategory = () => {
    const newCategory = { title: '', metrics: Array(options.length).fill(0), importance: 0 };
    const newCategories = [...categories, newCategory];
    const newMetricTypes = [...metricTypes, 0];

    // Update the state
    setCategories(newCategories);
    setMetricTypes(newMetricTypes);

  }
  
  const deleteCategory = (index: number) => {
    const deletecategory = [...categories];
    deletecategory.splice(index,1)
    setCategories(deletecategory)
  }


 //PART 4) HANDLING THE METRICS
 const [metricTypes, setMetricTypes] = useState(Array(options.length).fill(0));

 const handleMetricChange = (numCategory: number, numOptions: number, value: string) => {
  setCategories(prevCategories => {
    const newCategories = [...prevCategories];

    switch (metricTypes[numCategory]) {
      // HIGHER IS BETTER
      case 0:
        newCategories[numCategory].metrics[numOptions] = value;
        break;

      // LOWER IS BETTER
      case 1:
        newCategories[numCategory].metrics[numOptions] = value;
        break;

      // YES IS GOOD
      case 2:
        newCategories[numCategory].metrics[numOptions] = value === 'Yes' ? 1 : 0;
        break;

      // NO IS GOOD
      case 3:
        newCategories[numCategory].metrics[numOptions] = value === 'No' ? 1 : 0;
        break;

      // USER-DEFINED RANKING
      case 4:
        newCategories[numCategory].metrics[numOptions] = Number(value);
        break;

      default:
        break;
    }

    return newCategories;
  });
};



   //PART 5) NEXT PAGE - SETTING IMPORTANCE
   const [importance, setImportance] = useState(false);

  //PART 6) CALCULATING THE BEST DECISION
  const [decision, setDecision] = useState(false);


  //PART 7) LEVERAGE AI TO MAKING DECISION
  const [geminibox, setGeminibox] = useState(false);

  const toggleGemini = () => {
    setGeminibox(prevState => !prevState);
  };

  const [mainConsiderations, setMainConsiderations] = useState('');
  const [choiceConsiderations, setChoiceConsiderations] = useState<{ [key: string]: string }>({});

  
    //RETRIEVAL OPTION: 
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/get_decision/${id}`);
          if (!response.ok) {
            throw new Error(`Decision with ID ${id} not found`);
          }
          const data = await response.json();
          console.log('Fetched data:', data);  // Debug log
          setOptions(data.options || ['']);
          setCategories(data.categories || [{ title: '', metrics: Array(options.length).fill(0), importance: 0 }]);
          setMetricTypes(data.metricTypes || Array(options.length).fill(0));
          setMainConsiderations(data.mainConsideration || '');
          setChoiceConsiderations(data.choiceConsiderations || {});
        } catch (error) {
          console.error('Error fetching saved data', error);
        }
      };
    
      fetchData();
    }, [id]);
    
  

  return (
    decision ? (
      <CalculateDecision
      categories={categories} 
       options={options} 
       metricTypes={metricTypes} 
       setDecision={setDecision}
       reset={reset}
      choiceConsiderations={choiceConsiderations} 
       mainConsideration= {mainConsiderations}
       setCategories = {setCategories}
       setOptions={setOptions}
       setMetricTypes = {setMetricTypes}
       setMainConsideration = {setMainConsiderations}
       setChoiceConsiderations = {setChoiceConsiderations}
        />
       
    ) : importance ? (
      <Importance categories={categories} setCategories={setCategories} setImportance={setImportance} setDecision={setDecision}/>
    ) : (
    <div>
      <header>
      <img src = {logo} className = 'App-logo'></img>
      </header>

      <div className = 'OptionContainer'>
        <h1 style = {{fontSize:'30px'}}>List your options: </h1>


        {/* PART 2) SETTING CHOICES */}
        {options.map((option,index) => (
          <div key = {index} className = 'optionbox'>
      
            <input
            value = {option}
            placeholder= {`Choice ${index+1}`}
            onChange = {(e) => handleOptionChange(index, e.target.value)}
            className = "optionText"
            style={{width: '70vw', maxWidth: '850px', height: '40px'}}
            >
            </input> 

            <button className = "addremove" onClick = {() => addOption()}>+</button>
            <button className = "addremove" onClick = {() => deleteOption(index)}>-</button>
          </div>
        ))}

        {/* PART 3) CATEGORIES */}
        <div>
        <h1 style = {{fontSize:'30px'}}>Category: </h1>
        <h2> Define custom categories and metrics for each option: </h2>

        <div className='categoryboxes'>
        {categories.map((category, index) => (
          <div key={index} className='individualbox'>
            <div className='categoryheadings'>
              <label style={{ fontWeight: '900', color: 'white' }}>Category #{index + 1}</label>
              <input
                value={category.title}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                className="categoryText"
                style={{ width: '90%' }}

      />

      {/* PART 3A) DROP DOWN MENUS */}
            <label style={{ fontWeight: '900', color: 'white' }}> Metric Type: </label>
      <select
        value={metricTypes[index]}
        onChange={(e) => setMetricTypes(prevTypes => {
          const newTypes = [...prevTypes];
          newTypes[index] = Number(e.target.value);
          return newTypes;
        })}
        className="dropdown"
      >
        <option value={0}>Higher values are optimal</option>
        <option value={1}>Lower values are optimal</option>
        <option value={2}>'Yes' is optimal</option>
        <option value={3}>'No' is optimal</option>
        <option value={4}>Assign ratings to each option</option>
      </select>
    </div>

      {/* Pass the entire categories array */}
      <MetricOptions 
        index={index}
        setMetricTypes={setMetricTypes}
        options={options}
        metricTypes={metricTypes}
        categories={categories}
        handleMetricChange={handleMetricChange}
        addCategory = {addCategory}
        deleteCategory = {deleteCategory}
      />
  </div>
))}

         </div>
        </div>


    <div>
      <button onClick = {toggleGemini}
      className = "geminibutton" style = {{width: "100%",display: 'flex', alignItems: 'center', justifyContent: 'center'}}> 
        <img src = {gemini} style = {{width: '3%', height: '4%'}}></img>
        Analyze with Gemini AI </button>
    </div>

    
    {geminibox && (
      <Gemini
      options = {options}
      setMainConsiderations={setMainConsiderations}
      setChoiceConsiderations = {setChoiceConsiderations}
      MainConsiderations={mainConsiderations}
      choiceConsiderations={choiceConsiderations}
      />
    )}

      </div>
      <button className='startbutton' onClick={reset}>Back</button>
      <button className = "startbutton" onClick = {() => setImportance(true)}>Next</button>
    </div>
    )
  );
};

export default Main;
