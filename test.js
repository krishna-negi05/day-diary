// test-openrouter.js
import fetch from "node-fetch"; // remove if you're on Node 18+

const API_KEY = "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"; // 👈 put your real key in quotes

const test = async () => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`, // ✅ correct syntax
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "user", content: "Write a short quote about determination in anime style." },
        ],
        max_tokens: 50,
      }),
    });

    const data = await res.json();
    console.log("✅ Response:\n", data?.choices?.[0]?.message?.content || data);
  } catch (err) {
    console.error("❌ Error:", err);
  }
};

test();
