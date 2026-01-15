-- CreateTable
CREATE TABLE "HangmanPuzzle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "hint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangmanPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HangmanPuzzle_slug_key" ON "HangmanPuzzle"("slug");
