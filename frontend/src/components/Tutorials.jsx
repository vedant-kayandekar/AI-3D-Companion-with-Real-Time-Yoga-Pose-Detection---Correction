import { useState } from "react";
import { poseInstructions, poseList } from "../pose-detection/data";
import { poseImages } from "../pose-detection/poseImages";
import RefCard from "./ui/RefCard";

const appTutorials = [
  {
    icon: "📷",
    title: "Allow Camera Access",
    desc: "When prompted, allow camera access so the AI can see your pose and provide real-time feedback.",
  },
  {
    icon: "🧘",
    title: "Select a Pose",
    desc: "Choose from 7 yoga poses in the Practice page. Each pose comes with detailed step-by-step instructions.",
  },
  {
    icon: "📖",
    title: "Read the Instructions",
    desc: "Study the pose instructions and reference image carefully before starting detection.",
  },
  {
    icon: "▶️",
    title: "Start Pose Detection",
    desc: "Click 'Start Pose Detection' and replicate the pose in front of your camera.",
  },
  {
    icon: "✅",
    title: "Get Real-Time Feedback",
    desc: "When your pose is correct, the skeleton overlay turns green and a timer begins counting. Try to hold it as long as possible!",
  },
  {
    icon: "💬",
    title: "Chat with AI Tutor",
    desc: "Switch to the Chat page anytime to ask your 3D AI tutor questions about yoga, breathing, or technique.",
  },
];

const cameraFixes = [
  "Make sure you have allowed camera permission. If denied, go to your browser settings to re-enable it.",
  "Close any other apps using the camera (Zoom, Teams, Discord, etc.)",
  "Try closing other open browser tabs that might be accessing the camera.",
  "Ensure your device has a working camera. Try using a different browser if the issue persists.",
];

export const Tutorials = () => {
  const [selectedPose, setSelectedPose] = useState(null);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-warm-50 via-sage-50 to-lavender-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-warm-800">
            How to <span className="text-sage-500">Use</span>
          </h1>
          <p className="text-warm-500 mt-2 max-w-lg mx-auto">
            Follow these steps to get the most out of your AI-powered yoga
            practice
          </p>
        </div>

        {/* App Tutorial Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {appTutorials.map((step, i) => (
            <div key={i} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fade-in">
              <RefCard
                title={step.title}
                text={step.desc}
                socialButtons={[{ icon: <span style={{fontSize: '18px'}}>{step.icon}</span> }]}
              />
            </div>
          ))}
        </div>

        {/* Pose Library */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-warm-800 text-center mb-6">
            Pose <span className="text-lavender-400">Library</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {poseList.map((pose) => (
              <button
                key={pose}
                onClick={() =>
                  setSelectedPose(selectedPose === pose ? null : pose)
                }
                className={`group rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
                  selectedPose === pose
                    ? "border-sage-500 shadow-lg shadow-sage-200/50"
                    : "border-transparent hover:border-sage-200"
                }`}
              >
                <div className="relative">
                  <img
                    src={poseImages[pose]}
                    alt={`${pose} pose`}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-warm-900/60 to-transparent" />
                  <p className="absolute bottom-2 left-3 text-white font-bold text-sm">
                    {pose}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Pose Instructions */}
          {selectedPose && (
            <div className="mt-6 glass-card rounded-2xl p-6 animate-slide-up">
              <h3 className="font-heading text-xl font-bold text-warm-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sage-500 text-white flex items-center justify-center text-sm">
                  🧘
                </span>
                {selectedPose} Pose Instructions
              </h3>
              <ol className="space-y-3">
                {poseInstructions[selectedPose].map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-warm-600 leading-relaxed"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lavender-100 text-lavender-500 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Camera Troubleshooting */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-heading text-xl font-bold text-warm-800 mb-4 flex items-center gap-2">
            <span className="text-coral-400">🔧</span>
            Camera Not Working?
          </h2>
          <ul className="space-y-2">
            {cameraFixes.map((fix, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-warm-600 leading-relaxed"
              >
                <span className="flex-shrink-0 text-coral-400">•</span>
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
