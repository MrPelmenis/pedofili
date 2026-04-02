"use client";
import { useState } from "react";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import PdfModal from "./PdfModal";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [modal, setModal] = useState(null);
  const [modalStage, setModalStage] = useState("closed");

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

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSubmitted("");
  };

  const openPdf = (e, r) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModal({
      pdfUrl: `${API}/pdf-file/${encodeURIComponent(r.file)}`,
      previewUrl: `${API}${r.preview}`,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    });
    setModalStage("expanding");
    setTimeout(() => setModalStage("open"), 30);
  };

  const closeModal = () => {
    setModalStage("closing");
    setTimeout(() => {
      setModal(null);
      setModalStage("closed");
    }, 300);
  };

  return (
    <main className="min-h-screen bg-[#202124] text-white px-8 py-6">
      <SearchBar
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      <SearchResults
        results={results}
        loading={loading}
        submitted={submitted}
        apiUrl={API}
        onOpenPdf={openPdf}
      />
      <PdfModal
        modal={modal}
        modalStage={modalStage}
        onClose={closeModal}
      />
    </main>
  );
}
