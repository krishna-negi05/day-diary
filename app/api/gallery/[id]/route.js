import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    const numericId = parseInt(id, 10);

    const media = await prisma.galleryMedia.findUnique({ where: { id: numericId } });
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const response = NextResponse.json({ success: true });

    Promise.allSettled([
      prisma.galleryMedia.delete({ where: { id: numericId } }),
      (async () => {
        try {
          const publicId = media.url.split("/").pop().split(".")[0];
          await cloudinary.v2.uploader.destroy(publicId);
        } catch (e) {
          console.warn("⚠️ Cloudinary deletion failed:", e.message);
        }
      })(),
    ]);

    return response;
  } catch (err) {
    console.error("❌ Error deleting media:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ PUT: Update favorite status
export async function PUT(request, context) {
  try {
    const { id } = context.params;
    const { favorite } = await request.json();

    const updated = await prisma.galleryMedia.update({
      where: { id: parseInt(id, 10) },
      data: { favorite },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Error updating favorite:", err);
    return NextResponse.json({ error: "Failed to update favorite" }, { status: 500 });
  }
}
