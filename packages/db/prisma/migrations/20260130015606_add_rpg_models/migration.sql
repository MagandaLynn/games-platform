-- CreateTable
CREATE TABLE "SavedHangmanPuzzle" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInstanceId" TEXT,

    CONSTRAINT "SavedHangmanPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RPGCharacter" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "defense" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "speed" INTEGER NOT NULL DEFAULT 10,
    "currentLocation" TEXT NOT NULL DEFAULT 'town',
    "questsCompleted" TEXT NOT NULL DEFAULT '[]',
    "inventory" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RPGCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RPGBattle" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "enemyType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "xpGained" INTEGER NOT NULL DEFAULT 0,
    "goldGained" INTEGER NOT NULL DEFAULT 0,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "damageTaken" INTEGER NOT NULL DEFAULT 0,
    "turns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RPGBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RPGQuestProgress" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RPGQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedHangmanPuzzle_userId_idx" ON "SavedHangmanPuzzle"("userId");

-- CreateIndex
CREATE INDEX "SavedHangmanPuzzle_sessionId_idx" ON "SavedHangmanPuzzle"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedHangmanPuzzle_puzzleId_userId_key" ON "SavedHangmanPuzzle"("puzzleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedHangmanPuzzle_puzzleId_sessionId_key" ON "SavedHangmanPuzzle"("puzzleId", "sessionId");

-- CreateIndex
CREATE INDEX "RPGCharacter_userId_idx" ON "RPGCharacter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RPGCharacter_sessionId_key" ON "RPGCharacter"("sessionId");

-- CreateIndex
CREATE INDEX "RPGBattle_characterId_idx" ON "RPGBattle"("characterId");

-- CreateIndex
CREATE INDEX "RPGBattle_createdAt_idx" ON "RPGBattle"("createdAt");

-- CreateIndex
CREATE INDEX "RPGQuestProgress_characterId_idx" ON "RPGQuestProgress"("characterId");

-- CreateIndex
CREATE INDEX "RPGQuestProgress_status_idx" ON "RPGQuestProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RPGQuestProgress_characterId_questId_key" ON "RPGQuestProgress"("characterId", "questId");

-- AddForeignKey
ALTER TABLE "SavedHangmanPuzzle" ADD CONSTRAINT "SavedHangmanPuzzle_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "HangmanPuzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RPGBattle" ADD CONSTRAINT "RPGBattle_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "RPGCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RPGQuestProgress" ADD CONSTRAINT "RPGQuestProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "RPGCharacter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
