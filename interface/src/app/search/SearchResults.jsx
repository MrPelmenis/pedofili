"use client";

export default function SearchResults({ results, loading, submitted, apiUrl, onOpenPdf }) {
  if (loading) {
    return <p className="text-sm text-[#9aa0a6]">Searching...</p>;
  }

  if (submitted && results.length === 0) {
    return (
      <p className="text-sm text-[#9aa0a6]">
        No results for <span className="text-white">{submitted}</span>
      </p>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="max-w-2xl flex flex-col divide-y divide-[#3c3f43]">
      {results.map((r, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#9aa0a6] truncate mb-0.5">
              {r.file ?? ""}
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
              onClick={(e) => onOpenPdf(e, r)}
              className="shrink-0 w-48 rounded overflow-hidden border border-[#3c3f43] bg-[#303134] hover:border-[#8ab4f8] transition-colors cursor-pointer"
            >
              <img
                src={`${apiUrl}${r.preview}`}
                alt="preview"
                className="w-full h-auto object-cover"
              />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
