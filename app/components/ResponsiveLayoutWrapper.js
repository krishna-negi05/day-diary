"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function ResponsiveLayoutWrapper({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef(null);
  const pathname = usePathname();

  // ✅ Detect mobile screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Close sidebar when a link is clicked inside it
  useEffect(() => {
    const handleLinkClick = (event) => {
      const target = event.target.closest("a");
      if (target && sidebarRef.current?.contains(target)) {
        setTimeout(() => setIsSidebarOpen(false), 150);
      }
    };
    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  return (
    <div className="h-dvh w-dvw flex overflow-hidden bg-[#0a0a0a] text-white relative">
      {/* ✅ Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-dvh w-64 z-50 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* ✅ Dark overlay when sidebar is open on mobile */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-300"
        />
      )}

      {/* ✅ Always-visible mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)} // toggle sidebar open/close
          className={`fixed top-4 left-4 z-[60] bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/10 backdrop-blur-md transition-all ${
            isSidebarOpen ? "rotate-90 scale-90 opacity-80" : "rotate-0 scale-100"
          }`}
        >
          <Menu className="w-6 h-6 transition-transform" />
        </button>
      )}

      {/* ✅ Optional title (only on home page) */}
      {isMobile && pathname === "/home" && (
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center p-4 bg-[#111]/90 border-b border-zinc-800 shadow-md backdrop-blur-md">
          <h1 className="text-lg font-semibold tracking-wide">Day Diary</h1>
        </header>
      )}

      {/* ✅ Main content (no blur anymore) */}
      <main
        className={`flex-1 h-dvh w-full overflow-hidden transition-all duration-300 ease-in-out md:ml-64`}
      >
        <div className="h-full w-full overflow-y-auto overscroll-none">{children}</div>
      </main>
    </div>
  );
}
