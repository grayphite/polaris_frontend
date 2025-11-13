import React from 'react';
import LandingLayout from '../layouts/LandingLayout';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import StatisticsSection from '../components/landing/StatisticsSection';
import IntegrationSection from '../components/landing/IntegrationSection';
import PricingSection from '../components/landing/PricingSection';
import GuaranteesSection from '../components/landing/GuaranteesSection';

const Landing: React.FC = () => {
  return (
    <LandingLayout>
      <HeroSection />
      <FeaturesSection />
      <StatisticsSection />
      <IntegrationSection />
      <PricingSection />
      <GuaranteesSection />
    </LandingLayout>
  );
};

export default Landing;

