import React from 'react';

interface CategoryBreakdownProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  options: string[];
  metricTypes: number[];
  extractNumber: (value: string | number) => number;
  calculatePercentage: (score: number, maxScore: number) => number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  options,
  metricTypes,
  extractNumber,
  calculatePercentage
}) => {
  // 1) SORT CATEGORIES BY IMPORTANCE
  const sortedCategories = [...categories].sort((a, b) => b.importance - a.importance);

  // 2) SORT OPTIONS BY PERFORMANCE
  const sortedOptionsByCategory = sortedCategories.map(category => {
    return options
      .map((option, optionIndex) => ({
        option,
        score: category.metrics[optionIndex]
      }))
      .sort((a, b) => b.score - a.score);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#FF6E70', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>Category Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', flex: 1}}>
        {sortedCategories.map((category, index) => (
          <div key={index} style={{ borderRadius: '4px', padding: '8px', backgroundColor: 'rgba(255, 110, 112, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <span style={{ backgroundColor: '#FF6E70', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{index + 1}</span>
              <span style={{ color: '#FF6E70', fontSize: '14px', fontWeight: 'bold' }}>{category.title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sortedOptionsByCategory[index].map((sortedOption, optionIndex) => {
                const categoryIndex = categories.findIndex(cat => cat.title === category.title);
                const isLowerBetter = categoryIndex >= 0 && metricTypes[categoryIndex] === 1;
                
                let adjustedScore = sortedOption.score;
                if (isLowerBetter) {
                  const allScores = category.metrics.map(extractNumber);
                  const minScore = Math.min(...allScores);
                  const maxScore = Math.max(...allScores);
                  const range = maxScore - minScore;
                  if (range > 0) {
                    const normalized = (sortedOption.score - minScore) / range;
                    adjustedScore = (1 - normalized) * maxScore;
                  }
                }
                
                const maxScore = Math.max(...category.metrics.map(extractNumber));
                const percentage = calculatePercentage(adjustedScore, maxScore) * (category.importance / 10);
                
                let barColor = '#FF6E70';
                if (percentage >= 60) {
                  barColor = '#4ECDC4';
                } else if (percentage >= 30) {
                  barColor = '#FFEAA7';
                }
                
                return (
                  <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{ 
                        width: '350px', 
                        height: '12px', 
                        backgroundColor: '#D3D3D3', 
                        borderRadius: '4px', 
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      title={`${sortedOption.option}: ${extractNumber(sortedOption.score).toFixed(1)} (${percentage.toFixed(1)}% of max)`}
                    >
                      <div 
                        style={{ 
                          width: `${isNaN(percentage) ? 0 : percentage}%`, 
                          height: '100%', 
                          backgroundColor: barColor,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                          e.currentTarget.style.transform = 'scaleY(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scaleY(1)';
                        }}
                      ></div>
                    </div>
                    <span style={{ color: 'white', fontSize: '12px', minWidth: '60px' }}>{sortedOption.option}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p style={{ color: '#999', textAlign: 'center', fontSize: '11px', marginTop: '10px', lineHeight: '1.4' }}>
        <strong>How to read:</strong> Longer bars = better performance in that category.<br/>
        <strong>Look for:</strong> Options with long bars in your most important categories.
      </p>
    </div>
  );
}; 