import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavLink from "./components/NavLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pdf Magic",
  description: "upload and search",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          padding: "1rem",
        }}>
          <NavLink href="/search">Search</NavLink>
          <NavLink href="/chart">Chart</NavLink>
          <NavLink href="/upload">Upload</NavLink>
        </header>

        {children}
      </body>
    </html>
  );
}
