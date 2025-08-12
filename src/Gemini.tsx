import React, {useState, useEffect} from 'react';
import gemini from './images/gemini.png';

interface GeminiProps {
  options: string[];
  setMainConsiderations: React.Dispatch<React.SetStateAction<string>>;
  setChoiceConsiderations: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  MainConsiderations: string;
  choiceConsiderations: { [key: string]: string };
}

const Gemini: React.FC<GeminiProps> = ({options, setMainConsiderations, setChoiceConsiderations, MainConsiderations, choiceConsiderations}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // 1) OPTION SELECTION
  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!selectedOptions.includes(value)) {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  const handleDeleteOption = (option: string) => {
    setSelectedOptions(selectedOptions.filter((o) => o !== option));
  };

  // 2) CONSIDERATIONS HANDLING
  const handleMainConsiderationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainConsiderations(e.target.value);
  };

  const handleChoiceConsiderationsChange = (option: string, value: string) => {
    setChoiceConsiderations({ ...choiceConsiderations, [option]: value });
  };

  return (
    <div className = "geminibackground">
       <div className = 'feedback'>
        <img src = {gemini} style = {{width: '7%', height:'6%'}}></img>
        <h1 className = "Gemini">Gemini AI</h1>
      </div>
    <p>Let Gemini AI help you make the best decision. Describe your goals, challenges, hesitations, suggestsions and let our AI assists you.</p>
  
  <div className="geminicontainer2">
    <h1 style = {{fontSize: '15px', width: '20%'}}> Main Consideration </h1>
    <textarea className = 'geminitext' placeholder= 'Tell us about your overall goals and considerations in making your decision. What do you really want? What do you value in your decision?'
    value = {MainConsiderations}
    onChange = {handleMainConsiderationsChange}
    />
    </div>

    <div className="geminicontainer2">
    <h1 style = {{fontSize: '15px', width: '17%'}}> Choice Analysis </h1>

    <div style = {{width: "90%", margin: '0%'}}>
    <select className = "geminioptions"  onChange = {handleOptionChange}>
      <option value = ""> Select your choices </option>
      {options.map((option,index) => (
        <option key = {index} value = {option}>
            {option}
        </option>
      ))}
    </select>

    {selectedOptions.map((option, index) => (
      <div key = {index}>
        <h4 className = "geminiheading"> {option}</h4>
        <textarea className = 'geminitext' placeholder= 'Select your choices and list considerations you have for each options. Highlight key differences, pros and cons for this choice. '
       value={choiceConsiderations[option] || ''}
        onChange={(e) => handleChoiceConsiderationsChange(option, e.target.value)}
        />

        <button className = "geminibutton" style = {{border: 'none'} } onClick={() => handleDeleteOption(option)}>X</button>
        </div>
    ))}

    </div>
    </div>
</div>
  )
};

export default Gemini;
