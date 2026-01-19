import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import logo from './images/logo.png';
import './App.css';
import startimg from './images/main.png';
import Main from './Main';
import DecisionHistory from './DecisionHistory';
import Demo from './Demo';
import { supabase } from './supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// 1) HOME PAGE - Landing page with authentication
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showBottomSection, setShowBottomSection] = useState<boolean>(false);

  // Auth state listener
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  // Scroll detection for bottom section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Show bottom section when user scrolls down 30% of the viewport (more sensitive)
      if (scrollY > windowHeight * 0.3) {
        setShowBottomSection(true);
      } else {
        setShowBottomSection(false);
      }
    };

    // Initial check in case page is already scrolled
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="Start">
      <img src={startimg} className="StartImage" alt="Main background"></img>
      <div className="LogoHeader">
        <img src={logo} className="App-logo" alt="logo" />
        <h1> Wisest</h1>
      </div>
      
      <div className="home-main-container">
        {/* 2) TOP SECTION - Title with Description and Features */}
        <div className="home-top-section">
          <div className="home-title-section">
            <h2 className="home-subtitle">Make a Decision</h2>
            <div className="home-title-buttons">
              <button className="home-primary-button" onClick={() => navigate('/decision-maker')}>
                Start Now
              </button>
              {!userEmail ? (
                <button className="home-auth-button" onClick={signInWithGoogle}>
                  Sign In
                </button>
              ) : (
                <button className="home-auth-button" onClick={() => navigate('/decision-history')}>
                  My Profile
                </button>
              )}
            </div>
          </div>
          
          <div className="home-description-section">
            <p className="home-description">
              <strong>Can't decide? </strong> 
              Wisest helps you choose the best option by weighing all your priorities. 
              Just list your choices, set what matters most, and get your answer.
            </p>
            
            <div className="home-features">
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Multi-criteria</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚖️</span>
                <span>Weighted scoring</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI insights</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Visual breakdown</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3) BOTTOM SECTION - Expanded How It Works (Scroll to reveal) */}
        {showBottomSection && (
          <div className="home-bottom-section">
            <div className="home-how-to-section-expanded">
            
            
            <div className="how-to-features">
              <h4 className="features-title">Advanced Features</h4>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🤖</div>
                  <h5 className="feature-card-title">Gemini AI Integration</h5>
                  <p className="feature-card-description">
                    Leverage Google's advanced Gemini AI for intelligent decision analysis, 
                    risk assessment, and personalized recommendations.
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h5 className="feature-card-title">Interactive Visualizations</h5>
                  <p className="feature-card-description">
                    Comprehensive charts and graphs showing decision confidence, 
                    trade-off analysis, and risk assessment breakdowns.
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">💾</div>
                  <h5 className="feature-card-title">Decision History & Saving</h5>
                  <p className="feature-card-description">
                    Save and revisit your decisions anytime. Track decision patterns, 
                    outcomes, and learn from your decision-making history.
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h5 className="feature-card-title">Real-time Analysis</h5>
                  <p className="feature-card-description">
                    Instant scoring and ranking updates as you adjust criteria weights. 
                    See how your priorities affect the final recommendation.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="how-to-examples">
              <h4 className="examples-title">Perfect For</h4>
              <div className="examples-carousel">
                <div className="carousel-track">
                  <div className="example-item">
                    <span className="example-icon">💼</span>
                    <span>Career Decisions</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">🏠</span>
                    <span>Real Estate</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">🎓</span>
                    <span>Education Choices</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">📊</span>
                    <span>Business Strategy</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">💡</span>
                    <span>Investment Options</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">🛒</span>
                    <span>Major Purchases</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">🚗</span>
                    <span>Vehicle Selection</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">🏥</span>
                    <span>Healthcare Choices</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">✈️</span>
                    <span>Travel Planning</span>
                  </div>
                  <div className="example-item">
                    <span className="example-icon">💍</span>
                    <span>Life Decisions</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="how-to-cta">
              <a href="https://shirleyproject.my.canva.site/wisest" className="home-primary-button">
                Learn More
              </a>
            </div>
          </div>
        </div>
        )}
        
        {/* Temporary spacer to ensure scrollable content */}
        <div style={{ height: '100vh', background: 'rgba(255, 255, 255, 0.02)', margin: '20px 0' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '18px'
          }}>
            Scroll down to see more content ↓
          </div>
        </div>
      </div>
    </div>
  );
};

// 4) DECISION MAKER - Main decision creation flow
const DecisionMaker: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedDecisionId = searchParams.get('decisionId');

  const reset = () => {
    navigate('/');
  };

  const showDecisionHistory = () => {
    navigate('/decision-history');
  };

  return (
    <Main 
      reset={reset} 
      selectedDecisionId={selectedDecisionId}
      setSelectedDecisionId={(id) => {
        if (id) {
          navigate(`/decision-maker?decisionId=${id}`);
        } else {
          navigate('/decision-maker');
        }
      }}
      showDecisionHistory={showDecisionHistory}
    />
  );
};

// 5) DECISION HISTORY - View and manage saved decisions
const DecisionHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const onBack = () => {
    navigate('/');
  };

  const onSelectDecision = (decisionId: string) => {
    navigate('/decision-maker');
  };

  return (
    <DecisionHistory
      onSelectDecision={onSelectDecision}
      onBack={onBack}
    />
  );
};

// 6) DEMO PAGE - Demo decision with prebuilt values
const DemoPage: React.FC = () => {
  const navigate = useNavigate();

  const reset = () => {
    navigate('/');
  };

  const showDecisionHistory = () => {
    navigate('/decision-history');
  };

  return (
    <Demo
      reset={reset}
      showDecisionHistory={showDecisionHistory}
    />
  );
};

// 7) MAIN APP ROUTER
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/decision-maker" element={<DecisionMaker />} />
        <Route path="/decision-history" element={<DecisionHistoryPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
