import React from 'react';

interface DecisionNamingModalProps {
  isOpen: boolean;
  decisionName: string;
  setDecisionName: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const DecisionNamingModal: React.FC<DecisionNamingModalProps> = ({
  isOpen,
  decisionName,
  setDecisionName,
  onSave,
  onCancel
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #060724 0%, #0a0a2e 50%, #060724 100%)',
        padding: '40px',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Name Your Decision</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '25px' }}>
          Give your decision a memorable name to easily find it later.
        </p>
        <input
          type="text"
          placeholder="e.g., Job Choice, Apartment Decision, Car Purchase..."
          value={decisionName}
          onChange={(e) => setDecisionName(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '16px',
            width: '100%',
            marginBottom: '20px'
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSave();
            }
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            className='home-secondary-button' 
            onClick={onSave}
            disabled={!decisionName.trim()}
          >
            Save Decision
          </button>
          <button 
            className='home-secondary-button' 
            onClick={onCancel}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecisionNamingModal; 