"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, index: null });
  const longPressTimer = useRef(null);

  // ✅ Load from Prisma API
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        setMedia(data);
      } catch (err) {
        console.error("❌ Error fetching media:", err);
      }
    };
    fetchMedia();
  }, []);

  // ✅ Upload file with progress tracking
  const handleAddMedia = async (e) => {
    const files = Array.from(e.target.files);

    files.forEach(async (file) => {
      const tempId = `${file.name}-${Date.now()}`;
      setMedia((prev) => [
        ...prev,
        { id: tempId, name: file.name, type: file.type, progress: 0, uploading: true },
      ]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

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
              setMedia((prev) =>
                prev.map((m) =>
                  m.id === tempId
                    ? { ...saved, uploading: false, progress: 100 }
                    : m
                )
              );
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

  // ✅ Delete from Prisma
  const handleDelete = async (index) => {
    const target = media[index];
    if (!target || !target.id) return;

    try {
      const res = await fetch(`/api/gallery/${target.id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia((prev) => prev.filter((_, i) => i !== index));
      } else {
        console.error("❌ Failed to delete:", res.statusText);
      }
    } catch (err) {
      console.error("❌ Error deleting media:", err);
    }
    setMenu({ visible: false, x: 0, y: 0, index: null });
  };

  // 🖱 Context Menu & Long Press (with haptic feedback)
  const startLongPress = (e, idx) => {
  const target = e.currentTarget;

  longPressTimer.current = setTimeout(() => {
    // Ensure the target still exists in DOM
    if (!target) return;

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    // Safely get the element position
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
  // Cancel long press safely
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

    // Optional: haptic feedback on desktop touchpads that support it (Safari / Chrome)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setMenu({ visible: false, x: 0, y: 0, index: null });
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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

      {media.length === 0 ? (
        <p className="text-zinc-400 text-lg text-center mt-20">
          No media uploaded yet. Click “Add Media” to upload!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map((file, idx) => (
            <motion.div
              key={file.id || idx}
              className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer group"
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelectedMedia(file)}
              onContextMenu={(e) => handleContextMenu(e, idx)}
              onTouchStart={(e) => startLongPress(e, idx)}
              onTouchEnd={endLongPress}
            >
              {file.type?.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className={`object-cover w-full h-60 transition-all duration-300 ${
                    file.uploading ? "opacity-70" : ""
                  }`}
                />
              ) : (
                <video
                  src={file.url}
                  className={`object-cover w-full h-60 transition-all duration-300 ${
                    file.uploading ? "opacity-70" : ""
                  }`}
                  muted
                />
              )}

              {/* ✅ Upload Progress Bar */}
              {file.uploading && (
                <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-700">
                  <div
                    className="h-2 bg-green-500 transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                  <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white">
                    {file.progress}%
                  </span>
                </div>
              )}

              {/* ❌ Failed Upload */}
              {file.failed && (
                <div className="absolute bottom-0 left-0 w-full bg-red-600 text-xs text-center text-white py-1">
                  ❌ Upload Failed
                </div>
              )}
            </motion.div>
          ))}
        </div>
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
              className="max-w-4xl max-h-[85vh] p-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type.startsWith("image/") ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="w-full h-auto rounded-lg"
                />
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
