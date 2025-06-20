'use client';

import { useRef, useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';

import { ArrowLeft, ArrowRight, Grid3X3, List, Play } from 'lucide-react';

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
                    {isGridView ? (
                        <List className='h-4 w-4' />
                    ) : (
                        <Grid3X3 className='h-4 w-4' />
                    )}
                </Button>
            </div>

            {/* Grid View */}
            {isGridView ? (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {episodes.map((episode) => (
                        <div key={episode._id} className='group cursor-pointer'>
                            <div className='flex gap-4 rounded-lg border border-white/30 bg-white/5 p-4 shadow-lg backdrop-blur-md transition-all hover:bg-white/30 hover:shadow-xl'>
                                {/* Episode Image with Play Button */}
                                <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100'>
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

                                    {/* Play Button Overlay */}
                                    <div className='absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100'>
                                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg'>
                                            <Play
                                                className='ml-0.5 h-4 w-4 text-gray-900'
                                                fill='currentColor'
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Episode Metadata */}
                                <div className='flex min-w-0 flex-1 flex-col justify-between'>
                                    <div className='space-y-1'>
                                        {/* Podcast Name */}
                                        <p className='cursor-pointer truncate text-sm font-medium text-[#E3BD71]'>
                                            {episode.podcast.title}
                                        </p>

                                        {/* Episode Title */}
                                        <h4 className='line-clamp-2 cursor-pointer text-sm font-medium text-white'>
                                            {episode.title}
                                        </h4>
                                    </div>

                                    {/* Release Date and Duration */}
                                    <div className='flex items-center justify-between text-sm text-gray-500'>
                                        <span>
                                            {formatReleaseDate(episode.published)}
                                        </span>
                                        <span>{formatDuration(episode.duration)}</span>
                                    </div>
                                </div>
                            </div>
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
                            <div
                                key={episode._id}
                                className='group w-96 flex-shrink-0 cursor-pointer'>
                                <div className='flex gap-4 rounded-lg border border-white/30 bg-white/5 p-4 shadow-lg backdrop-blur-md transition-all hover:bg-white/30 hover:shadow-xl'>
                                    {/* Episode Image with Play Button */}
                                    <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100'>
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

                                        {/* Play Button Overlay */}
                                        <div className='absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100'>
                                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg'>
                                                <Play
                                                    className='ml-0.5 h-4 w-4 text-gray-900'
                                                    fill='currentColor'
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Episode Metadata */}
                                    <div className='flex min-w-0 flex-1 flex-col justify-between'>
                                        <div className='space-y-1'>
                                            {/* Podcast Name */}
                                            <p className='cursor-pointer truncate text-sm font-medium text-[#E3BD71]'>
                                                {episode.podcast.title}
                                            </p>

                                            {/* Episode Title */}
                                            <h4 className='line-clamp-2 cursor-pointer text-sm font-medium text-white'>
                                                {episode.title}
                                            </h4>
                                        </div>

                                        {/* Release Date and Duration */}
                                        <div className='flex items-center justify-between text-sm text-gray-500'>
                                            <span>
                                                {formatReleaseDate(episode.published)}
                                            </span>
                                            <span>
                                                {formatDuration(episode.duration)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
