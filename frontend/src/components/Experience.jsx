import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";
import { Model as Avatar2 } from "./Avatar2";
import { Avatar as Avatar3 } from "./Avatar3";
import { Avatar_yoga } from "./Avatar_yoga";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) {
            return ".";
          }
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed, message, role } = useChat();

  // Set initial camera on mount
  useEffect(() => {
    cameraControls.current.setLookAt(0, 2, 5, 0, 1.5, 0);
  }, []);

  // Reset camera when role changes OR zoom toggles — force reset removes stale user drag
  useEffect(() => {
    if (cameraControls.current) {
      // Reset camera to default framing for the avatar
      cameraControls.current.reset(true); // Reset any user panning/rotation
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
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      {role === "Yoga" && <Avatar />}
      {role === "YogAi" && <Avatar_yoga />}
      {role === "Kickboxing" && <Avatar2 yogaPose={message?.yogaPose} />}
      {role === "Friend" && <Avatar3 />}
      <ContactShadows opacity={0.7} />
    </>
  );
};
