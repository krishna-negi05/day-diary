"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, index: null });
  const [loading, setLoading] = useState(true);
  const longPressTimer = useRef(null);

  // ✅ Fetch from API
  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();

        const mediaArray = Array.isArray(data)
          ? data
          : Array.isArray(data.media)
          ? data.media
          : [];

        setMedia(mediaArray);
      } catch (err) {
        console.error("❌ Error fetching gallery:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, []);

  // ✅ Upload
  const handleAddMedia = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(async (file) => {
      const tempId = `${file.name}-${Date.now()}`;
      setMedia((prev) => [
        ...prev,
        {
          id: tempId,
          name: file.name,
          type: file.type,
          progress: 0,
          uploading: true,
        },
      ]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      try {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`
          );

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setMedia((prev) =>
                prev.map((m) =>
                  m.id === tempId ? { ...m, progress: percent } : m
                )
              );
            }
          });

          xhr.onload = async () => {
            if (xhr.status === 200) {
              const uploadData = JSON.parse(xhr.responseText);
              const res = await fetch("/api/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: file.name,
                  type: file.type,
                  url: uploadData.secure_url,
                }),
              });
              const saved = await res.json();
              const savedMedia = Array.isArray(saved)
                ? saved[0]
                : saved.media || saved;

              setMedia((prev) => [
                ...prev.filter((m) => m.id !== tempId),
                savedMedia,
              ]);

              resolve();
            } else reject(new Error("Upload failed"));
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      } catch (err) {
        console.error("❌ Upload failed:", err);
        setMedia((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, failed: true, uploading: false } : m
          )
        );
      }
    });
  };

  // ✅ Delete
  const handleDelete = async (index) => {
    const target = media[index];
    if (!target?.id) return;

    try {
      const res = await fetch(`/api/gallery/${target.id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (err) {
      console.error("❌ Error deleting media:", err);
    }
    setMenu({ visible: false, x: 0, y: 0, index: null });
  };

  // 🖱 Context menu & long press
  const startLongPress = (e, idx) => {
    const target = e.currentTarget;
    longPressTimer.current = setTimeout(() => {
      if (!target) return;
      if (navigator.vibrate) navigator.vibrate(50);
      const rect = target.getBoundingClientRect();
      setMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        index: idx,
      });
    }, 600);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e, idx) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      index: idx,
    });
    if (navigator.vibrate) navigator.vibrate(30);
  };

  // Close menu
  useEffect(() => {
    const closeMenu = () =>
      setMenu({ visible: false, x: 0, y: 0, index: null });
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // ✅ Skeleton
  const SkeletonCard = () => (
    <div className="relative overflow-hidden bg-[#1b1b1b] rounded-xl h-60 w-full animate-pulse" />
  );

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📸 My Gallery</h1>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-medium transition-all">
          ➕ Add Media
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleAddMedia}
            className="hidden"
          />
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : media.length === 0 ? (
        <p className="text-zinc-400 text-lg text-center mt-20">
          No media uploaded yet. Click “Add Media” to upload!
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {media.map((file, idx) => (
            <motion.div
              key={file.id || idx}
              layout
              className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer group"
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelectedMedia(file)}
              onContextMenu={(e) => handleContextMenu(e, idx)}
              onTouchStart={(e) => startLongPress(e, idx)}
              onTouchEnd={endLongPress}
            >
              {file?.type?.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className={`object-cover w-full h-60 transition-all duration-300 ${
                    file.uploading ? "opacity-70 blur-[1px]" : ""
                  }`}
                />
              ) : (
                <video
                  src={file.url}
                  className={`object-cover w-full h-60 transition-all duration-300 ${
                    file.uploading ? "opacity-70 blur-[1px]" : ""
                  }`}
                  muted
                />
              )}

              {/* ✅ Upload progress bar */}
              {file.uploading && (
                <div className="absolute bottom-0 left-0 w-full h-2 bg-zinc-800/70 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 via-lime-400 to-green-500 animate-pulse"
                    style={{ width: `${file.progress || 0}%` }}
                    transition={{ ease: "easeOut", duration: 0.3 }}
                  />
                  <span className="absolute right-2 bottom-3 text-xs text-green-300 font-semibold drop-shadow-md">
                    {file.progress}%
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {menu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bg-[#222]/90 backdrop-blur-lg text-white rounded-lg shadow-2xl z-50 p-2 w-40 border border-white/10"
            style={{
              top: `${menu.y}px`,
              left: `${menu.x}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              onClick={() => {
                setSelectedMedia(media[menu.index]);
                setMenu({ visible: false, x: 0, y: 0, index: null });
              }}
              className="block w-full text-left px-4 py-2 hover:bg-zinc-700 rounded-md"
            >
              👁 View
            </button>
            <button
              onClick={() => handleDelete(menu.index)}
              className="block w-full text-left px-4 py-2 hover:bg-red-600 rounded-md text-red-300 hover:text-white"
            >
              🗑 Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              className="max-w-[95vw] max-h-[90vh] flex justify-center items-center p-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia?.type?.startsWith("image/") ? (
                <img
                  src={selectedMedia?.url}
                  alt={selectedMedia?.name || "Image"}
                  className="max-h-[90vh] w-auto object-contain rounded-lg"
                />
              ) : selectedMedia?.url ? (
                <video
                  src={selectedMedia?.url}
                  controls
                  autoPlay
                  className="max-h-[90vh] w-auto rounded-lg"
                />
              ) : (
                <p className="text-center text-zinc-400">
                  ⚠️ Unable to preview this file.
                </p>
              )}
            </motion.div>

            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-6 right-6 bg-white/10 text-white text-2xl px-3 py-1 rounded-full hover:bg-white/20 transition-all"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
