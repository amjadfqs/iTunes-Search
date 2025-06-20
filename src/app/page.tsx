'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useSearch } from '@/hooks/use-search';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';

import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Loader2,
    Music,
    Search
} from 'lucide-react';

const Page = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeSearch = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(activeSearch);
    const [showScrollIndicators, setShowScrollIndicators] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSearch(activeSearch);

    // Update input when URL changes
    useEffect(() => {
        setSearchTerm(activeSearch);
    }, [activeSearch]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus search input when pressing '/' or 'Ctrl+K'
            if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
                e.preventDefault();
                const searchInput = document.querySelector(
                    'input[type="text"]'
                ) as HTMLInputElement;
                searchInput?.focus();
            }
            // Clear search when pressing Escape
            if (e.key === 'Escape' && activeSearch) {
                e.preventDefault();
                clearSearch();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeSearch]);

    const updateSearchParam = (query: string) => {
        if (query.trim()) {
            const params = new URLSearchParams();
            params.set('q', query.trim());
            router.push(`/?${params.toString()}`);
        } else {
            router.push('/');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateSearchParam(searchTerm);
    };

    const clearSearch = () => {
        setSearchTerm('');
        router.push('/');
    };

    // Flatten all results from all pages
    const allPodcasts = data?.pages.flatMap((page) => page.podcasts) || [];
    const allEpisodes = data?.pages.flatMap((page) => page.episodes) || [];
    const totalResults = allPodcasts.length + allEpisodes.length;

    // Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 1000
            ) {
                if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Check if podcasts scroll container needs indicators
    useEffect(() => {
        const checkScrollNeeded = () => {
            if (scrollContainerRef.current) {
                const { scrollWidth, clientWidth } = scrollContainerRef.current;
                setShowScrollIndicators(scrollWidth > clientWidth);
            }
        };

        checkScrollNeeded();
        window.addEventListener('resize', checkScrollNeeded);
        return () => window.removeEventListener('resize', checkScrollNeeded);
    }, [allPodcasts]);

    const scrollPodcasts = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 240; // Width of one card plus gap
            const newScrollLeft =
                scrollContainerRef.current.scrollLeft +
                (direction === 'right' ? scrollAmount : -scrollAmount);

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className='bg-background min-h-screen'>
            <div className='container mx-auto px-4 py-8'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='mb-4 flex items-center justify-center gap-2'>
                        <Music className='text-primary h-8 w-8' />
                        <h1 className='text-3xl font-bold tracking-tight'>
                            iTunes Search
                        </h1>
                    </div>
                    <p className='text-muted-foreground'>
                        Search for music, movies, apps, and more from the iTunes Store
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className='mx-auto mb-8 max-w-xl'>
                    <div className='flex gap-2'>
                        <div className='relative flex-1'>
                            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                            <Input
                                type='text'
                                placeholder='Search for songs, artists, albums... (Press / to focus)'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pr-10 pl-10'
                            />
                            {searchTerm && (
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0'
                                    onClick={clearSearch}>
                                    ×
                                </Button>
                            )}
                        </div>
                        <Button type='submit' disabled={isLoading || !searchTerm.trim()}>
                            {isLoading ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                                <Search className='h-4 w-4' />
                            )}
                        </Button>
                    </div>
                </form>

                {/* Results */}
                <div className='mx-auto max-w-4xl'>
                    {error && (
                        <Card className='border-destructive'>
                            <CardContent className='pt-6'>
                                <p className='text-destructive'>
                                    Error:{' '}
                                    {error instanceof Error
                                        ? error.message
                                        : 'Something went wrong'}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {isLoading && (
                        <div className='py-8 text-center'>
                            <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin' />
                            <p className='text-muted-foreground'>Searching iTunes...</p>
                        </div>
                    )}

                    {data && totalResults > 0 && (
                        <div className='space-y-8'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-semibold'>Search Results</h2>
                                <Badge variant='secondary'>
                                    {totalResults} result{totalResults !== 1 ? 's' : ''}{' '}
                                    found
                                </Badge>
                            </div>

                            {/* Podcasts Section - Horizontal Scroll */}
                            {allPodcasts.length > 0 && (
                                <div className='space-y-4'>
                                    <h3 className='flex items-center gap-2 text-lg font-semibold'>
                                        <Music className='h-5 w-5' />
                                        Podcasts ({allPodcasts.length})
                                    </h3>
                                    <div className='relative'>
                                        {/* Scroll Indicators */}
                                        {showScrollIndicators && (
                                            <>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    className='absolute top-1/2 left-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full p-0 shadow-md'
                                                    onClick={() =>
                                                        scrollPodcasts('left')
                                                    }>
                                                    <ChevronLeft className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    className='absolute top-1/2 right-4 z-10 h-8 w-8 -translate-y-1/2 rounded-full p-0 shadow-md'
                                                    onClick={() =>
                                                        scrollPodcasts('right')
                                                    }>
                                                    <ChevronRight className='h-4 w-4' />
                                                </Button>
                                            </>
                                        )}
                                        <div
                                            ref={scrollContainerRef}
                                            className='scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pr-4 pb-4 md:gap-4'>
                                            {allPodcasts.map((podcast) => (
                                                <Card
                                                    key={podcast._id}
                                                    className='w-48 flex-shrink-0 transition-shadow hover:shadow-md sm:w-56 md:w-64'>
                                                    <CardContent className='p-3 md:p-4'>
                                                        <div className='space-y-2 md:space-y-3'>
                                                            {/* Artwork */}
                                                            {podcast.image && (
                                                                <div className='relative'>
                                                                    <img
                                                                        src={
                                                                            podcast.image
                                                                        }
                                                                        alt={
                                                                            podcast.title
                                                                        }
                                                                        className='aspect-square w-full rounded-lg object-cover'
                                                                    />
                                                                    <Badge
                                                                        variant='secondary'
                                                                        className='absolute top-2 right-2 text-xs'>
                                                                        Podcast
                                                                    </Badge>
                                                                </div>
                                                            )}

                                                            {/* Content */}
                                                            <div className='space-y-1 md:space-y-2'>
                                                                <h4 className='line-clamp-2 text-xs leading-tight font-semibold md:text-sm'>
                                                                    {podcast.title}
                                                                </h4>
                                                                <p className='text-muted-foreground line-clamp-1 text-xs'>
                                                                    by {podcast.author}
                                                                </p>

                                                                {/* Link */}
                                                                {podcast.feed_url && (
                                                                    <Button
                                                                        size='sm'
                                                                        variant='outline'
                                                                        asChild
                                                                        className='w-full text-xs'>
                                                                        <a
                                                                            href={
                                                                                podcast.feed_url
                                                                            }
                                                                            target='_blank'
                                                                            rel='noopener noreferrer'
                                                                            className='flex items-center gap-1'>
                                                                            <ExternalLink className='h-3 w-3' />
                                                                            View Podcast
                                                                        </a>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Episodes Section - Compact List */}
                            {allEpisodes.length > 0 && (
                                <div className='space-y-4'>
                                    <h3 className='flex items-center gap-2 text-lg font-semibold'>
                                        <Music className='h-5 w-5' />
                                        Podcast Episodes ({allEpisodes.length})
                                    </h3>
                                    <div className='space-y-2 md:space-y-3'>
                                        {allEpisodes.map((episode) => (
                                            <Card
                                                key={episode._id}
                                                className='transition-shadow hover:shadow-sm'>
                                                <CardContent className='p-3 md:p-4'>
                                                    <div className='flex gap-2 md:gap-3'>
                                                        {/* Artwork */}
                                                        {episode.image && (
                                                            <div className='flex-shrink-0'>
                                                                <img
                                                                    src={episode.image}
                                                                    alt={episode.title}
                                                                    className='h-12 w-12 rounded-md object-cover md:h-16 md:w-16'
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Content */}
                                                        <div className='min-w-0 flex-1'>
                                                            <div className='flex items-start justify-between gap-2 md:gap-3'>
                                                                <div className='min-w-0 flex-1'>
                                                                    <h4 className='mb-1 line-clamp-2 text-xs leading-tight font-semibold md:text-sm'>
                                                                        {episode.title}
                                                                    </h4>
                                                                    <p className='text-muted-foreground mb-1 line-clamp-1 text-xs'>
                                                                        {
                                                                            episode
                                                                                .podcast
                                                                                .title
                                                                        }
                                                                    </p>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Badge
                                                                            variant='outline'
                                                                            className='px-2 py-0 text-xs'>
                                                                            Podcast
                                                                            Episode
                                                                        </Badge>
                                                                        <span className='text-muted-foreground text-xs'>
                                                                            {new Date(
                                                                                episode.published
                                                                            ).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Action Button */}
                                                                {episode.mediaURL && (
                                                                    <Button
                                                                        size='sm'
                                                                        variant='outline'
                                                                        asChild>
                                                                        <a
                                                                            href={
                                                                                episode.mediaURL
                                                                            }
                                                                            target='_blank'
                                                                            rel='noopener noreferrer'
                                                                            className='flex items-center gap-1 px-2 text-xs'>
                                                                            <ExternalLink className='h-3 w-3' />
                                                                            Listen
                                                                        </a>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Load More Button */}
                            {hasNextPage && (
                                <div className='flex flex-col items-center gap-2 pt-6'>
                                    <Button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        variant='outline'
                                        size='lg'>
                                        {isFetchingNextPage ? (
                                            <>
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                Loading more...
                                            </>
                                        ) : (
                                            <>
                                                <Search className='mr-2 h-4 w-4' />
                                                Load More Results
                                            </>
                                        )}
                                    </Button>
                                    {isFetchingNextPage && (
                                        <p className='text-muted-foreground text-xs'>
                                            Fetching new results and saving unique items
                                            to database...
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Show message when no more results */}
                            {!hasNextPage && totalResults > 0 && (
                                <div className='pt-6 text-center'>
                                    <p className='text-muted-foreground text-sm'>
                                        End of results ({totalResults} items loaded)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {data && totalResults === 0 && (
                        <Card>
                            <CardContent className='pt-6 text-center'>
                                <Music className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                                <p className='text-muted-foreground'>
                                    No podcasts or episodes found
                                </p>
                                <p className='text-muted-foreground mt-2 text-sm'>
                                    Try a different search term
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;
