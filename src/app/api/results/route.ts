import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        // Get all results from database for this search term
        const results = await prisma.searchResult.findMany({
            where: {
                OR: [
                    {
                        searchTerm: {
                            contains: searchTerm
                        }
                    },
                    {
                        trackName: {
                            contains: searchTerm
                        }
                    },
                    {
                        artistName: {
                            contains: searchTerm
                        }
                    },
                    {
                        collectionName: {
                            contains: searchTerm
                        }
                    }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Define proper types
        interface PodcastResult {
            _id: string;
            explicit: boolean;
            private: boolean;
            topResultFor: any[];
            title: string;
            author: string;
            image: string;
            slug: string;
            feed_url: string;
        }

        interface EpisodeResult {
            _id: string;
            podcast_id: string;
            description: string;
            duration: string;
            image: string;
            published: string;
            timestamp: number;
            title: string;
            podcast: {
                _id: string;
                explicit: boolean;
                title: string;
                image: string;
                hue: string;
                slug: string;
            };
            mediaURL: string;
            hasVideo: boolean;
            highlights: {
                title: Array<{
                    value: string;
                    type: string;
                }>;
            };
        }

        // Separate podcasts and episodes
        const podcasts: PodcastResult[] = [];
        const episodes: EpisodeResult[] = [];

        results.forEach((result) => {
            if (result.kind === 'podcast') {
                podcasts.push({
                    _id: result.trackId.toString(),
                    explicit: false, // We don't store this info
                    private: false,
                    topResultFor: [],
                    title: result.trackName || result.collectionName || 'Unknown Title',
                    author: result.artistName || 'Unknown Author',
                    image: result.artworkUrl100 || result.artworkUrl60 || '',
                    slug: (result.trackName || result.collectionName || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    feed_url: result.viewUrl || ''
                });
            } else if (result.kind === 'podcast-episode') {
                episodes.push({
                    _id: result.trackId.toString(),
                    podcast_id: result.collectionName || 'unknown',
                    description: 'Episode description not available', // We don't store descriptions
                    duration: '0', // We don't store duration
                    image: result.artworkUrl100 || result.artworkUrl60 || '',
                    published: result.createdAt.toISOString(),
                    timestamp: Math.floor(new Date(result.createdAt).getTime() / 1000),
                    title: result.trackName || 'Unknown Episode',
                    podcast: {
                        _id: result.collectionName || 'unknown',
                        explicit: false,
                        title: result.collectionName || 'Unknown Show',
                        image: result.artworkUrl100 || result.artworkUrl60 || '',
                        hue: '39.31034482758622', // Default hue
                        slug: (result.collectionName || '')
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                    },
                    mediaURL: result.viewUrl || '',
                    hasVideo: false, // Podcast episodes are audio
                    highlights: {
                        title: [
                            {
                                value: result.trackName || 'Unknown',
                                type: 'hit'
                            }
                        ]
                    }
                });
            }
        });

        // Convert BigInt to string for JSON serialization
        const apiResponse = JSON.parse(
            JSON.stringify(
                {
                    podcasts,
                    episodes
                },
                (key, value) => (typeof value === 'bigint' ? value.toString() : value)
            )
        );

        return NextResponse.json(apiResponse);
    } catch (error) {
        console.error('Results API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
