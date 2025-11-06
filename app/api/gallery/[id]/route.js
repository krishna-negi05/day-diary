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
    if (!numericId || isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // ✅ Find the record first
    const media = await prisma.galleryMedia.findUnique({
      where: { id: numericId },
    });

    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ✅ Respond immediately to the client
    const response = NextResponse.json({ success: true });

    // ✅ Run deletions in background (no await = instant API return)
    Promise.allSettled([
      prisma.galleryMedia.delete({ where: { id: numericId } }),
      (async () => {
        try {
          const publicId = media.url.split("/").pop().split(".")[0];
          await cloudinary.v2.uploader.destroy(publicId);
          console.log(`✅ Cloudinary deleted: ${publicId}`);
        } catch (e) {
          console.warn(`⚠️ Cloudinary deletion failed: ${e.message}`);
        }
      })(),
    ]).then(() => console.log(`✅ Completed background deletion for ID ${numericId}`));

    return response;
  } catch (err) {
    console.error("❌ Error deleting media:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
