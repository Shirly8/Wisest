import * as d3 from 'd3';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DecisionConfidenceProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  options: string[];
  bestDecision: string;
}

export const createConfidenceAnalysis = (
  containerRef: React.RefObject<HTMLDivElement>,
  categories: { title: string; metrics: number[]; importance: number }[],
  options: string[],
  bestDecision: string,
  calculateScore: () => number[]
) => {
  if (!containerRef.current) return;
  
  d3.select(containerRef.current).selectAll("*").remove();
  
  const margin = {top: 20, right: 30, bottom: 40, left: 60};
  const width = 400 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  
  const svg = d3.select(containerRef.current)
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // 1) CALCULATE SCORES AND CONFIDENCE
  const scores = calculateScore();
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const scoreRange = maxScore - minScore;
  
  const confidenceLevel = scoreRange > maxScore * 0.3 ? "High" : 
                         scoreRange > maxScore * 0.15 ? "Medium" : "Low";
  
  const x = d3.scaleBand()
    .range([0, width])
    .domain(options)
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, maxScore * 1.1])
    .range([height, 0]);
  
  // 2) ADD BARS
  svg.selectAll("rect")
    .data(scores)
    .enter()
    .append("rect")
    .attr("x", (d, i) => x(options[i]) || 0)
    .attr("y", d => y(d))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d))
    .attr("fill", (d, i) => {
        const maxScore = Math.max(...scores);
        const percentage = d / maxScore;
        if (percentage >= 0.8) return "#4ECDC4";
        if (percentage >= 0.5) return "#FFEAA7";
        return "#FF6E70";
    })
    .attr("opacity", 0.8);
  
  // 3) ADD CONFIDENCE INDICATOR
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .text(`Confidence: ${confidenceLevel}`)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", confidenceLevel === "High" ? "#4ECDC4" : 
                 confidenceLevel === "Medium" ? "#FFEAA7" : "#45B7D1");
  
  // 4) ADD SCORE LABELS
  svg.selectAll("text.score")
    .data(scores)
    .enter()
    .append("text")
    .attr("class", "score")
    .text(d => d.toFixed(2))
    .attr("x", (d, i) => (x(options[i]) || 0) + x.bandwidth() / 2)
    .attr("y", d => y(d) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "white");
  
  // 5) ADD AXES
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .call(d3.axisLeft(y));
}; 