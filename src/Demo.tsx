import React, { useState } from 'react';
import Main from './Main';

interface DemoProps {
  reset: () => void;
  showDecisionHistory: () => void;
}

// Pre-saved Gemini response for demo - no API call needed
const DEMO_DEFAULT_FEEDBACK = `**Choose Stripe**

**Why This Decision:**
While Google presents a strong and stable path, your explicit goal of pursuing the "highest growth potential" and "highest opportunity to become an engineering manager," coupled with a willingness to "sacrifice short-term gains for longer-term benefits," makes Stripe the superior strategic choice. Stripe's high-pressure, fast-paced environment directly aligns with sacrificing short-term comforts (like work-life balance) for accelerated skill development, rapid impact, and significantly enhanced long-term career trajectory. This environment often provides quicker pathways to leadership roles for ambitious individuals compared to more established, bureaucratic organizations. The equity upside in a high-growth fintech company also offers a greater potential for long-term financial gain, which is a key component of 'growth potential'.

**Strategic Advantages:**
1. **Accelerated Leadership Trajectory**: The rapid expansion and demanding nature of Stripe's environment will compel you to take on significant responsibility quickly, fostering leadership skills and providing more immediate opportunities to step into engineering management roles.
2. **Significant Equity Upside**: As a fast-growing, privately held fintech leader, Stripe offers substantial long-term financial growth potential through its equity, far exceeding the typical stock performance of mature public companies.
3. **Intensive Skill Development**: The high-pressure, modern tech stack environment ensures an unparalleled learning curve, pushing you to master new technologies and problem-solving at an accelerated pace, which is invaluable for future management.

**Risk Mitigation:**
To counter the high-pressure environment, proactively develop strong time management and prioritization skills. Establish clear communication channels with your manager regarding workload and expectations. For San Francisco's high living costs, consider optimizing housing choices and leveraging the strong compensation package effectively. Actively seek out mentors within Stripe who have successfully navigated the demanding culture.

**Implementation Priority:**
Thoroughly research Stripe's specific engineering teams and ongoing projects to identify areas that align with your technical interests and leadership aspirations, then tailor your application and interview preparation to demonstrate your potential for rapid impact and growth in such an environment.

**Success Metrics:**
Measure success by your rate of promotion or increase in responsibility (e.g., leading project initiatives, mentoring junior engineers), the tangible impact of your contributions on Stripe's products or infrastructure, and the growth in value of your equity holdings over time.`;

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
  // Always use the pre-saved feedback - no Gemini call needed for demo
  const [demoFeedback] = useState<string>(DEMO_DEFAULT_FEEDBACK);

  // Reset demo when user clicks reset
  const handleReset = () => {
    reset();
  };

  return (
    <Main
      reset={handleReset}
      selectedDecisionId={selectedDecisionId}
      setSelectedDecisionId={setSelectedDecisionId}
      showDecisionHistory={showDecisionHistory}
      demoMode={true}
      skipMetricsPage={true}
      demoOptions={demoOptions}
      demoCategories={demoCategories}
      demoMetricTypes={demoMetricTypes}
      demoMainConsideration={demoMainConsideration}
      demoChoiceConsiderations={demoChoiceConsiderations}
      autoOpenGemini={true}
      demoFeedback={demoFeedback}
    />
  );
};

export default Demo;
