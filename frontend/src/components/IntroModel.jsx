import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three'; // Import THREE

// Define corresponding visemes (copied from Avatar.jsx)
const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export const IntroModel = forwardRef(({ modelPath, audioPath, animationPath }, ref) => {
  const modelRef = useRef();
  const { scene, nodes } = useGLTF(modelPath); // Also get nodes for morph targets
  const { animations: animationClips } = useGLTF(animationPath);
  const { actions, mixer } = useAnimations(animationClips, modelRef);
  const audio = useRef(new Audio(audioPath));
  const [currentLipsync, setCurrentLipsync] = useState(null); // State for lipsync data

  // Define available idle animations (assuming these exist in animations.glb)
  const idleAnimations = ["Idle", "Standing Idle"]; // Example idle animations
  const [currentIdleAnimationIndex, setCurrentIdleAnimationIndex] = useState(0);

  // lerpMorphTarget function (simplified from Avatar.jsx)
  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (
          index === undefined ||
          child.morphTargetInfluences[index] === undefined
        ) {
          return;
        }
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );
      }
    });
  };

  // Function to fetch and play audio with animation and lipsync
  const playAudioWithAnimationAndLipsync = async () => {
    if (audio.current) {
      audio.current.currentTime = 0;
      try {
        // Fetch lipsync data
        const lipsyncData = await fetch(audioPath.replace('.wav', '.json')).then(res => res.json());
        setCurrentLipsync(lipsyncData);

        await audio.current.play();

        // Stop current idle animation and start talking animation when audio plays
        if (actions[idleAnimations[currentIdleAnimationIndex]]) {
          actions[idleAnimations[currentIdleAnimationIndex]].stop();
        }
        if (actions["Talking_0"]) {
          actions["Talking_0"].reset().play();
        }
      } catch (e) {
        console.error("Audio or Lipsync playback failed:", e);
        // If audio fails, stop animation
        if (actions["Talking_0"]) {
          actions["Talking_0"].stop();
        }
        // Resume idle animation if audio fails
        if (actions[idleAnimations[currentIdleAnimationIndex]]) {
          actions[idleAnimations[currentIdleAnimationIndex]].reset().play();
        }
      }
    }
  };

  // Handle audio end
  const handleAudioEnd = () => {
    if (actions["Talking_0"]) {
      actions["Talking_0"].stop();
    }
    // Resume current idle animation
    if (actions[idleAnimations[currentIdleAnimationIndex]]) {
      actions[idleAnimations[currentIdleAnimationIndex]].reset().play();
    }
    setCurrentLipsync(null); // Clear lipsync data
  };

  // Initial setup and audio event listener
  useEffect(() => {
    // Start initial idle animation
    if (actions[idleAnimations[currentIdleAnimationIndex]]) {
      actions[idleAnimations[currentIdleAnimationIndex]].reset().play();
    }

    // Attempt to play audio on initial mount (may be blocked by browsers)
    // This will attempt to play audio and animation once on component mount
    playAudioWithAnimationAndLipsync();

    audio.current.addEventListener('ended', handleAudioEnd);

    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current.currentTime = 0;
        audio.current.removeEventListener('ended', handleAudioEnd);
      }
      // Stop all animations on unmount
      Object.values(actions).forEach(action => { if (action) action.stop(); });
      setCurrentLipsync(null);
    };
  }, [audioPath, actions, currentIdleAnimationIndex]); // Re-run if audioPath, actions, or currentIdleAnimationIndex changes

  // Cycle through idle animations
  useEffect(() => {
    const idleAnimationInterval = setInterval(() => {
      if (!audio.current || audio.current.paused) { // Only cycle if audio is not playing
        const nextIndex = (currentIdleAnimationIndex + 1) % idleAnimations.length;
        if (actions[idleAnimations[currentIdleAnimationIndex]]) {
          actions[idleAnimations[currentIdleAnimationIndex]].stop();
        }
        if (actions[idleAnimations[nextIndex]]) {
          actions[idleAnimations[nextIndex]].reset().play();
        }
        setCurrentIdleAnimationIndex(nextIndex);
      }
    }, 5000); // Change idle animation every 5 seconds

    return () => clearInterval(idleAnimationInterval);
  }, [actions, currentIdleAnimationIndex, idleAnimations, audio.current]);


  useImperativeHandle(ref, () => ({
    playIntroAudio: () => {
      playAudioWithAnimationAndLipsync();
    }
  }));

  useFrame(() => {
    // LIPSYNC - Use current audio reference and lipsync data
    const appliedMorphTargets = [];
    if (currentLipsync && audio.current && !audio.current.paused) {
      const currentAudioTime = audio.current.currentTime;
      for (let i = 0; i < currentLipsync.mouthCues.length; i++) {
        const mouthCue = currentLipsync.mouthCues[i];
        if (
          currentAudioTime >= mouthCue.start &&
          currentAudioTime <= mouthCue.end
        ) {
          appliedMorphTargets.push(corresponding[mouthCue.value]);
          lerpMorphTarget(corresponding[mouthCue.value], 1, 0.2);
          break;
        }
      }
    }

    Object.values(corresponding).forEach((value) => {
      if (appliedMorphTargets.includes(value)) {
        return;
      }
      lerpMorphTarget(value, 0, 0.1);
    });
  });

  const handleModelClick = () => {
    if (ref.current) {
      ref.current.playIntroAudio();
    }
  };

  return (
    <primitive object={scene} ref={modelRef} scale={[2.5, 2.5, 2.5]} position={[0, -2, 0]} onClick={handleModelClick} />
  );
});

useGLTF.preload('/models/64f1a714fe61576b46f27ca2.glb');
useGLTF.preload('/models/animations.glb'); // Preload the animation GLB