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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDecisions(data || []);
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
    if (decision.title.startsWith('Decision ')) {
      const description = decision.description;
      if (description.startsWith('Decision between: ')) {
        const options = description.replace('Decision between: ', '');
        return options.length > 50 ? options.substring(0, 50) + '...' : options;
      }
    }
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
      <div className="header">
        <h1>Your Decision History</h1>
        <button className="home-secondary-button" onClick={onBack}>Back to Start</button>
      </div>

      {decisions.length === 0 ? (
        <div className="empty-state">
          <h2>No decisions yet</h2>
          <p>Start making your first decision to see it here!</p>
          <button className="home-secondary-button" onClick={onBack}>Create New Decision</button>
        </div>
      ) : (
        <div className="decisions-grid">
          {decisions.map((decision) => (
            <div 
              key={decision.id} 
              className="decision-card"
              onClick={() => handleDecisionClick(decision.id)}
            >
              <div className="decision-header">
                {editingDecision === decision.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleRename(decision.id)}
                    onKeyPress={(e) => handleKeyPress(e, decision.id)}
                    autoFocus
                  />
                ) : (
                  <h3 onDoubleClick={() => handleDoubleClick(decision)}>{getDecisionDisplayName(decision)}</h3>
                )}
                <button 
                  className="delete-button"
                  onClick={(e) => deleteDecision(decision.id, e)}
                  disabled={deletingDecision === decision.id}
                >
                  {deletingDecision === decision.id ? 'Deleting...' : '🗑️'}
                </button>
              </div>
              {decision.description && (
                <p className="description">{decision.description}</p>
              )}
              <div className="decision-meta">
                <span className="date">Created: {formatDate(decision.created_at)}</span>
                {decision.ai_feedback && (
                  <span className="has-feedback">✓ AI Feedback Available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecisionHistory; 