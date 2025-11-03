"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebase"; // ✅ Make sure your firebase.js exports db
import { doc, getDoc } from "firebase/firestore";
import "../components/Diary.css";

export default function Diary({ selectedDate, onBack }) {
  const [entry, setEntry] = useState(null);
  const [bgGradient, setBgGradient] = useState("linear-gradient(135deg, #ece9e6, #ffffff)");
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  // ✅ Load from Firestore instead of localStorage
  useEffect(() => {
    if (!selectedDate) return;

    const fetchEntry = async () => {
      try {
        const ref = doc(db, "diaryEntries", selectedDate);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setEntry(snap.data());
          setMoodBackground(snap.data().mood);
        } else {
          setEntry(null);
          setMoodBackground(null);
        }
      } catch (err) {
        console.error("Error fetching diary entry:", err);
      }
    };

    fetchEntry();
  }, [selectedDate]);

  // 🌈 Mood → Gradient
  const setMoodBackground = (mood) => {
    if (!mood) {
      setBgGradient("linear-gradient(135deg, #ece9e6, #ffffff)");
      return;
    }
    const emoji = mood.split(" ")[0];
    switch (emoji) {
      case "😊":
        setBgGradient("linear-gradient(135deg, #fff86b, #ffe66d, #ffd93d)");
        break;
      case "😌":
        setBgGradient("linear-gradient(135deg, #b2f7ef, #a0e7e5, #cbf3f0)");
        break;
      case "😔":
        setBgGradient("linear-gradient(135deg, #89a7d4, #cfd9df, #e2ebf0)");
        break;
      case "😤":
        setBgGradient("linear-gradient(135deg, #ff7b7b, #ffb3b3, #ff9999)");
        break;
      case "💪":
        setBgGradient("linear-gradient(135deg, #7effa0, #a1ffce, #faffd1)");
        break;
      default:
        setBgGradient("linear-gradient(135deg, #ece9e6, #ffffff)");
    }
  };

  // 🎨 Render file previews (Firebase URLs)
  const renderFilePreview = (file) => {
    if (!file) return null;
    const isImage = file.type?.startsWith("image/");
    const isVideo = file.type?.startsWith("video/");

    if (isImage) {
      return (
        <motion.img
          src={file.url}
          alt={file.name}
          className="rounded-xl shadow-md object-cover w-full h-56 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          onClick={() => setFullscreenMedia(file)}
        />
      );
    } else if (isVideo) {
      return (
        <motion.video
          controls
          className="rounded-xl shadow-md w-full h-56 border border-zinc-200 dark:border-zinc-700 object-cover cursor-pointer"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
          onClick={() => setFullscreenMedia(file)}
        >
          <source src={file.url} type={file.type} />
        </motion.video>
      );
    } else {
      return (
        <motion.a
          href={file.url}
          download={file.name}
          className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg p-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 shadow-sm"
          whileHover={{ scale: 1.02 }}
        >
          📎 {file.name}
        </motion.a>
      );
    }
  };

  return (
    <>
      <motion.div
        className="diary-container"
        style={{ background: bgGradient }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="diary-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h2 className="diary-date">{selectedDate}</h2>
        </div>

        <div className="diary-body">
          {entry ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="note-display"
            >
              <div className="note-top">
                <h3 className="note-title">{entry.title || "Untitled Entry"}</h3>
                {entry.mood && <span className="mood-emoji-large">{entry.mood.split(" ")[0]}</span>}
              </div>

              <p className="note-content whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-100">
                {entry.content || "No content written."}
              </p>

              {/* 🌟 Attached Files */}
              {entry.files && entry.files.length > 0 && (
                <div className="mt-9">
                  <h4 className="font-roboto text-zinc-900 dark:text-zinc-900 text-md mb-3">
                    Attached Files :
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entry.files.map((file, idx) => (
                      <motion.div key={idx}>{renderFilePreview(file)}</motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <p className="no-note text-zinc-700 dark:text-zinc-300">No entry for this date yet.</p>
          )}
        </div>
      </motion.div>

      {/* 🖼️ Fullscreen Media Modal */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenMedia(null)}
          >
            <motion.div
              className="relative max-w-5xl max-h-[90vh] w-full flex justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/50 rounded-full px-3 py-1 hover:bg-black/70"
                onClick={() => setFullscreenMedia(null)}
              >
                ✕
              </button>

              {fullscreenMedia.type.startsWith("image/") ? (
                <img
                  src={fullscreenMedia.url}
                  alt={fullscreenMedia.name}
                  className="max-h-[85vh] rounded-lg shadow-lg object-contain"
                />
              ) : (
                <video
                  src={fullscreenMedia.url}
                  controls
                  autoPlay
                  className="max-h-[85vh] rounded-lg shadow-lg"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
