import * as d3 from 'd3';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RiskAssessmentProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  options: string[];
  metricTypes: number[];
}

export const createRiskAssessment = (
  containerRef: React.RefObject<HTMLDivElement>,
  categories: { title: string; metrics: number[]; importance: number }[],
  options: string[],
  metricTypes: number[]
) => {
  if (!containerRef.current) return;

  d3.select(containerRef.current).selectAll("*").remove();

  const margin = {top: 15, right: 15, bottom: 35, left: 45};
  const totalWidth = 340;
  const totalHeight = 280;
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  const svg = d3.select(containerRef.current)
    .append("svg")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // 1) CALCULATE RISK SCORES
  const riskData = options.map((option, optionIndex) => {
    let totalRisk = 0;
    const categoryRisks = categories.map((category, categoryIndex) => {
      const value = category.metrics[optionIndex];
      const importance = category.importance;
      
      let risk;
      if (metricTypes[categoryIndex] === 1) {
        risk = importance * value / 10;
      } else {
        risk = importance * (10 - value) / 10;
      }
      
      totalRisk += risk;
      return {
        category: category.title,
        risk: risk,
        value: value,
        importance: importance
      };
    });
    
    return {
      option: option,
      totalRisk: totalRisk / categories.length,
      categoryRisks: categoryRisks,
      riskLevel: totalRisk / categories.length > 7 ? "High" : 
                totalRisk / categories.length > 4 ? "Medium" : "Low"
    };
  });
  
  const x = d3.scaleLinear()
    .domain([0, 10])
    .range([0, width]);
  
  const y = d3.scaleBand()
    .range([0, height])
    .domain(riskData.map(d => d.option))
    .padding(0.2);
  
  // 2) ADD RISK BARS
  svg.selectAll("rect")
    .data(riskData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", d => y(d.option) || 0)
    .attr("width", d => x(d.totalRisk))
    .attr("height", y.bandwidth())
    .attr("fill", d => {
      if (d.totalRisk >= 7) return "#FF6E70";
      if (d.totalRisk >= 4) return "#FFEAA7";
      return "#4ECDC4";
    })
    .attr("opacity", 0.8)
    .attr("ry", 3);
  
  // 3) ADD RISK LABELS
  svg.selectAll("text.risk")
    .data(riskData)
    .enter()
    .append("text")
    .attr("class", "risk")
    .text(d => d.totalRisk.toFixed(1))
    .attr("x", d => x(d.totalRisk) + 5)
    .attr("y", d => (y(d.option) || 0) + y.bandwidth() / 2)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("fill", "white");
  
  // 4) ADD RISK LEVEL INDICATORS
  svg.selectAll("text.level")
    .data(riskData)
    .enter()
    .append("text")
    .attr("class", "level")
    .text(d => d.riskLevel)
    .attr("x", d => x(d.totalRisk) + 5)
    .attr("y", d => (y(d.option) || 0) + y.bandwidth() / 2 + 15)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "8px")
    .attr("fill", "#C13B34");
  
  // 5) ADD AXES
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("font-size", "9px")
    .attr("fill", "#999")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end");
  
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .attr("font-size", "9px")
    .attr("fill", "#999");
}; 