-- CreateIndex
CREATE INDEX "HangmanDailyInstance_puzzleId_idx" ON "HangmanDailyInstance"("puzzleId");

-- CreateIndex
CREATE INDEX "HangmanDailySchedule_puzzleId_idx" ON "HangmanDailySchedule"("puzzleId");

-- CreateIndex
CREATE INDEX "HangmanPlay_instanceId_idx" ON "HangmanPlay"("instanceId");
