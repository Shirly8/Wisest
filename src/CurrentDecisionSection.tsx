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
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: '15px',
      margin: '15px auto',
      maxWidth: '1000px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>

      <div className="current-decision-actions" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>

        {/* STATUS INDICATOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: selectedDecisionId ? '#c13a34' : '#f97f78'
          }}></div>
          <span style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {selectedDecisionId ? 'Saved' : 'Unsaved'}
          </span>
        </div>

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={onSaveClick}
            style={{ 
              backgroundColor: '#c13a34',
              border: '2px solid #f97f78',
              color: 'white',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 6px rgba(193, 58, 52, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b2403d';
              e.currentTarget.style.borderColor = '#ed5b7a';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(193, 58, 52, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#c13a34';
              e.currentTarget.style.borderColor = '#f97f78';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(193, 58, 52, 0.3)';
            }}
          >
            {selectedDecisionId ? 'Update' : 'Save'}
          </button>
          
          <button 
            onClick={onExportPDF}
            style={{ 
              backgroundColor: 'transparent',
              border: '2px solid #f97f78',
              color: '#f97f78',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f97f78';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#f97f78';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Export
          </button>
          
          <button 
            onClick={onViewHistory}
            style={{ 
              backgroundColor: 'transparent',
              border: '2px solid #ed5b7a',
              color: '#ed5b7a',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ed5b7a';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#ed5b7a';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            History
          </button>
          
          <button 
            onClick={onBack}
            style={{ 
              backgroundColor: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Back
          </button>
        </div>
      </div>

      {/* STATUS MESSAGE */}
      {saveStatus && (
        <div style={{ 
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: saveStatus.includes('success') ? 'rgba(193, 58, 52, 0.1)' : 'rgba(249, 127, 120, 0.1)',
          border: `1px solid ${saveStatus.includes('success') ? '#c13a34' : '#f97f78'}`,
          borderRadius: '4px'
        }}>
          <p style={{ 
            color: saveStatus.includes('success') ? '#c13a34' : '#f97f78', 
            margin: 0,
            fontSize: '11px',
            textAlign: 'center'
          }}>
            {saveStatus}
          </p>
        </div>
      )}

      {/* AUTHENTICATION NOTE */}
      {!isAuthenticated && (
        <div style={{ 
          marginTop: '10px',
          padding: '6px 10px',
          backgroundColor: 'rgba(249, 127, 120, 0.1)',
          border: '1px solid #f97f78',
          borderRadius: '4px'
        }}>
          <p style={{ 
            color: '#f97f78', 
            margin: 0, 
            fontSize: '10px',
            textAlign: 'center'
          }}>
            Sign in to save decisions
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrentDecisionSection; 