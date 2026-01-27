import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './DecisionHistory.css';

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
  const [editingTitle, setEditingTitle] = useState<string>('');

  // 1) LOAD DECISIONS
  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('decisions')
        .select(`
          *,
          decision_options(name),
          decision_categories(name, importance, higher_is_better)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process the data to include options and categories
      const processedDecisions = (data || []).map(decision => ({
        ...decision,
        options: decision.decision_options || [],
        categories: decision.decision_categories || [],
        best_choice: decision.ai_feedback?.best_choice || null
      }));
      
      setDecisions(processedDecisions);
    } catch (err) {
      setError('Failed to load decisions');
    } finally {
      setLoading(false);
    }
  };

  // 2) EDIT DECISION TITLE
  const handleDoubleClick = (decision: Decision) => {
    setEditingDecision(decision.id);
    setEditingTitle(decision.title);
  };

  const handleRename = async (decisionId: string) => {
    if (!editingTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('decisions')
        .update({ title: editingTitle.trim() })
        .eq('id', decisionId);

      if (error) throw error;

      setDecisions(prev => prev.map(d => 
        d.id === decisionId ? { ...d, title: editingTitle.trim() } : d
      ));

      setEditingDecision(null);
      setEditingTitle('');
    } catch (err) {
      alert('Failed to rename decision. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, decisionId: string) => {
    if (e.key === 'Enter') {
      handleRename(decisionId);
    } else if (e.key === 'Escape') {
      setEditingDecision(null);
      setEditingTitle('');
    }
  };

  // 3) DELETE DECISION
  const deleteDecision = async (decisionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this decision? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingDecision(decisionId);
      
      await supabase.from('decision_values').delete().eq('decision_id', decisionId);
      await supabase.from('decision_categories').delete().eq('decision_id', decisionId);
      await supabase.from('decision_options').delete().eq('decision_id', decisionId);
      
      const { error } = await supabase
        .from('decisions')
        .delete()
        .eq('id', decisionId);

      if (error) throw error;
      
      setDecisions(prev => prev.filter(d => d.id !== decisionId));
      
    } catch (err) {
      alert('Failed to delete decision. Please try again.');
    } finally {
      setDeletingDecision(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDecisionDisplayName = (decision: Decision) => {
    // Always return the actual title, don't try to extract from description
    return decision.title;
  };

  const handleDecisionClick = (decisionId: string) => {
    navigate(`/decision-maker?decisionId=${decisionId}`);
  };

  if (loading) {
    return (
      <div className="decision-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Loading your decisions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="decision-history">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="home-secondary-button" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="decision-history">
      <button className="history-back-button" onClick={onBack}>← Back</button>

      <div className="history-header">
        <div className="history-title-section">
          <h1 className="history-title">Your Decisions</h1>
          <p className="history-subtitle">{decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} saved</p>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No decisions yet</h2>
          <p>Start making your first decision to see it here!</p>
          <button className="home-start-now-button" onClick={onBack}>Create Your First Decision</button>
        </div>
      ) : (
        <div className="decisions-list">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="decision-item"
              onClick={() => handleDecisionClick(decision.id)}
            >
              <div className="decision-main">
                <div className="decision-title-row">
                  {editingDecision === decision.id ? (
                    <input
                      type="text"
                      className="decision-title-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRename(decision.id)}
                      onKeyPress={(e) => handleKeyPress(e, decision.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <h3 className="decision-title" onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(decision); }}>
                      {getDecisionDisplayName(decision)}
                    </h3>
                  )}
                  <button
                    className="decision-delete-button"
                    onClick={(e) => deleteDecision(decision.id, e)}
                    disabled={deletingDecision === decision.id}
                    title="Delete decision"
                  >
                    {deletingDecision === decision.id ? '...' : '✕'}
                  </button>
                </div>

                {/* Categories */}
                {decision.categories && decision.categories.length > 0 && (
                  <div className="decision-categories">
                    {decision.categories.map((cat, idx) => (
                      <span key={idx} className="category-tag">{cat.name}</span>
                    ))}
                  </div>
                )}

                <div className="decision-meta">
                  <span className="decision-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {formatDate(decision.created_at)}
                  </span>

                  {/* Best Choice */}
                  {decision.best_choice && (
                    <span className="decision-result">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {decision.best_choice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecisionHistory; 