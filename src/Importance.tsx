import React from 'react';
import logo from './images/logo.png'

interface ImportanceProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  setCategories: React.Dispatch<React.SetStateAction<{ title: string; metrics: number[]; importance: number }[]>>;
  setImportance: React.Dispatch<React.SetStateAction<boolean>>;
  setDecision: React.Dispatch<React.SetStateAction<boolean>>;
}

const Importance: React.FC<ImportanceProps> = ({ categories, setCategories, setImportance, setDecision}) => {
  // 1) IMPORTANCE HANDLING
  const handleImportance = (index:number, value: number) => {
    const newCategories = [...categories];
    newCategories[index].importance = value;
    setCategories(newCategories);
  }

  return (
    <div>
      <header>
      <img src = {logo} className = 'App-logo clickable-logo' alt="logo" onClick={() => setImportance(false)} title="Back to Options"></img>
      </header>

      <div className = 'OptionContainer'>
      <h1>Category Importance</h1>
      <h2>Rank the importance of each category from 1 to 10</h2>

      {categories.map ((category, index) => (
          <div key={index} className = "rankingslider">
            <div className="importance-label">
              <h3>{category.title}</h3>
            </div>
            <div className="importance-slider-container">
              <input
                type = "range"
                min ="0"
                max = "10"
                value = {category.importance}
                onChange = {(e) => handleImportance(index, Number(e.target.value))}
                className = "scale"
              />
            </div>
            <div className="importance-value">
              <h3>{category.importance}</h3>
            </div>
          </div>
          ))}

          <button className = 'home-secondary-button' onClick = {() => setImportance(false)}>Back</button>
          <button className = 'home-secondary-button' onClick = {() => setDecision(true)}>Next</button>

      </div>
    </div>
  )
};

export default Importance;
