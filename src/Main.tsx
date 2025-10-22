import React, {useState, useEffect} from 'react';
import logo from './images/logo.png'
import MetricOptions from './MetricOptions';
import Importance from './Importance';
import CalculateDecision from './CalculateDecision';
import Gemini from './Gemini'
import gemini from './images/gemini.png';
import { supabase } from './supabaseClient';

interface MainProps {
  reset: () => void;
  selectedDecisionId: string | null;
  setSelectedDecisionId: React.Dispatch<React.SetStateAction<string | null>>;
  showDecisionHistory: () => void;
}

const Main: React.FC<MainProps> = ({reset, selectedDecisionId, setSelectedDecisionId, showDecisionHistory}) => {
  // 1) OPTIONS - Add or delete choices
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

  // 2) CATEGORIES - Define criteria with title, metrics, and importance
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

    setCategories(newCategories);
    setMetricTypes(newMetricTypes);
  }
  
  const deleteCategory = (index: number) => {
    const deletecategory = [...categories];
    deletecategory.splice(index,1)
    setCategories(deletecategory)
  }

  // 3) METRIC TYPES - Handle different scoring methods
  const [metricTypes, setMetricTypes] = useState(Array(options.length).fill(0));

  const handleMetricChange = (numCategory: number, numOptions: number, value: string) => {
    setCategories(prevCategories => {
      const newCategories = [...prevCategories];

      switch (metricTypes[numCategory]) {
        case 0: // Higher is better
          newCategories[numCategory].metrics[numOptions] = value;
          break;
        case 1: // Lower is better
          newCategories[numCategory].metrics[numOptions] = value;
          break;
        case 2: // Yes is good
          newCategories[numCategory].metrics[numOptions] = value === 'Yes' ? 1 : 0;
          break;
        case 3: // No is good
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

  // 4) NAVIGATION STATES
  const [importance, setImportance] = useState(false);
  const [decision, setDecision] = useState(false);
  const [geminibox, setGeminibox] = useState(false);

  const toggleGemini = () => {
    setGeminibox(prevState => !prevState);
  };

  // 5) DECISION CONTEXT
  const [mainConsiderations, setMainConsiderations] = useState('');
  const [choiceConsiderations, setChoiceConsiderations] = useState<{ [key: string]: string }>({});
  const [decisionName, setDecisionName] = useState<string>('');

  // 6) DATA LOADING - Prevent reloading when user is editing
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadedDecisionId, setLastLoadedDecisionId] = useState<string | null>(null);

  useEffect(() => {
    const loadDecisionData = async () => {
      // Reset dataLoaded if we're loading a different decision
      if (selectedDecisionId !== lastLoadedDecisionId) {
        setDataLoaded(false);
        setLastLoadedDecisionId(selectedDecisionId);
      }

      if (selectedDecisionId && !dataLoaded) {
        try {
          const { data, error } = await supabase
            .rpc('get_decision', { p_decision_id: selectedDecisionId });

          if (error) {
            return;
          }

          if (data) {
            // Set decision name and main consideration
            setDecisionName(data.title || '');
            // Don't set mainConsideration to title - it should remain empty or be set separately
            setMainConsiderations('');
            
            // Set options
            const optionNames = data.options.map((opt: any) => opt.name);
            setOptions(optionNames);
            
            // Set categories
            const categoryData = data.categories.map((cat: any) => ({
              title: cat.name,
              metrics: Array(optionNames.length).fill(0),
              importance: cat.importance
            }));
            setCategories(categoryData);
            
            // Set metric types
            const metricTypesData = data.categories.map((cat: any) => 
              cat.higher_is_better ? 0 : 1
            );
            setMetricTypes(metricTypesData);
            
            // Set choice considerations
            const considerations: { [key: string]: string } = {};
            data.options.forEach((opt: any) => {
              if (opt.note) {
                considerations[opt.name] = opt.note;
              }
            });
            setChoiceConsiderations(considerations);
            
            // Populate the metrics
            const newCategories = [...categoryData];
            data.values.forEach((val: any) => {
              const category = data.categories.find((cat: any) => cat.id === val.category_id);
              const option = data.options.find((opt: any) => opt.id === val.option_id);
              
              if (category && option) {
                const categoryIndex = data.categories.indexOf(category);
                const optionIndex = data.options.indexOf(option);
                
                if (categoryIndex !== -1 && optionIndex !== -1) {
                  newCategories[categoryIndex].metrics[optionIndex] = val.value;
                }
              }
            });
            
            setCategories(newCategories);
            setDataLoaded(true);
          }
        } catch (err) {
          // Handle error silently
        }
      } else if (!selectedDecisionId) {
        // Reset to default state when no decision is selected
        setOptions(['']);
        setCategories([{ title: '', metrics: [''], importance: 0 }]);
        setMetricTypes([0]);
        setChoiceConsiderations({});
        setMainConsiderations('');
        setDecisionName('');
        setDataLoaded(false);
        setLastLoadedDecisionId(null);
      }
    };

    loadDecisionData();
  }, [selectedDecisionId, dataLoaded, lastLoadedDecisionId]);

  return (
    decision ? (
      <CalculateDecision
        categories={categories}
        options={options}
        metricTypes={metricTypes}
        setDecision={setDecision}
        reset={reset}
        choiceConsiderations={choiceConsiderations}
        mainConsideration={mainConsiderations}
        setCategories={setCategories}
        setOptions={setOptions}
        setMetricTypes={setMetricTypes}
        setMainConsideration={setMainConsiderations}
        setChoiceConsiderations={setChoiceConsiderations}
        selectedDecisionId={selectedDecisionId}
        showDecisionHistory={showDecisionHistory}
        decisionName={decisionName}
        setDecisionName={setDecisionName}
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

        {/* 7) OPTIONS INPUT */}
        {options.map((option,index) => (
          <div key = {index} className = 'optionbox'>
            <input
              value = {option}
              placeholder= {`Choice ${index+1}`}
              onChange = {(e) => handleOptionChange(index, e.target.value)}
              className = "optionText"
            />

            <button className = "addremove" onClick = {() => addOption()}>+</button>
            <button className = "addremove" onClick = {() => deleteOption(index)}>-</button>
          </div>
        ))}

        {/* 8) CATEGORIES SECTION */}
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

                {/* 9) METRIC TYPE SELECTION */}
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
      </div>

      {/* 10) GEMINI AI ANALYSIS */}
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

      {/* 11) NAVIGATION BUTTONS */}
      <button className='home-secondary-button' onClick={reset}>Back</button>
      <button className = "home-secondary-button" onClick = {() => setImportance(true)}>Next</button>
    </div>
    )
  );
};

export default Main;
