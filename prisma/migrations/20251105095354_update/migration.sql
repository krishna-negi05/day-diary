/*
  Warnings:

  - A unique constraint covering the columns `[date]` on the table `DiaryEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `DiaryEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "files" JSONB,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TEXT,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DiaryEntry_date_key" ON "DiaryEntry"("date");
