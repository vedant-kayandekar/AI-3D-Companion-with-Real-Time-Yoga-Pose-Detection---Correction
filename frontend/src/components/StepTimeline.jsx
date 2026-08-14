import React from 'react';
import { POSES } from '../lib/constants';

/**
 * StepTimeline — Shows step progress. Only the FINAL step glows green.
 * Intermediate steps show lavender/grey as "transitioning".
 */
export default function StepTimeline({ poseName, currentStep, completedSteps, totalSteps, isFinalPose }) {
  const poseData = POSES[poseName];
  if (!poseData) return null;
  const steps = poseData.steps || [];

  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="font-heading text-base font-bold text-gray-700 mb-3">Step Guide</h3>

      {/* Timeline dots */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isFinal = stepNum === totalSteps;
          const isCompleted = completedSteps.has(stepNum);
          const isActive = stepNum === currentStep;

          let dotClass = 'pending';
          if (isFinal && isFinalPose) dotClass = 'final-correct';
          else if (isCompleted) dotClass = 'completed';
          else if (isActive) dotClass = 'active';

          return (
            <React.Fragment key={i}>
              <div className={`step-dot ${dotClass}`}>
                {(isFinal && isFinalPose) ? '✓' : isCompleted ? '✓' : stepNum}
              </div>
              {i < totalSteps - 1 && (
                <div className={`step-line ${isCompleted ? 'completed' : 'pending'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step instructions - compact */}
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isFinal = stepNum === totalSteps;
          const isCompleted = completedSteps.has(stepNum);
          const isActive = stepNum === currentStep;

          return (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-300 ${
              isFinal && isFinalPose
                ? 'bg-sage-50 border border-sage-200'
                : isActive
                  ? 'bg-lavender-300/10 border border-lavender-300/30'
                  : isCompleted
                    ? 'bg-sage-50/50 border border-transparent'
                    : 'border border-transparent'
            }`}>
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5 ${
                isFinal && isFinalPose ? 'bg-sage-400 text-white'
                  : isCompleted ? 'bg-sage-300 text-white'
                  : isActive ? 'bg-lavender-400 text-white'
                  : 'bg-warm-200 text-gray-400'
              }`}>
                {isCompleted || (isFinal && isFinalPose) ? '✓' : stepNum}
              </span>
              <p className={`text-xs leading-relaxed ${
                isFinal && isFinalPose ? 'text-sage-500 font-bold'
                  : isActive ? 'text-gray-700 font-semibold'
                  : isCompleted ? 'text-sage-400'
                  : 'text-gray-400'
              }`}>
                {step}
              </p>
            </div>
          );
        })}
      </div>

      {isFinalPose && (
        <div className="mt-3 p-3 rounded-xl bg-sage-50 border border-sage-200 text-center">
          <span className="text-xl">🎉</span>
          <p className="text-sage-500 font-bold text-sm mt-1">Pose Achieved!</p>
        </div>
      )}
    </div>
  );
}
