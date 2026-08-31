/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'PLANNER';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "destination" TEXT,
ADD COLUMN     "tripDocument" JSONB;

-- AlterTable
ALTER TABLE "Pin" ADD COLUMN     "locationType" TEXT,
ADD COLUMN     "osmId" BIGINT,
ADD COLUMN     "osmType" TEXT;

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "locationType" TEXT,
ADD COLUMN     "osmId" BIGINT,
ADD COLUMN     "osmType" TEXT;

-- CreateTable
CREATE TABLE "SavedItinerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "messages" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedItinerary_userId_idx" ON "SavedItinerary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_userId_key" ON "Conversation"("userId");

-- AddForeignKey
ALTER TABLE "SavedItinerary" ADD CONSTRAINT "SavedItinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
