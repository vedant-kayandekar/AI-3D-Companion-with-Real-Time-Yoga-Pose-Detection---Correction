import { useEffect, useState, useRef } from "react";
import { Lipsync } from "wawa-lipsync";

export const useLipsync = (audioElement) => {
  const [viseme, setViseme] = useState("viseme_sil");
  const lipsyncManager = useRef(null);
  const requestRef = useRef();

  useEffect(() => {
    if (!audioElement) return;

    // Initialize Wawa Lipsync with absolute minimum history buffer for instant sync
    if (!lipsyncManager.current) {
      // Default is higher, which causes a "rolling average" drag/delay on the visemes.
      // Setting historySize to 1 means it reacts instantly to the current frame's audio.
      lipsyncManager.current = new Lipsync({ historySize: 1 });
    }

    const connectSource = () => {
      try {
        if (!lipsyncManager.current.audioSource) {
          audioElement.crossOrigin = "anonymous";
          lipsyncManager.current.connectAudio(audioElement);
          console.log("🎤 wawa-lipsync connected to audio element.");
        }
      } catch (error) {
        console.error("Failed to connect wawa-lipsync:", error);
      }
    };

    // The WebAudio context needs user interaction to start, or we hook into 'play'
    audioElement.addEventListener("play", connectSource);

    return () => {
      audioElement.removeEventListener("play", connectSource);
    };
  }, [audioElement]);

  useEffect(() => {
    const updateLipsync = () => {
      if (lipsyncManager.current && !audioElement.paused) {
        lipsyncManager.current.processAudio();
        // The library calculates the closest phoneme viseme each frame
        if (lipsyncManager.current.viseme) {
          setViseme(lipsyncManager.current.viseme);
        }
      } else {
        setViseme("viseme_sil"); // Silence/closed mouth when paused
      }
      requestRef.current = requestAnimationFrame(updateLipsync);
    };

    requestRef.current = requestAnimationFrame(updateLipsync);
    return () => cancelAnimationFrame(requestRef.current);
  }, [audioElement]);

  return { viseme };
};
