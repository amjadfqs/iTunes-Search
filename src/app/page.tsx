'use client';

import { useEffect, useState } from 'react';

import { useSearch } from '@/hooks/use-search';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';

import { Database, ExternalLink, Loader2, Music, Search } from 'lucide-react';

const Page = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearch(activeSearch);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setActiveSearch(searchTerm.trim());
        }
    };

    const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
        if (!price) return 'Free';
        return `${currency || '$'}${price.toFixed(2)}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    // Flatten all results from all pages
    const allResults = data?.pages.flatMap((page) => page.results) || [];
    const totalResultsFromItunes = data?.pages[0]?.resultCount || 0;
    const totalNewResults = data?.pages.reduce((sum, page) => sum + (page.newResultsCount || 0), 0) || 0;

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

    return (
        <div className='bg-background min-h-screen'>
            <div className='container mx-auto px-4 py-8'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <div className='mb-4 flex items-center justify-center gap-2'>
                        <Music className='text-primary h-8 w-8' />
                        <h1 className='text-3xl font-bold tracking-tight'>iTunes Search</h1>
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
                                placeholder='Search for songs, artists, albums...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pl-10'
                            />
                        </div>
                        <Button type='submit' disabled={isLoading || !searchTerm.trim()}>
                            {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
                        </Button>
                    </div>
                </form>

                {/* Results */}
                <div className='mx-auto max-w-4xl'>
                    {error && (
                        <Card className='border-destructive'>
                            <CardContent className='pt-6'>
                                <p className='text-destructive'>
                                    Error: {error instanceof Error ? error.message : 'Something went wrong'}
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

                    {data && allResults.length > 0 && (
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-semibold'>
                                    Search Results for "{data.pages[0].searchTerm}"
                                </h2>
                                <div className='flex gap-2'>
                                    <Badge variant='secondary'>
                                        Showing {allResults.length} of {totalResultsFromItunes} result
                                        {totalResultsFromItunes !== 1 ? 's' : ''}
                                    </Badge>
                                    {totalNewResults > 0 && (
                                        <Badge variant='outline' className='border-green-600 text-green-600'>
                                            <Database className='mr-1 h-3 w-3' />
                                            {totalNewResults} new saved
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className='grid gap-4'>
                                {allResults.map((result) => (
                                    <Card key={result.trackId} className='transition-shadow hover:shadow-md'>
                                        <CardContent className='p-6'>
                                            <div className='flex gap-4'>
                                                {/* Artwork */}
                                                {result.artworkUrl100 && (
                                                    <div className='flex-shrink-0'>
                                                        <img
                                                            src={result.artworkUrl100}
                                                            alt={result.trackName || result.collectionName || 'Artwork'}
                                                            className='h-20 w-20 rounded-lg object-cover'
                                                        />
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className='min-w-0 flex-1'>
                                                    <div className='flex items-start justify-between gap-4'>
                                                        <div className='min-w-0 flex-1'>
                                                            {result.trackName && (
                                                                <h3 className='mb-1 text-lg leading-tight font-semibold'>
                                                                    {result.trackName}
                                                                </h3>
                                                            )}
                                                            {result.artistName && (
                                                                <p className='text-muted-foreground mb-1'>
                                                                    by {result.artistName}
                                                                </p>
                                                            )}
                                                            {result.collectionName && (
                                                                <p className='text-muted-foreground mb-2 text-sm'>
                                                                    from {result.collectionName}
                                                                </p>
                                                            )}

                                                            <div className='mb-3 flex flex-wrap gap-2'>
                                                                {result.kind && (
                                                                    <Badge variant='outline' className='text-xs'>
                                                                        {result.kind}
                                                                    </Badge>
                                                                )}
                                                                {result.primaryGenreName && (
                                                                    <Badge variant='outline' className='text-xs'>
                                                                        {result.primaryGenreName}
                                                                    </Badge>
                                                                )}
                                                                {result.releaseDate && (
                                                                    <Badge variant='outline' className='text-xs'>
                                                                        {formatDate(result.releaseDate)}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Additional Info */}
                                                            {result.shortDescription && (
                                                                <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
                                                                    {result.shortDescription}
                                                                </p>
                                                            )}

                                                            {(result.trackPrice !== null ||
                                                                result.collectionPrice !== null) && (
                                                                <div className='flex flex-wrap gap-2 text-sm'>
                                                                    {result.trackPrice !== null && (
                                                                        <span className='font-medium'>
                                                                            {result.wrapperType === 'track' &&
                                                                            result.kind === 'tv-episode'
                                                                                ? 'Episode'
                                                                                : 'Track'}
                                                                            :{' '}
                                                                            {formatPrice(
                                                                                result.trackPrice,
                                                                                result.currency
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {result.trackHdPrice !== null &&
                                                                        result.trackHdPrice !== result.trackPrice && (
                                                                            <span className='font-medium'>
                                                                                HD:{' '}
                                                                                {formatPrice(
                                                                                    result.trackHdPrice,
                                                                                    result.currency
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    {result.collectionPrice !== null && (
                                                                        <span className='font-medium'>
                                                                            {result.kind === 'tv-episode'
                                                                                ? 'Season'
                                                                                : 'Album'}
                                                                            :{' '}
                                                                            {formatPrice(
                                                                                result.collectionPrice,
                                                                                result.currency
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Links */}
                                                        <div className='flex flex-col gap-2'>
                                                            {result.trackViewUrl && (
                                                                <Button size='sm' variant='outline' asChild>
                                                                    <a
                                                                        href={result.trackViewUrl}
                                                                        target='_blank'
                                                                        rel='noopener noreferrer'
                                                                        className='flex items-center gap-1'>
                                                                        <ExternalLink className='h-3 w-3' />
                                                                        View
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {result.previewUrl && (
                                                                <Button size='sm' variant='outline' asChild>
                                                                    <a
                                                                        href={result.previewUrl}
                                                                        target='_blank'
                                                                        rel='noopener noreferrer'
                                                                        className='flex items-center gap-1'>
                                                                        <Music className='h-3 w-3' />
                                                                        Preview
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

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
                                            Fetching new results and saving unique items to database...
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Show message when no more results */}
                            {!hasNextPage && allResults.length > 0 && (
                                <div className='pt-6 text-center'>
                                    <p className='text-muted-foreground text-sm'>
                                        You've reached the end of the search results ({allResults.length} of{' '}
                                        {totalResultsFromItunes} shown)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {data && allResults.length === 0 && (
                        <Card>
                            <CardContent className='pt-6 text-center'>
                                <Music className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                                <p className='text-muted-foreground'>
                                    No results found for "{data.pages[0].searchTerm}"
                                </p>
                                <p className='text-muted-foreground mt-2 text-sm'>Try a different search term</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;
