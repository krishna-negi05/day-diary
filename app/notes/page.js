"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2 } from "lucide-react";

export default function StickyNotesWall() {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState("");
  const [color, setColor] = useState("yellow");
  const [editingNote, setEditingNote] = useState(null);
  const wallRef = useRef(null);

  // 🧠 Load saved notes
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("realStickyNotes") || "[]");
    setNotes(saved);
  }, []);

  // 💾 Save whenever changed
  useEffect(() => {
    localStorage.setItem("realStickyNotes", JSON.stringify(notes));
  }, [notes]);

  const colors = [
    { name: "yellow", bg: "bg-yellow-200" },
    { name: "pink", bg: "bg-pink-200" },
    { name: "blue", bg: "bg-blue-200" },
    { name: "green", bg: "bg-green-200" },
    { name: "purple", bg: "bg-purple-200" },
  ];

  const addOrEditNote = () => {
    if (!text.trim()) return;

    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id ? { ...n, text, color } : n
        )
      );
    } else {
      const newNote = {
        id: Date.now(),
        text,
        color,
        x: Math.random() * 300 + 100,
        y: Math.random() * 150 + 100,
        date: new Date().toLocaleString(),
      };
      setNotes((prev) => [...prev, newNote]);
    }
    setText("");
    setEditingNote(null);
    setShowModal(false);
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // ✅ Fixed: Clamp note inside wall boundaries
  const handleDragEnd = (event, info, id) => {
    const wallRect = wallRef.current?.getBoundingClientRect();
    const noteRect = event.target.getBoundingClientRect();

    if (!wallRect) return;

    let newX = noteRect.left - wallRect.left;
    let newY = noteRect.top - wallRect.top;

    // ✅ Clamp so it stays fully visible
    const maxX = wallRect.width - noteRect.width;
    const maxY = wallRect.height - noteRect.height;

    newX = Math.min(Math.max(0, newX), maxX);
    newY = Math.min(Math.max(0, newY), maxY);

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x: newX, y: newY } : n))
    );
  };

  return (
    <div
      ref={wallRef}
      className="min-h-screen bg-cover bg-center relative overflow-hidden select-none"
      style={{
        backgroundImage:
          "url('https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA4L3Jhd3BpeGVsX29mZmljZV8yOF8zZF9jdXRlX3JlbmRlcl9lbXB0eV9yb29tX2NsZWFuX3dhbGxfbXV0ZWRfYV82NWIwZjc5YS1mNGE5LTRjNzUtYTM4ZC05NWZlYzZmOWNkMWZfMS5qcGc.jpg')",
      }}
    >
      {/* Notes on wall */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              drag
              dragMomentum={false}
              dragConstraints={wallRef}
              onDragEnd={(e, info) => handleDragEnd(e, info, note.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: note.x,
                y: note.y,
                rotate: (note.id % 10) - 5,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`absolute p-4 rounded-lg shadow-[0_8px_15px_rgba(0,0,0,0.4)] w-52 h-auto cursor-grab active:cursor-grabbing ${colors.find(c=>c.name===note.color)?.bg} note-paper pointer-events-auto`}
            >
              {/* Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-[0_3px_3px_rgba(0,0,0,0.4)] border border-red-300"></div>

              <p className="text-gray-800 text-[15px] font-medium leading-relaxed whitespace-pre-wrap mt-2">
                {note.text}
              </p>

              <div className="text-xs text-gray-600 mt-3">{note.date}</div>

              {/* Controls */}
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={() => {
                    setEditingNote(note);
                    setText(note.text);
                    setColor(note.color);
                    setShowModal(true);
                  }}
                  className="p-1 bg-black/10 rounded hover:bg-black/20 transition"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 bg-black/10 rounded hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Add Button */}
      <motion.button
        onClick={() => setShowModal(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-[0_0_25px_rgba(37,99,235,0.6)] p-4 hover:scale-110 transition-all duration-300 cursor-pointer z-50"
      >
        <Plus size={28} />
      </motion.button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1b1b1b] text-white rounded-xl p-6 w-[90%] max-w-md shadow-[0_0_20px_rgba(0,0,0,0.6)]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingNote ? "Edit Note" : "New Note"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write something..."
                className="w-full h-32 bg-zinc-800/60 rounded-lg p-3 text-white placeholder-gray-400 outline-none resize-none"
              />

              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        color === c.name ? "border-white" : "border-transparent"
                      } ${c.bg}`}
                    ></button>
                  ))}
                </div>

                <button
                  onClick={addOrEditNote}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .note-paper {
          border: 1px solid rgba(0, 0, 0, 0.1);
          transform-origin: center top;
          transition: transform 0.2s ease;
          touch-action: none;
        }
        @media (max-width: 768px) {
          .note-paper {
            width: 80vw;
            left: 10vw;
          }
        }
      `}</style>
    </div>
  );
}
