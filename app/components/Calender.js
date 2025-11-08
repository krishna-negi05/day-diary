"use client";

import { useEffect, useState } from "react";
import "../components/Calender.css";
import Diary from "../components/Diary";

export default function Calendar() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [entries, setEntries] = useState([]);
  const [selectedDateForDiary, setSelectedDateForDiary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [days, setDays] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  const currentDate = new Date();

  // ✅ Fetch diary entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/entries");
        if (!response.ok) throw new Error("Failed to fetch entries");
        const data = await response.json();
        setEntries(data || []);
      } catch (err) {
        console.error("❌ Error fetching entries:", err);
        setError("Failed to load diary entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();

    // ✅ Auto-refresh when new entry added
    if (localStorage.getItem("entryUpdated")) {
      fetchEntries();
      localStorage.removeItem("entryUpdated");
    }
  }, []);

  // ✅ Fetch AI-generated quote from Gemini
  useEffect(() => {
    const getQuote = async () => {
      try {
        const res = await fetch("/api/quote");
        const data = await res.json();
        setQuote(data.quote || "Keep believing — the best is yet to come.");
      } catch (err) {
        console.error("Error fetching AI quote:", err);
        setQuote("Even small steps move you forward.");
      }
    };
    getQuote();
  }, []);

  // ✨ Fade-in animation when quote loads
  useEffect(() => {
    if (quote) {
      setFadeIn(true);
      const timer = setTimeout(() => setFadeIn(false), 800);
      return () => clearTimeout(timer);
    }
  }, [quote]);

  // ✅ Leap year helper
  const isLeapYear = (year) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const getFebDays = (year) => (isLeapYear(year) ? 29 : 28);

  // ✅ Generate days for month/year
  useEffect(() => {
    const daysInMonth = [
      31, getFebDays(year), 31, 30, 31, 30,
      31, 31, 30, 31, 30, 31
    ];

    const firstDay = new Date(year, month, 1);
    const totalDays = daysInMonth[month] + firstDay.getDay();

    const newDays = [];
    for (let i = 0; i < totalDays; i++) {
      newDays.push(i >= firstDay.getDay() ? i - firstDay.getDay() + 1 : "");
    }

    setDays(newDays);
  }, [month, year]);

  const handleDateClick = (day) => {
    if (!day) return;
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateForDiary(formattedDate);
  };

  if (selectedDateForDiary) {
    const entry = entries.find((e) => e.date === selectedDateForDiary);
    return (
      <Diary
        selectedDate={selectedDateForDiary}
        entry={entry}
        onBack={() => setSelectedDateForDiary(null)}
      />
    );
  }

  // ✅ Skeleton shimmer card
  const SkeletonDay = () => (
    <div className="relative overflow-hidden bg-[#d1d1d1]/40 dark:bg-[#1e1e1e] rounded-md h-16 w-full skeleton-shimmer"></div>
  );

  return (
    <div className={`calendar ${darkMode ? "dark" : "light"}`}>
      {/* Header */}
      <div className="calendar-header">
        <span
          className="month-picker"
          onClick={() => setShowMonths(!showMonths)}
        >
          {monthNames[month]}
        </span>

        <div className="year-picker">
          <span className="year-change" onClick={() => setYear(year - 1)}>
            &lt;
          </span>
          <span id="year">{year}</span>
          <span className="year-change" onClick={() => setYear(year + 1)}>
            &gt;
          </span>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="calendar-body">
        <div className="calendar-week-day">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="calendar-days grid grid-cols-7 gap-2 mt-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <SkeletonDay key={i} />
            ))}
          </div>
        ) : (
          <div className="calendar-days">
            {days.map((d, i) => {
              if (!d) return <div key={i}></div>;

              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const hasEntry = Array.isArray(entries)
                ? entries.some((entry) => entry.date === dateKey)
                : entries[dateKey];
              const isToday =
                d === currentDate.getDate() &&
                year === currentDate.getFullYear() &&
                month === currentDate.getMonth();

              return (
                <div
                  key={i}
                  className={`${isToday ? "curr-date" : ""} ${
                    hasEntry ? "has-entry" : ""
                  }`}
                  onClick={() => handleDateClick(d)}
                >
                  {d}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="calendar-footer">
        <div className="toggle" onClick={() => setDarkMode(!darkMode)}>
          <span style={{ color: darkMode ? "#fff" : "#000" }}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
          <div className="dark-mode-switch">
            <div className="dark-mode-switch-ident"></div>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      {showMonths && (
        <div className="month-list show">
          {monthNames.map((m, i) => (
            <div key={m}>
              <div
                onClick={() => {
                  setMonth(i);
                  setShowMonths(false);
                }}
              >
                {m}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✨ AI-Generated Quote */}
      <div
        className={`mt-8 text-center tracking-normal transition-all duration-700 ${
          darkMode ? "text-white/90" : "text-black/80"
        } ${fadeIn ? "opacity-100" : "opacity-80"}`}
        style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: "0.95rem",
          letterSpacing: "0.3px",
          lineHeight: "1.6",
          textShadow: darkMode
            ? "0 0 6px rgba(255,255,255,0.1)"
            : "0 0 6px rgba(0,0,0,0.05)",
        }}
      >
        💭 {quote}
      </div>
    </div>
  );
}
