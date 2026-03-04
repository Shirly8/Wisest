import React, { useEffect, useState, useRef, useCallback } from 'react';
import './styles/screen-verdict.css';
import './styles/sphere-3d.css';
import './styles/utilities.css';
import Nav from './components/Nav';
import Sphere3D from './components/Sphere3D';
import { useOrbParallax } from './hooks/useOrbParallax';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from './supabaseClient';
import SignInModal from './SignInModal';
import DecisionNamingModal from './DecisionNamingModal';

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
  categories, options, metricTypes, setDecision, reset,
  mainConsideration, choiceConsiderations,
  setCategories, setOptions: _setOptions, setMetricTypes: _setMetricTypes,
  setMainConsideration, setChoiceConsiderations: _setChoiceConsiderations,
  selectedDecisionId, showDecisionHistory,
  decisionName, setDecisionName,
  demoMode = false, demoFeedback = '',
  onBackToMetrics, onDemoCompleted
}) => {
  const [bestDecision, setBestDecision] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [dashboardVisible, setDashboardVisible] = useState(false);

  // Auth & save
  const [saveStatus, setSaveStatus] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDecisionNameInput, setShowDecisionNameInput] = useState(false);

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const orbScaleRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const nudgeRef = useRef<HTMLDivElement>(null);
  const vnameRef = useRef<HTMLDivElement>(null);
  const vpillsRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const revDoneRef = useRef(false);
  const sphere3dRef = useRef<HTMLDivElement>(null);

  function extractNumber(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    const numericValue = value.toString().match(/-?\d+(\.\d+)?/);
    return numericValue ? parseFloat(numericValue[0]) : 0;
  }

  // Auth
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
        setTimeout(() => saveToDatabase(), 1000);
      }
    });
    return () => subscription.unsubscribe();
  }, [showSignInModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Score calculation
  const calculateScore = useCallback(() => {
    const minVal = categories.map(c => Math.min(...c.metrics.map(extractNumber)));
    const maxVal = categories.map(c => Math.max(...c.metrics.map(extractNumber)));
    return options.map((_, oi) => {
      let score = 0;
      categories.forEach((cat, ci) => {
        let mv = extractNumber(cat.metrics[oi]);
        if (metricTypes[ci] === 1) mv = mv === 0 ? 0.1 : 1 / mv;
        const range = maxVal[ci] - minVal[ci];
        let nm;
        if (range === 0) nm = 0.5;
        else {
          if (metricTypes[ci] === 1) {
            const orig = extractNumber(cat.metrics[oi]);
            nm = 1 - (orig - minVal[ci]) / range;
          } else {
            nm = (mv - minVal[ci]) / range;
          }
          nm = Math.max(0, Math.min(1, nm));
        }
        score += nm * Math.pow(cat.importance, 2);
      });
      return score;
    });
  }, [categories, options, metricTypes]);

  // Main calc + fetch feedback
  const [scores, setScores] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [maxPossible, setMaxPossible] = useState(1);

  useEffect(() => {
    const sc = calculateScore();
    setScores(sc);
    const mp = categories.reduce((a, c) => a + Math.pow(c.importance, 2), 0) || 1;
    setMaxPossible(mp);
    const sorted = sc.map((_, i) => i).sort((a, b) => sc[b] - sc[a]);
    setSortedIndices(sorted);
    const bestIdx = sorted[0];
    setBestDecision(options[bestIdx]);

    const fetchFeedback = async () => {
      if (demoMode && demoFeedback) { setFeedback(demoFeedback); return demoFeedback; }
      setIsLoadingFeedback(true);
      try {
        const response = await fetch('https://wisest.onrender.com/wisest', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            options, categories: categories.map(c => ({ title: c.title, metrics: c.metrics, importance: c.importance })),
            scores: sc.map((s, i) => ({ option: options[i], score: s })),
            best_decision: options[bestIdx],
            main_Consideration: mainConsideration,
            choice_Considerations: options.map(o => ({ option: o, consideration: choiceConsiderations[o] }))
          }),
        });
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        setFeedback(data.feedback);
        return data.feedback;
      } catch {
        const msg = 'The oracle cannot be reached. Check your connection.';
        setFeedback(msg);
        return msg;
      } finally { setIsLoadingFeedback(false); }
    };

    fetchFeedback().then(fb => {
      if (demoMode && onDemoCompleted && !demoFeedback && fb) onDemoCompleted(fb);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Orb parallax
  useOrbParallax(['s4-ball'], ['s4-spec']);

  // Shake detection on verdict screen
  const triggerSphereShake = useCallback(() => {
    if (revDoneRef.current) return;
    revDoneRef.current = true;

    const sphere = sphere3dRef.current;
    const scaleEl = orbScaleRef.current;
    const eyeEl = eyeRef.current;
    const nudgeEl = nudgeRef.current;
    const vnameEl = vnameRef.current;
    const vpillEl = vpillsRef.current;

    if (sphere) {
      sphere.classList.remove('shaking');
      void (sphere as any).offsetWidth;
      sphere.classList.add('shaking');
    }

    // Animate sphere scale
    if (scaleEl) {
      scaleEl.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      scaleEl.style.transform = 'scale(1.5)';
    }

    // Fade out eye and nudge
    if (eyeEl) eyeEl.style.opacity = '0';
    if (nudgeEl) nudgeEl.style.opacity = '0';

    // Reveal verdict after shake
    setTimeout(() => {
      const eight = document.getElementById('s4-eight');
      const ans = document.getElementById('s4-ans');
      const sub = document.getElementById('s4-sub');

      if (eight) eight.classList.add('gone');
      if (ans) {
        const wn = bestDecision;
        ans.textContent = wn.length > 10 ? wn.slice(0, 10) + '\u2026' : wn;
        ans.classList.add('show');
      }
      if (sub) {
        const wpct = scores.length > 0 ? (scores[sortedIndices[0]] / maxPossible * 100).toFixed(1) : '0';
        const margin = sortedIndices.length > 1 ? ((scores[sortedIndices[0]] - scores[sortedIndices[1]]) / maxPossible * 100) : 0;
        const conf = margin > 15 ? 'Certain' : margin > 7 ? 'Likely' : 'Unclear';
        sub.textContent = `${wpct}% \u00b7 ${conf}`;
        sub.classList.add('show');
      }
      burstStars(sphere!);
    }, 400);

    // Show verdict name and pills
    setTimeout(() => {
      if (vnameEl) {
        vnameEl.style.opacity = '1';
        vnameEl.style.clipPath = 'inset(0 0 0 0)';
      }
      if (vpillEl) {
        vpillEl.style.opacity = '1';
        vpillEl.style.transform = 'translateY(0)';
      }
    }, 550);

    // Show dashboard
    setTimeout(() => {
      const dash = dashRef.current;
      if (dash && !dash.classList.contains('shown')) {
        dash.classList.add('shown');
        setDashboardVisible(true);
      }
    }, 950);
  }, [bestDecision, scores, sortedIndices, maxPossible]);

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
          triggerSphereShake();
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      return () => window.removeEventListener('devicemotion', handleDeviceMotion);
    }
  }, [triggerSphereShake]);


  const burstStars = (ballEl: HTMLElement) => {
    const r = ballEl.getBoundingClientRect();
    const bx = r.left + r.width / 2, by = r.top + r.height / 2;
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('div'); s.className = 'star';
      const a = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const d = 60 + Math.random() * 115;
      s.style.left = bx + 'px'; s.style.top = by + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.animationDelay = (Math.random() * 0.1) + 's';
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
  };

  // Animate score bars when dashboard visible
  useEffect(() => {
    if (dashboardVisible) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>('.sbar-f[data-w]').forEach(el => {
          el.style.transform = `scaleX(${Number(el.dataset.w) / 100})`;
        });
        const confFill = document.querySelector<HTMLElement>('.conf-fill[data-w]');
        if (confFill) confFill.style.width = confFill.dataset.w + '%';
      }));
    }
  }, [dashboardVisible]);

  // Skip animation for demo
  const skipAnimation = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // DB save logic
  const saveDecision = async (userId: string) => {
    const title = decisionName || mainConsideration || `Decision ${new Date().toLocaleDateString()}`;
    const desc = `Decision between: ${options.join(', ')}`;
    if (selectedDecisionId) {
      const { data, error } = await supabase.from('decisions').update({ title, description: desc, ai_feedback: feedback, updated_at: new Date().toISOString() }).eq('id', selectedDecisionId).select().single();
      if (error) throw error; return data;
    }
    const { data: existing } = await supabase.from('decisions').select('id').eq('user_id', userId).eq('title', title);
    if (existing && existing.length > 0) {
      const { data, error } = await supabase.from('decisions').update({ description: desc, ai_feedback: feedback, updated_at: new Date().toISOString() }).eq('id', existing[0].id).select().single();
      if (error) throw error; return data;
    }
    const { data, error } = await supabase.from('decisions').insert({ user_id: userId, title, description: desc, ai_feedback: feedback }).select().single();
    if (error) throw error; return data;
  };

  const saveToDatabase = useCallback(async () => {
    setSaveStatus('Saving...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus('Please sign in'); return; }
      const decisionData = await saveDecision(user.id);
      const decisionId = selectedDecisionId || decisionData.id;
      await supabase.from('decision_values').delete().eq('decision_id', decisionId);
      await supabase.from('decision_categories').delete().eq('decision_id', decisionId);
      await supabase.from('decision_options').delete().eq('decision_id', decisionId);
      const optionIds: string[] = [];
      for (let i = 0; i < options.length; i++) {
        const { data } = await supabase.from('decision_options').insert({ decision_id: decisionData.id, name: options[i], note: choiceConsiderations[options[i]] || null }).select().single();
        if (data) optionIds.push(data.id);
      }
      for (let ci = 0; ci < categories.length; ci++) {
        const { data: catData } = await supabase.from('decision_categories').insert({ decision_id: decisionData.id, name: categories[ci].title, importance: categories[ci].importance, higher_is_better: metricTypes[ci] === 0 }).select().single();
        if (catData) {
          for (let oi = 0; oi < options.length; oi++) {
            await supabase.from('decision_values').insert({ decision_id: decisionData.id, category_id: catData.id, option_id: optionIds[oi], value: extractNumber(categories[ci].metrics[oi]) });
          }
        }
      }
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch { setSaveStatus('Failed to save.'); setTimeout(() => setSaveStatus(''), 4000); }
  }, [selectedDecisionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveClick = () => {
    if (demoMode) return;
    if (!isAuthenticated) { setShowSignInModal(true); return; }
    if (!decisionName && !selectedDecisionId) { setShowDecisionNameInput(true); return; }
    saveToDatabase();
  };

  const handleExportPDF = () => {
    const el = document.getElementById('verdict-content');
    if (el) html2canvas(el).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save('Wisest-Decision.pdf');
    });
  };

  // Follow-up AI
  const askFollowUp = async () => {
    if (!followUpInput.trim()) return;
    setFollowUpResponse('The oracle contemplates\u2026');
    try {
      const response = await fetch('https://wisest.onrender.com/wisest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options, categories: categories.map(c => ({ title: c.title, metrics: c.metrics, importance: c.importance })),
          scores: scores.map((s, i) => ({ option: options[i], score: s })),
          best_decision: bestDecision,
          main_Consideration: mainConsideration + '\n\nAdditional question: ' + followUpInput,
          choice_Considerations: options.map(o => ({ option: o, consideration: choiceConsiderations[o] }))
        }),
      });
      const data = await response.json();
      setFollowUpResponse(data.feedback);
    } catch { setFollowUpResponse('The oracle cannot be reached.'); }
  };

  // Render feedback sections
  const renderFeedback = (text: string) => {
    if (!text) return null;
    const sections: { label: string; body: string }[] = [];
    const LABELS = ['WHY THIS CHOICE', 'WATCH OUT FOR', 'THE EDGE IT HAS', 'MY TAKE', 'Why', 'Watch out', 'Strategic Advantages', 'Risk Mitigation', 'Implementation Priority', 'Success Metrics'];

    // Try to parse sections
    let found = false;
    for (const lbl of LABELS) {
      const regex = new RegExp(`\\*\\*${lbl}[^*]*\\*\\*:?`, 'i');
      if (regex.test(text)) { found = true; break; }
    }

    if (found) {
      // Parse markdown bold headings
      const lines = text.split('\n');
      let currentLabel = '';
      let currentBody = '';
      for (const line of lines) {
        const match = line.match(/^\*\*([^*]+)\*\*:?\s*(.*)/);
        if (match) {
          if (currentLabel) sections.push({ label: currentLabel, body: currentBody.trim() });
          currentLabel = match[1];
          currentBody = match[2] || '';
        } else {
          currentBody += '\n' + line;
        }
      }
      if (currentLabel) sections.push({ label: currentLabel, body: currentBody.trim() });
    }

    if (sections.length > 0) {
      return sections.map((s, i) => (
        <div key={i} className="ai-reading-section">
          <div className="ai-reading-label">{s.label}</div>
          <div className="ai-reading-text">{s.body}</div>
        </div>
      ));
    }

    // Fallback: plain text
    return <div className="ai-reading-text">{text}</div>;
  };

  // Computed values
  const winnerScore = scores.length > 0 && sortedIndices.length > 0 ? scores[sortedIndices[0]] : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 1;
  const wpct = maxPossible > 0 ? (winnerScore / maxPossible * 100) : 0;
  const margin = sortedIndices.length > 1 ? ((scores[sortedIndices[0]] - scores[sortedIndices[1]]) / maxPossible * 100) : 0;
  const confWord = margin > 15 ? 'Certain' : margin > 7 ? 'Likely' : 'Unclear';
  const confMsg = confWord === 'Certain' ? 'The oracle is decided. Act without hesitation.'
    : confWord === 'Likely' ? 'The signs favour this path. Worth verifying one criterion.'
    : 'The veil is thin. Revisit your weights carefully.';

  // Risk Assessment — measure volatility/stability
  const riskScores = options.map((_, oi) => {
    let variance = 0;
    categories.forEach((cat, ci) => {
      let mv = extractNumber(cat.metrics[oi]);
      if (metricTypes[ci] === 1) mv = mv === 0 ? 0.1 : 1 / mv;
      const catMetrics = categories[ci].metrics.map(m => extractNumber(m));
      const range = (Math.max(...catMetrics) - Math.min(...catMetrics)) || 1;
      const normalized = Math.abs((mv - Math.min(...catMetrics)) / range - 0.5);
      variance += normalized * Math.pow(cat.importance, 2);
    });
    return variance;
  });

  return (
    <div className="scr" id="verdict-content">
      <Nav currentStep={3} stepLabel="III. The verdict" onLogoClick={reset}
        rightAction={onBackToMetrics
          ? <button className="btn btn-g btn-sm" onClick={onBackToMetrics}>&larr; Adjust</button>
          : <button className="btn btn-g btn-sm" onClick={() => setDecision(false)}>&larr; Adjust</button>
        } />

      <div ref={scrollRef} className="sroll">
        {/* SCROLL ZOOM ZONE */}
        <div className="s4-zone">
          <div className="s4-sticky">
            <div className="s4-eye" ref={eyeRef}>
              <div className="v-dash" /><span className="t-lbl">The oracle stirs</span><div className="v-dash" />
            </div>

            <div className="s4-orb-scale" ref={orbScaleRef}>
              <div ref={sphere3dRef} className="w-h-orb-lg">
                <Sphere3D
                  triangleContent={
                    <>
                      <div className="tri-eight" id="s4-eight">8</div>
                      <div className="tri-ans" id="s4-ans" />
                      <div className="tri-sub" id="s4-sub" />
                    </>
                  }
                />
              </div>
            </div>

            <div className="s4-nudge t-lbl" ref={nudgeRef}>
              <button className="btn btn-p" onClick={triggerSphereShake}>Shake to reveal</button>
            </div>

            <div className="s4-vname" ref={vnameRef}>{bestDecision || '\u2014'}</div>
            <div className="s4-vpills" ref={vpillsRef}>
              <div className="vpill"><span className="vpill-n">{wpct.toFixed(1)}%</span><span className="vpill-l">Score</span></div>
              <div className="vsep" />
              <div className="vpill"><span className="vpill-n">+{margin.toFixed(1)}</span><span className="vpill-l">Margin</span></div>
              <div className="vsep" />
              <div className="vpill"><span className="vpill-n">{confWord}</span><span className="vpill-l">Confidence</span></div>
            </div>
          </div>
        </div>

        {/* DASHBOARD */}
        <div className={`s4-dash${demoMode ? ' shown' : ''}`} ref={dashRef}>
          <div className="dash-grid">
            <div className="dash-panels">
              {/* 1. Total Weighted Scores */}
              <div className="cpanel">
                <div className="cp-h">Total weighted scores</div>
                <div className="sbars">
                  {sortedIndices.map((oi, rank) => {
                    const pf = maxScore > 0 ? (scores[oi] / maxScore * 100) : 0;
                    const pv = maxPossible > 0 ? (scores[oi] / maxPossible * 100) : 0;
                    return (
                      <div key={oi} className="sbar-r">
                        <span className="sbar-l">{options[oi]}</span>
                        <div className="sbar-tk">
                          <div className={`sbar-f f${Math.min(rank, 3)}`} data-w={pf.toFixed(1)} />
                        </div>
                        <span className="sbar-v">{pv.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Risk Assessment */}
              <div className="cpanel">
                <div className="cp-h">Risk assessment</div>
                <div className="risk-bars">
                  {sortedIndices.map((oi) => {
                    const riskPct = Math.min(100, (riskScores[oi] / Math.max(...riskScores, 1)) * 100);
                    const riskLevel = riskPct > 60 ? 'High' : riskPct > 30 ? 'Medium' : 'Low';
                    const riskColor = riskPct > 60 ? 'rgba(255,100,100,.8)' : riskPct > 30 ? 'rgba(255,200,100,.8)' : 'rgba(100,200,100,.8)';
                    return (
                      <div key={oi} className="risk-row">
                        <span className="risk-l">{options[oi]}</span>
                        <div className="risk-bar" style={{ background: `linear-gradient(to right, ${riskColor} ${riskPct}%, var(--e2) ${riskPct}%)` }} />
                        <span className="risk-lbl">{riskLevel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Performance Across Criteria */}
              <div className="cpanel">
                <div className="cp-h">Performance across criteria</div>
                <div className="cbreaks">
                  {categories.map((cat, ci) => {
                    const raw = options.map((_, oi) => extractNumber(cat.metrics[oi]));
                    const mn = Math.min(...raw), mx = Math.max(...raw), rng = (mx - mn) || 1;
                    const winIdx = sortedIndices[0];
                    return (
                      <div key={ci} className="cbrow">
                        <div className="cblbl">{cat.title}</div>
                        <div className="cbbars">
                          {sortedIndices.map(oi => {
                            let n = (raw[oi] - mn) / rng;
                            if (metricTypes[ci] === 1) n = 1 - n;
                            const h = Math.max(5, Math.round(n * 100));
                            return (
                              <div key={oi} className="cbw">
                                <div className="cbc">
                                  <div className={`cbb${oi === winIdx ? ' w' : ''}`} style={{ height: `${h}%` }} />
                                </div>
                                <span className="cbn">{options[oi]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Decision Confidence */}
              <div className="cpanel">
                <div className="cp-h">Decision confidence</div>
                <div className="conf-body">
                  <div className="conf-top">
                    <span className="conf-word">{confWord}</span>
                    <span className="conf-pct">{wpct.toFixed(0)}%</span>
                  </div>
                  <div className="conf-bar"><div className="conf-fill" data-w={wpct.toFixed(0)} /></div>
                  <p className="t-sm lh-185 mt-sp3">{confMsg}</p>
                </div>
              </div>

              {/* 5. Trade-off Analysis */}
              <div className="cpanel cp-full">
                <div className="cp-h">Trade-off analysis</div>
                <div className="sctr">
                  <div className="sctr-f">
                    {categories.length >= 2 && (() => {
                      const c0 = categories[0], c1 = categories[1];
                      const r0 = options.map((_, oi) => extractNumber(c0.metrics[oi]));
                      const r1 = options.map((_, oi) => extractNumber(c1.metrics[oi]));
                      const mn0 = Math.min(...r0), rng0 = (Math.max(...r0) - mn0) || 1;
                      const mn1 = Math.min(...r1), rng1 = (Math.max(...r1) - mn1) || 1;
                      return options.map((opt, oi) => {
                        let x = (r0[oi] - mn0) / rng0;
                        let y = (r1[oi] - mn1) / rng1;
                        if (metricTypes[0] === 1) x = 1 - x;
                        if (metricTypes[1] === 1) y = 1 - y;
                        const isWin = oi === sortedIndices[0];
                        return (
                          <React.Fragment key={oi}>
                            <div className={`spt${isWin ? ' win' : ''}`} style={{ left: `${x * 82 + 9}%`, bottom: `${y * 82 + 9}%` }} />
                            <div className="sptl" style={{ left: `${x * 82 + 9}%`, bottom: `${y * 82 + 9}%` }}>{opt}</div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                  {categories.length >= 2 && (
                    <>
                      <span className="sax">{categories[0].title}</span>
                      <span className="say">{categories[1].title}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ORACLE PANEL */}
            <div className="oracle-panel">
              <div className="op-head">
                <div className="op-orb-mini" />
                <span className="t-sm text-t1">Oracle Reading</span>
                <div className="ai-dot ml-auto" />
              </div>

              <div>
                <div className="t-lbl mb-6px">Chosen path</div>
                <div className="op-winner">{bestDecision}</div>
              </div>

              {/* AI Reading */}
              <div>
                {isLoadingFeedback ? (
                  <div className="surface-raised">
                    <div className="ai-dot" />
                    <span className="ai-thinking">The oracle is reading the data\u2026</span>
                  </div>
                ) : (
                  renderFeedback(feedback)
                )}
              </div>

              {/* Follow-up */}
              <div className="ai-zone">
                <div className="ai-lbl-row">
                  <div className="ai-dot" />
                  <span className="t-lbl">Ask a deeper question</span>
                </div>
                <textarea className="fi" rows={3} placeholder="What should I watch out for? Is there something the numbers miss?"
                  value={followUpInput} onChange={(e) => setFollowUpInput(e.target.value)} />
                <button className="btn btn-q btn-full" onClick={askFollowUp}>
                  <div className="ai-dot delay-4" />
                  Consult the oracle
                </button>
                {followUpResponse && (
                  <div className="border-top-e1">
                    <div className="ai-reading-text">{followUpResponse}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="s4-ft">
            <button className="btn btn-g" onClick={() => { if (onBackToMetrics) onBackToMetrics(); else setDecision(false); }}>&larr; Edit offerings</button>
            <button className="btn btn-p" onClick={handleSaveClick}>{selectedDecisionId ? 'Update' : 'Save'}</button>
            <button className="btn btn-g" onClick={handleExportPDF}>Export PDF</button>
            <button className="btn btn-g" onClick={showDecisionHistory}>History</button>
            <button className="btn btn-p" onClick={reset}>New consultation</button>
          </div>
        </div>
      </div>

      {/* Skip button for demo */}
      {demoMode && (
        <button className="btn btn-g btn-sm skip-anim" onClick={skipAnimation}>Skip animation</button>
      )}

      {/* Modals */}
      <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)}
        onSignInSuccess={() => { setShowSignInModal(false); saveToDatabase(); }} />
      <DecisionNamingModal isOpen={showDecisionNameInput} decisionName={decisionName}
        setDecisionName={setDecisionName} onSave={() => { setShowDecisionNameInput(false); saveToDatabase(); }}
        onCancel={() => setShowDecisionNameInput(false)} />

      {saveStatus && (
        <div className="toast" style={{ background: saveStatus.includes('Saved') ? 'var(--iris)' : 'var(--raised)' }}>
          {saveStatus}
        </div>
      )}
    </div>
  );
};

export default CalculateDecision;
