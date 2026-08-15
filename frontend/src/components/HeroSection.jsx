import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { HeroAvatar } from "./HeroAvatar";
import { Environment, Float, Sparkles, ContactShadows } from "@react-three/drei";

export const HeroSection = ({ onGetStarted }) => {

  const pills = [
    { icon: "🧘", text: "AI Yoga Coach" },
    { icon: "📡", text: "Real-Time Pose Detection" },
    { icon: "🧠", text: "RAG Knowledge Base" },
    { icon: "🎙️", text: "Voice-First Interaction" },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#f5f3ef]">

      {/* ── Very subtle warm dot-grid background ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(107,143,113,0.12) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Soft colour blobs ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[5%] w-[520px] h-[520px] rounded-full bg-[#d8ead8] opacity-40 blur-[110px] animate-blob" />
        <div className="absolute top-[15%] right-[0%] w-[420px] h-[420px] rounded-full bg-[#e2ddf0] opacity-35 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-8%] left-[35%] w-[380px] h-[380px] rounded-full bg-[#f5e0d8] opacity-30 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* ── 3D Avatar Canvas (full-screen background) ── */}
      <div className="absolute inset-0 z-[1]">
        <Canvas camera={{ position: [0, 0, 6], fov: 44 }}>
          <ambientLight intensity={0.65} />
          <spotLight position={[8, 10, 8]} angle={0.18} penumbra={1} intensity={0.9} color="#a8c8a0" />
          <pointLight position={[-8, -6, -8]} intensity={0.35} color="#c4b8e8" />
          <Environment preset="apartment" />
          <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.18}>
            <HeroAvatar
              modelPath="/models/new_yoga_assistant.glb"
              audioPath="/audios/intro_0.wav"
            />
          </Float>
          <ContactShadows position={[0, -2.1, 0]} opacity={0.45} scale={18} blur={2.5} far={5} />
          <Sparkles count={40} scale={9} size={2.5} speed={0.25} opacity={0.3} color="#8aad90" />
        </Canvas>
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
        {/* Wordmark only — no logo box */}
        <span className="text-[1.35rem] font-extrabold tracking-[-0.5px] text-[#2d3a2e]">
          Yoga<span className="text-[#6b8f71]">Kickfit</span>
          <span className="text-[#9b8ec4]">.AI</span>
        </span>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-[0.82rem] font-semibold tracking-wide text-[#5a6a5b] uppercase">
          <a href="#about" className="hover:text-[#6b8f71] transition-colors duration-200">About</a>
          <a href="#features" className="hover:text-[#6b8f71] transition-colors duration-200">Features</a>
        </div>

        {/* CTA button */}
        <button
          onClick={onGetStarted}
          className="relative overflow-hidden px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#6b8f71]/25 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: "linear-gradient(135deg, #6b8f71 0%, #8b7fc4 100%)" }}
        >
          Sign In
        </button>
      </nav>

      {/* ── HERO CONTENT ── */}
      <div className="relative z-10 flex flex-col items-start justify-center min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-8 pb-16">

        {/* Left panel – text block */}
        <div className="max-w-xl space-y-7">

          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-[#c8dac8] text-xs font-bold tracking-wide text-[#4a7a50] shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6b8f71] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6b8f71]" />
            </span>
            AI-Powered Yoga & Fitness
          </div>

          {/* Headline */}
          <h1 className="text-[3.4rem] md:text-[4rem] leading-[1.08] font-extrabold tracking-[-1.5px] text-[#1e2b1f]">
            Your Personal<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #6b8f71 20%, #9b8ec4 55%, #e07a5f 90%)" }}
            >
              AI Yoga Instructor
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="text-[1.05rem] text-[#5a6a5b] leading-relaxed max-w-md">
            Practice yoga with real-time pose detection. Chat with a living 3D instructor.
            Search a custom knowledge base built from your own PDF guides — voice-first, always.
          </p>

          {/* Hint */}
          <p className="text-xs text-[#8aad90] font-semibold italic flex items-center gap-1.5 animate-pulse">
            <span>✦</span> Click the avatar in the background to interact
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white shadow-lg shadow-[#6b8f71]/30 hover:shadow-[#6b8f71]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #6b8f71 0%, #4a6b50 100%)" }}
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            <button className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-[#4a7a50] bg-white/70 backdrop-blur-sm border border-[#c8dac8] hover:bg-white hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </button>
          </div>

          {/* Feature pills row */}
          <div className="flex flex-wrap gap-2 pt-2">
            {pills.map((p, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.72rem] font-semibold bg-white/60 backdrop-blur-sm border border-white/80 text-[#3d4e3e] shadow-sm"
              >
                {p.icon} {p.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
