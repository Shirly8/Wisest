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
  onBackToMetrics?: () => void;
  onDemoCompleted?: (feedback: string) => void;
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
  demoFeedback = '',
  onBackToMetrics,
  onDemoCompleted
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
  }, [showSignInModal]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [selectedDecisionId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const fetchFeedback = async (): Promise<string> => {
      setIsLoadingFeedback(true);
      let feedbackText = '';
      try {
        // Use demo feedback if in demo mode
        if (demoMode && demoFeedback) {
          setFeedback(demoFeedback);
          setIsLoadingFeedback(false);
          return demoFeedback;
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
        feedbackText = data.feedback;
        setFeedback(feedbackText);
      } catch (error) {
        feedbackText = 'Gemini API is not activated. To use this, please run it locally with API key.';
        setFeedback(feedbackText);
      } finally {
        setIsLoadingFeedback(false);
      }
      return feedbackText;
    };

    fetchFeedback().then((feedbackText) => {
      // Call onDemoCompleted after feedback is loaded (only on first visit)
      if (demoMode && onDemoCompleted && !demoFeedback && feedbackText) {
        onDemoCompleted(feedbackText);
      }
    });

    setTimeout(() => {
      setShowContent(true);
    }, 5000);
  }, [options, categories, metricTypes, mainConsideration, choiceConsiderations, demoMode, onDemoCompleted, demoFeedback]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [showContent, categories, options, metricTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedCategories = [...categories].sort((a, b) => b.importance - a.importance);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sortedOptionsByCategory = sortedCategories.map(category => {
    return options
      .map((option, optionIndex) => ({
        option,
        score: category.metrics[optionIndex]
      }))
      .sort((a, b) => b.score - a.score);
  });

  // Helper function to parse and render Gemini feedback with markdown styling
  const renderGeminiFeedback = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        elements.push(<div key={`spacer-${i}`} style={{ height: '12px' }}></div>);
        i++;
        continue;
      }

      // Check for main bold headings (**text**: as standalone line)
      if (line.startsWith('**') && line.includes('**:')) {
        const headingText = line.replace(/\*\*/g, '').replace(':', '');
        elements.push(
          <h3
            key={`heading-${i}`}
            style={{
              color: '#2E98DD',
              fontSize: '16px',
              fontWeight: '700',
              margin: '20px 0 12px 0',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
            }}
          >
            {headingText}:
          </h3>
        );
        i++;
        continue;
      }

      // Check for bold subheadings (**text**)
      if (line.startsWith('**') && line.endsWith('**')) {
        const headingText = line.slice(2, -2);
        elements.push(
          <h4
            key={`subheading-${i}`}
            style={{
              color: '#4ECDC4',
              fontSize: '13px',
              fontWeight: '700',
              margin: '14px 0 8px 0',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
              letterSpacing: '0.2px'
            }}
          >
            {headingText}
          </h4>
        );
        i++;
        continue;
      }

      // Check for numbered/bullet list items (starts with * or 1., 2., etc.)
      if (/^[*\d+.]/.test(line) || line.match(/^\d+\./)) {
        elements.push(
          <div
            key={`list-${i}`}
            style={{
              marginLeft: '16px',
              marginBottom: '8px',
              color: '#c0c0c0',
              fontSize: '13px',
              lineHeight: '1.6',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
            }}
          >
            {line}
          </div>
        );
        i++;
        continue;
      }

      // Regular paragraph text - parse inline **bold** and *italic* styling
      const renderParagraphWithFormatting = (text: string) => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        // Match **bold** and *italic* - handle text without spaces
        const regex = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
          }

          // Add formatted text
          if (match[1]) {
            // **bold** text
            parts.push(
              <strong key={`bold-${match.index}`} style={{ color: '#4ECDC4', fontWeight: '700' }}>
                {match[1]}
              </strong>
            );
          } else if (match[2]) {
            // *italic* text
            parts.push(
              <em key={`italic-${match.index}`} style={{ color: '#5A9FD4', fontStyle: 'italic' }}>
                {match[2]}
              </em>
            );
          }

          lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
      };

      elements.push(
        <p
          key={`para-${i}`}
          style={{
            color: '#b0b0b0',
            fontSize: '13px',
            lineHeight: '1.7',
            margin: '8px 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
          }}
        >
          {renderParagraphWithFormatting(line)}
        </p>
      );
      i++;
    }

    return elements;
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
      {!showContent && !demoMode ? (
        <Buffer />
      ) : (
        <div style={{backgroundColor: '#060724'}} id="content">
          {/* Main Container with 75/25 Split */}
          <div style={{ display: 'flex', gap: '16px', padding: '20px', maxWidth: '100%', height: 'calc(100vh - 40px)' }}>

            {/* 75% Main Content Section */}
            <div style={{ flex: '0 0 75%', overflow: 'auto', position: 'relative' }}>
              {/* Back to Metrics Button - Top Left */}
              {onBackToMetrics && (
                <button
                  onClick={onBackToMetrics}
                  style={{
                    position: 'absolute',
                    top: '-60px',
                    left: '0',
                    background: '#FF6E70',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: 'Poppins, sans-serif',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(255, 110, 112, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = '#E55A5C';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(255, 110, 112, 0.5)';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = '#FF6E70';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(255, 110, 112, 0.3)';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  ← Back to Metrics
                </button>
              )}

              {/* 10) FINAL DECISION DISPLAY */}
              <div className='final' style={{textAlign: 'center'}}>
                <div className='final-subtitle'>The best decision for you is:</div>
                <div className='final-decision'>{bestDecision}</div>
              </div>

              {/* 11) DECISION BREAKDOWN ANALYSIS */}
              <h2 style={{color: 'white', fontSize:'18px', marginTop: '1%', backgroundColor: '#FF6E70', padding: '12px'}}>Decision Breakdown Analysis</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '12px', margin: '0 -12px -12px -12px', minHeight: '420px' }}>

                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                  <CategoryBreakdown
                    categories={categories}
                    options={options}
                    metricTypes={metricTypes}
                    extractNumber={extractNumber}
                    calculatePercentage={calculatePercentage}
                  />
                </div>

                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                  <OptionBreakdown
                    options={options}
                    preparePieChart={preparePieChart}
                  />
                </div>

                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{color: '#FF6E70', fontSize:'16px', marginBottom: '10px', textAlign: 'center', margin: '0 0 10px 0'}}>Risk Assessment</h3>
                  <div ref={riskAssessmentRef} style={{ width: '100%', height: '300px', flex: 1 }}></div>
                  <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4', margin: '10px 0 0 0' }}>
                    <strong>How to read:</strong> Taller bars = higher risk. Red = High, Yellow = Medium, Green = Low.<br/>
                    <strong>Look for:</strong> Options with lower bars = safer choices for your priorities.
                  </p>
                </div>

              </div>

              {/* 12) STRATEGIC ANALYSIS DIAGRAMS */}
              <h2 className="strategic-analysis-header" style={{padding: '12px', margin: '0'}}>Strategic Decision Analysis</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px', minHeight: '420px' }}>
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#4ECDC4', textAlign: 'center', marginBottom: '10px', fontSize: '16px', margin: '0 0 10px 0' }}>Trade-off Analysis</h3>
                  <div ref={radarChartRef} style={{ width: '100%', height: '280px', flex: 1 }}></div>
                  <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4', margin: '10px 0 0 0' }}>
                    <strong>How to read:</strong> Each point = one option. Top-right = best in both categories.<br/>
                    <strong>Look for:</strong> Options closest to top-right corner = best balance.
                  </p>
                </div>

                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#4ECDC4', textAlign: 'center', marginBottom: '10px', fontSize: '16px', margin: '0 0 10px 0' }}>Decision Confidence</h3>
                  <div ref={comparisonChartRef} style={{ width: '100%', height: '280px', flex: 1 }}></div>
                  <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4', margin: '10px 0 0 0' }}>
                    <strong>How to read:</strong> Taller bars = higher scores. Big gaps = confident choice.<br/>
                    <strong>Look for:</strong> Clear winner with large score difference = high confidence.
                  </p>
                </div>

                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#4ECDC4', textAlign: 'center', marginBottom: '10px', fontSize: '16px', margin: '0 0 10px 0' }}>Decision Stability</h3>
                  <div ref={heatmapRef} style={{ width: '100%', height: '280px', flex: 1 }}></div>
                  <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4', margin: '10px 0 0 0' }}>
                    <strong>How to read:</strong> ✓ = stable, ⚠ = sensitive to changes.<br/>
                    <strong>Look for:</strong> Categories with ⚠ - small changes could flip your decision.
                  </p>
                </div>
              </div>
            </div>

            {/* 25% Gemini Sidebar - Full Height */}
            <div style={{
              flex: '0 0 25%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(42, 70, 160, 0.2) 0%, rgba(46, 152, 221, 0.2) 100%)',
                border: '1px solid rgba(46, 152, 221, 0.4)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                {/* Gemini Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '15px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(46, 152, 221, 0.3)'
                }}>
                  <img src={gemini} alt="gemini" style={{
                    width: '28px',
                    height: '28px',
                    objectFit: 'contain'
                  }}></img>
                  <h3 style={{
                    fontWeight: '500',
                    background: 'linear-gradient(to right, #5A70B8, #2E98DD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '18px',
                    margin: '0'
                  }}>Gemini Says</h3>
                </div>

                {/* Gemini Content - Scrollable */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '8px',
                  marginRight: '-8px',
                  scrollBehavior: 'smooth',
                  minHeight: '300px'
                }}>
                  {isLoadingFeedback ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: '12px',
                      color: '#2E98DD'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #2E98DD',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{
                        fontSize: '12px',
                        textAlign: 'center',
                        color: '#8ab4f8'
                      }}>Analyzing your decision...</span>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'left',
                      overflowY: 'auto',
                      paddingRight: '4px'
                    }}>
                      {renderGeminiFeedback(feedback)}
                    </div>
                  )}
                </div>

                {/* Reanalyze Section */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(46, 152, 221, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <input
                    type="text"
                    placeholder="Add context for reanalysis..."
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(46, 152, 221, 0.4)',
                      backgroundColor: 'rgba(46, 152, 221, 0.1)',
                      color: '#b0b0b0',
                      fontSize: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = 'rgba(46, 152, 221, 0.8)';
                      (e.target as HTMLInputElement).style.backgroundColor = 'rgba(46, 152, 221, 0.2)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = 'rgba(46, 152, 221, 0.4)';
                      (e.target as HTMLInputElement).style.backgroundColor = 'rgba(46, 152, 221, 0.1)';
                    }}
                  />
                  <button
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'linear-gradient(135deg, rgba(46, 152, 221, 0.3) 0%, rgba(90, 112, 184, 0.3) 100%)',
                      color: '#2E98DD',
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: 'Poppins, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(46, 152, 221, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(46, 152, 221, 0.5) 0%, rgba(90, 112, 184, 0.5) 100%)';
                      (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(46, 152, 221, 0.4)';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(46, 152, 221, 0.3) 0%, rgba(90, 112, 184, 0.3) 100%)';
                      (e.target as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(46, 152, 221, 0.2)';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    Reanalyze
                  </button>
                </div>
              </div>
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