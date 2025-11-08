"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../components/Diary.css";

export default function Diary({ selectedDate, onBack }) {
  const [entry, setEntry] = useState(null);
  const [bgGradient, setBgGradient] = useState("");
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  // ✅ Fetch entry
  useEffect(() => {
    if (!selectedDate) return;
    const fetchEntry = async () => {
      try {
        const res = await fetch(`/api/entries?date=${selectedDate}`);
        const data = await res.json();
        if (data) {
          if (data.files) {
            data.files = data.files.map((f) => {
              if (typeof f === "string") {
                const name = f.split("/").pop();
                const ext = name.split(".").pop();
                const type = ext === "mp4" ? "video/mp4" : `image/${ext}`;
                return { url: f, name, type };
              }
              return f;
            });
          }
          setEntry(data);
          setMoodBackground(data.mood);
        } else setEntry(null);
      } catch (err) {
        console.error("Error fetching entry:", err);
      }
    };
    fetchEntry();
  }, [selectedDate]);

  // 🌈 Mood-based gradient theme
  const setMoodBackground = (mood) => {
    const gradients = {
      "😊": "linear-gradient(135deg, #ffecd2, #fcb69f)",
      "😌": "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
      "😔": "linear-gradient(135deg, #d4fc79, #96e6a1)",
      "😤": "linear-gradient(135deg, #f5576c, #f093fb)",
      "💪": "linear-gradient(135deg, #43e97b, #38f9d7)",
      default: "linear-gradient(135deg, #dbe6f6, #c5796d)",
    };
    setBgGradient(gradients[mood] || gradients.default);
  };

  const renderFilePreview = (file) => {
    if (!file) return null;
    const isImage = file.type?.startsWith("image/");
    const isVideo = file.type?.startsWith("video/");

    if (isImage)
      return (
        <motion.img
          src={file.url}
          alt={file.name}
          className="file-tile image-tile"
          whileHover={{ scale: 1.06 }}
          onClick={() => setFullscreenMedia(file)}
        />
      );
    if (isVideo)
      return (
        <motion.video
          controls
          className="file-tile video-tile"
          whileHover={{ scale: 1.03 }}
          onClick={() => setFullscreenMedia(file)}
        >
          <source src={file.url} type={file.type} />
        </motion.video>
      );
    return (
      <motion.a
        href={file.url}
        download
        className="file-tile link-tile"
        whileHover={{ scale: 1.05 }}
      >
        📎 {file.name}
      </motion.a>
    );
  };

  return (
    <>
      <motion.div
        className="diary-container"
        style={{ background: bgGradient }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Floating particles */}
        <div className="diary-bg-blobs"></div>

        {/* Header */}
        <div className="diary-header">
          <motion.button
            className="back-btn-glass"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
          >
            ← Back
          </motion.button>
          <motion.h2
            className="diary-date-glow"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedDate}
          </motion.h2>
        </div>

        {/* Diary Content */}
        <motion.div
          className="diary-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {entry ? (
            <>
              <div className="note-top">
                <h3 className="note-title-glow">{entry.title || "Untitled Entry"}</h3>
                {entry.mood && <span className="mood-glow">{entry.mood}</span>}
              </div>

              <p className="note-content-modern">
                {entry.content || "No content written."}
              </p>

              {entry.files?.length > 0 && (
                <div className="file-grid">
                  {entry.files.map((file, i) => (
                    <motion.div key={i}>{renderFilePreview(file)}</motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="no-note-fancy">No entry found for this date.</p>
          )}
        </motion.div>
      </motion.div>

      {/* 🖼️ Fullscreen Media Modal */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            className="fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenMedia(null)}
          >
            <motion.div
              className="fullscreen-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-btn"
                onClick={() => setFullscreenMedia(null)}
              >
                ✕
              </button>
              {fullscreenMedia.type.startsWith("image/") ? (
                <img
                  src={fullscreenMedia.url}
                  alt={fullscreenMedia.name}
                  className="fullscreen-image"
                />
              ) : (
                <video
                  src={fullscreenMedia.url}
                  controls
                  autoPlay
                  className="fullscreen-video"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
