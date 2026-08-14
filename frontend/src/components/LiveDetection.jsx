import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import StepTimeline from './StepTimeline';
import ReferenceCarousel from './ReferenceCarousel';
import { POSES, DETECTION_CONFIG, SKELETON_CONNECTIONS, ANGLE_TO_KEYPOINTS } from '../lib/constants';
import { initPoseDetector, estimatePose, hasGoodKeypoints } from '../lib/poseDetector';
import { initPoseClassifier, classifyPose, isClassifierReady } from '../lib/poseClassifier';
import { initCorrectnessChecker, checkCorrectness } from '../lib/correctnessChecker';
import { computeAllAngles, normalizeKeypoints } from '../lib/angleUtils';

const W = DETECTION_CONFIG.CANVAS_WIDTH;
const H = DETECTION_CONFIG.CANVAS_HEIGHT;

// ── TTS Voice Assistant ─────────────────────────────────────────────
let lastSpokenTime = 0;
let ttsQueue = [];
let isSpeaking = false;

function speakFeedback(text, minIntervalMs = 10000) {
  if (!text) return;
  const now = Date.now();
  if (now - lastSpokenTime < minIntervalMs) return;
  if (isSpeaking) return;

  lastSpokenTime = now;
  isSpeaking = true;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find a good voice
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Microsoft Zira') || v.name.includes('Google') ||
    v.name.includes('Samantha') || v.lang.startsWith('en')
  );
  if (preferred) utterance.voice = preferred;

  utterance.onend = () => { isSpeaking = false; };
  utterance.onerror = () => { isSpeaking = false; };

  speechSynthesis.cancel(); // Clear any queued
  speechSynthesis.speak(utterance);
}

// Preload voices
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// ── Component ───────────────────────────────────────────────────────
export default function LiveDetection() {
  const { poseName } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const busyRef = useRef(false);
  const holdStartRef = useRef(null);
  const lastStepRef = useRef(1);
  const runningRef = useRef(false);
  const lastDetectTimeRef = useRef(0);
  const lastFeedbackTimeRef = useRef(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [keypoints, setKeypoints] = useState(null);
  const [angles, setAngles] = useState(null);
  const [classification, setClassification] = useState(null);
  const [correctness, setCorrectness] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [holdTime, setHoldTime] = useState(0);
  const [subtitleText, setSubtitleText] = useState('');
  const [subtitleType, setSubtitleType] = useState(''); // 'correct' | 'warning' | ''
  const [isFinalPose, setIsFinalPose] = useState(false);

  const poseData = POSES[poseName];
  const totalSteps = poseData?.totalSteps || 1;

  const videoConstraints = useMemo(() => ({
    width: W, height: H, facingMode: 'user',
  }), []);

  // ── Detection logic ───────────────────────────────────────
  const detectionLoop = useCallback(async (timestamp) => {
    if (!runningRef.current) return;

    const elapsed = timestamp - lastDetectTimeRef.current;
    if (elapsed < DETECTION_CONFIG.DETECTION_INTERVAL_MS) {
      rafRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    if (busyRef.current) {
      rafRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    busyRef.current = true;
    lastDetectTimeRef.current = timestamp;

    try {
      const video = webcamRef.current?.video;
      if (!video || video.readyState < 4) {
        busyRef.current = false;
        rafRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      // 1. MoveNet keypoints
      const kps = await estimatePose(video);
      if (!kps || !hasGoodKeypoints(kps)) {
        setKeypoints(null);
        setCorrectness(null);
        holdStartRef.current = null;
        busyRef.current = false;
        rafRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      // 2. Angles
      const userAngles = computeAllAngles(kps);

      // 3. Classify pose + step
      let detectedStep = lastStepRef.current;
      let classResult = null;

      if (isClassifierReady()) {
        const normalized = normalizeKeypoints(kps);
        if (normalized) {
          classResult = classifyPose(normalized);
          if (classResult && classResult.poseName === poseName) {
            detectedStep = classResult.stepNumber;
            lastStepRef.current = detectedStep;
          }
        }
      }

      if (!classResult) {
        classResult = { poseName, stepNumber: 1, confidence: 0, className: `${poseName}_Step1` };
      }

      // 4. Correctness check
      const result = checkCorrectness(poseName, detectedStep, userAngles);

      // 5. FINAL POSE LOGIC:
      // Only show "correct" (green) for the LAST step of the pose.
      // Intermediate steps show "transitioning" (lavender/grey).
      const isOnFinalStep = detectedStep === totalSteps;
      const isFinalCorrect = isOnFinalStep && result.isCorrect;

      // 6. Hold time (only counts on final step)
      let newHoldTime = 0;
      if (isFinalCorrect) {
        if (!holdStartRef.current) holdStartRef.current = Date.now();
        newHoldTime = (Date.now() - holdStartRef.current) / 1000;
        if (newHoldTime >= DETECTION_CONFIG.CORRECT_HOLD_THRESHOLD_S) {
          setCompletedSteps(prev => { const n = new Set(prev); n.add(detectedStep); return n; });
        }
      } else {
        holdStartRef.current = null;
      }

      // Mark intermediate steps as completed if user passes through
      if (detectedStep > 1) {
        setCompletedSteps(prev => {
          const n = new Set(prev);
          for (let s = 1; s < detectedStep; s++) n.add(s);
          return n;
        });
      }

      // 7. Throttled subtitle feedback (every 10 seconds)
      const now = Date.now();
      if (now - lastFeedbackTimeRef.current >= 10000) {
        lastFeedbackTimeRef.current = now;

        if (isFinalCorrect) {
          const msg = '✅ Perfect form! Hold this pose.';
          setSubtitleText(msg);
          setSubtitleType('correct');
          speakFeedback('Perfect form. Hold this pose.', 10000);
        } else if (isOnFinalStep && !result.isCorrect && result.feedback.length > 0) {
          const msg = result.feedback[0];
          setSubtitleText(msg);
          setSubtitleType('warning');
          speakFeedback(msg, 10000);
        } else if (!isOnFinalStep) {
          const stepInstruction = poseData?.steps?.[detectedStep - 1] || `Moving to step ${detectedStep}`;
          setSubtitleText(`Step ${detectedStep}: ${stepInstruction}`);
          setSubtitleType('');
          speakFeedback(`Step ${detectedStep}. ${stepInstruction}`, 10000);
        }

        // Auto-clear subtitle after 6 seconds
        setTimeout(() => {
          setSubtitleText('');
        }, 6000);
      }

      // 8. Batch state updates
      setKeypoints(kps);
      setAngles(userAngles);
      setClassification(classResult);
      setCorrectness(result);
      setCurrentStep(detectedStep);
      setHoldTime(newHoldTime);
      setIsFinalPose(isFinalCorrect);

    } catch (err) {
      console.error('[Detection] Error:', err);
    }

    busyRef.current = false;
    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(detectionLoop);
    }
  }, [poseName, totalSteps, poseData]);

  // ── Start / Stop ──────────────────────────────────────────
  const handleStart = async () => {
    setIsLoading(true);
    try {
      await initPoseDetector();
      await initPoseClassifier();
      await initCorrectnessChecker();
    } catch (err) {
      console.error('[LiveDetection] Init error:', err);
    }
    setIsLoading(false);
    setIsRunning(true);
    runningRef.current = true;
    setCompletedSteps(new Set());
    setCurrentStep(1);
    lastStepRef.current = 1;
    busyRef.current = false;
    lastDetectTimeRef.current = 0;
    lastFeedbackTimeRef.current = 0;
    setSubtitleText('');
    setIsFinalPose(false);
    rafRef.current = requestAnimationFrame(detectionLoop);
  };

  const handleStop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    busyRef.current = false;
    holdStartRef.current = null;
    setHoldTime(0);
    setKeypoints(null);
    setCorrectness(null);
    setAngles(null);
    setSubtitleText('');
    setIsFinalPose(false);
    speechSynthesis.cancel();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, W, H);
    }
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  // ── Draw skeleton ─────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!keypoints) return;

    const minConf = DETECTION_CONFIG.CONFIDENCE_THRESHOLD;
    const errorKps = new Set();
    const offAngles = correctness?.offAngles;
    if (offAngles) {
      for (const a of offAngles) {
        const kpIdx = ANGLE_TO_KEYPOINTS[a];
        if (kpIdx) kpIdx.forEach(idx => errorKps.add(idx));
      }
    }

    // Color logic:
    // Final step + correct = sage green
    // Final step + incorrect = coral
    // Intermediate step = lavender (transitioning)
    const isOnFinal = currentStep === totalSteps;
    const isCorr = correctness?.isCorrect;

    let baseColor;
    if (!isOnFinal) {
      baseColor = 'rgba(155, 142, 196, 0.75)'; // lavender for transition
    } else if (isCorr) {
      baseColor = '#6b8f71'; // sage green
    } else {
      baseColor = '#e07a5f'; // coral
    }

    const errorColor = '#e8b84a'; // warm yellow for error joints

    for (const [i, j] of SKELETON_CONNECTIONS) {
      const a = keypoints[i], b = keypoints[j];
      if (!a || !b || a.score < minConf || b.score < minConf) continue;
      const isErr = isOnFinal && (errorKps.has(i) || errorKps.has(j));
      ctx.beginPath();
      ctx.moveTo(W - a.x, a.y);
      ctx.lineTo(W - b.x, b.y);
      ctx.strokeStyle = isErr ? errorColor : baseColor;
      ctx.lineWidth = isErr ? 4 : 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    for (let i = 0; i < keypoints.length; i++) {
      const kp = keypoints[i];
      if (!kp || kp.score < minConf || i === 1 || i === 2) continue;
      const isErr = isOnFinal && errorKps.has(i);
      ctx.beginPath();
      ctx.arc(W - kp.x, kp.y, isErr ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isErr ? errorColor : baseColor;
      ctx.fill();
    }
  }, [keypoints, correctness, currentStep, totalSteps]);

  if (!poseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Pose not found.</p>
        <button onClick={() => navigate('/guided-practice')} className="btn-sage ml-4">← Back</button>
      </div>
    );
  }

  const isOnFinalStep = currentStep === totalSteps;
  const isCorr = correctness?.isCorrect;
  const poseStatus = isFinalPose ? 'pose-correct' : (isOnFinalStep && !isCorr && correctness) ? 'pose-incorrect' : (isRunning && !isOnFinalStep ? 'pose-transitioning' : '');

  return (
    <div className="min-h-screen px-3 md:px-4 py-4 md:py-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-10 right-0 w-52 h-52 bg-sage-200/25 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-44 h-44 bg-lavender-300/15 rounded-full blur-[60px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <button onClick={() => { handleStop(); navigate('/guided-practice'); }}
              className="text-sage-400 hover:text-sage-500 text-sm font-semibold transition-colors">← Back</button>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>{poseData.emoji}</span> {poseName}
              <span className="text-sm md:text-base text-sage-400 font-sans font-semibold hidden sm:inline">— {poseData.english}</span>
            </h1>
          </div>
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isFinalPose ? 'bg-sage-400' : 'bg-lavender-400'}`} />
              <span className={`text-sm font-bold ${isFinalPose ? 'text-sage-400' : 'text-lavender-400'}`}>
                {isFinalPose ? 'Correct' : isOnFinalStep ? 'Adjusting' : 'Transitioning'}
              </span>
            </div>
          )}
        </div>

        {/* Main Grid — mobile stacks vertically */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Webcam — 8 cols on desktop, full on mobile */}
          <div className="lg:col-span-8 animate-fade-in">
            <div className={poseStatus}>
              <div className="webcam-wrapper bg-warm-100 rounded-2xl">
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    width={W} height={H}
                    videoConstraints={videoConstraints}
                    className="w-full h-auto block rounded-2xl"
                    mirrored
                  />
                  <canvas ref={canvasRef} width={W} height={H}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none" />

                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl">
                      <div className="spinner mb-3" />
                      <p className="text-gray-700 font-bold">Loading AI Models...</p>
                      <p className="text-gray-400 text-sm">MoveNet + Classifier</p>
                    </div>
                  )}

                  {/* Pre-start overlay */}
                  {!isRunning && !isLoading && (
                    <div className="absolute inset-0 bg-warm-50/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                      <div className="text-5xl mb-3">{poseData.emoji}</div>
                      <h3 className="font-heading text-xl font-bold text-gray-800 mb-1">{poseName}</h3>
                      <p className="text-gray-500 text-sm max-w-sm text-center px-4">{poseData.description}</p>
                    </div>
                  )}

                  {/* HUD: Step badge + hold timer */}
                  {isRunning && !isLoading && (
                    <>
                      <div className="absolute top-3 left-3">
                        <div className={`backdrop-blur-md rounded-lg px-3 py-1.5 text-sm font-extrabold border ${
                          isFinalPose
                            ? 'bg-sage-400/80 text-white border-sage-400/50'
                            : isOnFinalStep
                              ? 'bg-coral-500/70 text-white border-coral-400/50'
                              : 'bg-lavender-400/70 text-white border-lavender-300/50'
                        }`}>
                          Step {currentStep}/{totalSteps}
                        </div>
                      </div>
                      {holdTime > 0 && (
                        <div className="absolute top-3 right-3 bg-sage-400/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm font-extrabold text-white border border-sage-300/50">
                          ⏱ {holdTime.toFixed(1)}s
                        </div>
                      )}
                    </>
                  )}

                  {/* SUBTITLE FEEDBACK — shown on camera */}
                  {subtitleText && isRunning && (
                    <div className="subtitle-feedback">
                      <p className={`subtitle-text ${subtitleType}`}>{subtitleText}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Start/Stop button */}
              <div className="flex justify-center gap-4 mt-4">
                {!isRunning ? (
                  <button onClick={handleStart} disabled={isLoading}
                    className="btn-sage text-base px-10 py-3 flex items-center gap-2">
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading...</>
                    ) : '▶ Start Detection'}
                  </button>
                ) : (
                  <button onClick={handleStop}
                    className="btn-coral text-base px-10 py-3 font-bold">
                    ⏹ Stop
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — 4 cols on desktop, full on mobile */}
          <div className="lg:col-span-4 space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Reference Images */}
            <ReferenceCarousel poseName={poseName} />

            {/* Step Timeline */}
            <StepTimeline poseName={poseName} currentStep={currentStep}
              completedSteps={completedSteps} totalSteps={totalSteps} isFinalPose={isFinalPose} />

            {/* Angle details (compact) */}
            {angles && isRunning && (
              <div className="glass-card rounded-2xl p-4">
                <h3 className="font-heading text-sm font-bold text-gray-600 mb-2">Joint Angles</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(angles).map(([name, val]) => {
                    const isOff = isOnFinalStep && correctness?.offAngles?.includes(name);
                    return (
                      <div key={name} className={`p-2 rounded-lg text-xs ${isOff ? 'bg-coral-400/10 border border-coral-400/20' : 'bg-warm-100'}`}>
                        <span className={isOff ? 'text-coral-500 font-bold' : 'text-gray-400 font-medium'}>
                          {name.replace(/_/g, ' ').replace('angle', '').trim()}
                        </span>
                        <p className={`font-extrabold ${isOff ? 'text-coral-500' : 'text-gray-600'}`}>{val.toFixed(0)}°</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
