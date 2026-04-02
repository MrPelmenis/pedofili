"use client";
import { useState, useRef, useCallback } from "react";

function sendPdfToServer(files) {
  alert("Uploaded:\n" + files.map((f) => f.name).join("\n"));
}

function FileRow({ file, progress }) {
  const done = progress >= 100;
  return (
    <div className="flex items-center gap-4 py-3">
      <svg className="w-4 h-4 text-[#9aa0a6] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-white truncate">{file.name}</p>
          <p className="text-xs text-[#9aa0a6] ml-3 shrink-0">
            {done ? "done" : `${progress}%`}
          </p>
        </div>
        <div className="h-1 rounded-full bg-[#3c3f43] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: done ? "#34a853" : "#8ab4f8",
            }}
          />
        </div>
      </div>
      {done && (
        <svg className="w-4 h-4 text-[#34a853] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [files, setFiles] = useState([]);      // [{ file, progress }]
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const simulateUpload = useCallback((newFiles) => {
    const entries = newFiles.map((f) => ({ file: f, progress: 0 }));

    setFiles((prev) => {
      const existingNames = new Set(prev.map((e) => e.file.name));
      const unique = entries.filter((e) => !existingNames.has(e.file.name));
      return [...prev, ...unique];
    });

    entries.forEach(({ file }) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) => {
            const updated = prev.map((e) =>
              e.file.name === file.name ? { ...e, progress: 100 } : e
            );
            const allDone = updated.every((e) => e.progress === 100);
            if (allDone) sendPdfToServer(updated.map((e) => e.file));
            return updated;
          });
        } else {
          setFiles((prev) =>
            prev.map((e) => (e.file.name === file.name ? { ...e, progress } : e))
          );
        }
      }, 120);
    });
  }, []);

  const addFiles = (incoming) => {
    const pdfs = Array.from(incoming).filter((f) => f.type === "application/pdf");
    if (pdfs.length) simulateUpload(pdfs);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const clearAll = () => setFiles([]);

  const anyInProgress = files.some((e) => e.progress < 100);

  return (
    <main className="min-h-screen bg-[#202124] text-white px-8 py-6">
      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          max-w-2xl flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-2xl px-8 py-14 mb-6
          cursor-pointer select-none transition-colors
          ${dragging
            ? "border-[#8ab4f8] bg-[#8ab4f81a]"
            : "border-[#3c3f43] bg-[#303134] hover:border-[#5f6368] hover:bg-[#35373b]"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        <svg
          className={`w-10 h-10 transition-colors ${dragging ? "text-[#8ab4f8]" : "text-[#5f6368]"}`}
          fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className={`text-sm font-medium transition-colors ${dragging ? "text-[#8ab4f8]" : "text-[#9aa0a6]"}`}>
          {dragging ? "Drop PDFs here" : "Drag & drop PDFs, or click to browse"}
        </p>
        <p className="text-xs text-[#5f6368]">.pdf files only</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="max-w-2xl bg-[#303134] rounded-2xl px-5 divide-y divide-[#3c3f43]">
          {files.map((entry) => (
            <FileRow key={entry.file.name} file={entry.file} progress={entry.progress} />
          ))}
          {!anyInProgress && (
            <div className="py-3 flex justify-end">
              <button
                onClick={clearAll}
                className="text-xs text-[#9aa0a6] hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
