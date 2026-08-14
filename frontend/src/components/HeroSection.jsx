import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { HeroAvatar } from "./HeroAvatar";
import { Environment, Float, Sparkles, ContactShadows } from "@react-three/drei";
import RefButton from "./ui/RefButton";
import RefCard from "./ui/RefCard";

export const HeroSection = ({ onGetStarted }) => {
  const [hovered, setHovered] = useState(false);

  const handleGetStartedClick = () => {
    // Usually triggers some auth or routing flow
    onGetStarted();
  };

  const features = [
    { icon: "🧘", label: "AI Yoga Coach", desc: "3D avatar guides you through poses" },
    { icon: "📷", label: "Pose Detection", desc: "Real-time feedback via webcam" },
    { icon: "🥊", label: "Kickboxing", desc: "High-energy training mode" },
    { icon: "🧠", label: "Smart AI", desc: "Learns and adapts to you" },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-warm-50 via-sage-50 to-lavender-50 text-warm-800 selection:bg-sage-500 selection:text-white">
      
      {/* 3D Background - Full Screen */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} color="#6b8f71" />
          <pointLight position={[-10, -10, -10]} intensity={0.4} color="#9b8ec4" />
          <Environment preset="apartment" />
          
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <HeroAvatar 
              modelPath="/models/new_yoga_assistant.glb" 
              audioPath="/audios/intro_0.wav" 
            />
          </Float>
          
          {/* Floor Shadow for realism */}
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />
          
          <Sparkles count={50} scale={10} size={3} speed={0.3} opacity={0.4} color="#6b8f71" />
        </Canvas>
      </div>

      {/* Main Content Overlay - pointer-events-none allows clicking through to canvas */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        
        {/* Soft Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-sage-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob"></div>
          <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-lavender-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-coral-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        {/* Subtle Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6b8f7108_1px,transparent_1px),linear-gradient(to_bottom,#6b8f7108_1px,transparent_1px)] bg-[size:32px_32px] z-[-1]"></div>

        {/* Navbar */}
        <nav className="flex justify-between items-center p-6 md:p-8 w-full max-w-7xl mx-auto pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sage-500 to-lavender-400 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-sage-500/20">
              Y
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">
              YogaKickFit<span className="text-sage-500">.AI</span>
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-warm-500">
            <a href="#features" className="hover:text-sage-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-sage-600 transition-colors">About</a>
          </div>
          <button onClick={handleGetStartedClick} className="px-5 py-2 rounded-full border-2 border-sage-300 hover:bg-sage-50 transition-all text-sm font-semibold text-sage-600">
            Sign In
          </button>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-start justify-center max-w-7xl mx-auto w-full px-6 relative mt-10 md:mt-0">
          
          {/* Left Text Area (Limit width to not block the avatar completely if she is on right) */}
          <div className="flex flex-col items-start justify-center space-y-7 z-20 md:pr-12 py-8 md:py-0 pointer-events-auto max-w-2xl bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage-100/90 border border-sage-200 text-xs font-semibold text-sage-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-500"></span>
              </span>
              AI-Powered Yoga & Fitness
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Your Personal
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-500 via-lavender-400 to-coral-400 bg-200% animate-gradient-x">
                AI Yoga Instructor
              </span>
            </h1>

            <p className="text-lg text-warm-600 max-w-lg leading-relaxed font-medium">
              Practice yoga with real-time pose detection, get guided by a living 3D AI
              tutor, master breathing techniques, and train kickboxing — all in
              one beautiful app.
            </p>
            
            <p className="text-sm text-sage-600 italic animate-pulse">
              Click on the avatar wandering in the background to interact!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <RefButton onClick={handleGetStartedClick} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>}>
                Get Started Free
              </RefButton>
              <RefButton icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}>
                Watch Demo
              </RefButton>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-5xl mx-auto w-full px-6 pb-16 pointer-events-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} style={{ animationDelay: `${i * 0.1}s` }} className="animate-fade-in">
                <RefCard title={f.label} text={f.desc} socialButtons={[{ icon: <span style={{fontSize: '24px'}}>{f.icon}</span> }]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
