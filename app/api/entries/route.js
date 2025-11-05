// app/api/entries/route.js
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// ✅ GET: Fetch all or single entry by date
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (date) {
      // Fetch single entry
      const entry = await prisma.entry.findUnique({
        where: { date },
      });
      return NextResponse.json(entry || null);
    }

    // Fetch all entries (sorted by date desc)
    const entries = await prisma.entry.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("❌ Error fetching entries:", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// ✅ POST: Create or update a diary entry
export async function POST(request) {
  try {
    const { date, title, mood, content, files } = await request.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const updatedEntry = await prisma.entry.upsert({
      where: { date },
      update: { title, mood, content, files },
      create: { date, title, mood, content, files },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("❌ Error saving entry:", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
