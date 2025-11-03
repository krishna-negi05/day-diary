// app/components/UploadMedia.jsx
"use client";

import { useState } from "react";
import { uploadFile } from "@/uploadFIle";

export default function UploadMedia({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    setUploading(true);
    try {
      const url = await uploadFile(file, "user123");
      if (onUploadSuccess) onUploadSuccess(url); // 👈 notify parent
      alert("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
      setFile(null);
      setPreview("");
    }
  };

  return (
    <div className="bg-[#181818] p-6 rounded-2xl border border-zinc-800 shadow-lg max-w-md mx-auto text-center">
      <h2 className="text-xl font-semibold mb-4">Upload Diary Media</h2>

      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="mb-4 w-full text-sm"
      />

      {preview && (
        <div className="mb-4">
          {file?.type?.startsWith("image") ? (
            <img
              src={preview}
              alt="preview"
              className="w-full rounded-lg shadow-md"
            />
          ) : (
            <video
              src={preview}
              controls
              className="w-full rounded-lg shadow-md"
            />
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
