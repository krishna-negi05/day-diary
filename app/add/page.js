"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import toast from "react-hot-toast"; // ✅ Added toast

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function AddEntry() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [existingEntry, setExistingEntry] = useState(null);
  const [mode, setMode] = useState("");
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Load entry from Prisma API
  useEffect(() => {
    async function fetchEntry() {
      if (!selectedDate) return;
      try {
        const res = await fetch(`/api/entries?date=${selectedDate}`);
        if (!res.ok) throw new Error("Failed to fetch entry");

        const data = await res.json();
        if (data) {
          setExistingEntry(data);
          setTitle(data.title || "");
          setMood(data.mood || "");
          setContent(data.content || "");
          setFiles(data.files || []);
        } else {
          setExistingEntry(null);
          setTitle("");
          setMood("");
          setContent("");
          setFiles([]);
        }
      } catch {
        toast.error("❌ Failed to fetch entry");
      }
    }
    fetchEntry();
  }, [selectedDate]);

  // ✅ Handle file uploads (locally store base64 for now)
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const filePreviews = [];

    uploadedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        filePreviews.push({
          name: file.name,
          type: file.type,
          data: event.target.result,
        });
        if (filePreviews.length === uploadedFiles.length) {
          setFiles((prev) => [...prev, ...filePreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Save entry to Prisma through API — only toast modified
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedDate) return toast.error("Please select a date first!");

    try {
      setLoading(true);

      const payload = {
        date: selectedDate,
        title,
        mood,
        content,
        files,
      };

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save entry");

      toast.success("✅ Entry saved successfully!");
      router.push("/");
    } catch {
      toast.error("❌ Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset form when mode changes
  const resetForm = () => {
    if (existingEntry && mode === "edit") {
      setTitle(existingEntry.title || "");
      setMood(existingEntry.mood || "");
      setContent(existingEntry.content || "");
      setFiles(existingEntry.files || []);
    } else {
      setTitle("");
      setMood("");
      setContent("");
      setFiles([]);
    }
  };

  useEffect(() => {
    resetForm();
  }, [mode]);

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-[#101013] dark:to-[#1b1b1f] transition-all duration-500 p-6 relative">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b2b31] to-[#1c1c20] text-white text-sm tracking-wide hover:scale-[1.05] transition-all duration-200"
        >
          ← Back
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-gradient-to-br from-[#ffffffcc] to-[#e5e5e5cc] dark:from-[#1b1b1e] dark:to-[#131316] border border-zinc-300 dark:border-zinc-700 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-md rounded-2xl p-8"
      >
        <h1 className="text-2xl font-semibold text-center text-zinc-800 dark:text-zinc-100 mb-6">
          Choose a Date 📅
        </h1>

        {/* Date Picker */}
        <div className="mb-6">
          <label className="block text-zinc-700 dark:text-zinc-300 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setMode("");
            }}
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1c1c20] text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        {/* Mode selection */}
        {selectedDate && !mode && (
          <>
            {existingEntry ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-zinc-700 dark:text-zinc-300 text-center">
                  You already have an entry for <b>{selectedDate}</b>.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode("edit")}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:scale-[1.03] transition-transform"
                  >
                    ✏️ Edit Entry
                  </button>
                  <button
                    onClick={() => setMode("new")}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#2b2b31] to-[#1c1c20] text-white hover:scale-[1.03] transition-transform"
                  >
                    ➕ Create New (Replace)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">No entry found for this date.</p>
                <button
                  onClick={() => setMode("new")}
                  className="px-8 py-2 rounded-lg bg-gradient-to-r from-[#2b2b31] to-[#1c1c20] text-white hover:scale-[1.03] transition-transform"
                >
                  ➕ Add New Entry
                </button>
              </div>
            )}
          </>
        )}

        {/* Entry Form */}
        {mode && (
          <motion.form
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">
              {mode === "edit" ? "Edit Entry" : "New Entry"} for {selectedDate}
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-zinc-700 dark:text-zinc-300 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1c1c20] text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>

            {/* Mood */}
            <div className="mb-4">
              <label className="block text-zinc-700 dark:text-zinc-300 mb-2">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1c1c20] text-zinc-800 dark:text-zinc-100"
              >
                <option value="">Select mood</option>
                <option value="😊">😊</option>
                <option value="😌">😌</option>
                <option value="😔">😔</option>
                <option value="😤">😤</option>
                <option value="💪">💪</option>
              </select>
            </div>

            {/* Content */}
            <div className="mb-6 relative">
              <label className="block text-zinc-700 dark:text-zinc-300 mb-2">Your Thoughts</label>
              <div className="relative">
                <textarea
                  rows="8"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full max-h-80 overflow-y-auto p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1c1c20] text-zinc-800 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 bottom-3 text-xl hover:scale-110 transition-transform"
                >
                  😊
                </button>
              </div>
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                </div>
              )}
            </div>

            {/* Files */}
            <div className="mb-6">
              <label className="block text-zinc-700 dark:text-zinc-300 mb-2">Add Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="block w-full text-sm text-zinc-600 dark:text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-200 hover:file:bg-zinc-300 dark:hover:file:bg-zinc-700"
              />

              <div className="mt-4 flex flex-wrap gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 w-32 h-32 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 group"
                  >
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ✕
                    </button>

                    {file.type.startsWith("image/") ? (
                      <img src={file.url || file.data} alt={file.name} className="w-full h-full object-cover" />
                    ) : file.type.startsWith("video/") ? (
                      <video src={file.url || file.data} controls className="w-full h-full object-cover" />
                    ) : (
                      <p className="text-xs text-center text-zinc-500 p-2 truncate">{file.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#2b2b31] to-[#1c1c20] text-white font-semibold tracking-wide hover:scale-[1.03] transition-all duration-200"
              >
                {loading ? "Saving..." : "Save Entry"}
              </motion.button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
