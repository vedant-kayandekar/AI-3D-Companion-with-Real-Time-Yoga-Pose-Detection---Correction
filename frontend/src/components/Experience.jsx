import {
  CameraControls,
  ContactShadows,
  Sparkles,
  MeshDistortMaterial,
  Float,
  Html
} from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";
import { Model as Avatar2 } from "./Avatar2";
import { Avatar as Avatar3 } from "./Avatar3";
import { Avatar_yoga } from "./Avatar_yoga";

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
      <group position={[0, -0.2, 0]}>
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

      {/* Floating text always visible on screen */}
      <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
        <div className="w-[220px] text-center bg-white/85 backdrop-blur-md border border-[#c8dac8] px-3.5 py-2 rounded-xl shadow-lg pointer-events-none animate-pulse">
          <p className="text-[#3d4e3e] text-xs font-semibold leading-tight">
            Consulting yoga expert knowledge base...
          </p>
        </div>
      </Html>
    </group>
  );
};

/* =========================================================
   3D LOADING FALLBACK (Fast Preloader + Status Text)
   ========================================================= */
const LoadingStars = () => (
  <group position={[0, 1.2, 0]}>
    <Sparkles count={150} scale={4} size={4} speed={0.5} opacity={0.9} color="#9b8ec4" />
    <mesh position={[0, -0.3, 0]}>
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshBasicMaterial color="#6b8f71" transparent opacity={0.15} wireframe />
    </mesh>
    <Html center zIndexRange={[100, 0]}>
      <div className="flex flex-col items-center gap-1.5 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-[#c8dac8] pointer-events-none animate-pulse whitespace-nowrap">
        <span className="text-sm font-extrabold text-[#2d4230]">
          ✨ Your 3D model is coming for you...
        </span>
        <span className="text-[0.72rem] font-semibold text-[#6b8f71]">
          Materializing your AI instructor
        </span>
      </div>
    </Html>
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
      
      {/* High-performance local studio lighting (replaces 2MB remote HDR download) */}
      <ambientLight intensity={0.75} />
      <hemisphereLight skyColor="#fbf9f5" groundColor="#e0e8e0" intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} color="#ffffff" />
      <pointLight position={[-4, 2, -4]} intensity={0.35} color="#e8d8c8" />
      <pointLight position={[4, 2, 4]} intensity={0.3} color="#c8e0c8" />
      
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
