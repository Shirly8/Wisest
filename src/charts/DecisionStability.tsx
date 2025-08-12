import * as d3 from 'd3';

interface DecisionStabilityProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  options: string[];
  metricTypes: number[];
}

export const createSensitivityAnalysis = (
  containerRef: React.RefObject<HTMLDivElement>,
  categories: { title: string; metrics: number[]; importance: number }[],
  options: string[],
  metricTypes: number[],
  calculateScore: () => number[],
  extractNumber: (value: string | number) => number
) => {
  if (!containerRef.current) return;
  
  d3.select(containerRef.current).selectAll("*").remove();
  
  const margin = {top: 30, right: 30, bottom: 40, left: 60};
  const width = 400 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  
  const svg = d3.select(containerRef.current)
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // 1) CALCULATE SENSITIVITY DATA
  const sensitivityData = categories.map(category => {
    const originalScores = calculateScore();
    const originalWinner = options[originalScores.indexOf(Math.max(...originalScores))];
    
    const modifiedCategories = categories.map(c => 
      c.title === category.title 
        ? {...c, importance: Math.min(10, c.importance * 1.5)}
        : c
    );
    
    const modifiedScores = options.map((_, optionIndex) => {
      let eachScore = 0;
      modifiedCategories.forEach((cat, categoryIndex) => {
        let metricValue = extractNumber(cat.metrics[optionIndex]);
        
        if (metricTypes[categoryIndex] === 1) {
          metricValue = metricValue === 0 ? 0.1 : 1 / metricValue;
        }
        
        const minVal = Math.min(...cat.metrics.map(extractNumber));
        const maxVal = Math.max(...cat.metrics.map(extractNumber));
        const range = maxVal - minVal;
        let normalizedMetric;
        
        if (range === 0) {
          normalizedMetric = 0.5;
        } else {
          if (metricTypes[categoryIndex] === 1) {
            const originalValue = extractNumber(cat.metrics[optionIndex]);
            const originalNormalized = (originalValue - minVal) / range;
            normalizedMetric = 1 - originalNormalized;
          } else {
            normalizedMetric = (metricValue - minVal) / range;
          }
          normalizedMetric = Math.max(0, Math.min(1, normalizedMetric));
        }
        
        const exponentialWeight = Math.pow(cat.importance, 2);
        eachScore += normalizedMetric * exponentialWeight;
      });
      return eachScore;
    });
    
    const modifiedWinner = options[modifiedScores.indexOf(Math.max(...modifiedScores))];
    const isStable = originalWinner === modifiedWinner;
    
    return {
      category: category.title,
      importance: category.importance,
      isStable: isStable,
      influence: isStable ? "Low" : "High"
    };
  });
  
  const x = d3.scaleBand()
    .range([0, width])
    .domain(sensitivityData.map(d => d.category))
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, 10])
    .range([height, 0]);
  
  // 2) ADD BARS
  svg.selectAll("rect")
    .data(sensitivityData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.category) || 0)
    .attr("y", d => y(d.importance))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.importance))
    .attr("fill", d => {
      if (d.importance >= 8) return "#FF6E70";
      if (d.importance >= 5) return "#FFEAA7";
      return "#4ECDC4";
    })
    .attr("opacity", 0.8);
  
  // 3) ADD IMPORTANCE LABELS
  svg.selectAll("text")
    .data(sensitivityData)
    .enter()
    .append("text")
    .text(d => d.importance)
    .attr("x", d => (x(d.category) || 0) + x.bandwidth() / 2)
    .attr("y", d => y(d.importance) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "white");
  
  // 4) ADD STABILITY INDICATORS
  svg.selectAll("text.stability")
    .data(sensitivityData)
    .enter()
    .append("text")
    .attr("class", "stability")
    .text(d => d.isStable ? "✓" : "⚠")
    .attr("x", d => (x(d.category) || 0) + x.bandwidth() / 2)
    .attr("y", height + 35)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", d => d.isStable ? "#4ECDC4" : "#FF6E70");
  
  // 5) ADD AXES
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .call(d3.axisLeft(y));
}; 