import { NextResponse } from "next/server";

export async function GET() {
  try {
    const prompt = `
    Generate a single short, poetic, and uplifting quote.
    It should sound natural and emotionally deep — like something from an anime diary or journal.
    Example: "Even the quietest hearts beat with the strength to try again."
    Just return the quote itself, no extra text.
    `;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await res.json();

    const quote =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Keep walking — the stars are watching your journey.";

    return NextResponse.json({ quote });
  } catch (err) {
    console.error("❌ Gemini Quote Error:", err);
    return NextResponse.json(
      { quote: "Every day is a blank page waiting for your story." },
      { status: 200 }
    );
  }
}
