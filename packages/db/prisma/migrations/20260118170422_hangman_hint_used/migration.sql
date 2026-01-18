-- AlterTable
ALTER TABLE "HangmanPlay" ADD COLUMN     "hintUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hintUsedAt" TIMESTAMP(3);
