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
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 style={{ color: '#FF6E70', fontSize: '14px', marginBottom: '8px', textAlign: 'center' }}>Category Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', flex: 1, overflow: 'auto' }}>
        {sortedCategories.map((category, index) => (
          <div key={index} style={{ borderRadius: '4px', padding: '6px', backgroundColor: 'rgba(255, 110, 112, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ backgroundColor: '#FF6E70', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>{index + 1}</span>
              <span style={{ color: '#FF6E70', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category.title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                        flex: 1,
                        minWidth: 0,
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
                    <span style={{ color: 'white', fontSize: '11px', minWidth: '50px', flexShrink: 0 }}>{sortedOption.option}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 