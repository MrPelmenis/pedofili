"use client";
import { useState, useRef } from "react";

const UPLOAD_URL = `${process.env.NEXT_PUBLIC_SERVER_URL}/upload`;

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  async function uploadFiles(fileList) {
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfs.length) return;

    setLoading(true);
    setErrors([]);
    setSuccess(false);

    const results = await Promise.all(
      pdfs.map(async (file) => {
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { name: file.name, message: body.error || `Error ${res.status}` };
          }
          return null;
        } catch {
          return { name: file.name, message: "Network error" };
        }
      })
    );

    const errs = results.filter(Boolean);
    setErrors(errs);
    setSuccess(errs.length === 0);
    setLoading(false);
  }

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  return (
    <main style={{
      minHeight: "100vh", background: "#202124", color: "white",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "sans-serif",
    }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <svg style={{ width: 36, height: 36, animation: "spin 0.8s linear infinite" }} viewBox="0 0 24 24" fill="none">
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <circle cx="12" cy="12" r="10" stroke="#3c3f43" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#8ab4f8" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p style={{ color: "#9aa0a6", fontSize: 14, margin: 0 }}>Uploading…</p>
        </div>
      ) : (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            style={{
              width: "100%", maxWidth: "28rem",
              border: `2px dashed ${dragging ? "#8ab4f8" : success ? "#34a853" : "#3c3f43"}`,
              background: dragging ? "rgba(138,180,248,0.06)" : success ? "rgba(52,168,83,0.06)" : "#303134",
              borderRadius: "0.875rem", padding: "3rem 2rem",
              cursor: "pointer", userSelect: "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple style={{ display: "none" }}
              onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />

            {success ? (
              <>
                <svg style={{ width: 36, height: 36, color: "#34a853" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#34a853", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Files uploaded successfully
                </p>
                <p style={{ fontSize: 12, color: "#5f6368", margin: 0 }}>Drop more PDFs to upload again</p>
              </>
            ) : (
              <>
                <svg style={{ width: 32, height: 32, color: dragging ? "#8ab4f8" : "#5f6368", transition: "color 0.15s" }}
                  fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p style={{ fontSize: 13, color: dragging ? "#8ab4f8" : "#9aa0a6", margin: 0, transition: "color 0.15s" }}>
                  {dragging ? "Drop PDFs here" : "Drag & drop PDFs, or click to browse"}
                </p>
              </>
            )}
          </div>

          {errors.length > 0 && (
            <div style={{ width: "100%", maxWidth: "28rem", marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {errors.map((err) => (
                <div key={err.name} style={{ background: "#2c1f1f", border: "1px solid #5c2d2d", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                  <span style={{ fontSize: 12, color: "#f28b82" }}>{err.name} — {err.message}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
