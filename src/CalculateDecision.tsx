import React, { useEffect, useState, useRef, useCallback } from 'react';
import Buffer from './Buffer'
import gemini from './images/gemini.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'chart.js/auto';
import { supabase } from './supabaseClient';
import SignInModal from './SignInModal';
import CurrentDecisionSection from './CurrentDecisionSection';
import DecisionNamingModal from './DecisionNamingModal';

import { 
  createTradeoffAnalysis, 
  createConfidenceAnalysis, 
  createSensitivityAnalysis, 
  createRiskAssessment,
  CategoryBreakdown,
  OptionBreakdown
} from './charts';

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
  selectedDecisionId?: string | null;
  showDecisionHistory: () => void;
  decisionName: string;
  setDecisionName: React.Dispatch<React.SetStateAction<string>>;
  demoMode?: boolean;
  demoFeedback?: string;
}

const CalculateDecision: React.FC<CalculateDecisionProps> = ({
  categories,
  options,
  metricTypes,
  setDecision,
  reset,
  mainConsideration,
  choiceConsiderations,
  setCategories,
  setOptions,
  setMetricTypes,
  setMainConsideration,
  setChoiceConsiderations,
  selectedDecisionId,
  showDecisionHistory,
  decisionName,
  setDecisionName,
  demoMode = false,
  demoFeedback = ''
}) => {
  // 1) DECISION RESULTS
  const [bestDecision, setBestDecision] = useState<string>('');
  const [showContent, setShowContent] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);

  // 2) D3 VISUALIZATIONS
  const radarChartRef = useRef<HTMLDivElement>(null);
  const comparisonChartRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);
  const riskAssessmentRef = useRef<HTMLDivElement>(null);

  // 3) STATE MANAGEMENT
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showDecisionNameInput, setShowDecisionNameInput] = useState<boolean>(false);
  
  function extractNumber(value: string | number | undefined): number {
    if (value === undefined || value === null) {
      return 0;
    }
    const stringValue = value.toString();
    const numericValue = stringValue.match(/-?\d+(\.\d+)?/);
    return numericValue ? parseFloat(numericValue[0]) : 0;
  }

  // 4) AUTHENTICATION
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (event === 'SIGNED_IN' && showSignInModal) {
        setShowSignInModal(false);
        setTimeout(() => {
          saveToDatabase();
        }, 1000);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [showSignInModal]);

  const handleDecisionNaming = () => {
    if (decisionName.trim()) {
      setShowDecisionNameInput(false);
      saveToDatabase();
    }
  };

  const handleSaveClick = () => {
    if (demoMode) {
      alert('This is a demo. Create your own decision to save!');
      return;
    }
    if (!isAuthenticated) {
      setShowSignInModal(true);
    } else {
      if (!decisionName && !selectedDecisionId) {
        setShowDecisionNameInput(true);
        return;
      }
      saveToDatabase();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleViewHistory = () => {
    if (showDecisionHistory) {
      showDecisionHistory();
    }
  };

  // 5) DATABASE OPERATIONS
  const saveDecision = async (userId: string) => {
    const decisionTitle = decisionName || mainConsideration || `Decision ${new Date().toLocaleDateString()}`;
    const decisionDescription = `Decision between: ${options.join(', ')}`;

    if (selectedDecisionId) {
      const { data, error } = await supabase
        .from('decisions')
        .update({
          title: decisionTitle,
          description: decisionDescription,
          ai_feedback: feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDecisionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data: existingDecisions, error: checkError } = await supabase
      .from('decisions')
      .select(`
        id,
        decision_options(name),
        decision_categories(name, importance)
      `)
      .eq('user_id', userId)
      .eq('title', decisionTitle);

    if (checkError) throw checkError;

    if (existingDecisions && existingDecisions.length > 0) {
      const existingDecision = existingDecisions[0];
      
      const { data, error } = await supabase
        .from('decisions')
        .update({
          description: decisionDescription,
          ai_feedback: feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDecision.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: decisionTitle,
        description: decisionDescription,
        ai_feedback: feedback
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const saveOptions = async (decisionId: string) => {
    const optionIds: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      const { data, error } = await supabase
        .from('decision_options')
        .insert({
          decision_id: decisionId,
          name: options[i],
          note: choiceConsiderations[options[i]] || null
        })
        .select()
        .single();

      if (error) throw error;
      optionIds.push(data.id);
    }
    
    return optionIds;
  };

  const saveCategoriesAndValues = async (decisionId: string, optionIds: string[]) => {
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      
      const { data: categoryData, error: categoryError } = await supabase
        .from('decision_categories')
        .insert({
          decision_id: decisionId,
          name: category.title,
          importance: category.importance,
          higher_is_better: metricTypes[categoryIndex] === 0
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
        const value = extractNumber(category.metrics[optionIndex]);
        const { error: valueError } = await supabase
          .from('decision_values')
          .insert({
            decision_id: decisionId,
            category_id: categoryData.id,
            option_id: optionIds[optionIndex],
            value: value
          });

        if (valueError) throw valueError;
      }
    }
  };

  const saveToDatabase = useCallback(async () => {
    setSaveStatus('Saving...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveStatus('Please sign in to save decisions');
        return;
      }

      const decisionData = await saveDecision(user.id);

      if (selectedDecisionId || decisionData.updated_at) {
        const decisionId = selectedDecisionId || decisionData.id;
        await supabase.from('decision_values').delete().eq('decision_id', decisionId);
        await supabase.from('decision_categories').delete().eq('decision_id', decisionId);
        await supabase.from('decision_options').delete().eq('decision_id', decisionId);
      }

      const optionIds = await saveOptions(decisionData.id);
      await saveCategoriesAndValues(decisionData.id, optionIds);

      setSaveStatus(selectedDecisionId || decisionData.updated_at ? 'Decision updated successfully! 🎉' : 'Decision saved successfully! 🎉');
      setTimeout(() => setSaveStatus(''), 5000);
      
    } catch (error) {
      setSaveStatus('Failed to save decision. Please try again.');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [selectedDecisionId]);

  // 6) SCORE CALCULATION
  const calculateScore = () => {
    const minVal = categories.map(category => Math.min(...category.metrics.map(extractNumber)));
    const maxVal = categories.map(category => Math.max(...category.metrics.map(extractNumber)));

    const scores = options.map((_, optionIndex) => {
      let eachScore = 0;
      
      categories.forEach((category, categoryIndex) => {
        let metricValue = extractNumber(category.metrics[optionIndex]);

        if (metricTypes[categoryIndex] === 1) {
          metricValue = metricValue === 0 ? 0.1 : 1 / metricValue;
        }

        const range = maxVal[categoryIndex] - minVal[categoryIndex];
        let normalizedMetric;
        
        if (range === 0) {
          normalizedMetric = 0.5;
        } else {
          if (metricTypes[categoryIndex] === 1) {
            const originalValue = extractNumber(category.metrics[optionIndex]);
            const originalNormalized = (originalValue - minVal[categoryIndex]) / range;
            normalizedMetric = 1 - originalNormalized;
          } else {
            normalizedMetric = (metricValue - minVal[categoryIndex]) / range;
          }
          normalizedMetric = Math.max(0, Math.min(1, normalizedMetric));
        }
        
        const exponentialWeight = Math.pow(category.importance, 2);
        const categoryScore = normalizedMetric * exponentialWeight;
        eachScore += categoryScore;
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
      let metricValue = extractNumber(category.metrics[optionIndex]);
      
      if (metricTypes[categories.indexOf(category)] === 1) {
        metricValue = metricValue === 0 ? 0.1 : 1 / metricValue;
      }
      
      const minVal = Math.min(...category.metrics.map(extractNumber));
      const maxVal = Math.max(...category.metrics.map(extractNumber));
      const range = maxVal - minVal;
      
      let normalizedMetric;
      if (range === 0) {
        normalizedMetric = 0.5;
      } else {
        normalizedMetric = (metricValue - minVal) / range;
        normalizedMetric = Math.max(0, Math.min(1, normalizedMetric));
      }
      
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

  // 7) MAIN CALCULATION EFFECT
  useEffect(() => {
    const scores = calculateScore();
    const final = Math.max(...scores);
    const bestOptionIndex = scores.indexOf(final);

    setBestDecision(options[bestOptionIndex]);

    // Always fetch fresh AI feedback
    const fetchFeedback = async () => {
      setIsLoadingFeedback(true);
      try {
        // Use demo feedback if in demo mode
        if (demoMode && demoFeedback) {
          setFeedback(demoFeedback);
          setIsLoadingFeedback(false);
          return;
        }

        const response = await fetch('https://wisest.onrender.com/wisest', {
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
        setFeedback('Gemini API is not activated. To use this, please run it locally with API key.');
      } finally {
        setIsLoadingFeedback(false);
      }
    };

    fetchFeedback();

    setTimeout(() => {
      setShowContent(true);
    }, 5000);
  }, [options, categories, metricTypes, mainConsideration, choiceConsiderations]);

  // 8) NORMALIZE DATA FOR CHARTS
  const normalizeForCharts = () => {
    return categories.map(category => {
      const values = category.metrics.map(extractNumber);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const range = maxVal - minVal;
      
      const normalizedMetrics = values.map(value => {
        if (range === 0) return 5; // Default to middle if no range
        
        let normalized;
        if (metricTypes[categories.indexOf(category)] === 1) {
          // Inverse metric (lower is better)
          normalized = 10 - ((value - minVal) / range) * 10;
        } else {
          // Normal metric (higher is better)
          normalized = ((value - minVal) / range) * 10;
        }
        
        return Math.max(0, Math.min(10, normalized));
      });
      
      return {
        ...category,
        metrics: normalizedMetrics
      };
    });
  };

  // 9) D3 VISUALIZATIONS
  useEffect(() => {
    if (showContent) {
      setTimeout(() => {
        const normalizedCategories = normalizeForCharts();
        createTradeoffAnalysis(radarChartRef, normalizedCategories, options, bestDecision);
        createConfidenceAnalysis(comparisonChartRef, normalizedCategories, options, bestDecision, calculateScore);
        createSensitivityAnalysis(heatmapRef, normalizedCategories, options, metricTypes, calculateScore, extractNumber);
        createRiskAssessment(riskAssessmentRef, normalizedCategories, options, metricTypes);
      }, 100);
    }
  }, [showContent, categories, options, metricTypes]);

  const sortedCategories = [...categories].sort((a, b) => b.importance - a.importance);

  const sortedOptionsByCategory = sortedCategories.map(category => {
    return options
      .map((option, optionIndex) => ({
        option,
        score: category.metrics[optionIndex]
      }))
      .sort((a, b) => b.score - a.score);
  });

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
        <div style={{backgroundColor: '#060724'}} id="content">
          {/* 10) FINAL DECISION DISPLAY */}
          <div className='final'>
            <div className='final-subtitle'>The best decision for you is:</div>
            <div className='final-decision'>{bestDecision}</div>
          </div>

          {/* 11) DECISION BREAKDOWN ANALYSIS */}
          <h2 style={{color: 'white', fontSize:'18px', marginTop: '1%', backgroundColor: '#FF6E70'}}>Decision Breakdown Analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '10px', maxWidth: '1400px', margin: '0 auto' }}>
            
            <CategoryBreakdown 
              categories={categories}
              options={options}
              metricTypes={metricTypes}
              extractNumber={extractNumber}
              calculatePercentage={calculatePercentage}
            />

            <OptionBreakdown 
              options={options}
              preparePieChart={preparePieChart}
            />

            <div style={{ border: '1px solid #FF6E70', borderRadius: '8px', padding: '15px', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{color: '#FF6E70', fontSize:'16px', marginBottom: '10px', textAlign: 'center'}}>Risk Assessment</h3>
              <div ref={riskAssessmentRef} style={{ width: '100%', height: '350px', flex: 1 }}></div>
              <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4' }}>
                <strong>How to read:</strong> Taller bars = higher risk. Red = High, Yellow = Medium, Green = Low.<br/>
                <strong>Look for:</strong> Options with lower bars = safer choices for your priorities.
              </p>
            </div>

          </div>

          {/* 12) STRATEGIC ANALYSIS DIAGRAMS */}
          <h2 className="strategic-analysis-header">Strategic Decision Analysis</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ border: '1px solid #4ECDC4', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(78, 205, 196, 0.1)', minHeight: '450px' }}>
              <h3 style={{ color: '#4ECDC4', textAlign: 'center', marginBottom: '10px', fontSize: '16px' }}>Trade-off Analysis</h3>
              <div ref={radarChartRef} style={{ width: '100%', height: '300px' }}></div>
              <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4' }}>
                <strong>How to read:</strong> Each point = one option. Top-right = best in both categories.<br/>
                <strong>Look for:</strong> Options closest to top-right corner = best balance.
              </p>
            </div>

            <div style={{ border: '1px solid #4ECDC4', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(78, 205, 196, 0.1)', minHeight: '450px' }}>
              <h3 style={{ color: '#4ECDC4', textAlign: 'center', marginBottom: '10px', fontSize: '16px' }}>Decision Confidence</h3>
              <div ref={comparisonChartRef} style={{ width: '100%', height: '300px' }}></div>
              <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4' }}>
                <strong>How to read:</strong> Taller bars = higher scores. Big gaps = confident choice.<br/>
                <strong>Look for:</strong> Clear winner with large score difference = high confidence.
              </p>
            </div>

            <div style={{ border: '1px solid #4ECDC4', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(78, 205, 196, 0.1)', minHeight: '450px' }}>
              <h3 style={{ color: '#4ECDC4', textAlign: 'center', marginBottom: '10px', fontSize: '16px' }}>Decision Stability</h3>
              <div ref={heatmapRef} style={{ width: '100%', height: '300px' }}></div>
              <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4' }}>
                <strong>How to read:</strong> ✓ = stable, ⚠ = sensitive to changes.<br/>
                <strong>Look for:</strong> Categories with ⚠ - small changes could flip your decision.
              </p>
            </div>
          </div>

          {/* 13) GEMINI FEEDBACK */}
          <div className="geminibackground">
            <div className='gemini-header'>
              <img src={gemini} className="gemini-logo"></img>
              <h1 className="gemini-title">Gemini Says</h1>
            </div>

            <div className="geminicontainer">
              {isLoadingFeedback ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <span className="loading-text">Gemini is analyzing your decision...</span>
                </div>
              ) : (
                <pre style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{feedback}</pre>
              )}
            </div>
          </div>

          <div style={{ marginTop: '40px', marginBottom: '40px', textAlign: 'center' }}>
            {saveStatus && (
              <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '15px 20px',
                borderRadius: '8px',
                backgroundColor: saveStatus.includes('success') ? '#4ECDC4' : '#FF6E70',
                color: 'white',
                zIndex: 1000,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                {saveStatus}
              </div>
            )}

            <DecisionNamingModal
              isOpen={showDecisionNameInput}
              decisionName={decisionName}
              setDecisionName={setDecisionName}
              onSave={handleDecisionNaming}
              onCancel={() => setShowDecisionNameInput(false)}
            />

            <CurrentDecisionSection
              isAuthenticated={isAuthenticated}
              options={options}
              categories={categories}
              bestDecision={bestDecision}
              selectedDecisionId={selectedDecisionId}
              saveStatus={saveStatus}
              onSaveClick={handleSaveClick}
              onExportPDF={handleSave}
              onViewHistory={handleViewHistory}
              onBack={() => setDecision(false)}
            />

            <SignInModal 
              isOpen={showSignInModal}
              onClose={() => setShowSignInModal(false)}
              onSignInSuccess={() => {
                setShowSignInModal(false);
                saveToDatabase();
              }}
            />
          </div>

          {/* 14) BOTTOM ACTION BUTTONS */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '40px', 
            marginBottom: '40px',
            padding: '20px'
          }}>
            <button 
              className='startbutton'
              onClick={reset}
              style={{ 
                backgroundColor: '#FF6E70',
                fontSize: '16px',
                padding: '12px 24px'
              }}
            >
              Reset
            </button>
            <button 
              className='startbutton'
              onClick={handleSignOut}
              style={{ 
                backgroundColor: '#666',
                fontSize: '16px',
                padding: '12px 24px'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculateDecision; 