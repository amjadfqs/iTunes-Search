'use client';

import { useRef, useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent } from '@/registry/new-york-v4/ui/card';

import { ArrowLeft, ArrowRight, Grid3X3 } from 'lucide-react';

interface Episode {
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

interface EpisodeSectionProps {
    episodes: Episode[];
}

export const EpisodeSection = ({ episodes }: EpisodeSectionProps) => {
    const [isGridView, setIsGridView] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollEpisodes = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            const newScrollLeft =
                scrollContainerRef.current.scrollLeft +
                (direction === 'right' ? scrollAmount : -scrollAmount);

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    const formatDuration = (duration: string) => {
        const durationMs = parseInt(duration);
        if (isNaN(durationMs) || durationMs === 0) return 'Unknown';

        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatReleaseDate = (published: string) => {
        try {
            const date = new Date(published);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Unknown';
        }
    };

    if (episodes.length === 0) return null;

    return (
        <div className='space-y-4'>
            {/* Header with view toggle */}
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Episodes ({episodes.length})</h3>
                <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setIsGridView(!isGridView)}
                    className='h-8 w-8 p-0'>
                    <Grid3X3 className='h-4 w-4' />
                </Button>
            </div>

            {/* Grid View */}
            {isGridView ? (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {episodes.map((episode) => (
                        <div
                            key={episode._id}
                            className='group cursor-pointer transition-transform hover:scale-[1.02]'>
                            <Card className='h-full shadow-sm transition-shadow group-hover:shadow-md'>
                                <CardContent className='p-4'>
                                    <div className='flex gap-3'>
                                        {/* Episode Image */}
                                        <div className='flex-shrink-0'>
                                            <div className='h-16 w-16 overflow-hidden rounded-lg'>
                                                {episode.image ? (
                                                    <img
                                                        src={episode.image}
                                                        alt={episode.title}
                                                        className='h-full w-full object-cover transition-transform group-hover:scale-110'
                                                    />
                                                ) : (
                                                    <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                                                        <span className='text-xs text-gray-400'>
                                                            No Image
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Episode Content */}
                                        <div className='min-w-0 flex-1 space-y-1'>
                                            {/* Title */}
                                            <h4 className='group-hover:text-primary line-clamp-2 text-sm leading-tight font-medium transition-colors'>
                                                {episode.title}
                                            </h4>

                                            {/* Author/Podcast */}
                                            <p className='text-muted-foreground line-clamp-1 text-xs'>
                                                {episode.podcast.title}
                                            </p>

                                            {/* Release Date and Duration */}
                                            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                                <span>{formatReleaseDate(episode.published)}</span>
                                                <span>{formatDuration(episode.duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                /* Horizontal Scroll View */
                <div className='relative'>
                    {/* Scroll Buttons */}
                    <Button
                        variant='outline'
                        size='sm'
                        className='absolute top-1/2 left-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full p-0 shadow-md'
                        onClick={() => scrollEpisodes('left')}>
                        <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='absolute top-1/2 right-4 z-10 h-8 w-8 -translate-y-1/2 rounded-full p-0 shadow-md'
                        onClick={() => scrollEpisodes('right')}>
                        <ArrowRight className='h-4 w-4' />
                    </Button>

                    {/* Horizontal Scroll Container */}
                    <div
                        ref={scrollContainerRef}
                        className='scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pr-4 pb-4'>
                        {episodes.map((episode) => (
                            <Card
                                key={episode._id}
                                className='w-80 flex-shrink-0 transition-shadow hover:shadow-md'>
                                <CardContent className='p-4'>
                                    <div className='flex gap-3'>
                                        {/* Episode Image */}
                                        <div className='flex-shrink-0'>
                                            <div className='h-16 w-16 overflow-hidden rounded-lg'>
                                                {episode.image ? (
                                                    <img
                                                        src={episode.image}
                                                        alt={episode.title}
                                                        className='h-full w-full object-cover'
                                                    />
                                                ) : (
                                                    <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                                                        <span className='text-xs text-gray-400'>
                                                            No Image
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Episode Content */}
                                        <div className='min-w-0 flex-1 space-y-1'>
                                            {/* Title */}
                                            <h4 className='line-clamp-2 text-sm leading-tight font-medium'>
                                                {episode.title}
                                            </h4>

                                            {/* Author/Podcast */}
                                            <p className='text-muted-foreground line-clamp-1 text-xs'>
                                                {episode.podcast.title}
                                            </p>

                                            {/* Release Date and Duration */}
                                            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                                <span>{formatReleaseDate(episode.published)}</span>
                                                <span>{formatDuration(episode.duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
