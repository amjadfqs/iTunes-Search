import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// iTunes API interface
interface iTunesResult {
    wrapperType?: string;
    kind?: string;
    artistId?: number;
    collectionId?: number;
    trackId?: number;
    artistName?: string;
    collectionName?: string;
    trackName?: string;
    collectionCensoredName?: string;
    trackCensoredName?: string;
    artistViewUrl?: string;
    collectionViewUrl?: string;
    trackViewUrl?: string;
    previewUrl?: string;
    artworkUrl30?: string;
    artworkUrl60?: string;
    artworkUrl100?: string;
    artworkUrl160?: string;
    artworkUrl600?: string;
    collectionPrice?: number;
    trackPrice?: number;
    collectionHdPrice?: number;
    trackHdPrice?: number;
    releaseDate?: string;
    collectionExplicitness?: string;
    trackExplicitness?: string;
    discCount?: number;
    discNumber?: number;
    trackCount?: number;
    trackNumber?: number;
    trackTimeMillis?: number;
    country?: string;
    currency?: string;
    primaryGenreName?: string;
    contentAdvisoryRating?: string;
    shortDescription?: string;
    longDescription?: string;
    description?: string;
    feedUrl?: string;
    episodeUrl?: string;
    episodeGuid?: string;
    episodeContentType?: string;
    episodeFileExtension?: string;
    closedCaptioning?: string;
    artistIds?: number[];
    genreIds?: string[];
    genres?: Array<{ name: string; id: string }>;
}

interface iTunesResponse {
    resultCount: number;
    results: iTunesResult[];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get('q');

        if (!searchTerm) {
            return NextResponse.json(
                { error: 'Search term is required' },
                { status: 400 }
            );
        }

        // Call iTunes API - fetch all podcasts and podcast episodes (default limit is 50)
        const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&limit=200&media=podcast&entity=podcastEpisode,podcast`;
        const response = await fetch(iTunesUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch from iTunes API');
        }

        const data: iTunesResponse = await response.json();

        // Check which results are new (not already in database)
        const resultsWithTrackId = data.results.filter((result) => result.trackId);

        // Early return if no results have trackId
        if (resultsWithTrackId.length === 0) {
            return NextResponse.json({
                resultCount: data.resultCount,
                results: [],
                searchTerm,
                newResultsCount: 0
            });
        }

        // Separate podcasts and episodes
        const podcasts = resultsWithTrackId.filter((result) => result.kind === 'podcast');
        const episodes = resultsWithTrackId.filter(
            (result) => result.kind === 'podcast-episode'
        );

        // Find existing podcasts
        const podcastTrackIds = podcasts.map((result) => BigInt(result.trackId!));
        const existingPodcasts = await prisma.podcast.findMany({
            where: {
                trackId: {
                    in: podcastTrackIds
                }
            },
            select: {
                trackId: true
            }
        });

        const existingPodcastIds = new Set(
            existingPodcasts.map((p) => p.trackId.toString())
        );

        // Find existing episodes
        const episodeTrackIds = episodes.map((result) => BigInt(result.trackId!));
        const existingEpisodes = await prisma.podcastEpisode.findMany({
            where: {
                trackId: {
                    in: episodeTrackIds
                }
            },
            select: {
                trackId: true
            }
        });

        const existingEpisodeIds = new Set(
            existingEpisodes.map((e) => e.trackId.toString())
        );

        // Only save new podcasts and episodes
        const newPodcasts = podcasts.filter(
            (result) => !existingPodcastIds.has(result.trackId!.toString())
        );
        const newEpisodes = episodes.filter(
            (result) => !existingEpisodeIds.has(result.trackId!.toString())
        );

        // Save new podcasts
        await Promise.all(
            newPodcasts.map(async (result) => {
                const viewUrl =
                    result.trackViewUrl ||
                    result.collectionViewUrl ||
                    result.artistViewUrl;

                return await prisma.podcast.create({
                    data: {
                        trackId: BigInt(result.trackId!),
                        searchTerm,
                        trackName: result.trackName,
                        artistName: result.artistName,
                        artworkUrl100: result.artworkUrl100,
                        artworkUrl60: result.artworkUrl60,
                        viewUrl: viewUrl
                    }
                });
            })
        );

        // Save new episodes
        await Promise.all(
            newEpisodes.map(async (result) => {
                const viewUrl =
                    result.trackViewUrl ||
                    result.collectionViewUrl ||
                    result.artistViewUrl;

                return await prisma.podcastEpisode.create({
                    data: {
                        trackId: BigInt(result.trackId!),
                        searchTerm,
                        trackName: result.trackName,
                        artistName: result.artistName,
                        collectionName: result.collectionName,
                        artworkUrl100: result.artworkUrl100,
                        artworkUrl60: result.artworkUrl60,
                        viewUrl: viewUrl,
                        trackTimeMillis: result.trackTimeMillis,
                        releaseDate: result.releaseDate
                    }
                });
            })
        );

        return NextResponse.json({
            message: 'Search completed and results saved',
            newPodcastsCount: newPodcasts.length,
            newEpisodesCount: newEpisodes.length,
            totalNewResults: newPodcasts.length + newEpisodes.length
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
