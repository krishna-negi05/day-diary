import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages?.[messages.length - 1];

    if (!userMessage)
      return NextResponse.json({ reply: "⚠️ No message received." });

    const hasImage = userMessage?.media?.some((m) =>
      m.type?.startsWith("image/")
    );

    // 👇 Choose model dynamically based on content type
    const model = hasImage
      ? "qwen/qwen2.5-vl-32b-instruct" // handles image + text
      : "deepseek/deepseek-chat-v3.1"; // handles text

    console.log(
      `🧠 Using model: ${model} | Image detected: ${hasImage ? "Yes" : "No"}`
    );

    // Build request for OpenRouter
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Nemo, a kind and creative diary companion who can discuss emotions, events, and reflections naturally.",
          },
          ...messages.map((m) => {
            if (m.role === "user" && m.media?.length > 0) {
              // 🖼️ Include media URLs for Qwen visual input
              return {
                role: "user",
                content: [
                  ...m.media.map((media) => ({
                    type: media.type.startsWith("image/")
                      ? "image_url"
                      : "text",
                    image_url: media.type.startsWith("image/")
                      ? media.url
                      : undefined,
                    text: !media.type.startsWith("image/")
                      ? media.url
                      : undefined,
                  })),
                  { type: "text", text: m.content },
                ],
              };
            } else {
              return { role: m.role, content: m.content };
            }
          }),
        ],
        max_tokens: 600,
      }),
    });

    const data = await res.json();
    console.log("🔍 Model response:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.error?.message ||
      "⚠️ No valid response.";

    return NextResponse.json({
      reply,
      model,
    });
  } catch (err) {
    console.error("❌ Chat route error:", err);
    return NextResponse.json(
      { reply: "🚫 Server error while contacting OpenRouter." },
      { status: 500 }
    );
  }
}
