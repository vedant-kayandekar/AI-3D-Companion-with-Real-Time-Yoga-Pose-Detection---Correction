import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../hooks/useChat";

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useChat();
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

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(248, 246, 242, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(200, 218, 200, 0.5)",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center h-14 gap-6">

          {/* Wordmark — no logo box */}
          <Link to="/chat" className="no-underline shrink-0">
            <span className="text-[1.15rem] font-extrabold tracking-[-0.4px] text-[#1e2b1f]">
              Yoga<span className="text-[#6b8f71]">Kickfit</span>
              <span className="text-[#9b8ec4]">.AI</span>
            </span>
          </Link>

          {/* Pill nav links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-1.5 rounded-full text-[0.8rem] font-bold no-underline transition-all duration-200 ${
                  isActive(link.to)
                    ? "bg-[#6b8f71] text-white shadow-sm shadow-[#6b8f71]/30"
                    : "text-[#5a6a5b] hover:text-[#6b8f71] hover:bg-[#f0f8f0]"
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Desktop logout */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.78rem] font-bold text-[#5a6a5b] border border-[#d8e4d8] hover:bg-[#f0f8f0] hover:text-[#2d3a2e] transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#f0f5f0] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 text-[#3d4e3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-[#e8f0e8] animate-fade-in">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all ${
                    isActive(link.to)
                      ? "bg-[#6b8f71] text-white"
                      : "text-[#5a6a5b] hover:bg-[#f0f8f0]"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="mt-2 px-4 py-2.5 text-sm font-semibold text-[#5a6a5b] border border-[#d8e4d8] rounded-xl hover:bg-[#f0f5f0] transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
