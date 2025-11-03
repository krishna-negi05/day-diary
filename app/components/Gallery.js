"use client";

export default function Gallery({ mediaUrls = [] }) {
  if (mediaUrls.length === 0)
    return <p className="text-center text-gray-400">No photos yet...</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {mediaUrls.map((url, idx) => (
        <div key={idx} className="relative">
          {url.includes(".mp4") || url.includes("video") ? (
            <video src={url} controls className="rounded-lg shadow-md" />
          ) : (
            <img
              src={url}
              alt={`Diary media ${idx}`}
              className="rounded-lg shadow-md"
            />
          )}
        </div>
      ))}
    </div>
  );
}
