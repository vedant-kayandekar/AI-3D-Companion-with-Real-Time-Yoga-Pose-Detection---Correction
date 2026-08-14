import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF, useAnimations, useFBX } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const visemeValues = {
  A: 0.0,
  B: 0.2,
  C: 0.4,
  D: 0.8,
  E: 0.5,
  F: 0.3,
  G: 0.1,
  H: 0.4,
  X: 0.0,
};

export function HeroAvatar({ modelPath, audioPath, onInteractionComplete }) {
  const group = useRef();
  const { scene, nodes, materials } = useGLTF(modelPath);

  // Load Animations
  const walkFbx = useFBX('/animations/yogaai_animations/Walk In Circle.fbx'); // Using Walk In Circle for natural turning
  const idleFbx = useFBX('/animations/yogaai_animations/Standing Idle.fbx');
  const talkFbx = useFBX('/animations/yogaai_animations/Talking_0.fbx');

  // Prepare animations for mixer
  const animations = useMemo(() => {
    const walkAnim = walkFbx.animations[0].clone();
    walkAnim.name = 'Walking';
    const idleAnim = idleFbx.animations[0].clone();
    idleAnim.name = 'Idle';
    const talkAnim = talkFbx.animations[0].clone();
    talkAnim.name = 'Talking';
    return [walkAnim, idleAnim, talkAnim];
  }, [walkFbx, idleFbx, talkFbx]);

  const { actions, mixer } = useAnimations(animations, group);

  // State Machine
  const [state, setState] = useState('ROAMING'); // ROAMING, TRANSITIONING_IN, INTERACTING, TRANSITIONING_OUT
  const [currentAction, setCurrentAction] = useState(null);
  const [currentLipsync, setCurrentLipsync] = useState(null);
  
  const audioRef = useRef(new Audio(audioPath));

  // Roaming Path variables
  const roamingRadius = 4;
  const roamingCenter = new THREE.Vector3(0, -2, -4);
  const timeRef = useRef(0);

  // Target interaction transform
  const interactionPosition = new THREE.Vector3(0, -3.5, 3);
  const interactionRotation = new THREE.Euler(0, -Math.PI / 2, 0);

  // Initial animation start
  useEffect(() => {
    if (actions && actions['Walking']) {
      actions['Walking'].reset().play();
      setCurrentAction('Walking');
    }
  }, [actions]);

  // Handle Animation Crossfading smoothly
  useEffect(() => {
    if (!actions || !currentAction) return;

    let targetAnim = 'Walking';
    if (state === 'ROAMING') {
      targetAnim = 'Walking';
    } else if (state === 'INTERACTING') {
      targetAnim = 'Talking';
    }

    if (currentAction !== targetAnim) {
      const prev = actions[currentAction];
      const next = actions[targetAnim];
      
      if (prev && next) {
        next.reset().play();
        prev.crossFadeTo(next, 0.5, true);
      } else if (next) {
        next.reset().fadeIn(0.5).play();
      }
      
      setCurrentAction(targetAnim);
    }
  }, [state, actions, currentAction]);

  // Preload lipsync data so audio and animation start synchronously
  useEffect(() => {
    fetchLipsync();
  }, []);

  const fetchLipsync = async () => {
    try {
      const jsonPath = audioPath.replace('.wav', '.json');
      const response = await fetch(jsonPath);
      const data = await response.json();
      setCurrentLipsync(data);
    } catch (e) {
      console.error("Failed to load lipsync data", e);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.error("Audio play blocked", e);
        setState('ROAMING');
      });
    }
  };

  useEffect(() => {
    let timeoutId;
    const handleAudioEnd = () => {
      timeoutId = setTimeout(() => {
        if (group.current) {
          group.current.position.set(0, -2, -4);
          group.current.rotation.set(0, 0, 0);
        }
        setState('ROAMING');
        setCurrentLipsync(null);
        if (onInteractionComplete) onInteractionComplete();
      }, 3000);
    };

    const currentAudio = audioRef.current;
    if (currentAudio) {
      currentAudio.addEventListener('ended', handleAudioEnd);
    }

    return () => {
      clearTimeout(timeoutId);
      if (currentAudio) {
        currentAudio.removeEventListener('ended', handleAudioEnd);
        currentAudio.pause();
      }
    };
  }, [onInteractionComplete]);

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

  useFrame((stateContext, delta) => {
    if (!group.current) return;

    // LIPSYNC Update (Fallback using mouthOpen)
    let targetMouthOpen = 0;
    if (state === 'INTERACTING' && currentLipsync && audioRef.current && !audioRef.current.paused) {
      const currentAudioTime = audioRef.current.currentTime;
      for (let i = 0; i < currentLipsync.mouthCues.length; i++) {
        const mouthCue = currentLipsync.mouthCues[i];
        if (
          currentAudioTime >= mouthCue.start &&
          currentAudioTime <= mouthCue.end
        ) {
          targetMouthOpen = visemeValues[mouthCue.value] || 0;
          break;
        }
      }
    }
    
    // Apply the mouthOpen morph target
    lerpMorphTarget('mouthOpen', targetMouthOpen, 0.4);

    // BLINKING (Random)
    if (Math.random() > 0.99) {
      lerpMorphTarget('eyeBlinkLeft', 1, 0.8);
      lerpMorphTarget('eyeBlinkRight', 1, 0.8);
    } else {
      lerpMorphTarget('eyeBlinkLeft', 0, 0.1);
      lerpMorphTarget('eyeBlinkRight', 0, 0.1);
    }

    // MOVEMENT Logic
    if (state === 'INTERACTING') {
      group.current.position.copy(interactionPosition);
      group.current.rotation.setFromVector3(interactionRotation);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent clicks from going through
    if (state === 'ROAMING') {
      if (group.current) {
        group.current.position.copy(interactionPosition);
        group.current.rotation.setFromVector3(interactionRotation);
      }
      playAudio();
      setState('INTERACTING');
    }
  };

  return (
    <primitive 
      object={scene} 
      ref={group} 
      onClick={handleClick}
      scale={[2.5, 2.5, 2.5]}
      position={[0, -2, -4]}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    />
  );
}

useGLTF.preload('/models/new_yoga_assistant.glb');
useFBX.preload('/animations/yogaai_animations/Walk In Circle.fbx');
useFBX.preload('/animations/yogaai_animations/Standing Idle.fbx');
useFBX.preload('/animations/yogaai_animations/Talking_0.fbx');
