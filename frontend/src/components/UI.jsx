import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useChat } from "../hooks/useChat";
import RefChatBar from "./ui/RefChatBar";
import RAGPanel from "./RAGPanel"; // The upload modal

/* =========================================================
   PROCESSING INDICATOR
   ========================================================= */
const ProcessingBadge = ({ stage }) => {
  if (!stage || stage === "IDLE") return null;
  const labels = {
    THINKING: "Thinking...",
    SEARCHING: "Searching Expert Knowledge Base...",
    RETRIEVING: "Gathering info...",
    GENERATING: "Generating response...",
    SPEAKING: "Speaking...",
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#d8e8d8] shadow-sm text-xs font-semibold text-[#4a6a50] animate-fade-in">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6b8f71] opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6b8f71]" />
      </span>
      {labels[stage] || stage}
    </div>
  );
};

/* =========================================================
   MAIN UI COMPONENT
   ========================================================= */
export const UI = ({ hidden }) => {
  const inputRef = useRef();
  const chatEndRef = useRef();
  const {
    chat, loading, message, messages, role,
    processingStage, isRAGMode
  } = useChat();

  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, message]);

  const sendMessage = useCallback(() => {
    const text = inputRef.current?.value?.trim();
    if (!text || loading) return;
    chat(text);
    inputRef.current.value = "";
  }, [chat, loading]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const toggleListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      if (inputRef.current) inputRef.current.value = e.results[0][0].transcript;
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  if (hidden) return null;

  /* ── MOBILE layout ── */
  if (isMobile) {
    return (
      <>
        {!showChat && message?.text && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[85%] max-w-sm pointer-events-none">
            <div className="bg-black/55 backdrop-blur-md rounded-2xl px-4 py-2.5 text-center animate-fade-in">
              <p className="text-white text-[14px] font-medium leading-snug">{message.text}</p>
            </div>
          </div>
        )}
        {!showChat && (
          <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#e0eae0] px-1 py-1">
              <RefChatBar onSend={chat} loading={loading} isListening={isListening} toggleListening={toggleListening} />
            </div>
          </div>
        )}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #6b8f71, #9b8ec4)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}
        {showChat && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#f8f6f2]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8f0e8] bg-white/80 backdrop-blur-sm">
              <span className="font-bold text-[#2d3a2e]">Chat</span>
              <button onClick={() => setShowChat(false)} className="p-2 rounded-lg hover:bg-[#f0f5f0]">
                <svg className="w-4 h-4 text-[#5a6a5b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MessageList messages={messages} message={message} chatEndRef={chatEndRef} chat={chat} />
            <div className="flex-shrink-0 px-3 py-3 border-t border-[#e8f0e8] bg-white/80">
              <RefChatBar onSend={chat} loading={loading} isListening={isListening} toggleListening={toggleListening} />
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── DESKTOP layout ── */
  return (
    <>
      {/* Subtle admin button for knowledge base uploads */}
      <button 
        onClick={() => setShowUploadModal(true)}
        title="Admin: Upload PDFs"
        className="fixed top-20 left-4 z-[60] w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-[#c8dac8] text-[#6b8f71] flex items-center justify-center transition-all shadow-md backdrop-blur-md pointer-events-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {showUploadModal && <RAGPanel onClose={() => setShowUploadModal(false)} />}

      <div className="fixed inset-0 top-16 z-40 pointer-events-none flex p-4">
        {/* Chat pane */}
        <div className="flex-1 max-w-[400px] ml-auto pointer-events-auto flex flex-col rounded-2xl overflow-hidden shadow-xl border border-[#e2ece2] bg-white/75 backdrop-blur-xl">

          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaf0ea] bg-white/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #6b8f71, #9b8ec4)" }}
              >
                AI
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3a2e]">YogaKickFit Expert</p>
                {isRAGMode && (
                  <p className="text-[9.5px] text-[#6b8f71] font-semibold tracking-wide uppercase flex items-center gap-1 mt-0.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-[#6b8f71]" />
                    Expert Knowledge Base
                  </p>
                )}
              </div>
            </div>
            <ProcessingBadge stage={processingStage} />
          </div>

          {/* Messages */}
          <MessageList messages={messages} message={message} chatEndRef={chatEndRef} chat={chat} />

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3 border-t border-[#eaf0ea] bg-white/60">
            <RefChatBar onSend={chat} loading={loading} isListening={isListening} toggleListening={toggleListening} />
          </div>
        </div>
      </div>
    </>
  );
};

const MessageList = ({ messages, message, chatEndRef, chat }) => (
  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
    {messages.length === 0 && (
      <div className="text-center py-14">
        <div className="text-3xl mb-3">🧘</div>
        <p className="text-[13px] font-semibold text-[#6a7a6b]">Ready for your session</p>
        <p className="text-[11px] text-[#a0b0a0] mt-1 mb-6">Grounded in verified yoga expertise</p>
        
        {/* Demo Questions */}
        <div className="flex flex-col gap-2 max-w-[80%] mx-auto mt-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#9bc8a0] mb-1">Try these demos</p>
          <button 
            onClick={() => chat("Bhujangasana steps")}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a7a50] bg-white border border-[#c8dac8] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#6b8f71] transition-all"
          >
            "Bhujangasana steps"
          </button>
          <button 
            onClick={() => chat("Pawanmuktasana steps")}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a7a50] bg-white border border-[#c8dac8] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#6b8f71] transition-all"
          >
            "Pawanmuktasana steps"
          </button>
        </div>
      </div>
    )}

    {messages.map((msg, i) => {
      const isUser = msg.sender_type === "user" || msg.role === "user";
      return (
        <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed animate-fade-in ${
              isUser
                ? "text-white rounded-br-sm"
                : "text-[#2d3a2e] bg-white/80 border border-[#e5eee5] rounded-bl-sm"
            }`}
            style={isUser ? { background: "linear-gradient(135deg, #6b8f71, #4a6b50)" } : {}}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      );
    })}

    {message?.text && (
      <div className="flex justify-start">
        <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-[13px] leading-relaxed text-[#2d3a2e] bg-white/80 border border-[#e5eee5] border-l-[3px] border-l-[#6b8f71] animate-fade-in">
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    )}

    <div ref={chatEndRef} />
  </div>
);
