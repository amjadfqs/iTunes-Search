-- CreateTable
CREATE TABLE "podcasts" (
    "trackId" BIGINT NOT NULL,
    "searchTerm" TEXT NOT NULL,
    "trackName" TEXT,
    "artistName" TEXT,
    "artworkUrl600" TEXT,
    "artworkUrl100" TEXT,
    "viewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcasts_pkey" PRIMARY KEY ("trackId")
);

-- CreateTable
CREATE TABLE "podcast_episodes" (
    "trackId" BIGINT NOT NULL,
    "searchTerm" TEXT NOT NULL,
    "trackName" TEXT,
    "artistName" TEXT,
    "collectionName" TEXT,
    "artworkUrl600" TEXT,
    "artworkUrl100" TEXT,
    "viewUrl" TEXT,
    "trackTimeMillis" INTEGER,
    "releaseDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "podcastId" BIGINT,

    CONSTRAINT "podcast_episodes_pkey" PRIMARY KEY ("trackId")
);

-- AddForeignKey
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "podcasts"("trackId") ON DELETE SET NULL ON UPDATE CASCADE;
