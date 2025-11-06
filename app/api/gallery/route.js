import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// ✅ GET all media
export async function GET() {
  try {
    const media = await prisma.galleryMedia.findMany({
      orderBy: { addedAt: "desc" },
    });
    return NextResponse.json(media);
  } catch (err) {
    console.error("❌ Error fetching gallery:", err);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}

// ✅ POST: Add new media
export async function POST(request) {
  try {
    const { name, type, url } = await request.json();
    if (!name || !type || !url)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // ✅ Create new media entry and return full object including ID
    const newMedia = await prisma.galleryMedia.create({
      data: { name, type, url },
    });

    console.log("✅ Created new media:", newMedia);
    return NextResponse.json(newMedia); // return record with id
  } catch (err) {
    console.error("❌ Error adding media:", err);
    return NextResponse.json({ error: "Failed to add media" }, { status: 500 });
  }
}