'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';

import { Button } from '@/registry/new-york-v4/ui/button';

import { ArrowLeft, ArrowRight, Grid3X3, List } from 'lucide-react';

interface Podcast {
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

interface PodcastSectionProps {
    podcasts: Podcast[];
}

export const PodcastSection = ({ podcasts }: PodcastSectionProps) => {
    const [isGridView, setIsGridView] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollPodcasts = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 240;
            const newScrollLeft =
                scrollContainerRef.current.scrollLeft +
                (direction === 'right' ? scrollAmount : -scrollAmount);

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    if (podcasts.length === 0) return null;

    return (
        <div className='space-y-4'>
            {/* Header with view toggle */}
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>البودكاست ({podcasts.length})</h3>
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
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
                    {podcasts.map((podcast) => (
                        <div
                            key={podcast._id}
                            className='group cursor-pointer space-y-2 transition-transform hover:scale-105'>
                            {/* Podcast Image */}
                            <div className='aspect-square overflow-hidden rounded-lg shadow-sm transition-shadow group-hover:shadow-md'>
                                {podcast.image ? (
                                    <Image
                                        src={podcast.image}
                                        alt={podcast.title}
                                        className='object-cover transition-transform group-hover:scale-110'
                                        width={300}
                                        height={300}
                                        quality={90}
                                    />
                                ) : (
                                    <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                                        <span className='text-sm text-gray-400'>
                                            لا توجد صورة
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Podcast Title */}
                            <h4 className='group-hover:text-primary line-clamp-2 text-sm leading-tight font-medium transition-colors'>
                                {podcast.title}
                            </h4>

                            {/* Author/Description */}
                            <p className='text-muted-foreground line-clamp-1 text-xs'>
                                {podcast.author}
                            </p>
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
                        onClick={() => scrollPodcasts('left')}>
                        <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='absolute top-1/2 right-4 z-10 h-8 w-8 -translate-y-1/2 rounded-full p-0 shadow-md'
                        onClick={() => scrollPodcasts('right')}>
                        <ArrowRight className='h-4 w-4' />
                    </Button>

                    {/* Horizontal Scroll Container */}
                    <div
                        ref={scrollContainerRef}
                        className='scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pr-4 pb-4'>
                        {podcasts.map((podcast) => (
                            <div
                                key={podcast._id}
                                className='group w-48 flex-shrink-0 cursor-pointer space-y-2 transition-transform hover:scale-105'>
                                {/* Podcast Image */}
                                <div className='aspect-square overflow-hidden rounded-lg shadow-sm transition-shadow group-hover:shadow-md'>
                                    {podcast.image ? (
                                        <img
                                            src={podcast.image}
                                            alt={podcast.title}
                                            className='h-full w-full object-cover transition-transform group-hover:scale-110'
                                        />
                                    ) : (
                                        <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                                            <span className='text-sm text-gray-400'>
                                                لا توجد صورة
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Podcast Title */}
                                <h4 className='group-hover:text-primary line-clamp-2 text-sm leading-tight font-medium transition-colors'>
                                    {podcast.title}
                                </h4>

                                {/* Author/Description */}
                                <p className='text-muted-foreground line-clamp-1 text-xs'>
                                    {podcast.author}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
