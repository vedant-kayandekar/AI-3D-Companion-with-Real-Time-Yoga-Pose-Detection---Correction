import React, { useState, useCallback, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { useChat } from "./hooks/useChat";
import { HeroSection } from "./components/HeroSection";
import { Navbar } from "./components/Navbar";
import { UI } from "./components/UI";
import { Experience } from "./components/Experience";
import { FlowSelector } from "./components/FlowSelector";
import { GuidedSession } from "./components/GuidedSession";
import RefAuthForm from "./components/ui/RefAuthForm";

// Lazy load heavy components for faster initial page load
const PoseDetection = lazy(() =>
  import("./components/PoseDetection").then((m) => ({
    default: m.PoseDetection,
  })),
);
const Tutorials = lazy(() =>
  import("./components/Tutorials").then((m) => ({ default: m.Tutorials })),
);
const GuidedPoseSelector = lazy(() =>
  import("./components/GuidedPoseSelector").then((m) => ({ default: m.default }))
);
const LiveDetection = lazy(() =>
  import("./components/LiveDetection").then((m) => ({ default: m.default }))
);

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* =========================================================
   Loader Fallback
   ========================================================= */
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin mb-4"></div>
    <p className="text-warm-400 text-sm font-medium">Loading...</p>
  </div>
);

/* =========================================================
   Background helper — sets body background based on role
   ========================================================= */
const roleBackgrounds = {
  Yoga: "linear-gradient(to bottom right, #f0f5f0, #fdf8f3)",
  Kickboxing: "linear-gradient(to bottom right, #fdf8f3, #ede8f5)",
  Friend: "linear-gradient(to bottom right, #ede8f5, #f0f5f0)",
};

/* =========================================================
   AUTH FORM (Login / Register)
   ========================================================= */
const AuthForm = () => {
  const { login } = useChat();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const endpoint = isRegister ? "/register" : "/login";
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errBody = await res
          .json()
          .catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(
          errBody.error || errBody.message || "Authentication failed",
        );
      }

      if (isRegister) {
        // After successful registration, auto-login to get JWT
        const loginRes = await fetch(`${backendUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });
        if (!loginRes.ok) throw new Error("Registered! Please sign in.");
        const data = await loginRes.json();
        login(data.token, data.user.id, data.chatSessionId);
      } else {
        const data = await res.json();
        login(data.token, data.user.id, data.chatSessionId);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-sage-50 to-lavender-50 px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 right-1/4 w-[400px] h-[400px] bg-sage-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-15 animate-blob"></div>
        <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] bg-lavender-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-15 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <RefAuthForm
          isRegister={isRegister}
          setIsRegister={setIsRegister}
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          error={error}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

/* =========================================================
   CHAT PAGE — 3D Avatar + Chat UI
   ========================================================= */
const ChatPage = () => {
  const { role } = useChat();

  // Dynamic background based on role
  React.useEffect(() => {
    document.body.style.background =
      roleBackgrounds[role] || roleBackgrounds.Yoga;
    return () => {
      document.body.style.background = "";
    };
  }, [role]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <Loader />
      <Leva hidden />
      <UI />
      <Canvas shadows camera={{ position: [0, 20, 1], fov: 30 }}>
        <Experience />
      </Canvas>
    </div>
  );
};

/* =========================================================
   PROTECTED ROUTE WRAPPER
   ========================================================= */
const ProtectedRoute = ({ children }) => {
  const { authToken } = useChat();
  if (!authToken) return <Navigate to="/login" replace />;
  return children;
};

/* =========================================================
   APP — MAIN ROUTING
   ========================================================= */
function App() {
  const { authToken } = useChat();
  const navigate = useNavigate();

  const handleGetStarted = useCallback(() => {
    navigate(authToken ? "/chat" : "/login");
  }, [authToken, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={<HeroSection onGetStarted={handleGetStarted} />}
      />
      <Route
        path="/login"
        element={authToken ? <Navigate to="/chat" replace /> : <AuthForm />}
      />

      {/* Protected Routes — Wrapped with Navbar */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Navbar />
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice"
        element={
          <ProtectedRoute>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <PoseDetection />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutorials"
        element={
          <ProtectedRoute>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Tutorials />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      {/* New Flow Routes */}
      <Route
        path="/flows"
        element={
          <ProtectedRoute>
            <Navbar />
            <FlowSelector />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session/:planId"
        element={
          <ProtectedRoute>
            <GuidedSession />
          </ProtectedRoute>
        }
      />
      
      {/* Step-by-Step Guided Practice Routes */}
      <Route
        path="/guided-practice"
        element={
          <ProtectedRoute>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <GuidedPoseSelector />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guided-practice/:poseName"
        element={
          <ProtectedRoute>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <LiveDetection />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
