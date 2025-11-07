"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Copy,
  Check,
  Trash2,
  Menu,
  RefreshCcw,
  Mic,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";

/**
 * ChatPage - client component
 *
 * Features:
 * - Uploads files (Cloudinary) and sends media URLs to /api/chat
 * - Abortable request (Stop button) using AbortController
 * - Typing animation with ability to stop mid-type
 * - Shows model name returned by API under assistant messages
 * - Mobile + button (non-overlapping with Send/Stop)
 * - Copy assistant messages, regenerate, file previews, sidebar
 *
 * Replace/verify:
 * - NEXT_PUBLIC_CLOUDINARY_* env variables for file upload
 * - /api/chat route should accept { messages: [...] } and return { reply, model }
 */

export default function ChatPage() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // "generating" state
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(null);

  const recognitionRef = useRef(null);
  const typingTimeout = useRef(null);
  const controllerRef = useRef(null);
  const containerRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // load chats once
  useEffect(() => {
    const saved = localStorage.getItem("nemoChats");
    const parsed = saved ? JSON.parse(saved) : [];
    setChats(parsed);
    if (parsed.length > 0) setActiveChatId(parsed[parsed.length - 1].id);
  }, []);

  // persist chats
  useEffect(() => {
    localStorage.setItem("nemoChats", JSON.stringify(chats));
  }, [chats]);

  // speech recognition (webkit)
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

  // scroll to bottom helper
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };
  useEffect(scrollToBottom, [activeChat?.messages]);

  // create new chat
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
    toast.success("All chats cleared");
  };

  // typing animation logic (types `reply` into the assistant's last message)
  const typeResponse = (reply, modelName) => {
    // ensure last message exists and is assistant placeholder
    clearTimeout(typingTimeout.current);
    setLoading(true);

    let i = 0;
    let stopped = false;

    const stopFn = () => {
      stopped = true;
      setLoading(false);
    };
    // expose stop globally to be used by Stop button or external call
    window.stopTypingResponse = stopFn;

    const typeNext = () => {
      if (stopped) return;
      i++;
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.map((m, idx, arr) =>
                  idx === arr.length - 1 && m.role === "assistant"
                    ? { ...m, content: reply.slice(0, i), model: modelName }
                    : m
                ),
              }
            : chat
        )
      );

      if (i < reply.length) {
        typingTimeout.current = setTimeout(typeNext, 18);
        scrollToBottom();
      } else {
        setLoading(false);
        scrollToBottom();
      }
    };

    typeNext();
  };

  // upload files to Cloudinary (returns array of { url, type })
  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return [];
    setUploading(true);

    const uploaded = [];
    try {
      await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
            { method: "POST", body: formData }
          );
          const data = await res.json();
          uploaded.push({ url: data.secure_url, type: file.type, name: file.name });
        })
      );
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return uploaded;
  };

  // send message (uploads files first, then calls /api/chat)
  const sendMessage = async (e, customPrompt = null) => {
    e?.preventDefault?.();
    if (!activeChat) return;

    if (!customPrompt && !input.trim() && selectedFiles.length === 0) return;

    const content = customPrompt ?? input.trim();
    const userMessage = { role: "user", content };

    // 1) upload files (if any)
    let uploadedMedia = [];
    if (selectedFiles.length > 0) {
      uploadedMedia = await uploadFiles(selectedFiles);
    }

    const fullUserMessage = { ...userMessage, media: uploadedMedia };

    // 2) append user message locally
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, fullUserMessage],
              title: chat.messages.length === 0 ? (content.slice(0, 25) + "...") : chat.title,
            }
          : chat
      )
    );

    setInput("");
    setSelectedFiles([]);
    setLoading(true);

    // add assistant placeholder message (empty content + model null)
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, { role: "assistant", content: "", model: null }] }
          : chat
      )
    );

    // create abort controller for this request
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...(activeChat.messages || []), fullUserMessage] }),
        signal,
      });

      const data = await res.json();
      const reply = data?.reply ?? "⚠️ No response from model.";
      const modelName = data?.model ?? "unknown";

      // start typing animation (this will update the last assistant placeholder)
      typeResponse(reply, modelName);
    } catch (err) {
      if (err.name === "AbortError") {
        toast("🛑 Generation stopped");
        // write partial message text if any or remove placeholder
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((m, idx, arr) =>
                    idx === arr.length - 1 && m.role === "assistant" ? { ...m, content: "— generation stopped —" } : m
                  ),
                }
              : chat
          )
        );
      } else {
        console.error("Chat send error", err);
        toast.error("Server error");
        // mark assistant placeholder as error
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((m, idx, arr) =>
                    idx === arr.length - 1 && m.role === "assistant"
                      ? { ...m, content: "🚫 Something went wrong." }
                      : m
                  ),
                }
              : chat
          )
        );
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  // Stop generation immediately
  const handleStop = () => {
    controllerRef.current?.abort();
    clearTimeout(typingTimeout.current);
    setLoading(false);
    toast("🛑 Stopped");
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
    const lastUser =
      activeChat?.messages?.slice().reverse().find((m) => m.role === "user")?.content || "";
    if (lastUser) sendMessage(null, lastUser);
  };

  // file preview removal
  const removeSelectedFile = (index) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
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

      {/* Mobile new chat + button (bottom-left) */}
      <motion.button
        onClick={createNewChat}
        whileTap={{ scale: 0.95 }}
        title="New Chat"
        className="fixed bottom-6 left-4 z-40 md:hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full p-3 shadow-lg"
        style={{ boxShadow: "0 8px 30px rgba(37,99,235,0.25)", cursor: "pointer" }}
      >
        <Plus size={22} />
      </motion.button>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-4 left-4 md:hidden z-20 bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/10 transition-all"
      >
        <Menu size={18} />
      </button>

      {/* Chat area */}
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
            handleCopy={handleCopy}
            copiedMsg={copiedMsg}
            containerRef={containerRef}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            removeSelectedFile={removeSelectedFile}
            uploading={uploading}
            handleStop={handleStop}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-lg italic text-center px-4">
            Tap the <strong className="text-white">＋</strong> icon to start chatting 🚀
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
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
                className={`rounded-lg cursor-pointer transition-all ${isActive ? "bg-blue-700/40 border border-blue-500/40" : "hover:bg-white/10"}`}
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
                    title="Delete chat"
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
          <button onClick={clearAllChats} className="flex items-center justify-center gap-2 w-full text-red-400 text-sm hover:text-red-500 transition-all">
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      )}
    </>
  );
}

/* ---------------- Chat Window ---------------- */
function ChatWindow({
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
  containerRef,
  selectedFiles,
  setSelectedFiles,
  removeSelectedFile,
  uploading,
  handleStop,
}) {
  const promptTemplates = [
    "Summarize the last conversation 🧠",
    "Explain in simpler terms 🧩",
    "Make it sound polite 💬",
    "List key takeaways 📋",
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col justify-between h-full max-w-4xl mx-auto w-full">
      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
        {activeChat.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <img src="/icons/robot.png" alt="assistant" className="w-8 h-8 rounded-full border border-white/10" />
            )}

            <div className={`p-4 rounded-2xl max-w-[75%] leading-relaxed ${msg.role === "user" ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white" : "bg-white/10 border border-white/20 text-white backdrop-blur-lg"}`}>
              {/* content */}
              <ReactMarkdown
                children={msg.content || ""}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter {...props} style={oneDark} language={match[1]} PreTag="div">
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-black/30 px-1 py-0.5 rounded">{children}</code>
                    );
                  },
                }}
              />

              {/* media inside message (if any) */}
              {msg.media?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {msg.media.map((m, idx) =>
                    m.type?.startsWith("image/") ? (
                      <img key={idx} src={m.url} alt={m.name || "image"} className="w-28 h-28 object-cover rounded-md border border-white/10" />
                    ) : (
                      <a key={idx} href={m.url} target="_blank" rel="noreferrer" className="text-sm underline text-blue-300">
                        📎 {m.name || m.url.split("/").pop()}
                      </a>
                    )
                  )}
                </div>
              )}

              {/* model badge for assistant messages */}
              {msg.role === "assistant" && msg.model && (
                <div className="mt-2 text-xs text-zinc-300 flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-black/30 text-xs">Model: {shortModel(msg.model)}</span>
                </div>
              )}

              {/* assistant copy button */}
              {msg.role === "assistant" && (
                <button onClick={() => handleCopy(msg.content || "", i)} className="mt-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition">
                  {copiedMsg === i ? <Check size={14} /> : <Copy size={14} />} {copiedMsg === i ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {msg.role === "user" && <img src="/icons/profile.jpg" alt="user" className="w-8 h-8 rounded-full border border-white/10" />}
          </div>
        ))}
      </div>

      {/* prompt templates */}
      <div className="flex flex-wrap gap-2 px-6 py-2 border-t border-white/10 overflow-x-auto">
        {promptTemplates.map((p) => (
          <button key={p} onClick={(e) => sendMessage(e, p)} className="bg-white/10 hover:bg-white/20 text-sm px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
            {p}
          </button>
        ))}
      </div>

      {/* Selected file previews */}
      {selectedFiles.length > 0 && (
        <div className="px-6 pb-2 flex gap-3 flex-wrap">
          {selectedFiles.map((file, i) => (
            <div key={i} className="relative bg-white/6 border border-white/10 rounded-lg p-2 w-[100px]">
              {file.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-20 object-cover rounded-md" />
              ) : (
                <div className="h-20 flex items-center justify-center text-xs text-zinc-300">{file.name}</div>
              )}
              <button onClick={() => removeSelectedFile(i)} className="absolute -top-2 -right-2 bg-black/50 rounded-full p-1 text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* input area - uses flex-wrap to avoid overlap on small screens */}
      <form onSubmit={sendMessage} className="flex flex-wrap md:flex-nowrap items-center gap-2 px-6 py-3 border-t border-white/10 bg-[#0f0f0f]/60">
        <label className="cursor-pointer p-2 rounded-full hover:bg-white/10 transition-all">
          📎
          <input type="file" multiple accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
        </label>

        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type your message..."} className="flex-1 px-4 py-2 bg-transparent text-white placeholder-gray-400 outline-none min-w-[140px]" />

        <button type="button" onClick={handleMicClick} className={`p-2 rounded-full border ${isListening ? "border-red-400 bg-red-500/20 animate-pulse" : "border-zinc-500 hover:bg-white/10"} transition-all`} title="Speak">
          <Mic size={18} />
        </button>

        {/* Show Stop (when loading) or Send */}
        {loading ? (
          <button type="button" onClick={handleStop} className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full font-semibold">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={uploading} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full font-semibold">
            {uploading ? "Uploading..." : "Send"}
          </button>
        )}
      </form>
    </motion.div>
  );
}

/* ---------------- helpers ---------------- */
function shortModel(model) {
  if (!model) return "unknown";
  // show concise model name
  if (model.includes("deepseek")) return "DeepSeek";
  if (model.includes("qwen")) return "Qwen";
  if (model.includes("gemini")) return "Gemini";
  return model.split("/").pop?.() ?? model;
}
