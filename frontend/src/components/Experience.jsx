import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
  Sparkles,
  MeshDistortMaterial,
  Float,
  Html
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";
import { Model as Avatar2 } from "./Avatar2";
import { Avatar as Avatar3 } from "./Avatar3";
import { Avatar_yoga } from "./Avatar_yoga";
import * as THREE from "three";

/* =========================================================
   RAG PROCESSING INDICATOR (Glowing Blob & Text)
   ========================================================= */
const ProcessingIndicator = () => {
  const { loading } = useChat();
  const blobRef = useRef();

  useFrame(({ clock }) => {
    if (blobRef.current) {
      blobRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      blobRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });

  if (!loading) return null;

  return (
    <group>
      {/* Revolving glowing blob under the avatar */}
      <group position={[0, -0.5, 0]}>
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh ref={blobRef} scale={[1.2, 0.4, 1.2]}>
            <torusGeometry args={[0.5, 0.15, 32, 100]} />
            <MeshDistortMaterial
              color="#6b8f71"
              emissive="#9b8ec4"
              emissiveIntensity={0.5}
              distort={0.4}
              speed={3}
              transparent
              opacity={0.7}
            />
          </mesh>
        </Float>
      </group>

      {/* Floating text above the avatar */}
      <Text 
        position={[0, 2.1, 0]} 
        fontSize={0.12} 
        anchorX="center" 
        anchorY="bottom"
        color="#3d4e3e"
        maxWidth={2.5}
        textAlign="center"
      >
        Answers through yoga expert knowledge base without hallucination...
        <meshBasicMaterial attach="material" color="#6b8f71" />
      </Text>
    </group>
  );
};

/* =========================================================
   3D LOADING FALLBACK (Twinkling Stars)
   ========================================================= */
const LoadingStars = () => (
  <group position={[0, 1, 0]}>
    <Sparkles count={100} scale={4} size={4} speed={0.4} opacity={1} color="#9b8ec4" />
    <Text position={[0, 0, 0]} fontSize={0.2} color="#6b8f71" anchorX="center" anchorY="center">
      Materializing your instructor...
    </Text>
  </group>
);

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed, message, role } = useChat();

  useEffect(() => {
    cameraControls.current?.setLookAt(0, 2, 5, 0, 1.5, 0);
  }, []);

  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.reset(true);
      if (cameraZoomed) {
        cameraControls.current.setLookAt(0, 1.5, 1.5, 0, 1.5, 0, true);
      } else {
        cameraControls.current.setLookAt(0, 2.2, 5, 0, 1.0, 0, true);
      }
    }
  }, [cameraZoomed, role]);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      
      <ProcessingIndicator />
      
      <Suspense fallback={<LoadingStars />}>
        {role === "Yoga" && <Avatar_yoga />}
        {role === "Kickboxing" && <Avatar2 yogaPose={message?.yogaPose} />}
        {role === "Friend" && <Avatar3 />}
      </Suspense>
      
      <ContactShadows opacity={0.7} position={[0, -1, 0]} />
    </>
  );
};
