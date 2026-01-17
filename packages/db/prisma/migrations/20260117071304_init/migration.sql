-- CreateTable
CREATE TABLE "HangmanDailyInstance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangmanDailyInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangmanPlay" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "wrongGuesses" INTEGER NOT NULL DEFAULT 0,
    "guessed" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HangmanPlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangmanPuzzle" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "hint" TEXT,
    "category" TEXT,
    "isDailyEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangmanPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangmanDailySchedule" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangmanDailySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HangmanDailyInstance_mode_date_idx" ON "HangmanDailyInstance"("mode", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HangmanDailyInstance_date_mode_key" ON "HangmanDailyInstance"("date", "mode");

-- CreateIndex
CREATE INDEX "HangmanPlay_sessionId_idx" ON "HangmanPlay"("sessionId");

-- CreateIndex
CREATE INDEX "HangmanPlay_userId_idx" ON "HangmanPlay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HangmanPlay_instanceId_sessionId_key" ON "HangmanPlay"("instanceId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "HangmanDailySchedule_date_key" ON "HangmanDailySchedule"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HangmanDailySchedule_puzzleId_key" ON "HangmanDailySchedule"("puzzleId");

-- AddForeignKey
ALTER TABLE "HangmanDailyInstance" ADD CONSTRAINT "HangmanDailyInstance_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "HangmanPuzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangmanPlay" ADD CONSTRAINT "HangmanPlay_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "HangmanDailyInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangmanDailySchedule" ADD CONSTRAINT "HangmanDailySchedule_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "HangmanPuzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
