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
        {/* TWO COLUMN LAYOUT - 25% LEFT, 75% RIGHT */}
        <div className="home-two-column">
          {/* LEFT COLUMN - Title and Buttons */}
          <div className="home-left-section">
            <h2 className="home-main-title">Make a Decision</h2>

            <button className="home-cta-primary" onClick={() => navigate('/decision-maker')}>
              START NOW
            </button>

            {!userEmail ? (
              <button className="home-cta-secondary" onClick={signInWithGoogle}>
                SIGN IN
              </button>
            ) : (
              <button className="home-cta-secondary" onClick={() => navigate('/decision-history')}>
                MY DECISIONS
              </button>
            )}
          </div>

          {/* RIGHT COLUMN - Description and Features */}
          <div className="home-right-section">
            <p className="home-description">
              <strong>Can't decide?</strong> Wisest helps you choose the best option by weighing all your priorities. Just list your choices, set what matters most, and get your answer.
            </p>

            <div className="home-features-grid">
              <div className="feature-card-mini">
                <span className="feature-icon-large">🎯</span>
                <h3>Multi-criteria</h3>
              </div>
              <div className="feature-card-mini">
                <span className="feature-icon-large">⚖️</span>
                <h3>Weighted scoring</h3>
              </div>
              <div className="feature-card-mini">
                <span className="feature-icon-large">🤖</span>
                <h3>AI insights</h3>
              </div>
              <div className="feature-card-mini">
                <span className="feature-icon-large">📊</span>
                <h3>Visual breakdown</h3>
              </div>
            </div>
          </div>
        </div>

        <a
          href="https://shirleyproject.my.canva.site/wisest"
          className="home-learn-more-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>

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
// Demo route cache bust
