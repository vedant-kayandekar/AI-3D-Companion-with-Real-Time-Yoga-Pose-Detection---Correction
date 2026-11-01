import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as THREE from "three";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import "./index.css";

// Enable Three.js file caching across all loaders (useGLTF, useFBX, FileLoader)
THREE.Cache.enabled = true;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChatProvider>
        <App />
      </ChatProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
