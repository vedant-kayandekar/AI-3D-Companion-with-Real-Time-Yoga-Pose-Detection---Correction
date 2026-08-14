import React from 'react';
import { useNavigate } from 'react-router-dom';
import { POSES } from '../lib/constants';
import RefCard from "./ui/RefCard";

export default function GuidedPoseSelector() {
  const navigate = useNavigate();
  const poseEntries = Object.entries(POSES);

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-sage-200/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-52 h-52 bg-lavender-300/20 rounded-full blur-[70px] pointer-events-none" />

      <div className="max-w-5xl mx-auto mb-10 animate-fade-in z-10 relative">
        <button onClick={() => navigate('/')} className="text-sage-400 hover:text-sage-500 text-sm mb-6 flex items-center gap-2 transition-colors font-semibold">
          ← Back to Home
        </button>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Choose Your <span className="gradient-text">Pose</span>
        </h1>
        <p className="text-gray-500">Select a yoga pose to practice. The AI will guide you step by step.</p>
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in z-10 relative" style={{ animationDelay: '0.1s' }}>
        {poseEntries.map(([name, data]) => (
          <div key={name}>
            <RefCard
              title={name}
              text={
                <>
                  <span style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>{data.english}</span>
                  {data.description}
                </>
              }
              onViewMore={() => navigate(`/guided-practice/${name}`)}
              socialButtons={[
                { icon: <span style={{fontSize: '16px'}}>{data.emoji}</span> },
                { icon: <span style={{fontSize: '10px', fontWeight: 'bold'}}>{data.type}</span> }
              ]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
