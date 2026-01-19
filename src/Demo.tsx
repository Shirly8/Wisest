import React, { useState, useEffect } from 'react';
import CalculateDecision from './CalculateDecision';

interface DemoProps {
  reset: () => void;
  showDecisionHistory: () => void;
}

const Demo: React.FC<DemoProps> = ({ reset, showDecisionHistory }) => {
  const [showResults, setShowResults] = useState(true);

  // Demo data for tech job comparison
  const demoOptions = ['Google', 'Stripe', 'Shopify', 'Apple'];

  const demoCategories = [
    {
      title: 'Total Compensation',
      metrics: [180000, 200000, 150000, 190000],
      importance: 5,
    },
    {
      title: 'Commute Time',
      metrics: [45, 60, 0, 50],
      importance: 5,
    },
    {
      title: 'Work-Life Balance',
      metrics: [7, 5, 10, 4],
      importance: 5,
    },
    {
      title: 'Stock Options',
      metrics: [1, 1, 0, 1],
      importance: 5,
    },
  ];

  const demoMetricTypes = [0, 1, 4, 2]; // Higher, Lower, Rating (1-10), Yes/No optimal

  const demoMainConsideration = `I'm young and ambitious so I want to pick something with the highest growth potential and can sacrifice short-term gains for longer-term benefits. In the future, I would love a company with the highest opportunity to become an engineering manager.`;

  const demoChoiceConsiderations: { [key: string]: string } = {
    Google: `Pros: Incredible brand recognition, excellent engineering culture, amazing perks and benefits, strong work-life balance, access to cutting-edge projects, excellent career growth opportunities, comprehensive health benefits, free meals and transportation.

Cons: Large company bureaucracy, competitive environment, may get lost in the crowd, slower decision making, commute to Mountain View can be long.`,

    Stripe: `Pros: Highest compensation package, fast-growing fintech company, strong engineering culture, equity upside potential, modern tech stack, great learning opportunities, smaller team feel within larger company.

Cons: High-pressure environment, longer hours expected, expensive San Francisco living costs, competitive culture, less work-life balance, high expectations for performance.`,

    Shopify: `Pros: Fully remote work, excellent work-life balance, Canadian company with great culture, no commute time, flexible schedule, good compensation for remote work, strong engineering team, opportunity to work on e-commerce platform.

Cons: Lower total compensation, limited in-person collaboration, time zone differences with US team, less brand recognition, limited networking opportunities, potential career growth limitations.`,

    Apple: `Pros: Prestigious company, excellent compensation, strong brand recognition, access to innovative projects, comprehensive benefits, good work-life balance, strong engineering culture, opportunities to work on consumer products.

Cons: Secretive culture, long commute to Cupertino, high expectations, competitive environment, limited transparency, strict confidentiality requirements, may feel constrained by company culture.`,
  };

  const demoFeedback = `Based on your priorities and analysis, here's the breakdown:

**Stripe** appears to be the strongest choice given your career ambitions. While it has the highest compensation ($200,000) and strong equity potential, you should carefully consider the work-life balance trade-offs. The fast-growing fintech environment will accelerate your growth and give you exposure to complex problems, which is crucial for becoming an engineering manager.

**Google** is your second-best option. The company offers excellent career growth opportunities, great engineering culture, and a better work-life balance than Stripe. However, the larger company structure might slow your path to management roles compared to Stripe's faster-paced environment.

**Apple** is competitive but has lower work-life balance (4/10) which conflicts with your stated priorities, despite excellent compensation and prestige.

**Shopify** offers the best work-life balance (10/10) and zero commute, but the lower compensation ($150,000) and limited career growth opportunities make it less ideal for your ambitious trajectory.

**Recommendation**: Choose Stripe if you're willing to sacrifice short-term work-life balance for rapid career acceleration and management opportunities. The compensation and equity potential, combined with the fast-paced startup culture, will position you well for an engineering manager role within 3-5 years.`;

  if (showResults) {
    return (
      <CalculateDecision
        categories={demoCategories}
        options={demoOptions}
        metricTypes={demoMetricTypes}
        setDecision={() => {}}
        reset={reset}
        choiceConsiderations={demoChoiceConsiderations}
        mainConsideration={demoMainConsideration}
        setCategories={() => {}}
        setOptions={() => {}}
        setMetricTypes={() => {}}
        setMainConsideration={() => {}}
        setChoiceConsiderations={() => {}}
        selectedDecisionId={null}
        showDecisionHistory={showDecisionHistory}
        decisionName="Tech Job Comparison Demo"
        setDecisionName={() => {}}
        demoMode={true}
        demoFeedback={demoFeedback}
      />
    );
  }

  return <div>Loading demo...</div>;
};

export default Demo;
