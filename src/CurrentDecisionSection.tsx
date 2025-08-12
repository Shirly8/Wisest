import React from 'react';

interface CurrentDecisionSectionProps {
  isAuthenticated: boolean;
  options: string[];
  categories: { title: string; metrics: number[]; importance: number }[];
  bestDecision: string;
  selectedDecisionId?: string | null;
  saveStatus: string;
  onSaveClick: () => void;
  onExportPDF: () => void;
  onViewHistory: () => void;
  onBack: () => void;
}

const CurrentDecisionSection: React.FC<CurrentDecisionSectionProps> = ({
  isAuthenticated,
  options,
  categories,
  bestDecision,
  selectedDecisionId,
  saveStatus,
  onSaveClick,
  onExportPDF,
  onViewHistory,
  onBack
}) => {
  return (
    <div style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
      borderRadius: '12px', 
      padding: '20px', 
      margin: '20px auto',
      maxWidth: '1200px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '30px'
      }}>
        
        {/* 1) LEFT COLUMN - DECISION SUMMARY */}
        <div>
          <h3 style={{ color: '#FF6E70', marginBottom: '15px', fontSize: '18px' }}>Decision Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', minWidth: '100px', flexShrink: 0 }}>Best Choice:</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', wordBreak: 'break-word' }}>{bestDecision}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', minWidth: '100px', flexShrink: 0 }}>Options:</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', wordBreak: 'break-word' }}>{options.join(', ')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', minWidth: '100px', flexShrink: 0 }}>Categories:</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', wordBreak: 'break-word' }}>{categories.map(cat => cat.title).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* 2) MIDDLE COLUMN - SAVE STATUS */}
        <div>
          <h3 style={{ color: '#4ECDC4', marginBottom: '15px', fontSize: '18px' }}>Save Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className='startbutton'
              onClick={onSaveClick}
              style={{ 
                backgroundColor: isAuthenticated ? '#4ECDC4' : '#FF6E70',
                fontSize: '14px',
                padding: '12px 16px',
                width: '100%'
              }}
            >
              {selectedDecisionId ? 'Save Changes' : 'Save Decision'}
            </button>
            <button 
              className='startbutton'
              onClick={onBack}
              style={{ 
                backgroundColor: '#666',
                fontSize: '14px',
                padding: '12px 16px',
                width: '100%'
              }}
            >
              Back
            </button>
            {saveStatus && (
              <p style={{ 
                color: saveStatus.includes('success') ? '#4ECDC4' : '#FF6E70', 
                marginTop: '10px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {saveStatus}
              </p>
            )}
          </div>
        </div>

        {/* 3) RIGHT COLUMN - QUICK ACTIONS */}
        <div>
          <h3 style={{ color: '#FFD93D', marginBottom: '15px', fontSize: '18px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className='startbutton'
              onClick={onExportPDF}
              style={{ 
                backgroundColor: '#FFD93D',
                color: '#333',
                fontSize: '14px',
                padding: '12px 16px',
                width: '100%'
              }}
            >
              Export PDF
            </button>
            <button 
              className='startbutton'
              onClick={onViewHistory}
              style={{ 
                backgroundColor: '#9B59B6',
                fontSize: '14px',
                padding: '12px 16px',
                width: '100%'
              }}
            >
              View All Decisions
            </button>
          </div>
        </div>

      </div>

      {/* 4) AUTHENTICATION STATUS */}
      {!isAuthenticated && (
        <div style={{ 
          backgroundColor: 'rgba(255, 110, 112, 0.1)', 
          border: '1px solid rgba(255, 110, 112, 0.3)',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <p style={{ color: '#FF6E70', margin: 0, fontSize: '14px' }}>
            <strong>Note:</strong> Sign in to save your decisions and access them later.
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrentDecisionSection; 