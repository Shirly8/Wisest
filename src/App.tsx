import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import logo from './images/logo.png';
import './App.css';
import startimg from './images/main.png';
import Main from './Main';
import DecisionHistory from './DecisionHistory';
import { supabase } from './supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// 1) HOME PAGE - Landing page with authentication
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

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
            <h2 className="home-subtitle">Make Smarter Decisions</h2>
            <button className="home-secondary-button" onClick={() => navigate('/decision-maker')}>
              Start Now
            </button>
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

        {/* 3) BOTTOM SECTION - How to do it (left) and Get Started (right) */}
        <div className="home-bottom-section">
          <div className="home-how-to-section">
            <h3 className="how-to-title">How It Works</h3>
            <p className="how-to-description">
              Simply list your options, define custom categories and metrics, 
              set importance weights, and let our algorithm calculate the best decision for you.
            </p>
            <div className="how-to-examples">
              <div className="example-item">
                <span className="example-icon">💼</span>
                <span>Job Offers</span>
              </div>
              <div className="example-item">
                <span className="example-icon">🏠</span>
                <span>House Buying</span>
              </div>
              <div className="example-item">
                <span className="example-icon">🎓</span>
                <span>University Choice</span>
              </div>
              <div className="example-item">
                <span className="example-icon">📊</span>
                <span>Business Analysis</span>
              </div>
            </div>
            <button className="home-secondary-button" onClick={() => navigate('/decision-maker')}>
              Start Making Decisions
            </button>
          </div>

          <div className="home-auth-column">
            <div className="home-auth-content">
              <h3 className="auth-title">Get Started</h3>
              
              {userEmail ? (
                <div className="auth-signed-in">
                  <div className="home-user-info">
                    <span className="user-email">Signed in as {userEmail}</span>
                  </div>
                  <div className="auth-buttons">
                    <button className="home-secondary-button" onClick={() => navigate('/decision-history')}>
                      View My Decisions
                    </button>
                    <button className="home-secondary-button" onClick={signOut}>
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-signed-out">
                  <p className="auth-description">Sign in to save and access your decisions</p>
                  <button className="home-secondary-button" onClick={signInWithGoogle}>
                    Sign in with Google
                  </button>
                </div>
              )}
              
              <div className="learn-more-section">
                <a href="https://shirleyproject.com/wisest">
                  <button className="home-secondary-button">Learn More</button>
                </a>
              </div>
            </div>
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

  const selectDecision = (decisionId: string) => {
    navigate(`/decision-maker?decisionId=${decisionId}`);
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
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const onBack = () => {
    navigate('/');
  };

  const onSelectDecision = (decisionId: string) => {
    setSelectedDecisionId(decisionId);
    navigate('/decision-maker');
  };

  return (
    <DecisionHistory 
      onSelectDecision={onSelectDecision}
      onBack={onBack}
    />
  );
};

// 6) MAIN APP ROUTER
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/decision-maker" element={<DecisionMaker />} />
        <Route path="/decision-history" element={<DecisionHistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
