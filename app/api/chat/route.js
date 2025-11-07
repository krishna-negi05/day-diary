import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages?.[messages.length - 1]?.content || "";

    console.log("📩 User message:", userMessage);

    if (!userMessage) {
      return NextResponse.json({ reply: "⚠️ No message received." });
    }

    // ✅ Gemini API request
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    console.log("🔍 Gemini raw response:", JSON.stringify(data, null, 2));

    let reply = "⚠️ No valid response from Gemini.";

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      reply = data.candidates[0].content.parts[0].text.trim();
    } else if (data?.error?.message) {
      reply = `🚫 API Error: ${data.error.message}`;
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("❌ Gemini route error:", err);
    return NextResponse.json(
      { reply: "🚫 Server error while contacting Gemini API." },
      { status: 500 }
    );
  }
}
