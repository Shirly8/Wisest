import React, { useState, useEffect } from 'react';
import Main from './Main';

interface DemoProps {
  reset: () => void;
  showDecisionHistory: () => void;
}

const DEMO_STORAGE_KEY = 'wisest_demo_completed';

const Demo: React.FC<DemoProps> = ({ reset, showDecisionHistory }) => {
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

  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [skipMetrics, setSkipMetrics] = useState(false);

  // Check if demo has been completed before and skip to results
  useEffect(() => {
    const demoCompleted = localStorage.getItem(DEMO_STORAGE_KEY);
    if (demoCompleted === 'true') {
      setSkipMetrics(true);
    }
  }, []);

  // Mark demo as completed when moving to results
  const handleDemoCompleted = () => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
  };

  // Reset demo when user clicks reset
  const handleReset = () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    reset();
  };

  return (
    <Main
      reset={handleReset}
      selectedDecisionId={selectedDecisionId}
      setSelectedDecisionId={setSelectedDecisionId}
      showDecisionHistory={showDecisionHistory}
      demoMode={true}
      skipMetricsPage={skipMetrics}
      demoOptions={demoOptions}
      demoCategories={demoCategories}
      demoMetricTypes={demoMetricTypes}
      demoMainConsideration={demoMainConsideration}
      demoChoiceConsiderations={demoChoiceConsiderations}
      autoOpenGemini={true}
      onDemoCompleted={handleDemoCompleted}
    />
  );
};

export default Demo;
