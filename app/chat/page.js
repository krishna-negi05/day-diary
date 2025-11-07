"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Copy, Check, Trash2, Menu, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";

export default function ChatPage() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(null);
  const recognitionRef = useRef(null);
  const typingTimeout = useRef(null);
  const containerRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    const saved = localStorage.getItem("nemoChats");
    const parsed = saved ? JSON.parse(saved) : [];
    setChats(parsed);
    if (parsed.length > 0) setActiveChatId(parsed[parsed.length - 1].id);
  }, []);

  useEffect(() => {
    localStorage.setItem("nemoChats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (e) => setInput(e.results[0][0].transcript);
      recognitionRef.current = recognition;
    }
  }, []);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };
  useEffect(scrollToBottom, [activeChat?.messages]);

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

  const deleteChat = (id) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeChatId) setActiveChatId(null);
  };

  const clearAllChats = () => {
    setChats([]);
    localStorage.removeItem("nemoChats");
    setActiveChatId(null);
    toast.success("All chats cleared 🧹");
  };

  const sendMessage = async (e, customPrompt = null) => {
    e?.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0 && !customPrompt) || !activeChat) return;

    const content = customPrompt || input.trim();
    const userMessage = { role: "user", content };
    let uploadedMedia = [];

    if (selectedFiles.length > 0) {
      setUploading(true);
      try {
        uploadedMedia = await Promise.all(
          selectedFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
            const res = await fetch(
              `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
              { method: "POST", body: formData }
            );
            const data = await res.json();
            return { url: data.secure_url, type: file.type };
          })
        );
      } catch {
        toast.error("Upload failed");
      }
      setUploading(false);
    }

    const fullUserMessage = { ...userMessage, media: uploadedMedia };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, fullUserMessage],
              title: chat.messages.length === 0 ? content.slice(0, 25) + "..." : chat.title,
            }
          : chat
      )
    );

    setInput("");
    setSelectedFiles([]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...activeChat.messages, fullUserMessage] }),
      });
      const data = await res.json();
      const reply = data.reply || "⚠️ No response from Gemini.";

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, { role: "assistant", content: "" }] }
            : chat
        )
      );

      let typed = "";
      let stopped = false;
      const stopTyping = () => {
        stopped = true;
        clearTimeout(typingTimeout.current);
        setLoading(false);
      };
      window.stopTypingResponse = stopTyping;

      const typeNext = (i = 0) => {
        if (i < reply.length && !stopped) {
          typed += reply[i];
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChatId
                ? {
                    ...chat,
                    messages: chat.messages.map((m, idx, arr) =>
                      idx === arr.length - 1 && m.role === "assistant"
                        ? { ...m, content: typed }
                        : m
                    ),
                  }
                : chat
            )
          );
          scrollToBottom();
          typingTimeout.current = setTimeout(() => typeNext(i + 1), 15);
        } else {
          setLoading(false);
          scrollToBottom();
        }
      };
      typeNext();
    } catch {
      toast.error("Server error");
      setLoading(false);
    }
  };

  const handleCopy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopiedMsg(i);
    toast.success("Copied!");
    setTimeout(() => setCopiedMsg(null), 1500);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return alert("🎤 Speech recognition not supported.");
    isListening ? recognitionRef.current.stop() : recognitionRef.current.start();
  };

  const regenerateResponse = () => {
    const lastUser = activeChat?.messages.slice().reverse().find((m) => m.role === "user")?.content;
    if (lastUser) sendMessage({ preventDefault: () => {} }, lastUser);
  };

  const promptTemplates = [
    "Summarize the last conversation 🧠",
    "Explain in simpler terms 🧩",
    "Make it sound polite 💬",
    "List key takeaways 📋",
  ];

  const sidebarVariants = { hidden: { x: "-100%" }, visible: { x: 0 } };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-[#090909] to-[#141414] text-white overflow-hidden relative">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex w-64 bg-white/10 backdrop-blur-xl border-r border-white/10 flex-col">
        <SidebarContent {...{ chats, activeChatId, setActiveChatId, createNewChat, deleteChat, clearAllChats }} />
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
              <SidebarContent {...{ chats, activeChatId, setActiveChatId, createNewChat, deleteChat, clearAllChats }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating new chat button (mobile) */}
      <motion.button
        onClick={createNewChat}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-5 z-40 md:hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] p-4 hover:scale-110 active:scale-95 transition-all duration-300"
        title="New Chat"
      >
        <Plus size={26} />
      </motion.button>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-4 left-4 md:hidden z-20 bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/10 transition-all"
      >
        <Menu size={18} />
      </button>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col h-full md:ml-0">
        {activeChat ? (
          <ChatWindow
            {...{
              activeChat,
              loading,
              input,
              setInput,
              sendMessage,
              regenerateResponse,
              handleMicClick,
              isListening,
              handleCopy,
              copiedMsg,
              selectedFiles,
              setSelectedFiles,
              uploading,
              promptTemplates,
            }}
            containerRef={containerRef}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-lg italic text-center px-4">
            Tap the <strong className="text-white">“＋”</strong> icon to start chatting 🚀
          </div>
        )}
      </div>
    </div>
  );
}

/* -------- Sidebar -------- */
function SidebarContent({ chats, activeChatId, setActiveChatId, createNewChat, deleteChat, clearAllChats }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xl font-bold mb-4">🤖 NEMO</h2>
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 bg-blue-600/80 hover:bg-blue-700 transition-all rounded-lg px-3 py-2 mb-4 font-semibold w-full"
        >
          <Plus size={18} /> New Chat
        </button>
        <div className="space-y-2 pr-1">
          {chats.length === 0 && <p className="text-sm text-zinc-400 italic">No history yet</p>}
          {chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <motion.div
                key={chat.id}
                className={`rounded-lg cursor-pointer transition-all ${
                  isActive ? "bg-blue-700/40 border border-blue-500/40" : "hover:bg-white/10"
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="truncate text-sm font-medium">{chat.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">{chat.timestamp}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="text-red-400 hover:text-red-500 transition-all"
                  >
                    <X size={12} />
                  </button>
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

/* -------- Chat Window -------- */
function ChatWindow({
  activeChat,
  input,
  setInput,
  sendMessage,
  regenerateResponse,
  handleMicClick,
  isListening,
  handleCopy,
  copiedMsg,
  containerRef,
  selectedFiles,
  setSelectedFiles,
  uploading,
  loading,
  promptTemplates,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col justify-between h-full max-w-4xl mx-auto w-full"
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar"
      >
        {activeChat.messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <img
                src="/icons/robot.png"
                alt="assistant"
                className="w-8 h-8 rounded-full border border-white/10"
              />
            )}
            <div
              className={`p-4 rounded-2xl max-w-[75%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                  : "bg-white/10 border border-white/20 text-white backdrop-blur-lg"
              }`}
            >
              <ReactMarkdown
                children={msg.content}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-black/30 px-1 py-0.5 rounded">
                        {children}
                      </code>
                    );
                  },
                }}
              />

              {msg.role === "assistant" && (
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="mt-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
                >
                  {copiedMsg === i ? <Check size={14} /> : <Copy size={14} />}
                  {copiedMsg === i ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <img
                src="/icons/profile.jpg"
                alt="user"
                className="w-8 h-8 rounded-full border border-white/10"
              />
            )}
          </div>
        ))}
      </div>

      {/* Prompt Templates */}
      <div className="flex flex-wrap gap-2 px-6 py-2 border-t border-white/10 overflow-x-auto">
        {promptTemplates.map((p) => (
          <button
            key={p}
            onClick={(e) => sendMessage(e, p)}
            className="bg-white/10 hover:bg-white/20 text-sm px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Section (non-overlapping layout) */}
      <form
        onSubmit={sendMessage}
        className="flex flex-wrap md:flex-nowrap items-center gap-2 px-6 py-3 border-t border-white/10 bg-[#0f0f0f]/60"
      >
        <label className="cursor-pointer p-2 rounded-full hover:bg-white/10 transition-all">
          📎
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*,application/pdf"
            className="hidden"
            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
          />
        </label>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          className="flex-1 px-4 py-2 bg-transparent text-white placeholder-gray-400 outline-none min-w-[150px]"
        />

        <button
          type="button"
          onClick={handleMicClick}
          className={`p-2 rounded-full border flex-shrink-0 ${
            isListening
              ? "border-red-400 bg-red-500/20 animate-pulse"
              : "border-zinc-500 hover:bg-white/10"
          } transition-all`}
        >
          🎤
        </button>

        {loading ? (
          <button
            type="button"
            onClick={() => window.stopTypingResponse && window.stopTypingResponse()}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full font-semibold flex-shrink-0 hover:scale-105 transition-all"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={uploading}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full font-semibold flex-shrink-0 hover:scale-110 transition-all"
          >
            {uploading ? "Uploading..." : "Send"}
          </button>
        )}
      </form>
    </motion.div>
  );
}
