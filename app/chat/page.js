"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Clock, X, Menu, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function ChatPage() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const recognitionRef = useRef(null);
  const typingTimeout = useRef(null);
  const containerRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // 🧠 Load chats
  useEffect(() => {
    const saved = localStorage.getItem("nemoChats");
    const parsed = saved ? JSON.parse(saved) : [];
    setChats(parsed);
    if (parsed.length > 0) setActiveChatId(parsed[parsed.length - 1].id);
  }, []);

  // 💾 Persist chats
  useEffect(() => {
    localStorage.setItem("nemoChats", JSON.stringify(chats));
  }, [chats]);

  // 🎙️ Speech recognition setup
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (e) => setInput(e.results[0][0].transcript);
      recognitionRef.current = recognition;
    }
  }, []);

  // 🧭 Smart scroll lock detection
  useEffect(() => {
    const container = containerRef.current;
    const handleScroll = () => {
      const isAtBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 100;
      setAutoScroll(isAtBottom);
    };
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // ✨ Create new chat
  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      timestamp: new Date().toLocaleString(),
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChat.id);
    setSidebarOpen(false);
  };

  // ❌ Delete single chat
  const deleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeChatId) setActiveChatId(null);
  };

  // 🗑️ Clear all chats
  const clearAllChats = () => {
    setChats([]);
    localStorage.removeItem("nemoChats");
    setActiveChatId(null);
    toast.success("All chats cleared 🧹");
  };

  // 🚀 Send message
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeChat) return;

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    const userMessage = { role: "user", content: input };
    const updatedChats = chats.map((chat) =>
      chat.id === activeChatId
        ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            title:
              chat.messages.length === 0
                ? input.slice(0, 25) + "..."
                : chat.title,
          }
        : chat
    );
    setChats(updatedChats);
    setInput("");
    setLoading(true);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...activeChat.messages, userMessage],
        }),
      });

      const data = await res.json();
      const reply = data.reply || "⚠️ No response from Gemini.";

      // Empty assistant message for typing
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [...chat.messages, { role: "assistant", content: "" }],
              }
            : chat
        )
      );

      setTimeout(scrollToBottom, 150);

      let typedText = "";
      let isStopped = false;

      const stopTyping = () => {
        isStopped = true;
        clearTimeout(typingTimeout.current);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      };

      window.stopTypingResponse = stopTyping;

      const typeChar = (i = 0) => {
        if (i < reply.length && !isStopped) {
          typedText += reply[i];
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChatId
                ? {
                    ...chat,
                    messages: chat.messages.map((m, idx, arr) =>
                      idx === arr.length - 1 && m.role === "assistant"
                        ? { ...m, content: typedText }
                        : m
                    ),
                  }
                : chat
            )
          );
          scrollToBottom();
          typingTimeout.current = setTimeout(() => typeChar(i + 1), 25);
        } else {
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      };
      typeChar();
    } catch (err) {
      console.error("❌ Chat error:", err);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "assistant", content: "🚫 Something went wrong." },
                ],
              }
            : chat
        )
      );
      setLoading(false);
    }
  };

  // 🔁 Regenerate response
  const regenerateResponse = () => {
    const lastUser =
      activeChat?.messages
        ?.slice()
        .reverse()
        .find((m) => m.role === "user")?.content || "";
    if (lastUser) {
      setInput(lastUser);
      sendMessage();
    }
  };

  // 🎤 Mic
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("🎤 Speech recognition not supported.");
      return;
    }
    isListening
      ? recognitionRef.current.stop()
      : recognitionRef.current.start();
  };

  // Sidebar animation variants
  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-[#090909] to-[#141414] text-white overflow-hidden relative">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex w-64 bg-white/10 backdrop-blur-xl border-r border-white/10 flex-col">
        <SidebarContent
          chats={chats}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          createNewChat={createNewChat}
          deleteChat={deleteChat}
          clearAllChats={clearAllChats}
        />
      </div>

      {/* Sidebar (mobile overlay) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 w-64 bg-white/10 backdrop-blur-xl border-r border-white/10 flex flex-col z-40"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: "tween", duration: 0.3 }}
            >
              <SidebarContent
                chats={chats}
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
                createNewChat={createNewChat}
                deleteChat={deleteChat}
                clearAllChats={clearAllChats}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-4 left-4 md:hidden z-20 bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/10 transition-all"
      >
        <Menu size={18} />
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full md:ml-0">
        {activeChat ? (
          <ChatWindow
            activeChat={activeChat}
            loading={loading}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            regenerateResponse={regenerateResponse}
            handleMicClick={handleMicClick}
            isListening={isListening}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-lg italic">
            Click <strong>“New Chat”</strong> to begin 🚀
          </div>
        )}
      </div>
    </div>
  );
}

// 📦 Sidebar Component
function SidebarContent({
  chats,
  activeChatId,
  setActiveChatId,
  createNewChat,
  deleteChat,
  clearAllChats,
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🤖 NEMO</h2>
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 bg-blue-600/80 hover:bg-blue-700 transition-all rounded-lg px-3 py-2 mb-4 font-semibold w-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
        >
          <Plus size={18} /> New Chat
        </button>
        <div className="space-y-2 pr-1 custom-scrollbar">
          {chats.length === 0 && (
            <p className="text-sm text-zinc-400 italic">No history yet</p>
          )}
          {chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <motion.div
                key={chat.id}
                className={`relative rounded-lg cursor-pointer group transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-700/40 to-indigo-700/20 border border-blue-500/40 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    : "hover:bg-white/10"
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div
                  className={`absolute left-0 top-0 h-full w-[3px] rounded-r-full transition-all ${
                    isActive
                      ? "bg-gradient-to-b from-blue-400 to-indigo-500 opacity-100"
                      : "opacity-0 group-hover:opacity-60 bg-gradient-to-b from-zinc-500 to-zinc-600"
                  }`}
                />
                <div className="relative p-3 pl-4 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="truncate text-sm font-medium">
                      {chat.title || "Untitled Chat"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{chat.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Clock size={14} className="text-zinc-400" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="text-red-400 hover:text-red-500 bg-black/40 rounded-full p-[2px] transition-all hover:scale-110"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      {chats.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={clearAllChats}
            className="flex items-center justify-center gap-2 w-full text-red-400 text-sm hover:text-red-500 transition-all"
          >
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      )}
    </>
  );
}

// 💬 Chat Window Component
function ChatWindow({
  activeChat,
  loading,
  input,
  setInput,
  sendMessage,
  regenerateResponse,
  handleMicClick,
  isListening,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col justify-between h-full max-w-4xl mx-auto w-full"
    >
      <div
        id="chatContainer"
        ref={(ref) => (window.chatContainerRef = ref)}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar"
      >
        {activeChat.messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-3 max-w-[75%] rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  : "bg-white/10 border border-white/20 text-white backdrop-blur-lg shadow-[0_0_8px_rgba(147,197,253,0.15)]"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" &&
                i === activeChat.messages.length - 1 &&
                loading && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block ml-[1px] text-blue-400"
                  >
                    ▌
                  </motion.span>
                )}

              {msg.role === "assistant" &&
                i === activeChat.messages.length - 1 &&
                !loading && (
                  <button
                    onClick={regenerateResponse}
                    className="flex items-center gap-1 text-xs text-blue-400 mt-1 hover:text-blue-300 transition-all"
                  >
                    <RefreshCcw size={12} /> Regenerate
                  </button>
                )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-[#1a1a1e]/60 backdrop-blur-md px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            className="flex-1 px-4 py-2 bg-transparent text-white placeholder-gray-400 outline-none"
          />
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-2 rounded-full border ${
              isListening
                ? "border-red-400 bg-red-500/20 animate-pulse"
                : "border-zinc-500 hover:bg-white/10"
            } transition-all flex items-center justify-center w-10 h-10`}
            title="Speak"
          >
            <img
              src="/icons/mic.png"
              alt="Mic"
              className={`w-5 h-5 ${isListening ? "opacity-50" : "opacity-100"}`}
            />
          </button>

          {loading ? (
            <button
              type="button"
              onClick={() =>
                window.stopTypingResponse && window.stopTypingResponse()
              }
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full font-semibold hover:scale-105 transition-all"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full font-semibold hover:scale-110 hover:shadow-[0_0_10px_rgba(99,102,241,0.4)] transition-all"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </motion.div>
  );
}
