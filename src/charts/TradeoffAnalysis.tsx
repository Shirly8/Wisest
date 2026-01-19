import * as d3 from 'd3';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TradeoffAnalysisProps {
  categories: { title: string; metrics: number[]; importance: number }[];
  options: string[];
  bestDecision: string;
}

export const createTradeoffAnalysis = (
  containerRef: React.RefObject<HTMLDivElement>,
  categories: { title: string; metrics: number[]; importance: number }[],
  options: string[],
  bestDecision: string
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
  
  // 1) FIND TOP TWO CATEGORIES
  const sortedCategories = [...categories].sort((a, b) => b.importance - a.importance);
  const category1 = sortedCategories[0];
  const category2 = sortedCategories[1];
  
  if (!category1 || !category2) return;
  
  const x = d3.scaleLinear()
    .domain([0, 10])
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([0, 10])
    .range([height, 0]);
  
  // 2) ADD GRID LINES
  for (let i = 0; i <= 10; i += 2) {
    svg.append("line")
      .attr("x1", x(i))
      .attr("y1", 0)
      .attr("x2", x(i))
      .attr("y2", height)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.5);
    
    svg.append("line")
      .attr("x1", 0)
      .attr("y1", y(i))
      .attr("x2", width)
      .attr("y2", y(i))
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.5);
  }
  
  // 3) ADD DATA POINTS
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const colors = ['#FF6E70', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const pointData = options.map((option, index) => ({
    option: option,
    xValue: category1.metrics[index],
    yValue: category2.metrics[index]
  }));
  
  pointData.forEach((d, index) => {
    let pointColor = '#FF6E70';
    const xPercent = d.xValue / 10;
    const yPercent = d.yValue / 10;
    const avgPerformance = (xPercent + yPercent) / 2;
    
    if (avgPerformance >= 0.7) {
      pointColor = '#4ECDC4';
    } else if (avgPerformance >= 0.4) {
      pointColor = '#FFEAA7';
    }
    
    svg.append("circle")
      .attr("cx", x(d.xValue))
      .attr("cy", y(d.yValue))
      .attr("r", 8)
      .attr("fill", pointColor)
      .attr("opacity", 0.8)
      .on("mouseover", function(event) {
        d3.select(this).attr("r", 12);
        
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none");
        
        tooltip.html(`
          <strong>${d.option}</strong><br/>
          ${category1.title}: ${d.xValue}/10<br/>
          ${category2.title}: ${d.yValue}/10
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 8);
        d3.selectAll(".tooltip").remove();
      });
    
    svg.append("text")
      .attr("x", x(d.xValue) + 12)
      .attr("y", y(d.yValue))
      .text(d.option)
      .attr("font-size", "10px")
      .attr("fill", pointColor);
  });
  
  // 4) ADD AXES AND LABELS
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  
  svg.append("g")
    .call(d3.axisLeft(y));
  
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .text(category1.title)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "#FF6E70");
  
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .text(category2.title)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "#FF6E70");
}; 