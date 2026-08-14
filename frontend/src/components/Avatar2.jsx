/*
Kickboxing Avatar — with full audio pipeline + kickboxing FBX animations
*/

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGLTF, useAnimations, useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";

const facialExpressions = {
  default: {},
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.17,
    noseSneerRight: 0.14,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78,
    browInnerUp: 0.45,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
  },
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0.35,
    mouthFunnel: 1,
    browInnerUp: 1,
  },
  funnyFace: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 1,
  },
};

export function Model({ yogaPose, ...props }) {
  const group = useRef();
  const { nodes, materials, scene } = useGLTF(
    "/models/68c54efec036016545fcd2d4 (1).glb",
  );

  // ========== useChat integration ==========
  const { message, onMessagePlayed, queueLength } = useChat();

  const [audioQueue, setAudioQueue] = useState([]);
  const audioRef = useRef(null);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [facialExpression, setFacialExpression] = useState("default");

  // Add incoming messages to audio queue
  useEffect(() => {
    if (message) {
      const audioItem = {
        id: message.id,
        text: message.text,
        audio: message.audio,
        animation: message.animation,
        facialExpression: message.facialExpression,
      };
      setAudioQueue((q) => [...q, audioItem]);
    }
  }, [message]);

  // Audio queue processor
  useEffect(() => {
    if (audioQueue.length > 0 && !audioRef.current) {
      const { text, audio, animation, facialExpression: expr } = audioQueue[0];

      // Set visual states
      if (animation) setCurrentAnimation(animation);
      if (expr) setFacialExpression(expr);

      if (audio) {
        const binaryString = atob(audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        audioRef.current = audioElement;

        audioElement.play().catch((e) => {
          console.error("Avatar2: Audio playback failed:", e);
          finishCurrentAudio();
        });

        audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl);
          finishCurrentAudio();
        };

        audioElement.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          finishCurrentAudio();
        };
      } else {
        // No audio — simulate duration
        const estimatedDuration = Math.max(2000, (text?.length || 20) * 50);
        setTimeout(() => finishCurrentAudio(), estimatedDuration);
      }
    }
  }, [audioQueue]);

  const finishCurrentAudio = useCallback(() => {
    audioRef.current = null;
    setAudioQueue((q) => q.slice(1));
    onMessagePlayed();
  }, [onMessagePlayed]);

  // ========== Kickboxing Animations ==========
  const { animations: boxingAnim } = useFBX("/animation_kickboxing/Boxing.fbx");
  const { animations: kickAnim } = useFBX("/animation_kickboxing/Kicking.fbx");
  const { animations: blockAnim } = useFBX("/animation_kickboxing/Block.fbx");
  const { animations: bodyBlockAnim } = useFBX(
    "/animation_kickboxing/Body Block.fbx",
  );
  const { animations: elbowPunchAnim } = useFBX(
    "/animation_kickboxing/Elbow Punch.fbx",
  );
  const { animations: marteloAnim } = useFBX(
    "/animation_kickboxing/Martelo 2.fbx",
  );
  const { animations: roundessKickAnim } = useFBX(
    "/animation_kickboxing/RoundessKick.fbx",
  );
  const { animations: sideHookAnim } = useFBX(
    "/animation_kickboxing/SideHook.fbx",
  );
  const { animations: sideShiftKickAnim } = useFBX(
    "/animation_kickboxing/SideShiftKick.fbx",
  );
  const { animations: fightingPositionAnim } = useFBX(
    "/animation_kickboxing/Fighting postion.fbx",
  );

  // Name animations
  if (boxingAnim[0]) boxingAnim[0].name = "Boxing";
  if (kickAnim[0]) kickAnim[0].name = "Kicking";
  if (blockAnim[0]) blockAnim[0].name = "Block";
  if (bodyBlockAnim[0]) bodyBlockAnim[0].name = "BodyBlock";
  if (elbowPunchAnim[0]) elbowPunchAnim[0].name = "ElbowPunch";
  if (marteloAnim[0]) marteloAnim[0].name = "Martelo";
  if (roundessKickAnim[0]) roundessKickAnim[0].name = "RoundessKick";
  if (sideHookAnim[0]) sideHookAnim[0].name = "SideHook";
  if (sideShiftKickAnim[0]) sideShiftKickAnim[0].name = "SideShiftKick";
  if (fightingPositionAnim[0])
    fightingPositionAnim[0].name = "FightingPosition";

  // Strip root bone position tracks to prevent drift
  const allAnims = [
    ...boxingAnim,
    ...kickAnim,
    ...blockAnim,
    ...bodyBlockAnim,
    ...elbowPunchAnim,
    ...marteloAnim,
    ...roundessKickAnim,
    ...sideHookAnim,
    ...sideShiftKickAnim,
    ...fightingPositionAnim,
  ];

  for (const clip of allAnims) {
    clip.tracks = clip.tracks.filter((track) => {
      const isRootPosition =
        track.name.endsWith(".position") &&
        (track.name.includes("Hips") || track.name.startsWith("mixamorig"));
      return !isRootPosition;
    });
  }

  const { actions } = useAnimations(allAnims, group);

  // Play animation when triggered by response OR yogaPose prop
  // Default to FightingPosition idle stance
  const activeAnim = currentAnimation || yogaPose || "FightingPosition";
  useEffect(() => {
    if (activeAnim && actions[activeAnim]) {
      actions[activeAnim].reset().fadeIn(0.5).play();
      return () => {
        actions[activeAnim].fadeOut(0.5).stop();
      };
    }
  }, [activeAnim, actions]);

  // ========== Facial Expressions ==========
  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (
          index === undefined ||
          child.morphTargetInfluences[index] === undefined
        )
          return;
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed,
        );
      }
    });
  };

  const [blink, setBlink] = useState(false);

  useFrame(() => {
    // Apply facial expression
    if (nodes.EyeLeft?.morphTargetDictionary) {
      Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") return;
        const mapping = facialExpressions[facialExpression];
        if (mapping && mapping[key]) {
          lerpMorphTarget(key, mapping[key], 0.1);
        } else {
          lerpMorphTarget(key, 0, 0.1);
        }
      });
    }

    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);
  });

  // Blinking
  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(
        () => {
          setBlink(true);
          setTimeout(() => {
            setBlink(false);
            nextBlink();
          }, 200);
        },
        THREE.MathUtils.randInt(1000, 5000),
      );
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
}

useGLTF.preload("/models/68c54efec036016545fcd2d4 (1).glb");
