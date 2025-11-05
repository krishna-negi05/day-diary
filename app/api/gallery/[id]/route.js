import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// ✅ DELETE media by ID
export async function DELETE(_, { params }) {
  try {
    const { id } = params;
    await prisma.galleryMedia.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting media:", err);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
