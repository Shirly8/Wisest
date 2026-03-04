import React from 'react';
import '../styles/orb.css';

interface OrbProps {
  size: string;
  winSize?: string;
  showTriangle?: boolean;
  triangleContent?: React.ReactNode;
  showAtmRings?: boolean;
  showShadow?: boolean;
  id?: string;
  specId?: string;
  swirlId?: string;
  ringId?: string;
  className?: string;
  eightSize?: string;
}

const Orb: React.FC<OrbProps> = ({
  size,
  winSize = '52%',
  showTriangle = true,
  triangleContent,
  showAtmRings = false,
  showShadow = true,
  id,
  specId,
  swirlId,
  ringId,
  className = '',
  eightSize = '2.5rem',
}) => {
  return (
    <div className="orb-stage">
      {showAtmRings && (
        <>
          <div className="atm-ring" />
          <div className="atm-ring" />
          <div className="atm-ring" />
        </>
      )}
      <div className="orb-scene">
        <div
          className={`orb-wrap ${className}`}
          id={id}
          style={{ width: size, height: size }}
        >
          <div className="orb-body">
            <div className="orb-spec" id={specId} />
            <div className="orb-rim-light" />
            <div className="orb-win" style={{ width: winSize, height: winSize }}>
              {swirlId && <div className="swirl" id={swirlId} />}
              {showTriangle && (
                <div className="tri-wrap" style={{ width: '56%', height: '56%' }}>
                  <svg className="tri-svg" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id={`tg-${id || 'orb'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#131D58" stopOpacity=".96" />
                        <stop offset="100%" stopColor="#090F38" stopOpacity=".96" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="50,13 87,80 13,80"
                      fill={`url(#tg-${id || 'orb'})`}
                      stroke="rgba(75,120,230,.22)"
                      strokeWidth=".5"
                    />
                  </svg>
                  <div className="tri-ct" style={{ padding: '18% 10% 24%' }}>
                    {triangleContent || (
                      <div className="tri-eight" style={{ fontSize: eightSize }}>8</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="orb-inner-shadow" />
          </div>
          {showShadow && <div className="orb-shadow" />}
          {ringId && <div className="orb-ring" id={ringId} />}
        </div>
      </div>
    </div>
  );
};

export default Orb;
