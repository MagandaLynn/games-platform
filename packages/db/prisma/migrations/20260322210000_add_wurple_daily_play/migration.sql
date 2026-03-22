-- CreateTable
CREATE TABLE "WurpleDailyPlay" (
    "id" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "guessCount" INTEGER NOT NULL DEFAULT 0,
    "maxGuesses" INTEGER,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WurpleDailyPlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WurpleDailyPlay_seed_mode_session_key" ON "WurpleDailyPlay"("seed", "mode", "sessionId");

-- CreateIndex
CREATE INDEX "WurpleDailyPlay_mode_date_idx" ON "WurpleDailyPlay"("mode", "date");

-- CreateIndex
CREATE INDEX "WurpleDailyPlay_sessionId_date_idx" ON "WurpleDailyPlay"("sessionId", "date");

-- CreateIndex
CREATE INDEX "WurpleDailyPlay_userId_date_idx" ON "WurpleDailyPlay"("userId", "date");
