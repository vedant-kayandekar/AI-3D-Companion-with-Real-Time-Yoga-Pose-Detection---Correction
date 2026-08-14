import React, { useRef, useState, useEffect, useMemo } from "react";
import Webcam from "react-webcam";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import {
  POINTS,
  keypointConnections,
  poseList,
  poseInstructions,
} from "../pose-detection/data";
import { drawPoint, drawSegment } from "../pose-detection/helper";
import { poseImages } from "../pose-detection/poseImages";

/* ============================================
   CONSTANTS
   ============================================ */
const COLOR_DEFAULT = "rgba(255, 255, 255, 0.9)";
const COLOR_CORRECT = "rgba(107, 143, 113, 1)";
const CONFIDENCE_THRESHOLD = 0.97; // Reference used 0.97
const DETECTION_INTERVAL = 100; // Reference used 100ms
const CANVAS_W = 640;
const CANVAS_H = 480;

// Order must match CLASS_NO in data.js:
// Chair:0, Cobra:1, Dog:2, No_Pose:3, Shoulderstand:4, Traingle:5, Tree:6, Warrior:7
const CLASS_NAMES = [
  "Chair",
  "Cobra",
  "Dog",
  "No_Pose",
  "Shoulderstand",
  "Traingle",
  "Tree",
  "Warrior",
];

/* ============================================
   PREPROCESSING — Exactly matching model's
   internal SlicingOpLambda/TFOpLambda logic
   ============================================ */
function preprocessLandmarks(keypoints) {
  const lm = keypoints.map((kp) => [kp.x, kp.y]);

  // Hip center
  const lh = lm[POINTS.LEFT_HIP];
  const rh = lm[POINTS.RIGHT_HIP];
  const cx = (lh[0] + rh[0]) * 0.5;
  const cy = (lh[1] + rh[1]) * 0.5;

  // Center all landmarks on hip midpoint
  const centered = lm.map(([x, y]) => [x - cx, y - cy]);

  // Torso size = ||shoulder_center - hip_center||
  const ls = lm[POINTS.LEFT_SHOULDER];
  const rs = lm[POINTS.RIGHT_SHOULDER];
  const scx = (ls[0] + rs[0]) * 0.5;
  const scy = (ls[1] + rs[1]) * 0.5;
  const torso = Math.sqrt((scx - cx) ** 2 + (scy - cy) ** 2);

  // Max distance of any landmark from center
  let maxD = 0;
  for (const [a, b] of centered) {
    const d = Math.sqrt(a * a + b * b);
    if (d > maxD) maxD = d;
  }

  const poseSize = Math.max(torso * 2.5, maxD);
  if (poseSize === 0) return null;

  const norm = centered.map(([a, b]) => [a / poseSize, b / poseSize]);
  return norm.flat(); // 34 values
}

/* ============================================
   COMPONENT
   ============================================ */
export const PoseDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Use REFS for values accessed inside setInterval (avoids stale closures)
  const currentPoseRef = useRef("Tree");
  const skeletonColorRef = useRef(COLOR_DEFAULT);
  const flagRef = useRef(false);
  const startTimeRef = useRef(0);

  // State for rendering only
  const [currentPose, _setCurrentPose] = useState("Tree");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [poseTime, setPoseTime] = useState(0);
  const [bestPerform, setBestPerform] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [skeletonColor, _setSkeletonColor] = useState(COLOR_DEFAULT);

  // Sync setters — update BOTH state and ref
  const setCurrentPose = (val) => {
    currentPoseRef.current = val;
    _setCurrentPose(val);
  };
  const setSkeletonColor = (val) => {
    skeletonColorRef.current = val;
    _setSkeletonColor(val);
  };

  const videoConstraints = useMemo(
    () => ({ width: CANVAS_W, height: CANVAS_H, facingMode: "user" }),
    [],
  );

  // Reset on pose change
  useEffect(() => {
    setPoseTime(0);
    setBestPerform(0);
    flagRef.current = false;
    startTimeRef.current = 0;
  }, [currentPose]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  /* ------------------------------------------
     Detection loop — reads from REFS, not state
     ------------------------------------------ */
  function runDetection(detector, classifier) {
    if (!webcamRef.current?.video || webcamRef.current.video.readyState !== 4)
      return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    detector.estimatePoses(video).then((poses) => {
      if (!poses[0]?.keypoints) return;
      const keypoints = poses[0].keypoints;
      let bad = 0;
      const color = skeletonColorRef.current;

      // Draw skeleton (mirrored x to match mirrored webcam)
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

      // Preprocess & classify
      const embedding = preprocessLandmarks(keypoints);
      if (!embedding) return;

      const pose = currentPoseRef.current;
      const classIdx = CLASS_NAMES.indexOf(pose);
      if (classIdx === -1) return;

      const input = tf.tensor2d([embedding], [1, 34]);
      const pred = classifier.predict(input);
      pred.data().then((probs) => {
        input.dispose();
        pred.dispose();

        if (probs[classIdx] > CONFIDENCE_THRESHOLD) {
          // CORRECT POSE
          if (!flagRef.current) {
            flagRef.current = true;
            startTimeRef.current = Date.now();
            try {
              audioRef.current?.play();
            } catch (e) {}
          }
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setPoseTime(elapsed);
          setBestPerform((prev) => Math.max(prev, elapsed));
          setSkeletonColor(COLOR_CORRECT);
        } else {
          // WRONG POSE
          if (flagRef.current) {
            flagRef.current = false;
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }
          setSkeletonColor(COLOR_DEFAULT);
        }
      });
    });
  }

  /* ------------------------------------------
     Start / Stop
     ------------------------------------------ */
  const startDetection = async () => {
    setIsLoading(true);
    setShowInstructions(false);

    try {
      await tf.ready();
      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig,
      );
      
      // Load the exact model the reference project used
      const classifier = await tf.loadLayersModel('https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json');

      audioRef.current = new Audio("/audio/count.wav");
      audioRef.current.loop = true;

      setIsLoading(false);
      setIsDetecting(true);

      intervalRef.current = setInterval(() => {
        runDetection(detector, classifier);
      }, DETECTION_INTERVAL);
    } catch (err) {
      console.error("Failed to initialize pose detection:", err);
      setIsLoading(false);
    }
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    flagRef.current = false;
    startTimeRef.current = 0;
    setShowInstructions(true);
    setSkeletonColor(COLOR_DEFAULT);
  };

  const isPoseSupported = CLASS_NAMES.includes(currentPose);

  /* ------------------------------------------
     RENDER
     ------------------------------------------ */
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-warm-50 via-sage-50 to-lavender-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-warm-800">
            Pose <span className="text-sage-500">Practice</span>
          </h1>
          <p className="text-warm-500 mt-2 text-sm md:text-base">
            Select a pose, follow the instructions, and let AI check your form
            in real-time
          </p>
        </div>

        {/* Pose Selector */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {poseList.map((pose) => {
            const supported = CLASS_NAMES.includes(pose);
            return (
              <button
                key={pose}
                onClick={() => {
                  setCurrentPose(pose);
                  if (isDetecting) stopDetection();
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  currentPose === pose
                    ? "bg-sage-500 text-white shadow-md shadow-sage-300/30"
                    : supported
                      ? "bg-white text-warm-600 border border-warm-200 hover:border-sage-300 hover:text-sage-600"
                      : "bg-white text-warm-400 border border-warm-100 opacity-60"
                }`}
                title={supported ? pose : `${pose} — instructions only`}
              >
                {pose}
                {!supported && " 📖"}
              </button>
            );
          })}
        </div>

        {!isPoseSupported && (
          <div className="text-center mb-4 px-4 py-2 rounded-xl bg-lavender-100/60 text-lavender-600 text-sm font-medium max-w-lg mx-auto animate-fade-in">
            ℹ️ AI detection available for Tree, Chair, Cobra, Dog &amp;
            Shoulderstand. For {currentPose}, follow instructions &amp;
            reference image.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4">
                <img
                  src={poseImages[currentPose]}
                  alt={`${currentPose} pose`}
                  className="w-full h-48 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
              <h3 className="font-heading text-lg font-bold text-warm-800 mb-3">
                {currentPose} Pose
              </h3>
              {showInstructions && (
                <ol className="space-y-2">
                  {poseInstructions[currentPose].map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-warm-600 leading-relaxed"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
              {isDetecting && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-sage-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-sage-500 font-semibold uppercase tracking-wider">
                      Current
                    </p>
                    <p className="text-2xl font-bold text-sage-700">
                      {poseTime.toFixed(1)}s
                    </p>
                  </div>
                  <div className="bg-lavender-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-lavender-500 font-semibold uppercase tracking-wider">
                      Best
                    </p>
                    <p className="text-2xl font-bold text-lavender-500">
                      {bestPerform.toFixed(1)}s
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Webcam Area */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div
              className={`webcam-container rounded-2xl bg-warm-800 overflow-hidden ${
                skeletonColor === COLOR_CORRECT ? "pose-correct" : ""
              }`}
            >
              {isDetecting || isLoading ? (
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    videoConstraints={videoConstraints}
                    className="w-full h-auto block"
                    mirrored
                  />
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="skeleton-canvas w-full h-full"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-warm-900/80 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-sage-300 border-t-sage-500 rounded-full animate-spin mb-4" />
                      <p className="text-white font-semibold">
                        Loading AI Model...
                      </p>
                      <p className="text-warm-300 text-sm mt-1">
                        This may take a moment
                      </p>
                    </div>
                  )}
                  {isDetecting && !isLoading && (
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="glass-card-dark rounded-xl px-3 py-1.5 text-white text-sm font-semibold">
                        ⏱ {poseTime.toFixed(1)}s
                      </div>
                      <div className="glass-card-dark rounded-xl px-3 py-1.5 text-white text-sm font-semibold">
                        🏆 {bestPerform.toFixed(1)}s
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-sage-500/10 flex items-center justify-center mb-6">
                    <svg
                      className="w-12 h-12 text-sage-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-white font-heading text-xl font-bold mb-2">
                    Ready to Practice?
                  </h3>
                  <p className="text-warm-300 text-sm mb-6 max-w-sm">
                    Select a pose, read the instructions, then click Start to
                    begin AI-powered pose detection
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-5">
              {!isDetecting ? (
                <button
                  onClick={startDetection}
                  disabled={isLoading}
                  className="btn-primary text-base px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>▶ Start Pose Detection</>
                  )}
                </button>
              ) : (
                <button
                  onClick={stopDetection}
                  className="btn-coral text-base px-8 py-3 flex items-center gap-2"
                >
                  ⏹ Stop Detection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
