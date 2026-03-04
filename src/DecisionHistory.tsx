import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './styles/history.css';
import './styles/utilities.css';

interface Decision {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  ai_feedback: any;
  options?: { name: string }[];
  categories?: { name: string; importance: number; higher_is_better: boolean }[];
  best_choice?: string;
}

interface DecisionHistoryProps {
  onSelectDecision: (decisionId: string) => void;
  onBack: () => void;
}

const DecisionHistory: React.FC<DecisionHistoryProps> = ({ onSelectDecision, onBack }) => {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingDecision, setDeletingDecision] = useState<string | null>(null);
  const [editingDecision, setEditingDecision] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => { fetchDecisions(); }, []);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('User not authenticated'); return; }

      const { data, error } = await supabase
        .from('decisions')
        .select(`*, decision_options(name), decision_categories(name, importance, higher_is_better)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDecisions((data || []).map(d => ({
        ...d,
        options: d.decision_options || [],
        categories: d.decision_categories || [],
        best_choice: d.ai_feedback?.best_choice || null
      })));
    } catch {
      setError('Failed to load decisions');
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = (decision: Decision) => {
    setEditingDecision(decision.id);
    setEditingTitle(decision.title);
  };

  const handleRename = async (decisionId: string) => {
    if (!editingTitle.trim()) { alert('Title cannot be empty'); return; }
    try {
      const { error } = await supabase.from('decisions').update({ title: editingTitle.trim() }).eq('id', decisionId);
      if (error) throw error;
      setDecisions(prev => prev.map(d => d.id === decisionId ? { ...d, title: editingTitle.trim() } : d));
      setEditingDecision(null);
      setEditingTitle('');
    } catch {
      alert('Failed to rename decision.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, decisionId: string) => {
    if (e.key === 'Enter') handleRename(decisionId);
    else if (e.key === 'Escape') { setEditingDecision(null); setEditingTitle(''); }
  };

  const deleteDecision = async (decisionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Delete this decision? This cannot be undone.')) return;
    try {
      setDeletingDecision(decisionId);
      await supabase.from('decision_values').delete().eq('decision_id', decisionId);
      await supabase.from('decision_categories').delete().eq('decision_id', decisionId);
      await supabase.from('decision_options').delete().eq('decision_id', decisionId);
      const { error } = await supabase.from('decisions').delete().eq('id', decisionId);
      if (error) throw error;
      setDecisions(prev => prev.filter(d => d.id !== decisionId));
    } catch {
      alert('Failed to delete decision.');
    } finally {
      setDeletingDecision(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const handleDecisionClick = (decisionId: string) => {
    navigate(`/decision-maker?decisionId=${decisionId}`);
  };

  if (loading) {
    return (
      <div className="hist">
        <div className="hist-loading">
          <div className="hist-spinner" />
          <span>Consulting the archives...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hist">
        <div className="hist-inner">
          <div className="hist-error">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn btn-g" onClick={onBack}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hist">
      <div className="hist-inner">
        <div className="hist-head">
          <div>
            <button className="btn btn-g btn-sm" onClick={onBack}>&larr; Back</button>
            <h1 className="hist-title mt-sp3">Your Decisions</h1>
            <p className="hist-count">{decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} saved</p>
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="hist-empty">
            <div className="hist-empty-orb" />
            <h2>No decisions yet</h2>
            <p>The oracle awaits your first consultation.</p>
            <button className="btn btn-p" onClick={onBack}>Begin a Decision</button>
          </div>
        ) : (
          <div className="hist-list">
            {decisions.map((decision) => (
              <div key={decision.id} className="hist-card" onClick={() => handleDecisionClick(decision.id)}>
                <div className="hist-card-top">
                  {editingDecision === decision.id ? (
                    <input
                      className="hist-card-name-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRename(decision.id)}
                      onKeyDown={(e) => handleKeyDown(e, decision.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="hist-card-name" onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(decision); }}>
                      {decision.title}
                    </span>
                  )}
                  <button
                    className="hist-del"
                    onClick={(e) => deleteDecision(decision.id, e)}
                    disabled={deletingDecision === decision.id}
                    title="Delete decision"
                  >
                    {deletingDecision === decision.id ? '...' : '\u2715'}
                  </button>
                </div>

                {decision.categories && decision.categories.length > 0 && (
                  <div className="hist-tags">
                    {decision.categories.map((cat, idx) => (
                      <span key={idx} className="hist-tag">{cat.name}</span>
                    ))}
                  </div>
                )}

                <div className="hist-meta">
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(decision.created_at)}
                  </span>
                  {decision.best_choice && (
                    <span className="hist-winner">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {decision.best_choice}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionHistory;
