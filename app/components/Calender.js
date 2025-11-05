"use client";

import { useEffect, useState } from "react";
import "../components/Calender.css";
import Diary from "../components/Diary";

export default function Calendar() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [entries, setEntries] = useState({});
  const [selectedDateForDiary, setSelectedDateForDiary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [days, setDays] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentDate = new Date();

  // ✅ Fetch entries from Prisma API
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/entries");
        if (!response.ok) throw new Error("Failed to fetch entries");
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        console.error("❌ Error fetching entries:", err);
        setError("Failed to load diary entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  // ✅ Leap year + February helper
  const isLeapYear = (year) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const getFebDays = (year) => (isLeapYear(year) ? 29 : 28);

  // ✅ Generate days grid for selected month/year
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

  // ✅ Handle date click
  const handleDateClick = (day) => {
    if (!day) return;
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateForDiary(formattedDate);
  };

  // ✅ Show diary page when date selected
  if (selectedDateForDiary) {
    const entry = entries[selectedDateForDiary];
    return (
      <Diary
        selectedDate={selectedDateForDiary}
        entry={entry}
        onBack={() => setSelectedDateForDiary(null)}
      />
    );
  }

  // ✅ Calendar view
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

      {/* Loading / Error States */}
      {loading && <p className="status">Loading diary entries...</p>}
      {error && <p className="status error">{error}</p>}

      {/* Calendar Body */}
      <div className="calendar-body">
        <div className="calendar-week-day">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((d, i) => {
            if (!d) return <div key={i}></div>;

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const hasEntry = entries[dateKey];
            const isToday =
              d === currentDate.getDate() &&
              year === currentDate.getFullYear() &&
              month === currentDate.getMonth();

            return (
              <div
                key={i}
                className={`${isToday ? "curr-date" : ""} ${hasEntry ? "has-entry" : ""}`}
                onClick={() => handleDateClick(d)}
              >
                {d}
                {hasEntry && <span className="entry-dot"></span>}
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
1