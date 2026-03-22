-- CreateTable
CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "followToken" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialFollow" (
    "id" TEXT NOT NULL,
    "followerProfileId" TEXT NOT NULL,
    "followingProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_handle_key" ON "SocialProfile"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_followToken_key" ON "SocialProfile"("followToken");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_sessionId_key" ON "SocialProfile"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_userId_key" ON "SocialProfile"("userId");

-- CreateIndex
CREATE INDEX "SocialProfile_createdAt_idx" ON "SocialProfile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFollow_follower_following_key" ON "SocialFollow"("followerProfileId", "followingProfileId");

-- CreateIndex
CREATE INDEX "SocialFollow_followerProfileId_createdAt_idx" ON "SocialFollow"("followerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialFollow_followingProfileId_createdAt_idx" ON "SocialFollow"("followingProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialFollow" ADD CONSTRAINT "SocialFollow_followerProfileId_fkey" FOREIGN KEY ("followerProfileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFollow" ADD CONSTRAINT "SocialFollow_followingProfileId_fkey" FOREIGN KEY ("followingProfileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
