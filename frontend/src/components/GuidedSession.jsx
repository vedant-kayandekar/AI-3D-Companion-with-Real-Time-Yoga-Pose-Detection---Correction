import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, CheckCircle2, RotateCcw, ChevronLeft, Wind } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { yogaPlans } from "../data/yogaPlans";
import { poseImages } from "../pose-detection/poseImages";
import { GuidedSessionCamera } from "./GuidedSessionCamera";
import { BreathingApplet } from "./BreathingApplet";

export const GuidedSession = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  
  const plan = yogaPlans.find(p => p.id === planId);
  const totalSteps = plan?.routine.length || 0;

  const [currentStep, setCurrentStep] = useState(0);
  const [sessionState, setSessionState] = useState('intro'); // 'intro', 'active', 'rest', 'finished'
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const mountedRef = useRef(true);
  const stepAudioRef = useRef(null); // Reference for transition audios

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
    if (stepAudioRef.current) {
        stepAudioRef.current.pause();
        stepAudioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
  };

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.name.toLowerCase().includes('female')) || 
           voices.find(v => v.name.includes('Samantha')) || 
           voices.find(v => v.name.includes('Google US English'));
  };

  useEffect(() => {
    if (!plan || sessionState === 'finished') return;

    stopAllAudio();
    setIsPaused(false);

    const setupStep = () => {
      if (sessionState === 'intro') {
        const step = plan.routine[currentStep];
        
        // Setup audio callback or generic browser TTS
        const playWelcome = () => {
           if (!mountedRef.current) return;
           if (step.audioSrc) {
               // If there's a local audio file provided
               stepAudioRef.current = new Audio(step.audioSrc);
               stepAudioRef.current.onended = startActiveTimer;
               stepAudioRef.current.play().catch(e => {
                   console.log("Audio failed to auto-play, falling back to TTS", e);
                   fallbackTTS();
               });
           } else {
               fallbackTTS();
           }
        };

        const fallbackTTS = () => {
           const u = new SpeechSynthesisUtterance(step.textInstruction);
           const voice = getFemaleVoice();
           if (voice) u.voice = voice;
           u.onend = () => {
               if (mountedRef.current) startActiveTimer();
           };
           window.speechSynthesis.speak(u);
        };

        playWelcome();
      }
    };

    setupStep();
  }, [currentStep, sessionState, plan]);

  const startActiveTimer = () => {
    if (!mountedRef.current) return;
    setSessionState(prev => {
        if (prev !== 'intro') return prev;
        
        const step = plan.routine[currentStep];
        setTimer(step.duration);
        return 'active';
    });
  };

  const startRest = () => {
    if(currentStep >= totalSteps - 1) {
        setSessionState('finished');
        return;
    }
    setSessionState('rest');
    setTimer(15); // 15 seconds rest between poses
    
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance("Rest for 15 seconds.");
      const voice = getFemaleVoice();
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    }, 500); // Slight delay for smoothness
  };

  // Timer logic
  useEffect(() => {
    let interval;
    if (!isPaused && (sessionState === 'active' || sessionState === 'rest') && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      if (sessionState === 'active') {
        startRest();
      } else if (sessionState === 'rest') {
        if (currentStep < totalSteps - 1) {
          setCurrentStep(c => c + 1);
          setSessionState('intro');
        } else {
          setSessionState('finished');
        }
      }
    }
    return () => clearInterval(interval);
  }, [timer, isPaused, sessionState, currentStep, totalSteps]);

  if (!plan) return <div className="text-white">Plan not found</div>;

  if (sessionState === 'finished') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-20 h-20 bg-mint-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-mint-400" />
        </div>
        <h2 className="text-3xl font-bold font-heading">Namaste!</h2>
        <p className="text-slate-400 mt-2 mb-8">You have completed the {plan.title} flow.</p>
        <button onClick={() => navigate('/flows')} className="px-8 py-3 bg-mint-500 text-slate-900 rounded-full hover:bg-mint-400 font-bold tracking-wide">
          Back to Plans
        </button>
      </div>
    );
  }

  const stepDetails = plan.routine[currentStep];
  const isBreathing = stepDetails.type === 'breathing';

  return (
    <div className="h-[100dvh] bg-slate-900 text-white flex flex-col overflow-hidden">
      
      {/* Top Bar Navigation */}
      <div className="h-16 flex-shrink-0 bg-slate-800 flex items-center px-6 border-b border-slate-700/50">
         <button onClick={() => {stopAllAudio(); navigate('/flows');}} className="p-2 text-slate-400 hover:text-white mr-4">
             <ChevronLeft className="w-6 h-6"/>
         </button>
         <h1 className="text-lg font-heading font-semibold text-white tracking-wide truncate flex-1">{plan.title}</h1>
         
         <div className="flex items-center gap-2">
            {plan.routine.map((_, idx) => (
              <div key={idx} className={`w-8 h-1.5 rounded-full transition-all ${idx === currentStep ? 'bg-mint-400' : idx < currentStep ? 'bg-slate-500' : 'bg-slate-700'}`} />
            ))}
         </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-stretch justify-center pb-8 overflow-y-auto">
        
        {/* LEFT COLUMN: Main Info & Image */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-6">
            
            <div className="flex-1 bg-slate-800 rounded-[2rem] p-1 shadow-2xl relative overflow-hidden min-h-[40vh] lg:min-h-[500px]">
                {sessionState === 'rest' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                        <Wind className="w-16 h-16 text-mint-400 animate-pulse mb-6" />
                        <h3 className="text-3xl font-light text-mint-100 tracking-wide">Breathe</h3>
                        <p className="text-mint-400/80 mt-2 text-xl font-mono">{timer}s</p>
                    </div>
                ) : (
                    <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-slate-950">
                       {!isBreathing ? (
                         <>
                           <img src={poseImages[stepDetails.pose_name]} alt={stepDetails.pose_name} className="w-full h-full object-cover opacity-80" />
                           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-6 pt-16">
                               <h2 className="text-3xl font-bold font-heading">{stepDetails.pose_name}</h2>
                               <p className="text-mint-400 italic text-lg mt-1">{stepDetails.sanskrit_name}</p>
                               <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-md">{stepDetails.description}</p>
                           </div>
                         </>
                       ) : (
                          // If it's a breathing phase on the left side, we don't show image, just aesthetic filler
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center text-slate-400">
                             <div>
                                 <Wind className="w-12 h-12 text-mint-400/30 mx-auto mb-4" />
                                 <h2 className="text-2xl font-light text-white mb-2">Guided Breathing</h2>
                                 <p className="text-sm">Follow the animation on the right panel.</p>
                             </div>
                          </div>
                       )}
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="w-full bg-slate-800 rounded-3xl p-4 flex items-center justify-between px-6 border border-slate-700/50">
                <div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                       {sessionState === 'intro' ? 'Get Ready' : sessionState === 'rest' ? 'Resting' : 'Active'}
                    </div>
                    <div className={"text-4xl font-mono font-bold " + (timer < 10 && sessionState === "active" ? "text-coral-400" : "text-white")}>
                       00:{timer.toString().padStart(2, '0')}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button onClick={() => setTimer(stepDetails.duration)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsPaused(!isPaused)} className="w-16 h-16 bg-mint-500 text-slate-900 rounded-full flex items-center justify-center hover:bg-mint-400 transition-colors shadow-lg shadow-mint-500/20 active:scale-95">
                        {isPaused ? <Play className="w-8 h-8 ml-1" fill="currentColor" /> : <Pause className="w-8 h-8" fill="currentColor" />}
                    </button>
                    <button onClick={() => {
                        stopAllAudio();
                        if (currentStep < totalSteps - 1) {
                            setCurrentStep(c => c + 1);
                            setSessionState('intro');
                        } else {
                            setSessionState('finished');
                        }
                    }} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors">
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Camera or Breathing Applet */}
        <div className="w-full lg:w-1/2 flex-shrink-0 min-h-[40vh] lg:min-h-full">
            {isBreathing ? (
               <BreathingApplet duration={timer} />
            ) : (
               <GuidedSessionCamera 
                  currentPose={stepDetails.pose_name}
                  isActive={sessionState === 'active'}
                  sessionTimer={timer}
               />
            )}
        </div>

      </div>
    </div>
  );
};
