"use client";
import { useRef } from "react";

export default function SearchBar({ query, setQuery, onSearch, onClear }) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={onSearch} className="flex items-center gap-2 max-w-2xl mb-8">
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
          <button type="button" onClick={handleClear} className="text-[#9aa0a6] hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 14 14">
              <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
