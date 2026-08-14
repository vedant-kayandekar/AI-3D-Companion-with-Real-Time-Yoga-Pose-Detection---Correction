import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useChat } from "../hooks/useChat";
import RefChatBar from "./ui/RefChatBar";

/* =========================================================
   PROCESSING OVERLAY — shows AI processing stage
   ========================================================= */
const ProcessingOverlay = ({ stage }) => {
  if (!stage || stage === "IDLE") return null;

  const labels = {
    THINKING: "Thinking...",
    SEARCHING: "Searching knowledge...",
    RETRIEVING: "Gathering info...",
    GENERATING: "Generating response...",
    SPEAKING: "Speaking...",
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 glass-card rounded-full px-6 py-2.5 flex items-center gap-3 animate-fade-in shadow-lg">
      <div className="relative">
        <div className="w-3 h-3 rounded-full bg-sage-400 animate-pulse-soft"></div>
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-sage-400 animate-ping opacity-40"></div>
      </div>
      <span className="text-sm font-semibold text-warm-600">
        {labels[stage] || stage}
      </span>
    </div>
  );
};

/* =========================================================
   MAIN CHAT UI COMPONENT
   ========================================================= */
export const UI = ({ hidden, ...props }) => {
  const inputRef = useRef();
  const chatEndRef = useRef();
  const { chat, loading, message, messages, role, setRole, processingStage, isRAGMode, setIsRAGMode } =
    useChat();

  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, message]);

  const sendMessage = useCallback(() => {
    const text = inputRef.current?.value?.trim();
    if (!text || loading) return;
    chat(text);
    inputRef.current.value = "";
  }, [chat, loading]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // Speech-to-text
  const toggleListening = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (inputRef.current) inputRef.current.value = transcript;
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  if (hidden) return null;

  const chatVisible = isMobile ? showChat : true;

  return (
    <>
      {/* Mobile Floating Chat Button */}
      {isMobile && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-sage-500 to-sage-700 text-white shadow-lg shadow-sage-500/30 flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Open chat"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Mobile Subtitle Overlay */}
      {isMobile && !showChat && message?.text && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[85%] max-w-md pointer-events-none">
          <div className="glass-card bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center shadow-2xl animate-fade-in">
            <p className="text-white text-[15px] font-medium leading-snug drop-shadow-md">
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Persistent Chat Bar */}
      {isMobile && !showChat && (
        <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
          <div className="glass-card rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl px-1 py-1 border border-sage-200/50">
            <RefChatBar 
              onSend={chat} 
              loading={loading} 
              isListening={isListening} 
              toggleListening={toggleListening} 
            />
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div
        className={`fixed z-40 pointer-events-none flex flex-col items-end
          ${isMobile ? "inset-0" : "bottom-4 right-4 top-20 w-[380px]"}
          ${chatVisible ? "" : "hidden"}
        `}
      >
        <div
          className={`pointer-events-auto flex flex-col
            ${
              isMobile
                ? "w-full h-full bg-warm-50/95 backdrop-blur-xl"
                : "w-full h-full glass-card rounded-2xl overflow-hidden shadow-xl"
            }
          `}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sage-100 bg-white/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-400 to-lavender-400 flex items-center justify-center text-white text-sm font-bold">
                AI
              </div>
              <div>
                <p className="font-bold text-warm-800 text-sm flex items-center gap-2">
                  YogaKickFit AI
                  <button
                    onClick={() => setIsRAGMode(!isRAGMode)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      isRAGMode
                        ? "bg-sage-500 text-white border-sage-500"
                        : "bg-white text-sage-400 border-sage-200"
                    }`}
                    title="Toggle Knowledge Base Mode"
                  >
                    RAG {isRAGMode ? "ON" : "OFF"}
                  </button>
                </p>
                <p className="text-xs text-sage-500 capitalize">{role} Mode</p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setShowChat(false)}
                className="p-2 rounded-lg hover:bg-sage-50 transition-colors"
                aria-label="Close chat"
              >
                <svg
                  className="w-5 h-5 text-warm-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🧘</div>
                <p className="text-warm-400 text-sm font-medium">
                  Start a conversation with your AI tutor
                </p>
                <p className="text-warm-300 text-xs mt-1">
                  Ask about yoga poses, breathing, or technique
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender_type === "user" || msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    msg.sender_type === "user" || msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                  }
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  {msg.source === "rag" && (
                    <div className="mt-2 text-[10px] font-semibold text-sage-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                      From Knowledge Base
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Current playing message */}
            {message?.text && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai border-l-2 border-sage-400">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-sage-100 bg-white/50">
            <RefChatBar 
              onSend={chat} 
              loading={loading} 
              isListening={isListening} 
              toggleListening={toggleListening} 
            />
          </div>
        </div>
      </div>

      <ProcessingOverlay stage={processingStage} />
    </>
  );
};
