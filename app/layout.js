import "./globals.css";
import { Outfit } from "next/font/google";
import ResponsiveLayoutWrapper from "./components/ResponsiveLayoutWrapper";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "Day Diary",
  description: "A personal online diary app",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.className} bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white flex min-h-screen`}
      >
        <ResponsiveLayoutWrapper>{children}</ResponsiveLayoutWrapper>
        <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
      </body>
    </html>
  );
}
