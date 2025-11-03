"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function ResponsiveLayoutWrapper({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* ✅ Sidebar Wrapper (Transparent, no gradient) */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 z-50 transform transition-transform duration-300 ease-in-out 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0`}
      >
        {/* Sidebar itself handles its background styling */}
        <Sidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>

      {/* ✅ Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        ></div>
      )}

      {/* ✅ Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-[#111]/90 border-b border-zinc-800 shadow-md backdrop-blur-md">
        <h1 className="text-lg font-semibold">Day Diary</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* ✅ Main Content */}
      <main
        className={`flex-1 h-screen overflow-y-auto transition-all duration-300 ease-in-out
          md:ml-64 p-4 md:p-10 pt-16 md:pt-10 
          ${isSidebarOpen && isMobile ? "blur-sm" : "blur-none"}`}
      >
        {children}
      </main>
    </>
  );
}
