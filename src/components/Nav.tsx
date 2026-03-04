import React from 'react';
import '../styles/nav.css';

interface NavProps {
  currentStep: number;
  stepLabel: string;
  onLogoClick: () => void;
  rightAction?: React.ReactNode;
}

const Nav: React.FC<NavProps> = ({ currentStep, stepLabel, onLogoClick, rightAction }) => {
  return (
    <nav className="nav">
      <button className="logo" onClick={onLogoClick}>
        <div className="logo-bead">8</div>
        <span className="logo-name">W<em>i</em>sest</span>
      </button>
      <div className="nsteps">
        <div className={`ndot${currentStep === 1 ? ' on' : ''}`} />
        <div className={`ndot${currentStep === 2 ? ' on' : ''}`} />
        <div className={`ndot${currentStep === 3 ? ' on' : ''}`} />
        <span className="ncrumb">{stepLabel}</span>
      </div>
      {rightAction || (
        <button className="btn btn-g btn-sm" onClick={onLogoClick}>&larr; Exit</button>
      )}
    </nav>
  );
};

export default Nav;
