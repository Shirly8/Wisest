import React from 'react';
import './styles/modals.css';

interface DecisionNamingModalProps {
  isOpen: boolean;
  decisionName: string;
  setDecisionName: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const DecisionNamingModal: React.FC<DecisionNamingModalProps> = ({
  isOpen, decisionName, setDecisionName, onSave, onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}>&times;</button>
        <div className="modal-orb" />
        <h2 className="modal-title">Name Your Decision</h2>
        <p className="modal-desc">Give your decision a memorable name to easily find it later.</p>
        <input
          className="naming-input"
          type="text"
          placeholder="e.g., Job Choice, Apartment Decision..."
          value={decisionName}
          onChange={(e) => setDecisionName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); }}
          autoFocus
        />
        <div className="naming-actions">
          <button className="btn btn-p" onClick={onSave} disabled={!decisionName.trim()}>Save Decision</button>
          <button className="btn btn-g" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default DecisionNamingModal;
