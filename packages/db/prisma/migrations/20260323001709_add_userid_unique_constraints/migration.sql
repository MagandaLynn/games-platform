/*
  Warnings:

  - A unique constraint covering the columns `[instanceId,userId]` on the table `HangmanPlay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[puzzleNumber,userId]` on the table `SemantleDailyPlay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seed,mode,userId]` on the table `WurpleDailyPlay` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HangmanPlay_instanceId_userId_key" ON "HangmanPlay"("instanceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SemantleDailyPlay_puzzleNumber_userId_key" ON "SemantleDailyPlay"("puzzleNumber", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WurpleDailyPlay_seed_mode_userId_key" ON "WurpleDailyPlay"("seed", "mode", "userId");

-- RenameIndex
ALTER INDEX "SemantleDailyPlay_puzzle_session_key" RENAME TO "SemantleDailyPlay_puzzleNumber_sessionId_key";

-- RenameIndex
ALTER INDEX "SocialBlock_blocker_blocked_key" RENAME TO "SocialBlock_blockerProfileId_blockedProfileId_key";

-- RenameIndex
ALTER INDEX "SocialFollow_follower_following_key" RENAME TO "SocialFollow_followerProfileId_followingProfileId_key";

-- RenameIndex
ALTER INDEX "WurpleDailyPlay_seed_mode_session_key" RENAME TO "WurpleDailyPlay_seed_mode_sessionId_key";
