import React, { useState, useEffect, useRef } from 'react';
import { POSES } from '../lib/constants';

export default function ReferenceCarousel({ poseName }) {
  const poseData = POSES[poseName];
  const totalSteps = poseData?.totalSteps || 1;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadedImages, setLoadedImages] = useState([]);
  const timerRef = useRef(null);

  const safeName = poseName.replace(/ /g, '_');
  const imagePaths = Array.from({ length: totalSteps }, (_, i) =>
    `/poses/${safeName}_step${i + 1}.jpg`
  );

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const valid = [];
      for (const path of imagePaths) {
        try {
          const resp = await fetch(path, { method: 'HEAD' });
          if (resp.ok) valid.push(path);
        } catch { /* skip */ }
      }
      if (!cancelled) setLoadedImages(valid);
    };
    check();
    return () => { cancelled = true; };
  }, [poseName]);

  useEffect(() => {
    if (loadedImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % loadedImages.length);
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [loadedImages.length]);

  if (loadedImages.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-heading text-base font-bold text-gray-700 mb-2">Reference</h3>
        <div className="h-36 rounded-xl bg-warm-100 flex items-center justify-center">
          <p className="text-gray-400 text-xs">Run 5_copy_reference_images.py</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading text-base font-bold text-gray-700">
          Step {currentIdx + 1}/{loadedImages.length}
        </h3>
        <div className="flex gap-1.5">
          {loadedImages.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={`h-2 rounded-full transition-all ${i === currentIdx ? 'bg-sage-400 w-5' : 'bg-warm-200 w-2'}`} />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-warm-100" style={{ height: '200px' }}>
        {loadedImages.map((src, i) => (
          <img key={src} src={src} alt={`${poseName} step ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 rounded-xl"
            style={{ opacity: i === currentIdx ? 1 : 0, transform: i === currentIdx ? 'scale(1)' : 'scale(0.95)' }} />
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-2 font-medium">
        {poseData?.steps?.[currentIdx] || `Step ${currentIdx + 1}`}
      </p>

      {loadedImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          <button onClick={() => setCurrentIdx(prev => (prev - 1 + loadedImages.length) % loadedImages.length)}
            className="px-3 py-1 rounded-full bg-warm-100 text-gray-500 text-xs font-semibold hover:bg-warm-200 transition-colors">← Prev</button>
          <button onClick={() => setCurrentIdx(prev => (prev + 1) % loadedImages.length)}
            className="px-3 py-1 rounded-full bg-warm-100 text-gray-500 text-xs font-semibold hover:bg-warm-200 transition-colors">Next →</button>
        </div>
      )}
    </div>
  );
}
