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

  // ✅ Upload file to Cloudinary
  const handleAddMedia = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
          { method: "POST", body: formData }
        );

        const uploadData = await uploadRes.json();
        if (!uploadData.secure_url) throw new Error("Upload failed");

        const newMedia = {
          name: file.name,
          type: file.type,
          url: uploadData.secure_url,
        };

        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMedia),
        });

        const saved = await res.json();
        setMedia((prev) => [...prev, saved]);
      } catch (err) {
        console.error("❌ Upload failed:", err);
      }
    }
  };

  // ✅ Delete from Prisma
  const handleDelete = async (index) => {
  const target = media[index];

  if (!target || !target.id) {
    console.error("❌ No valid ID found for:", target);
    return;
  }

  try {
    console.log("🗑 Deleting ID:", target.id);

    const res = await fetch(`/api/gallery/${target.id}`, { method: "DELETE" });
    const result = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to delete media:", result.error || res.statusText);
      return;
    }

    // ✅ Remove from state only after successful deletion
    setMedia((prev) => prev.filter((_, i) => i !== index));
    console.log("✅ Media deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting media:", err);
  }
};


  // 🖱 Context Menu & Long Press
  const startLongPress = (e, idx) => {
    longPressTimer.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        index: idx,
      });
    }, 600);
  };
  const endLongPress = () => clearTimeout(longPressTimer.current);

  const handleContextMenu = (e, idx) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      index: idx,
    });
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
              {file.type.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="object-cover w-full h-60 transition-all duration-300 hover:brightness-75"
                />
              ) : (
                <video
                  src={file.url}
                  className="object-cover w-full h-60 transition-all duration-300 hover:brightness-75"
                  muted
                />
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
