import React, {useState, useEffect} from 'react';
import './styles/screen-define.css';
import './styles/utilities.css';
import Nav from './components/Nav';
import Orb from './components/Orb';
import { useOrbParallax } from './hooks/useOrbParallax';
import MetricOptions from './MetricOptions';
import Importance from './Importance';
import CalculateDecision from './CalculateDecision';
import { supabase } from './supabaseClient';

interface MainProps {
  reset: () => void;
  selectedDecisionId: string | null;
  setSelectedDecisionId: React.Dispatch<React.SetStateAction<string | null>>;
  showDecisionHistory: () => void;
  demoMode?: boolean;
  skipMetricsPage?: boolean;
  demoOptions?: string[];
  demoCategories?: { title: string; metrics: number[]; importance: number }[];
  demoMetricTypes?: number[];
  demoMainConsideration?: string;
  demoChoiceConsiderations?: { [key: string]: string };
  autoOpenGemini?: boolean;
  onDemoCompleted?: (feedback: string) => void;
  demoFeedback?: string;
  onBackToMetrics?: () => void;
}

const ArrowSvg = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5h9M6.5 3l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Main: React.FC<MainProps> = ({
  reset,
  selectedDecisionId,
  setSelectedDecisionId,
  showDecisionHistory,
  demoMode = false,
  skipMetricsPage = false,
  demoOptions,
  demoCategories,
  demoMetricTypes,
  demoMainConsideration,
  demoChoiceConsiderations,
  autoOpenGemini = false,
  onDemoCompleted,
  demoFeedback = '',
  onBackToMetrics
}) => {
  // 1) OPTIONS
  const [options, setOptions] = useState(demoMode && demoOptions ? demoOptions : ['']);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, '']);
  };

  const deleteOption = (index: number) => {
    if (options.length < 2) return;
    const newoptions = [...options];
    newoptions.splice(index, 1);
    setOptions(newoptions);
  };

  // 2) CATEGORIES
  const [categories, setCategories] = useState(
    demoMode && demoCategories
      ? demoCategories
      : [{ title: '', metrics: Array(options.length).fill(''), importance: 0 }]
  );

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index].title = value;
    setCategories(newCategories);
  };

  const addCategory = () => {
    const newCategory = { title: '', metrics: Array(options.length).fill(0), importance: 0 };
    setCategories([...categories, newCategory]);
    setMetricTypes([...metricTypes, 0]);
  };

  const deleteCategory = (index: number) => {
    const deletecategory = [...categories];
    deletecategory.splice(index, 1);
    setCategories(deletecategory);
  };

  // 3) METRIC TYPES
  const [metricTypes, setMetricTypes] = useState(
    demoMode && demoMetricTypes ? demoMetricTypes : Array(options.length).fill(0)
  );

  const handleMetricChange = (numCategory: number, numOptions: number, value: string) => {
    setCategories(prevCategories => {
      const newCategories = [...prevCategories];
      switch (metricTypes[numCategory]) {
        case 0: newCategories[numCategory].metrics[numOptions] = value; break;
        case 1: newCategories[numCategory].metrics[numOptions] = value; break;
        case 2: newCategories[numCategory].metrics[numOptions] = value === 'Yes' ? 1 : 0; break;
        case 3: newCategories[numCategory].metrics[numOptions] = value === 'No' ? 1 : 0; break;
        case 4: newCategories[numCategory].metrics[numOptions] = Number(value); break;
        default: break;
      }
      return newCategories;
    });
  };

  // 4) NAVIGATION STATES — Use screen state instead of booleans
  type Screen = 'options' | 'criteria' | 'importance' | 'decision';
  const [screen, setScreen] = useState<Screen>(skipMetricsPage && demoMode ? 'decision' : 'options');

  useEffect(() => {
    if (skipMetricsPage && demoMode) setScreen('decision');
  }, [skipMetricsPage, demoMode]);

  // 5) DECISION CONTEXT
  const [mainConsiderations, setMainConsiderations] = useState(
    demoMode && demoMainConsideration ? demoMainConsideration : ''
  );
  const [choiceConsiderations, setChoiceConsiderations] = useState<{ [key: string]: string }>(
    demoMode && demoChoiceConsiderations ? demoChoiceConsiderations : {}
  );
  const [decisionName, setDecisionName] = useState<string>('');

  // 6) DATA LOADING
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadedDecisionId, setLastLoadedDecisionId] = useState<string | null>(null);

  useEffect(() => {
    const loadDecisionData = async () => {
      if (selectedDecisionId !== lastLoadedDecisionId) {
        setDataLoaded(false);
        setLastLoadedDecisionId(selectedDecisionId);
      }
      if (selectedDecisionId && !dataLoaded) {
        try {
          const { data, error } = await supabase
            .rpc('get_decision', { p_decision_id: selectedDecisionId });
          if (error) return;
          if (data) {
            setDecisionName(data.title || '');
            setMainConsiderations('');
            const optionNames = data.options.map((opt: any) => opt.name);
            setOptions(optionNames);
            const categoryData = data.categories.map((cat: any) => ({
              title: cat.name, metrics: Array(optionNames.length).fill(0), importance: cat.importance
            }));
            setCategories(categoryData);
            setMetricTypes(data.categories.map((cat: any) => cat.higher_is_better ? 0 : 1));
            const considerations: { [key: string]: string } = {};
            data.options.forEach((opt: any) => { if (opt.note) considerations[opt.name] = opt.note; });
            setChoiceConsiderations(considerations);
            const newCategories = [...categoryData];
            data.values.forEach((val: any) => {
              const category = data.categories.find((cat: any) => cat.id === val.category_id);
              const option = data.options.find((opt: any) => opt.id === val.option_id);
              if (category && option) {
                const ci = data.categories.indexOf(category);
                const oi = data.options.indexOf(option);
                if (ci !== -1 && oi !== -1) newCategories[ci].metrics[oi] = val.value;
              }
            });
            setCategories(newCategories);
            setDataLoaded(true);
          }
        } catch (err) { /* Handle silently */ }
      } else if (!selectedDecisionId && !demoMode) {
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
  }, [selectedDecisionId, dataLoaded, lastLoadedDecisionId, demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validation
  const [validationError, setValidationError] = useState('');
  const validate = () => {
    if (options.filter(o => o.trim()).length < 2) { setValidationError('Two offerings minimum.'); return false; }
    if (categories.length === 0) { setValidationError('At least one criterion required.'); return false; }
    if (options.some(o => !o.trim())) { setValidationError('All offerings need names.'); return false; }
    setValidationError('');
    return true;
  };

  useOrbParallax(['s2-mini'], ['s2-spec']);

  // ════ RENDER ════
  if (screen === 'decision') {
    return (
      <CalculateDecision
        categories={categories} options={options} metricTypes={metricTypes}
        setDecision={() => setScreen('criteria')} reset={reset}
        choiceConsiderations={choiceConsiderations} mainConsideration={mainConsiderations}
        setCategories={setCategories} setOptions={setOptions} setMetricTypes={setMetricTypes}
        setMainConsideration={setMainConsiderations} setChoiceConsiderations={setChoiceConsiderations}
        selectedDecisionId={selectedDecisionId} showDecisionHistory={showDecisionHistory}
        decisionName={decisionName} setDecisionName={setDecisionName}
        demoMode={demoMode} demoFeedback={demoFeedback}
        onBackToMetrics={() => { setScreen('criteria'); if (onBackToMetrics) onBackToMetrics(); }}
        onDemoCompleted={onDemoCompleted}
      />
    );
  }

  if (screen === 'importance') {
    return (
      <Importance
        categories={categories} setCategories={setCategories}
        setImportance={() => setScreen('decision')} setDecision={() => setScreen('decision')}
        metricTypes={metricTypes} options={options}
        mainConsiderations={mainConsiderations} setMainConsiderations={setMainConsiderations}
        choiceConsiderations={choiceConsiderations} setChoiceConsiderations={setChoiceConsiderations}
        reset={reset}
      />
    );
  }

  // CRITERIA SCREEN
  if (screen === 'criteria') {
    return (
      <div className="scr">
        <Nav currentStep={2} stepLabel="II. Define what matters" onLogoClick={reset}
          rightAction={<button className="btn btn-g btn-sm" onClick={() => setScreen('options')}>&larr; Back</button>} />
        <div className="crit-pane sroll">
          <div className="rsb flex-shrink-0">
            <div className="col gap-sp2">
              <h2 className="t-head">What shall be judged?</h2>
              <p className="t-sm">Each criterion is a dimension the oracle will weigh against your options.</p>
            </div>
            <span className="t-lbl">{categories.length} criteria</span>
          </div>
          <div className="crit-grid">
            {categories.map((category, index) => (
              <div key={index} className="cc">
                <div className="cc-top">
                  <span className="cc-badge">{index + 1}</span>
                  <input className="fi-ln" type="text" value={category.title}
                    placeholder="Criterion name..." onChange={(e) => handleCategoryChange(index, e.target.value)} />
                  <button className="icn ml-auto" onClick={() => deleteCategory(index)}>&times;</button>
                </div>
                <div>
                  <div className="t-lbl mb-sp2">Direction</div>
                  <select className="fi-sel" value={metricTypes[index]}
                    onChange={(e) => setMetricTypes(prev => { const n = [...prev]; n[index] = Number(e.target.value); return n; })}>
                    <option value={0}>&uarr; Higher is better</option>
                    <option value={1}>&darr; Lower is better</option>
                    <option value={2}>Yes is optimal</option>
                    <option value={3}>No is optimal</option>
                    <option value={4}>Assign ratings (1-10)</option>
                  </select>
                </div>
                <MetricOptions index={index} setMetricTypes={setMetricTypes} options={options}
                  metricTypes={metricTypes} categories={categories} handleMetricChange={handleMetricChange}
                  addCategory={addCategory} deleteCategory={deleteCategory} />
              </div>
            ))}
            <div className="add-cc" onClick={addCategory}>
              <div className="add-plus">+</div>
              <span className="t-lbl">Add criterion</span>
            </div>
          </div>
        </div>
        <div className="btm-bar">
          <span className="err">{validationError}</span>
          <button className="btn btn-g" onClick={() => setScreen('options')}>&larr; Back</button>
          <button className="btn btn-p" onClick={() => { if (validate()) setScreen('importance'); }}>
            Set the weights <ArrowSvg />
          </button>
        </div>
      </div>
    );
  }

  // OPTIONS SCREEN (default/initial)
  return (
    <div className="scr">
      <Nav currentStep={1} stepLabel="I. Define your options" onLogoClick={reset}
        rightAction={<button className="btn btn-g btn-sm" onClick={reset}>&larr; Exit</button>} />
      <div className="s1-layout">
        <div className="s1-content">
          <div className="s1-header">
            <h2 className="t-head">What are you deciding between?</h2>
            <p className="t-sm">Add 2-8 options you're considering. Be specific—this helps the oracle make better recommendations.</p>
          </div>

          <div className="s1-options">
            {options.map((option, index) => (
              <div key={index} className="s1-option-row">
                <span className="s1-num">{String(index + 1).padStart(2, '0')}</span>
                <input className="fi" type="text" value={option} placeholder="Option name..."
                  onChange={(e) => handleOptionChange(index, e.target.value)} />
                <button className="icn" onClick={() => deleteOption(index)}>&times;</button>
              </div>
            ))}
          </div>

          <button className="btn-add" onClick={addOption}>+ Add option</button>
        </div>

        <div className="s1-sidebar">
          <Orb size="80px" id="s2-mini" specId="s2-spec" eightSize=".85rem" showShadow={false} />
          <span className="t-lbl text-center mt-sp4">The oracle awaits</span>
        </div>
      </div>

      <div className="btm-bar">
        <span className="err">{validationError}</span>
        <button className="btn btn-p" onClick={() => { if (options.filter(o => o.trim()).length >= 2) setScreen('criteria'); else setValidationError('Two options minimum.'); }}>
          Define criteria <ArrowSvg />
        </button>
      </div>
    </div>
  );
};

export default Main;
