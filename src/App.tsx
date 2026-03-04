import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './styles/landing.css';
import './styles/utilities.css';
import AtmosphereCanvas from './components/AtmosphereCanvas';
import Orb from './components/Orb';
import { useOrbParallax } from './hooks/useOrbParallax';
import Main from './Main';
import DecisionHistory from './DecisionHistory';
import Demo from './Demo';
import { supabase } from './supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const ArrowSvg = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5h9M6.5 3l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 1) HOME PAGE — Single viewport with shake-to-enter
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const orbStageRef = useRef<HTMLDivElement>(null);
  const orbWrapRef = useRef<HTMLDivElement>(null);
  const landZoomedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const enterApp = useCallback(() => {
    if (landZoomedRef.current) return;
    landZoomedRef.current = true;
    setTimeout(() => {
      navigate('/decision-maker');
    }, 460);
  }, [navigate]);

  const triggerShake = useCallback(() => {
    const orbWrap = orbWrapRef.current;
    if (!orbWrap) return;
    orbWrap.classList.remove('shaking');
    void (orbWrap as any).offsetWidth;
    orbWrap.classList.add('shaking');
    setTimeout(() => {
      enterApp();
    }, 1000);
  }, [enterApp]);

  useEffect(() => {
    let lastShakeTime = 0;
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) return;
      const x = accel.x ?? 0;
      const y = accel.y ?? 0;
      const z = accel.z ?? 0;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      if (acceleration > 25) {
        const now = Date.now();
        if (now - lastShakeTime > 500) {
          lastShakeTime = now;
          triggerShake();
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      return () => window.removeEventListener('devicemotion', handleDeviceMotion);
    }
  }, [triggerShake]);

  useOrbParallax(['h-ball'], ['h-spec']);

  return (
    <>
      <AtmosphereCanvas />

      <div className="hero-viewport">
        <div className="hero-spot" />

        <nav className="hero-nav">
          <div className="logo">
            <div className="logo-bead">8</div>
            <span className="logo-name">W<em>i</em>sest</span>
          </div>
          <div className="hero-auth-btns">
            {userEmail ? (
              <button className="btn btn-g btn-sm" onClick={() => navigate('/decision-history')}>My Decisions</button>
            ) : (
              <button className="btn btn-g btn-sm" onClick={signInWithGoogle}>Sign In</button>
            )}
          </div>
        </nav>

        <div className="hero-inner">
          <div className="hero-orb-ctr">
            <div className="orb-stage" ref={orbStageRef}>
              <div ref={orbWrapRef} className="orb-wrap">
                <Orb size="min(46vmin, 260px)" id="h-ball" specId="h-spec" showAtmRings />
              </div>
            </div>
          </div>

          <div className="hero-text">
            <h1 className="t-hero text-center">
              <span className="hl"><span className="hli">Make the</span></span>
              <span className="hl"><span className="hli">best <em className="text-silver text-italic">decision.</em></span></span>
            </h1>
            <p className="hero-sub">Define options. Name what matters. Let the oracle surface the math beneath the mist.</p>
            <div className="hero-cta">
              <button className="btn btn-p btn-hero" onClick={triggerShake}>
                Shake to consult
                <ArrowSvg />
              </button>
              <button className="btn btn-g btn-hero" onClick={() => navigate('/demo')}>
                See demo
                <ArrowSvg />
              </button>
            </div>
          </div>

          <div className="hero-stats">
            <div><div className="stat-n">73<em>%</em></div><div className="stat-l">Decision accuracy gain</div></div>
            <div><div className="stat-n">6</div><div className="stat-l">Oracle visualizations</div></div>
          </div>
        </div>
      </div>
    </>
  );
};

// 4) DECISION MAKER
const DecisionMaker: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedDecisionId = searchParams.get('decisionId');

  return (
    <Main
      reset={() => navigate('/')}
      selectedDecisionId={selectedDecisionId}
      setSelectedDecisionId={(id) => {
        if (id) navigate(`/decision-maker?decisionId=${id}`);
        else navigate('/decision-maker');
      }}
      showDecisionHistory={() => navigate('/decision-history')}
    />
  );
};

// 5) DECISION HISTORY
const DecisionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <DecisionHistory
      onSelectDecision={() => navigate('/decision-maker')}
      onBack={() => navigate('/')}
    />
  );
};

// 6) DEMO PAGE
const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Demo
      reset={() => navigate('/')}
      showDecisionHistory={() => navigate('/decision-history')}
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
