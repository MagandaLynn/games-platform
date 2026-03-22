-- CreateTable
CREATE TABLE "SemantleDailyPlay" (
    "id" TEXT NOT NULL,
    "puzzleNumber" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "guessCount" INTEGER,
    "topGuessNumber" INTEGER,
    "topScore" INTEGER,
    "hintsUsed" INTEGER,
    "rawText" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemantleDailyPlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SemantleDailyPlay_puzzle_session_key" ON "SemantleDailyPlay"("puzzleNumber", "sessionId");

-- CreateIndex
CREATE INDEX "SemantleDailyPlay_sessionId_importedAt_idx" ON "SemantleDailyPlay"("sessionId", "importedAt");

-- CreateIndex
CREATE INDEX "SemantleDailyPlay_userId_importedAt_idx" ON "SemantleDailyPlay"("userId", "importedAt");
