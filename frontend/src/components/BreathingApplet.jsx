import React, { useState, useEffect } from "react";
import { Sparkles, Wind } from "lucide-react";

export const BreathingApplet = ({ duration = 60, onComplete }) => {
  const [phase, setPhase] = useState("inhale"); // 'inhale', 'hold', 'exhale'
  const [timeLeft, setTimeLeft] = useState(duration);
  const [cycleTime, setCycleTime] = useState(4); // 4 for inhale, 7 down for hold, 8 down for exhale

  useEffect(() => {
    // Total session timer
    const sessionTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(sessionTimer);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [duration, onComplete]);

  useEffect(() => {
    // 4-7-8 Breathing Cycle Logic
    if (timeLeft <= 0) return;

    let nextPhase;
    let nextDuration;

    const cycleTimer = setTimeout(() => {
      if (phase === "inhale") {
        nextPhase = "hold";
        nextDuration = 7;
        setPhase(nextPhase);
        setCycleTime(nextDuration);
      } else if (phase === "hold") {
        nextPhase = "exhale";
        nextDuration = 8;
        setPhase(nextPhase);
        setCycleTime(nextDuration);
      } else if (phase === "exhale") {
        nextPhase = "inhale";
        nextDuration = 4;
        setPhase(nextPhase);
        setCycleTime(nextDuration);
      }
    }, cycleTime * 1000);

    // Inner countdown for the cycle number display
    const countdownInterval = setInterval(() => {
      setCycleTime((prev) => (prev > 1 ? prev - 1 : prev));
    }, 1000);

    return () => {
      clearTimeout(cycleTimer);
      clearInterval(countdownInterval);
    };
  }, [phase, timeLeft]); // Re-trigger when phase changes

  // Dynamic Styles based on phase
  const circleStyle = {
    inhale: "scale-100 bg-mint-400 opacity-80 duration-[4000ms] ease-out",
    hold: "scale-125 bg-mint-500 opacity-90 duration-[1000ms] ease-in-out",
    exhale: "scale-50 bg-teal-600 opacity-50 duration-[8000ms] ease-in-out",
  };

  const textMap = {
    inhale: "Breathe In...",
    hold: "Hold...",
    exhale: "Breathe Out...",
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 rounded-[2rem] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mint-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Session Timer */}
      <div className="absolute top-6 right-6 px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-700/50 flex items-center gap-2">
        <Wind className="w-4 h-4 text-mint-400" />
        <span className="text-mint-400 font-mono text-sm font-semibold">
          {timeLeft}s remaining
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light text-white tracking-wide mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-mint-400" />
            Find Your Center
          </h2>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            4-7-8 Deep Relaxation
          </p>
        </div>

        {/* The Breathing Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          {/* Outer Ripple */}
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-all block ${
              phase === "hold" ? "animate-pulse shadow-[0_0_80px_rgba(52,211,153,0.4)]" : ""
            } ${circleStyle[phase]}`}
          />
          {/* Inner Solid Circle */}
          <div
            className={`absolute w-full h-full rounded-full transition-all block backdrop-blur-md ${circleStyle[phase]}`}
          />

          {/* Text inside circle */}
          <div className="relative z-20 flex flex-col items-center">
            <span className="text-white text-5xl font-mono font-bold drop-shadow-md">
              {cycleTime}
            </span>
          </div>
        </div>

        {/* Phase Text */}
        <div className="h-12">
          <span
            key={phase}
            className="text-2xl text-mint-200 font-medium tracking-wider animate-fade-in block"
          >
            {textMap[phase]}
          </span>
        </div>
      </div>
    </div>
  );
};
