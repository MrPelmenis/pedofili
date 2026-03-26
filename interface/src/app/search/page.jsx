"use client";
import { useState, useRef, useEffect } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [modal, setModal] = useState(null);
  const [modalStage, setModalStage] = useState("closed"); 
  const inputRef = useRef(null);

  const API = process.env.NEXT_PUBLIC_SERVER_URL;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSubmitted(query.trim());
    setLoading(true);
    try {
      const res = await fetch(`${API}/search?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSubmitted("");
    inputRef.current?.focus();
  };

  const openPdf = (e, r) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const filename = r.file?.replace("./pdf-files/", "");
    setModal({
      pdfUrl: `${API}/pdf-file/${encodeURIComponent(filename)}`,
      previewUrl: `${API}${r.preview}`,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    });
    setModalStage("expanding");
    // small delay so the browser paints the initial position before transitioning
    setTimeout(() => setModalStage("open"), 30);
  };

  const closeModal = () => {
    setModalStage("closing");
    setTimeout(() => {
      setModal(null);
      setModalStage("closed");
    }, 300);
  };

  useEffect(() => {
    if (modal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  const isOpen = modalStage === "open";
  const isExpanding = modalStage === "expanding";
  const isClosing = modalStage === "closing";

  return (
    <main className="min-h-screen bg-[#202124] text-white px-8 py-6">
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-2xl mb-8">
        <div className="flex items-center flex-1 bg-[#303134] rounded-2xl px-4 h-11 gap-3 hover:bg-[#3c3f43] transition-colors">
          <svg className="w-4 h-4 text-[#9aa0a6] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 15 15">
            <circle cx="6.5" cy="6.5" r="4.5" /><line x1="10.2" y1="10.2" x2="13.5" y2="13.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers..."
            className="flex-1 bg-transparent outline-none text-white placeholder-[#9aa0a6] text-sm"
          />
          {query && (
            <button type="button" onClick={clearSearch} className="text-[#9aa0a6] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 14 14">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {loading && <p className="text-sm text-[#9aa0a6]">Searching...</p>}
      {!loading && submitted && results.length === 0 && (
        <p className="text-sm text-[#9aa0a6]">No results for <span className="text-white">{submitted}</span></p>
      )}

      {!loading && results.length > 0 && (
        <div className="max-w-2xl flex flex-col divide-y divide-[#3c3f43]">
          {results.map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-5">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#9aa0a6] truncate mb-0.5">
                  {r.file?.replace("./pdf-files/", "") ?? ""}
                </p>
                <p className="text-[#8ab4f8] text-base font-medium leading-snug mb-1 line-clamp-2">
                  {r.title ?? r.file}
                </p>
                {r.authors?.length > 0 && (
                  <p className="text-xs text-[#9aa0a6] mb-1.5">
                    {r.authors.join(", ")}
                    {r.date && r.date !== "Unknown" && (
                      <span className="ml-2 text-[#5f6368]">· {r.date}</span>
                    )}
                  </p>
                )}
                {r.abstract && (
                  <p className="text-sm text-[#bdc1c6] line-clamp-3 leading-relaxed">
                    {r.abstract}
                  </p>
                )}
              </div>

              {r.preview && (
                <button
                  onClick={(e) => openPdf(e, r)}
                  className="shrink-0 w-48 rounded overflow-hidden border border-[#3c3f43] bg-[#303134] hover:border-[#8ab4f8] transition-colors cursor-pointer"
                >
                  <img
                    src={`${API}${r.preview}`}
                    alt="preview"
                    className="w-full h-auto object-cover"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          onClick={closeModal}
          style={{ transition: "opacity 300ms" }}
          className={`fixed inset-0 z-50 flex items-center justify-center
            ${isOpen ? "bg-black/70" : "bg-black/0"}
            ${isClosing ? "bg-black/0" : ""}
          `}
        >
          {/* Animated container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
              width:  isOpen ? "90vw"  : `${modal.rect.width}px`,
              height: isOpen ? "90vh"  : `${modal.rect.height}px`,
              position: "fixed",
              top:  isOpen ? "5vh"  : `${modal.rect.top}px`,
              left: isOpen ? "5vw"  : `${modal.rect.left}px`,
              borderRadius: isOpen ? "12px" : "4px",
              overflow: "hidden",
              boxShadow: isOpen ? "0 25px 60px rgba(0,0,0,0.8)" : "none",
            }}
          >
            {/* Preview image shown while expanding */}
            {!isOpen && (
              <img
                src={modal.previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}

            {/* iframe shown once open */}
            {isOpen && (
              <embed
                src={modal.pdfUrl}
                className="w-full h-full border-0 bg-[#303134]"
                title="PDF viewer"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
