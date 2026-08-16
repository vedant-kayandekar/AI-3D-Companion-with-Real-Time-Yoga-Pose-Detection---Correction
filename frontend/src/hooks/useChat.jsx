import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ragServiceUrl = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [messageQueue, setMessageQueue] = useState([]);
  const [audioBuffer, setAudioBuffer] = useState([]);
  const [nextExpectedSeq, setNextExpectedSeq] = useState(0);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [chatSessionId, setChatSessionId] = useState(localStorage.getItem("chatSessionId"));
  
  // Guest mode state
  const [isGuest, setIsGuest] = useState(!localStorage.getItem("authToken"));
  const [guestId, setGuestId] = useState(localStorage.getItem("guestId") || crypto.randomUUID());
  
  const [role, setRole] = useState("Yoga");
  const [isRAGMode, setIsRAGMode] = useState(true); // RAG always on by default
  
  const [yogaPose, setYogaPose] = useState(null);
  const [ws, setWs] = useState(null);
  const [processingStage, setProcessingStage] = useState("IDLE");

  // Persist guest ID
  useEffect(() => {
    if (isGuest && !localStorage.getItem("guestId")) {
      localStorage.setItem("guestId", guestId);
    }
  }, [isGuest, guestId]);

  const onMessagePlayed = useCallback(() => {
    setMessage(null);
    setIsPlaying(false);
    setMessageQueue((prev) => prev.length > 0 ? prev.slice(1) : prev);
  }, []);

  useEffect(() => {
    if (messageQueue.length > 0 && !message) {
      setMessage(messageQueue[0]);
      setIsPlaying(true);
    }
  }, [messageQueue, message]);

  useEffect(() => {
    if (audioBuffer.length === 0) return;
    const readyItems = [];
    let nextSeq = nextExpectedSeq;

    for (const item of audioBuffer) {
      if (item.seq === nextSeq) {
        readyItems.push(item);
        nextSeq++;
      } else break;
    }

    if (readyItems.length > 0) {
      setMessageQueue((prev) => [
        ...prev,
        ...readyItems.map((item) => ({
          id: item.id,
          audio: item.audio,
          animation: item.animation,
          facialExpression: item.facialExpression,
        })),
      ]);
      setAudioBuffer((prev) => prev.slice(readyItems.length));
      setNextExpectedSeq(nextSeq);
    }
  }, [audioBuffer, nextExpectedSeq]);

  const chat = useCallback(async (userMessage) => {
    if (!isGuest && (!authToken || !userId)) {
      console.error("User not authenticated.");
      return;
    }
    if (loading) return;

    setLoading(true);
    setNextExpectedSeq(0);
    setAudioBuffer([]);

    try {
      setMessages((prev) => [
        ...prev,
        { sender_type: "user", content: userMessage, timestamp: new Date().toISOString() },
      ]);

      const headers = { "Content-Type": "application/json" };
      if (!isGuest && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          message: userMessage, 
          chatSessionId: isGuest ? "guest" : chatSessionId, 
          role, 
          isRAGMode,
          isGuest,
          guestId
        }),
      });

      if (response.status === 403) {
        const resData = await response.json();
        if (resData.requireLogin) {
          alert("Guest limit reached! Please log in or register to continue.");
          // Trigger auth modal or redirect here in a real app
        }
        throw new Error("Guest limit reached");
      }
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!isGuest && result.chatSessionId && result.chatSessionId !== chatSessionId) {
        setChatSessionId(result.chatSessionId);
        localStorage.setItem("chatSessionId", result.chatSessionId);
      }
    } catch (err) {
      console.error("Chat API error:", err);
      const errorMessage = {
        text: err.message === "Guest limit reached" ? "Please log in to continue our chat." : "I'm having some technical difficulties right now. Please try again.",
        audio: null, lipsync: null, facialExpression: "sad", animation: "Talking_1",
      };
      setMessages((prev) => [
        ...prev,
        { sender_type: "assistant", content: errorMessage.text, timestamp: new Date().toISOString() },
      ]);
      setMessageQueue((prev) => [...prev, errorMessage]);
      setProcessingStage("IDLE");
    } finally {
      if (loading) setLoading(false);
    }
  }, [authToken, userId, chatSessionId, loading, role, isRAGMode, isGuest, guestId]);

  // WebSocket Connection
  useEffect(() => {
    // Only connect if we have an auth token OR we are a guest with a guestId
    if ((authToken && userId) || (isGuest && guestId)) {
      if (ws) return; // already connected

      const wsUrl = isGuest 
        ? `${backendUrl.replace("http", "ws")}?guest=true&guestId=${guestId}`
        : `${backendUrl.replace("http", "ws")}?token=${authToken}`;

      const newWs = new WebSocket(wsUrl);

      newWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "text_ready") {
            setMessages((prev) => [
              ...prev,
              {
                id: data.id,
                sender_type: "assistant",
                content: data.text,
                timestamp: new Date().toISOString(),
                loadingAudio: true,
                facialExpression: data.facialExpression,
                animation: data.animation,
                source: data.source // "ai" or "rag"
              },
            ]);
            setLoading(false);
            setProcessingStage("IDLE");
          } else if (data.type === "audio_ready") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id ? { ...msg, audio: data.audio, loadingAudio: false } : msg
              )
            );

            setAudioBuffer((prev) => {
              if (prev.some(p => p.id === data.id && p.seq === data.seq) || nextExpectedSeq > data.seq) return prev;
              const matchingMsg = messages.find((m) => m.id === data.id);
              const newBuffer = [
                ...prev,
                { id: data.id, audio: data.audio, seq: data.seq, animation: matchingMsg?.animation, facialExpression: matchingMsg?.facialExpression },
              ];
              newBuffer.sort((a, b) => a.seq - b.seq);
              return newBuffer;
            });
          }
        } catch (err) {
          console.error("Error parsing WS message", err);
        }
      };

      newWs.onclose = () => setWs(null);
      setWs(newWs);
    }
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [authToken, userId, isGuest, guestId, ws, messages]);

  const login = (token, id, session_id) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", id);
    localStorage.setItem("chatSessionId", session_id || null);
    setAuthToken(token);
    setUserId(id);
    setChatSessionId(session_id || null);
    setIsGuest(false);
    if (ws) ws.close();
    setWs(null);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("chatSessionId");
    setAuthToken(null);
    setUserId(null);
    setChatSessionId(null);
    setIsGuest(true); // Revert to guest mode
    if (ws) ws.close();
    setWs(null);
    setMessages([]);
    setMessageQueue([]);
    setMessage(null);
    setIsPlaying(false);
  };

  // Upload PDFs to RAG Service
  const uploadPDFs = async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    try {
      const res = await fetch(`${ragServiceUrl}/upload_pdfs/`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // Wake up Render Free Tier on page load
  useEffect(() => {
    fetch(`${ragServiceUrl}/health`).catch(() => {
      console.log("Wake up ping sent to RAG service");
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chat, message, onMessagePlayed, loading,
        cameraZoomed, setCameraZoomed,
        authToken, userId, chatSessionId,
        login, logout, messages,
        role, setRole,
        isRAGMode, setIsRAGMode, // Export RAG mode controls
        yogaPose, setYogaPose, processingStage,
        uploadPDFs, isGuest
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};
