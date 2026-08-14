import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import Webcam from "react-webcam";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import {
  POINTS,
  keypointConnections,
} from "../pose-detection/data";
import { drawPoint, drawSegment } from "../pose-detection/helper";

// Fallback if data doesn't export CLASS_NAMES yet 
const POSE_CLASSES = [
  "Chair",
  "Cobra",
  "Dog",
  "No_Pose",
  "Shoulderstand",
  "Traingle",
  "Tree",
  "Warrior",
];

const COLOR_DEFAULT = "rgba(255, 255, 255, 0.9)";
const COLOR_CORRECT = "rgba(52, 211, 153, 1)"; // mint-400
const CONFIDENCE_THRESHOLD = 0.97;
const DETECTION_INTERVAL = 100;
const CANVAS_W = 640;
const CANVAS_H = 480;

function preprocessLandmarks(keypoints) {
  const lm = keypoints.map((kp) => [kp.x, kp.y]);
  const lh = lm[POINTS.LEFT_HIP];
  const rh = lm[POINTS.RIGHT_HIP];
  const cx = (lh[0] + rh[0]) * 0.5;
  const cy = (lh[1] + rh[1]) * 0.5;

  const centered = lm.map(([x, y]) => [x - cx, y - cy]);

  const ls = lm[POINTS.LEFT_SHOULDER];
  const rs = lm[POINTS.RIGHT_SHOULDER];
  const scx = (ls[0] + rs[0]) * 0.5;
  const scy = (ls[1] + rs[1]) * 0.5;
  const torso = Math.sqrt((scx - cx) ** 2 + (scy - cy) ** 2);

  let maxD = 0;
  for (const [a, b] of centered) {
    const d = Math.sqrt(a * a + b * b);
    if (d > maxD) maxD = d;
  }

  const poseSize = Math.max(torso * 2.5, maxD);
  if (poseSize === 0) return null;

  const norm = centered.map(([a, b]) => [a / poseSize, b / poseSize]);
  return norm.flat();
}

export const GuidedSessionCamera = forwardRef(({ 
  currentPose, 
  isActive, 
  onTimeUpdate,
  sessionTimer // The main session timer passed from parent (30...0)
}, ref) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const audioFeedbackRef = useRef(null);

  const currentPoseRef = useRef(currentPose);
  const skeletonColorRef = useRef(COLOR_DEFAULT);
  const flagRef = useRef(false);
  const startTimeRef = useRef(0);
  const hasCapturedFeedbackRef = useRef(false); // Prevents multi-fetches

  const [isLoading, setIsLoading] = useState(false);
  const [skeletonColor, _setSkeletonColor] = useState(COLOR_DEFAULT);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const setSkeletonColor = (val) => {
    skeletonColorRef.current = val;
    _setSkeletonColor(val);
  };

  useEffect(() => {
    currentPoseRef.current = currentPose;
    // Reset flags on new pose
    hasCapturedFeedbackRef.current = false;
    flagRef.current = false;
    startTimeRef.current = 0;
    setFeedbackText("");
  }, [currentPose]);

  const videoConstraints = useMemo(
    () => ({ width: CANVAS_W, height: CANVAS_H, facingMode: "user" }),
    []
  );

  // Expose playAudio externally if needed
  useImperativeHandle(ref, () => ({
    getHasCaptured: () => hasCapturedFeedbackRef.current
  }));

  const triggerAIAnalysis = async (imageSrc, keypoints) => {
    setIsProcessingFeedback(true);
    setFeedbackText("AI Analyzing Form...");
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/analyze-pose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          keypoints: keypoints,
          targetPose: currentPoseRef.current
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedbackText) setFeedbackText(data.feedbackText);
        
        // Play Audio Feedback
        if (data.audioBase64) {
             const audioUrl = `data:audio/mp3;base64,${data.audioBase64}`;
             if (audioFeedbackRef.current) {
                 audioFeedbackRef.current.src = audioUrl;
                 audioFeedbackRef.current.play().catch(e => console.warn("Autoplay blocked", e));
             }
        } else {
             // Fallback browser Native TTS if backend doesn't supply audio
             const utterance = new SpeechSynthesisUtterance(data.feedbackText);
             window.speechSynthesis.speak(utterance);
        }
      } else {
         setFeedbackText("Looking good!");
      }

    } catch (e) {
      console.error("AI Feedback Failed:", e);
      setFeedbackText("");
    } finally {
      setIsProcessingFeedback(false);
    }
  };

  const runDetection = (detector, classifier) => {
    if (!webcamRef.current?.video || webcamRef.current.video.readyState !== 4) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    detector.estimatePoses(video).then((poses) => {
      if (!poses[0]?.keypoints) return;
      const keypoints = poses[0].keypoints;
      let bad = 0;
      const color = skeletonColorRef.current;

      // Draw skeleton
      for (const kp of keypoints) {
        if (kp.score > 0.4) {
          if (kp.name !== "left_eye" && kp.name !== "right_eye") {
            const mx = CANVAS_W - kp.x;
            drawPoint(ctx, mx, kp.y, 6, color);
            const conns = keypointConnections[kp.name];
            if (conns) {
              for (const c of conns) {
                const t = keypoints[POINTS[c.toUpperCase()]];
                if (t && t.score > 0.4)
                  drawSegment(ctx, [mx, kp.y], [CANVAS_W - t.x, t.y], color);
              }
            }
          }
        } else {
          bad++;
        }
      }

      if (bad > 4) {
        setSkeletonColor(COLOR_DEFAULT);
        return;
      }

      // --- 15 Second Specific AI Snapshot Logic ---
      // Instead of relying on elapsed correct time, we use the sessionTimer
      // For instance, if sessionTimer is 30, we capture at 15
      if (sessionTimer <= 15 && sessionTimer > 0 && !hasCapturedFeedbackRef.current && isActive) {
          hasCapturedFeedbackRef.current = true;
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
               triggerAIAnalysis(imageSrc, keypoints);
          }
      }

      const embedding = preprocessLandmarks(keypoints);
      if (!embedding) return;

      const pose = currentPoseRef.current;
      const classIdx = POSE_CLASSES.indexOf(pose);
      if (classIdx === -1) return;

      const input = tf.tensor2d([embedding], [1, 34]);
      const pred = classifier.predict(input);
      pred.data().then((probs) => {
        input.dispose();
        pred.dispose();

        if (probs[classIdx] > CONFIDENCE_THRESHOLD) {
          if (!flagRef.current) {
            flagRef.current = true;
            startTimeRef.current = Date.now();
            // We REMOVED the beep.wav! Silent recognition.
          }
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          if (onTimeUpdate) onTimeUpdate(elapsed);
          setSkeletonColor(COLOR_CORRECT);
        } else {
          if (flagRef.current) {
            flagRef.current = false;
          }
          setSkeletonColor(COLOR_DEFAULT);
        }
      });
    });
  };

  useEffect(() => {
    let detector;
    let classifier;

    const initModels = async () => {
      setIsLoading(true);
      try {
        await tf.ready();
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
        );
        classifier = await tf.loadLayersModel('https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json');
        
        setIsLoading(false);

        if (isActive) {
          intervalRef.current = setInterval(() => {
            runDetection(detector, classifier);
          }, DETECTION_INTERVAL);
        }
      } catch (err) {
        console.error("TF Init Error", err);
        setIsLoading(false);
      }
    };

    if (isActive && !intervalRef.current) {
      initModels();
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      flagRef.current = false;
      setSkeletonColor(COLOR_DEFAULT);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50">
      <Webcam
        ref={webcamRef}
        width={CANVAS_W}
        height={CANVAS_H}
        videoConstraints={videoConstraints}
        className="absolute inset-0 w-full h-full object-cover"
        mirrored
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="absolute inset-0 w-full h-full object-cover z-10"
      />
      <audio ref={audioFeedbackRef} />

      {isLoading && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-mint-500/20 border-t-mint-500 rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-medium tracking-wide text-white">Waking up AI...</span>
        </div>
      )}

      {/* Real-time Target Pose Overlay */}
      <div className="absolute top-4 left-4 z-20">
          <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border ${skeletonColor === COLOR_CORRECT ? 'bg-mint-500/20 border-mint-400 text-mint-400' : 'bg-black/40 border-white/10 text-white/70'} text-xs font-semibold uppercase tracking-wider transition-colors`}>
              Detecting: {currentPoseRef.current}
          </div>
      </div>

      {/* AI Correction Banner overlay */}
      {feedbackText && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
             <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl animate-fade-up">
                 {isProcessingFeedback && (
                    <div className="w-4 h-4 border-2 border-mint-500/20 border-t-mint-500 rounded-full animate-spin mb-2 mx-auto"></div>
                 )}
                 <p className="text-mint-100 text-sm font-medium text-center leading-relaxed">
                   {feedbackText}
                 </p>
             </div>
          </div>
      )}
    </div>
  );
});

GuidedSessionCamera.displayName = "GuidedSessionCamera";
