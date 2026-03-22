-- CreateTable
CREATE TABLE "SocialBlock" (
    "id" TEXT NOT NULL,
    "blockerProfileId" TEXT NOT NULL,
    "blockedProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialBlock_blocker_blocked_key" ON "SocialBlock"("blockerProfileId", "blockedProfileId");

-- CreateIndex
CREATE INDEX "SocialBlock_blockerProfileId_createdAt_idx" ON "SocialBlock"("blockerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialBlock_blockedProfileId_createdAt_idx" ON "SocialBlock"("blockedProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialBlock" ADD CONSTRAINT "SocialBlock_blockerProfileId_fkey" FOREIGN KEY ("blockerProfileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialBlock" ADD CONSTRAINT "SocialBlock_blockedProfileId_fkey" FOREIGN KEY ("blockedProfileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
