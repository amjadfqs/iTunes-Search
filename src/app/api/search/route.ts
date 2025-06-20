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
            return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
        }

        // Call iTunes API with offset
        const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`;
        const response = await fetch(iTunesUrl);
        console.error('Fetching iTunes API:', response);

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

        const trackIds = resultsWithTrackId.map((result) => result.trackId!);

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

        const existingTrackIds = new Set(existingResults.map((r) => r.trackId));

        // Only save new results that don't exist in database
        const newResults = resultsWithTrackId.filter((result) => !existingTrackIds.has(result.trackId!));

        const savedResults = await Promise.all([
            // Save only new results
            ...newResults.map(async (result) => {
                return await prisma.searchResult.create({
                    data: {
                        trackId: result.trackId!,
                        searchTerm,
                        wrapperType: result.wrapperType,
                        kind: result.kind,
                        artistId: result.artistId,
                        collectionId: result.collectionId,
                        artistName: result.artistName,
                        collectionName: result.collectionName,
                        trackName: result.trackName,
                        collectionCensoredName: result.collectionCensoredName,
                        trackCensoredName: result.trackCensoredName,
                        artistViewUrl: result.artistViewUrl,
                        collectionViewUrl: result.collectionViewUrl,
                        trackViewUrl: result.trackViewUrl,
                        previewUrl: result.previewUrl,
                        artworkUrl30: result.artworkUrl30,
                        artworkUrl60: result.artworkUrl60,
                        artworkUrl100: result.artworkUrl100,
                        collectionPrice: result.collectionPrice,
                        trackPrice: result.trackPrice,
                        collectionHdPrice: result.collectionHdPrice,
                        trackHdPrice: result.trackHdPrice,
                        releaseDate: result.releaseDate,
                        collectionExplicitness: result.collectionExplicitness,
                        trackExplicitness: result.trackExplicitness,
                        discCount: result.discCount,
                        discNumber: result.discNumber,
                        trackCount: result.trackCount,
                        trackNumber: result.trackNumber,
                        trackTimeMillis: result.trackTimeMillis,
                        country: result.country,
                        currency: result.currency,
                        primaryGenreName: result.primaryGenreName,
                        contentAdvisoryRating: result.contentAdvisoryRating,
                        shortDescription: result.shortDescription,
                        longDescription: result.longDescription
                    }
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
        const allResults = savedResults.filter((result) => result !== null).sort((a, b) => a!.trackId - b!.trackId);

        return NextResponse.json({
            resultCount: data.resultCount,
            results: allResults,
            searchTerm,
            hasMore: data.results.length === limit,
            newResultsCount: newResults.length,
            offset: offset
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
