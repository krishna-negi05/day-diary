/*
  Warnings:

  - You are about to drop the `DiaryEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."DiaryEntry";

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mood" TEXT,
    "content" TEXT,
    "files" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_date_key" ON "Entry"("date");
