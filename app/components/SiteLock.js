"use client";
import React, { useState, useEffect, useRef, memo } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

/* ---------------- PASSWORD INPUT ---------------- */
const PasswordInput = memo(function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  toggleVisible,
  autoFocus = false,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative w-full mb-6">
      <input
        ref={inputRef}
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="p-3 pr-10 w-full text-zinc-900 placeholder:text-zinc-500 rounded-xl 
        bg-white/60 backdrop-blur-md border border-white/30 outline-none
        focus:ring-2 focus:ring-purple-400/70 focus:bg-white/70 transition-all duration-200"
      />
      {/* 👁 Toggle button — now perfectly aligned and single */}
      <button
        type="button"
        onClick={toggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-900 focus:outline-none"
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
});

/* ---------------- GLASS PANEL ---------------- */
const GlassPanel = memo(function GlassPanel({ title, subtitle, children }) {
  return (
    <div
      className="relative w-[90%] sm:w-[400px] md:w-[440px] p-8 sm:p-10 rounded-3xl overflow-hidden
      flex flex-col items-center text-center backdrop-blur-2xl border border-white/20
      bg-white/30 shadow-[0_0_40px_rgba(0,0,0,0.25)] transition-all duration-300 animate-fade-in"
    >
      {/* Frosted glass gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent opacity-70 rounded-3xl" />
      <div className="absolute inset-0 rounded-3xl border border-white/20 [mask-image:linear-gradient(white,transparent)]" />
      <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-purple-500/20 via-blue-500/10 to-pink-400/20 blur-xl opacity-70" />

      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-zinc-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-700 mb-8 tracking-wide font-medium drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
          {subtitle}
        </p>
        {children}
      </div>
    </div>
  );
});

/* ---------------- BACKGROUND WRAPPER ---------------- */
const BackgroundWrapper = memo(function BackgroundWrapper({ children }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      <div className="relative z-10 text-zinc-900">{children}</div>
      <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
    </div>
  );
});

/* ---------------- MAIN SITELOCK ---------------- */
export default function SiteLock({ children }) {
  const [mode, setMode] = useState("loading"); // "setup" | "unlock" | "unlocked"
  const [password, setPassword] = useState("");
  const [input, setInput] = useState("");
  const [savedPassword, setSavedPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showInput, setShowInput] = useState(false);

  /* ---- Load saved state ---- */
  useEffect(() => {
    const saved = localStorage.getItem("sitePassword");
    const lastUnlockDate = localStorage.getItem("lastUnlockDate");
    const today = new Date().toDateString();
    const sessionUnlocked = sessionStorage.getItem("sessionUnlocked");

    // Reset session if new day
    if (lastUnlockDate && lastUnlockDate !== today) {
      sessionStorage.removeItem("sessionUnlocked");
    }

    if (sessionUnlocked === "true" && lastUnlockDate === today) {
      setMode("unlocked");
    } else if (saved) {
      setSavedPassword(saved);
      setMode("unlock");
    } else {
      setMode("setup");
    }
  }, []);

  /* ---- Set Password ---- */
  const handleSetPassword = () => {
    if (password.trim().length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    const today = new Date().toDateString();
    localStorage.setItem("sitePassword", password.trim());
    localStorage.setItem("lastUnlockDate", today);
    sessionStorage.setItem("sessionUnlocked", "true");
    toast.success("Password set successfully!");
    setMode("unlocked");
  };

  /* ---- Unlock ---- */
  const handleUnlock = () => {
    if (input.trim() === savedPassword) {
      const today = new Date().toDateString();
      localStorage.setItem("lastUnlockDate", today);
      sessionStorage.setItem("sessionUnlocked", "true");
      toast.success("Welcome Back 🔓");
      setMode("unlocked");
    } else {
      toast.error("Incorrect password!");
    }
  };

  /* ---- Reset ---- */
  const handleReset = () => {
    localStorage.removeItem("sitePassword");
    localStorage.removeItem("lastUnlockDate");
    sessionStorage.removeItem("sessionUnlocked");
    toast("Password reset — please set a new one.", { icon: "♻️" });
    setPassword("");
    setInput("");
    setSavedPassword(null);
    setMode("setup");
  };

  /* ---- Loading ---- */
  if (mode === "loading") return null;

  /* ---- Unlocked ---- */
  if (mode === "unlocked") return children;

  /* ---- Setup Screen ---- */
  if (mode === "setup") {
    return (
      <BackgroundWrapper>
        <GlassPanel
          title={
            <div className="flex items-center justify-center gap-3">
              <img
                src="/lock.png"
                alt="Lock Icon"
                className="w-8 h-8 opacity-90"
              />
              <span>Set Your Password</span>
            </div>
          }
          subtitle="Protect your diary with a personal lock"
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Create a password"
            visible={showPassword}
            toggleVisible={() => setShowPassword((p) => !p)}
            autoFocus
          />
          <button
            onClick={handleSetPassword}
            className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-3 rounded-lg font-semibold w-full 
            transition-all hover:opacity-90 hover:scale-[1.03] active:scale-95 shadow-lg shadow-purple-500/20 text-white"
          >
            Save & Unlock
          </button>
        </GlassPanel>
      </BackgroundWrapper>
    );
  }

  /* ---- Unlock Screen ---- */
  if (mode === "unlock") {
    return (
      <BackgroundWrapper>
        <GlassPanel
          title={
            <div className="flex items-center justify-center gap-3">
              <img
                src="/lock.png"
                alt="Lock Icon"
                className="w-8 h-8 opacity-90"
              />
              <span>Enter Password</span>
            </div>
          }
          subtitle="Unlock your private diary"
        >
          <PasswordInput
            value={input}
            onChange={setInput}
            placeholder="Enter your password"
            visible={showInput}
            toggleVisible={() => setShowInput((p) => !p)}
            autoFocus
          />
          <button
            onClick={handleUnlock}
            className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-3 rounded-lg font-semibold w-full
            transition-all hover:opacity-90 hover:scale-[1.03] active:scale-95 shadow-lg shadow-purple-500/20 mb-3 text-white"
          >
            Unlock
          </button>
          <button
            onClick={handleReset}
            className="text-sm text-zinc-700 hover:text-zinc-900 underline mt-2"
          >
            Reset Password
          </button>
        </GlassPanel>
      </BackgroundWrapper>
    );
  }
}
