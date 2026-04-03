import { Poppins } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "./ConditionalHeader";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PDF Magic",
  description: "Search and upload scientific literature",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://lib.chartizer.com/chartizer.css" rel="stylesheet" />
        <script src="https://lib.chartizer.com/chartizer.js" async />
      </head>
      <body className={`${poppins.className} antialiased`}>
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
