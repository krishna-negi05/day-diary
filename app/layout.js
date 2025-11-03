import "./globals.css";
import { Outfit } from "next/font/google";
import ResponsiveLayoutWrapper from "./components/ResponsiveLayoutWrapper";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "Day Diary",
  description: "A personal online diary app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.className} bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white flex min-h-screen`}
      >
        {/* ✅ Client-side wrapper handles sidebar + responsive behavior */}
        <ResponsiveLayoutWrapper>{children}</ResponsiveLayoutWrapper>
      </body>
    </html>
  );
}
