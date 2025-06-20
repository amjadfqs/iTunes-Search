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
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!searchTerm) {
            return NextResponse.json(
                { error: 'Search term is required' },
                { status: 400 }
            );
        }

        // Call iTunes API with offset - only fetch podcasts and podcast episodes
        const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}&media=podcast&entity=podcastEpisode,podcast`;
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
                hasMore: data.results.length === limit,
                newResultsCount: 0,
                offset: offset
            });
        }

        const trackIds = resultsWithTrackId.map((result) => BigInt(result.trackId!));

        // Find existing track IDs in database
        const existingResults = await prisma.searchResult.findMany({
            where: {
                trackId: {
                    in: trackIds
                }
            },
            select: {
                trackId: true
            }
        });

        const existingTrackIds = new Set(
            existingResults.map((r) => r.trackId.toString())
        );

        // Only save new results that don't exist in database
        const newResults = resultsWithTrackId.filter(
            (result) => !existingTrackIds.has(result.trackId!.toString())
        );

        const savedResults = await Promise.all([
            // Save only new results
            ...newResults.map(async (result) => {
                // Determine the best viewUrl to use
                const viewUrl =
                    result.trackViewUrl ||
                    result.collectionViewUrl ||
                    result.artistViewUrl;

                return await prisma.searchResult.create({
                    data: {
                        trackId: BigInt(result.trackId!),
                        searchTerm,
                        kind: result.kind,
                        trackName: result.trackName,
                        artistName: result.artistName,
                        collectionName: result.collectionName,
                        artworkUrl100: result.artworkUrl100,
                        artworkUrl60: result.artworkUrl60,
                        viewUrl: viewUrl
                    } as any
                });
            }),
            // Get existing results to return them too
            ...existingResults.map(async (existingResult) => {
                return await prisma.searchResult.findUnique({
                    where: {
                        trackId: existingResult.trackId
                    }
                });
            })
        ]);

        // Filter out any null results and sort by trackId for consistency
        const allResults = savedResults
            .filter((result) => result !== null)
            .sort((a, b) => Number(a!.trackId) - Number(b!.trackId));

        // Convert BigInt to string for JSON serialization
        const apiResponse = JSON.parse(
            JSON.stringify(
                {
                    resultCount: data.resultCount,
                    results: allResults,
                    searchTerm,
                    hasMore: data.results.length === limit && allResults.length > 0,
                    newResultsCount: newResults.length,
                    offset: offset,
                    totalFetched: allResults.length
                },
                (key, value) => (typeof value === 'bigint' ? value.toString() : value)
            )
        );

        return NextResponse.json(apiResponse);
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
