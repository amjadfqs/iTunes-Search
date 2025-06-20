import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get('q');
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        if (!searchTerm) {
            return NextResponse.json(
                { error: 'Search term is required' },
                { status: 400 }
            );
        }

        // Get paginated podcasts from database
        const podcasts = await prisma.podcast.findMany({
            where: {
                OR: [
                    {
                        searchTerm: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        trackName: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        artistName: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            orderBy: [
                {
                    trackName: 'asc'
                },
                {
                    createdAt: 'desc'
                }
            ],
            skip: offset,
            take: limit
        });

        // Get paginated episodes from database
        const episodes = await prisma.podcastEpisode.findMany({
            where: {
                OR: [
                    {
                        searchTerm: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        trackName: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        artistName: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        collectionName: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            orderBy: [
                {
                    trackName: 'asc'
                },
                {
                    createdAt: 'desc'
                }
            ],
            skip: offset,
            take: limit
        });

        // Get total count for pagination info
        const [podcastCount, episodeCount] = await Promise.all([
            prisma.podcast.count({
                where: {
                    OR: [
                        {
                            searchTerm: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        },
                        {
                            trackName: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        },
                        {
                            artistName: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            }),
            prisma.podcastEpisode.count({
                where: {
                    OR: [
                        {
                            searchTerm: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        },
                        {
                            trackName: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        },
                        {
                            artistName: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        },
                        {
                            collectionName: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            })
        ]);

        const totalCount = podcastCount + episodeCount;

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

        // Format podcasts
        const formattedPodcasts: PodcastResult[] = podcasts.map((podcast) => ({
            _id: podcast.trackId.toString(),
            explicit: false,
            private: false,
            topResultFor: [],
            title: podcast.trackName || 'Unknown Title',
            author: podcast.artistName || 'Unknown Author',
            image: podcast.artworkUrl100 || podcast.artworkUrl60 || '',
            slug: (podcast.trackName || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            feed_url: podcast.viewUrl || ''
        }));

        // Format episodes
        const formattedEpisodes: EpisodeResult[] = episodes.map((episode) => ({
            _id: episode.trackId.toString(),
            podcast_id: episode.collectionName || 'unknown',
            description: 'Episode description not available',
            duration: '0',
            image: episode.artworkUrl100 || episode.artworkUrl60 || '',
            published: episode.createdAt.toISOString(),
            timestamp: Math.floor(new Date(episode.createdAt).getTime() / 1000),
            title: episode.trackName || 'Unknown Episode',
            podcast: {
                _id: episode.collectionName || 'unknown',
                explicit: false,
                title: episode.collectionName || 'Unknown Show',
                image: episode.artworkUrl100 || episode.artworkUrl60 || '',
                hue: '39.31034482758622',
                slug: (episode.collectionName || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
            },
            mediaURL: episode.viewUrl || '',
            hasVideo: false,
            highlights: {
                title: [
                    {
                        value: episode.trackName || 'Unknown',
                        type: 'hit'
                    }
                ]
            }
        }));

        return NextResponse.json({
            podcasts: formattedPodcasts,
            episodes: formattedEpisodes,
            pagination: {
                offset,
                limit,
                total: totalCount,
                hasMore: offset + limit < totalCount
            }
        });
    } catch (error) {
        console.error('Results API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
