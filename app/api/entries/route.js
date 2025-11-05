// app/api/entries/route.js
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// ✅ GET: Fetch all or a single diary entry
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (date) {
      // Fetch entry for a specific date
      const entry = await prisma.entry.findUnique({
        where: { date },
      });
      return NextResponse.json(entry || null);
    }

    // Fetch all entries (sorted by latest)
    const entries = await prisma.entry.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("❌ Error fetching entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ POST: Create or update a diary entry
export async function POST(request) {
  try {
    const { date, title, mood, content, files } = await request.json();

    if (!date || !title) {
      return NextResponse.json(
        { error: "Date and title are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.entry.upsert({
      where: { date },
      update: { title, mood, content, files },
      create: { date, title, mood, content, files },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("❌ Error saving entry:", error);
    return NextResponse.json(
      { error: "Failed to save entry", details: error.message },
      { status: 500 }
    );
  }
}
