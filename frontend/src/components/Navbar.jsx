import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import RefButton from "./ui/RefButton";
import RAGPanel from "./RAGPanel";

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ragPanelOpen, setRagPanelOpen] = useState(false);
  const { role, setRole, logout } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: "/chat", label: "Chat Companion", icon: "💬" },
    { to: "/flows", label: "Yoga", icon: "🧘" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };



  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-sage-200/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/chat" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 bg-gradient-to-br from-sage-500 to-lavender-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
              Y
            </div>
            <span className="font-heading font-bold text-xl text-warm-800 tracking-tight">
              YogaKickFitt<span className="text-sage-500">.AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 no-underline ${
                  location.pathname === link.to
                    ? "bg-sage-100 text-sage-700"
                    : "text-warm-600 hover:text-sage-600 hover:bg-sage-50"
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setRagPanelOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-sage-600 bg-sage-50 hover:bg-sage-100 rounded-full transition-colors mr-2 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Knowledge Base
            </button>

            <RefButton size="small" onClick={handleLogout}>
              Logout
            </RefButton>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-sage-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-warm-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-sage-100 animate-slide-up">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold no-underline transition-all ${
                    location.pathname === link.to
                      ? "bg-sage-100 text-sage-700"
                      : "text-warm-600 hover:bg-sage-50"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col items-stretch gap-2 px-4 pt-3 mt-2 border-t border-sage-100">
                <button
                  onClick={() => { setRagPanelOpen(true); setMobileOpen(false); }}
                  className="w-full px-4 py-2 text-sm font-semibold text-sage-600 bg-sage-50 hover:bg-sage-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Knowledge Base Upload
                </button>

                <RefButton size="small" onClick={handleLogout} style={{width: '100%'}}>
                  Logout
                </RefButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {ragPanelOpen && <RAGPanel onClose={() => setRagPanelOpen(false)} />}
    </nav>
  );
};

