import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';

export const HeroPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}
      <HeroSection onGetStarted={onGetStarted} />
    </div>
  );
};