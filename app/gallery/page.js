"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, index: null });
  const longPressTimer = useRef(null);

  // 🧠 Load from Firestore
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "galleryMedia"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMedia(data);
        console.log("✅ Loaded from Firestore:", data);
      } catch (err) {
        console.error("❌ Error fetching media:", err);
      }
    };

    fetchMedia();
  }, []);

  // 📤 Upload to Firebase Storage
  const handleAddMedia = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);

      try {
        // Upload file
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Save metadata to Firestore
        const newMedia = {
          name: file.name,
          type: file.type,
          url,
          addedAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "galleryMedia"), newMedia);

        // Update UI
        setMedia((prev) => [...prev, { id: docRef.id, ...newMedia }]);
        console.log("✅ Uploaded:", newMedia);
      } catch (err) {
        console.error("❌ Upload failed:", err);
      }
    }
  };

  // 🗑 Delete media from Firebase
  const handleDelete = async (index) => {
    const target = media[index];
    if (!target) return;

    try {
      // Delete from Storage
      const fileRef = ref(storage, target.url);
      await deleteObject(fileRef).catch(() => console.warn("File not found in storage"));

      // Delete from Firestore
      await deleteDoc(doc(db, "galleryMedia", target.id));

      // Update local state
      setMedia((prev) => prev.filter((_, i) => i !== index));
      console.log("🗑 Deleted:", target.name);
    } catch (err) {
      console.error("❌ Error deleting media:", err);
    }

    setMenu({ visible: false, x: 0, y: 0, index: null });
  };

  // 📱 Long press for mobile
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

  // 🖱 Right-click menu
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
    const handleClickOutside = () =>
      setMenu({ visible: false, x: 0, y: 0, index: null });
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

      {/* 🧭 Context Menu */}
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

      {/* 🌌 Fullscreen viewer */}
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
