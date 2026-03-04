import React, { useState } from 'react';
import './styles/screen-weights.css';
import './styles/utilities.css';
import Nav from './components/Nav';

interface ImportanceProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  setCategories: React.Dispatch<React.SetStateAction<{ title: string; metrics: number[]; importance: number }[]>>;
  setImportance: () => void;
  setDecision: () => void;
  metricTypes: number[];
  options: string[];
  mainConsiderations: string;
  setMainConsiderations: React.Dispatch<React.SetStateAction<string>>;
  choiceConsiderations: { [key: string]: string };
  setChoiceConsiderations: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  reset: () => void;
}

const dirLabel = (t: number) => {
  switch (t) {
    case 0: return '\u2191 higher is better';
    case 1: return '\u2193 lower is better';
    case 2: return 'yes is optimal';
    case 3: return 'no is optimal';
    case 4: return 'rating scale';
    default: return '';
  }
};

const ArrowSvg = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5h9M6.5 3l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Importance: React.FC<ImportanceProps> = ({
  categories, setCategories, setImportance, setDecision,
  metricTypes, options,
  mainConsiderations, setMainConsiderations,
  choiceConsiderations, setChoiceConsiderations,
  reset
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(options.filter(o => o.trim()));

  const handleImportance = (index: number, value: number) => {
    const newCategories = [...categories];
    newCategories[index].importance = value;
    setCategories(newCategories);
  };

  const handleChoiceToggle = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(o => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  return (
    <div className="scr">
      <Nav
        currentStep={3}
        stepLabel="III. Set importance weights"
        onLogoClick={reset}
        rightAction={<button className="btn btn-g btn-sm" onClick={() => setImportance()}>&larr; Back</button>}
      />
      <div className="sroll">
        <div className="s3-wrap">
          <div className="s3-glow" />
          <div className="col gap-sp3">
            <h2 className="t-head">How much does each matter?</h2>
            <p className="t-sm max-w-450">
              Drag to decree importance. 1 is a whisper &mdash; 10 is law. The oracle squares these values, so high weights carry real power over the verdict.
            </p>
          </div>

          {/* Weight sliders */}
          <div>
            {categories.map((cat, i) => (
              <div className="wt-row" key={i}>
                <div className="col">
                  <div className="wt-name">{cat.title || 'Unnamed'}</div>
                  <div className="wt-dir">{dirLabel(metricTypes[i])}</div>
                </div>
                <input
                  type="range"
                  className="wt-sl"
                  min={1}
                  max={10}
                  value={cat.importance || 1}
                  style={{ '--pct': `${((cat.importance || 1) - 1) / 9 * 100}%` } as React.CSSProperties}
                  onChange={(e) => handleImportance(i, Number(e.target.value))}
                />
                <div className="wt-val">{cat.importance || 1}</div>
              </div>
            ))}
          </div>

          {/* SPEAK TO THE ORACLE */}
          <div className="oracle-speak mt-sp8">
            <div className="speak-orb-accent" />
            <div className="speak-label-row">
              <div className="speak-orb-dot">8</div>
              <span className="t-lbl">Speak to the oracle</span>
            </div>
            <p className="speak-hint">
              What do you seek? Describe your goals, hesitations, or what you'd sacrifice. The oracle weighs this alongside the numbers.
            </p>
            <textarea
              className="fi"
              rows={3}
              placeholder="I'm early in my career and willing to sacrifice salary for growth. I want to become an engineering manager within 5 years and I value mentorship over prestige..."
              value={mainConsiderations}
              onChange={(e) => setMainConsiderations(e.target.value)}
            />
            <div className="speak-examples">
              <button className="ex-chip" onClick={() => setMainConsiderations('I want the highest long-term growth potential and am willing to sacrifice short-term comfort.')}>Long-term growth</button>
              <button className="ex-chip" onClick={() => setMainConsiderations('Work-life balance is non-negotiable \u2014 I have a family and need predictable hours.')}>Work-life balance</button>
              <button className="ex-chip" onClick={() => setMainConsiderations('I care most about compensation. I have student loans and need to maximise earnings in the next 3 years.')}>Max earnings</button>
              <button className="ex-chip" onClick={() => setMainConsiderations('I want the most prestigious brand name for future opportunities and career optionality.')}>Brand prestige</button>
            </div>

            {/* Per-choice analysis */}
            {options.filter(o => o.trim()).length > 0 && (
              <div className="choice-analysis">
                <div className="t-lbl">Per-choice considerations (optional)</div>
                <div className="speak-examples mt-0">
                  {options.filter(o => o.trim()).map((opt, i) => (
                    <button
                      key={i}
                      className={`ex-chip${selectedOptions.includes(opt) ? ' selected' : ''}`}
                      onClick={() => handleChoiceToggle(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedOptions.map((opt, i) => (
                  <div key={i} className="choice-item">
                    <span className="choice-item-label">{opt}</span>
                    <textarea
                      className="fi"
                      rows={2}
                      placeholder={`Pros, cons, and considerations for ${opt}...`}
                      value={choiceConsiderations[opt] || ''}
                      onChange={(e) => setChoiceConsiderations({ ...choiceConsiderations, [opt]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="rsb mt-sp6">
            <button className="btn btn-g" onClick={() => setImportance()}>&larr; Back to criteria</button>
            <button className="btn btn-p btn-base-large"
              onClick={() => setDecision()}>
              Consult the oracle
              <ArrowSvg />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Importance;
