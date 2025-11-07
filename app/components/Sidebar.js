"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", icon: "/icons/home.png", label: "Home" },
    { href: "/add", icon: "/icons/add.png", label: "Add Entry" },
    { href: "/gallery", icon: "/icons/gallery.png", label: "Gallery" },
    { href: "/chat", icon: "/icons/robot.png", label: "Chat with AI" },
    { href: "/notes", icon: "/icons/notes.png", label: "Sticky Notes" }, // 🗒️ Added here below Chat
  ];

  return (
    <aside
      className="
        flex flex-col justify-between h-full 
        transition-all duration-300 w-20 md:w-64
        bg-gradient-to-br from-[#1a1a1e] to-[#101013]
        shadow-[8px_8px_20px_rgba(0,0,0,0.6),_-6px_-6px_14px_rgba(60,60,70,0.25)]
        border-r border-zinc-800 text-white
        backdrop-blur-xl bg-opacity-80
      "
      style={{ borderRadius: '0 18px 18px 0' }}
    >
      {/* ===== Brand Section ===== */}
      <div>
        <div
          className="
            flex items-center gap-3 p-4
            border-b border-zinc-800
            shadow-[inset_3px_3px_6px_rgba(0,0,0,0.7),_inset_-3px_-3px_6px_rgba(80,80,90,0.2)]
          "
        >
          <Image
            src="/icons/diary.png"
            alt="Diary Icon"
            width={40}
            height={40}
            className="rounded drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          />
          <div className="hidden md:block">
            <div className="text-lg font-semibold tracking-wide">Day Diary</div>
          </div>
        </div>

        {/* ===== Navigation ===== */}
        <nav className="mt-4 flex flex-col gap-2 px-2">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <div
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg no-underline transition-all duration-300
                  hover:scale-[1.03] hover:bg-gradient-to-r hover:from-[#2b2b31] hover:to-[#1c1c20]
                  hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.7),_inset_-3px_-3px_6px_rgba(80,80,90,0.25)]
                  ${
                    pathname === link.href
                      ? "bg-gradient-to-r from-[#2b2b31] to-[#1c1c20] scale-[1.02] shadow-inner border-l-4 border-sky-400"
                      : ""
                  }
                `}
              >
                <Image
                  src={link.icon}
                  alt={link.label}
                  width={22}
                  height={22}
                  className="opacity-90"
                />
                <span className="hidden md:inline">{link.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* ===== Footer Profile ===== */}
      <div
        className="
          border-t border-zinc-800 p-4 flex items-center gap-3
          shadow-[inset_3px_3px_6px_rgba(0,0,0,0.7),_inset_-3px_-3px_6px_rgba(80,80,90,0.2)]
        "
      >
        <Image
          src="/icons/profile.jpg"
          alt="Profile"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full overflow-hidden drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
        />
        <div className="hidden md:block leading-tight">
          <div className="font-semibold text-gray-100">Divyata</div>
          <div className="text-sm text-zinc-400">✨ Staying mindful</div>
        </div>
      </div>
    </aside>
  );
}
