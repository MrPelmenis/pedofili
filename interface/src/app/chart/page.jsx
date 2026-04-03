"use client";
import { useEffect, useRef, useState } from "react";

const mockNetworkData = {
  nodes: [
    { id: "u1", loaded: true, style: { fillColor: "rgba(236,46,46,0.8)",  label: "Admin User"   } },
    { id: "u2", loaded: true, style: { fillColor: "rgba(236,46,46,0.8)",  label: "Guest User"   } },
    { id: "s1", loaded: true, style: { fillColor: "rgba(47,195,47,0.8)",  label: "API Gateway"  } },
    { id: "s2", loaded: true, style: { fillColor: "rgba(47,195,47,0.8)",  label: "Auth Service" } },
    { id: "s3", loaded: true, style: { fillColor: "rgba(47,195,47,0.8)",  label: "Worker Node"  } },
    { id: "d1", loaded: true, style: { fillColor: "rgba(28,124,213,0.8)", label: "Main DB"      } },
    { id: "d2", loaded: true, style: { fillColor: "rgba(28,124,213,0.8)", label: "Redis Cache"  } },
  ],
  links: [
    { id: "l1", from: "u1", to: "s1", style: { fillColor: "rgba(236,46,46,0.5)",  toDecoration: "arrow" } },
    { id: "l2", from: "u2", to: "s1", style: { fillColor: "rgba(236,46,46,0.5)",  toDecoration: "arrow" } },
    { id: "l3", from: "s1", to: "s2", style: { fillColor: "rgba(47,195,47,0.5)",  toDecoration: "arrow" } },
    { id: "l4", from: "s1", to: "s3", style: { fillColor: "rgba(47,195,47,0.5)",  toDecoration: "arrow" } },
    { id: "l5", from: "s2", to: "d1", style: { fillColor: "rgba(28,124,213,0.5)", toDecoration: "arrow" } },
    { id: "l6", from: "s3", to: "d1", style: { fillColor: "rgba(28,124,213,0.5)", toDecoration: "arrow" } },
    { id: "l7", from: "s1", to: "d2", style: { fillColor: "rgba(28,124,213,0.5)", toDecoration: "arrow" } },
  ],
};

export default function ChartPage() {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const [query, setQuery] = useState("mock");

  function initChart(q) {
    if (chartRef.current) {
      chartRef.current.remove?.();
      chartRef.current = null;
    }

    if (!window.NetChart || !containerRef.current) return;

    console.log("chart for: " + q);
    chartRef.current = new window.NetChart({
      container: containerRef.current,
      data: { preloaded: mockNetworkData },
      area: { style: { fillColor: "#121212" } },
    });
  }

  useEffect(() => {
    const t = setTimeout(() => initChart(query), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    initChart(query);
  };

  return (
    <main className="min-h-screen bg-main flex flex-col">
      <div ref={containerRef} className="flex-1 w-full" />
    </main>
  );
}
