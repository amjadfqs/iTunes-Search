'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { EpisodeSection } from '@/components/EpisodeSection';
import { PodcastSection } from '@/components/PodcastSection';
import { useSearch } from '@/hooks/use-search';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';

import { Loader2, Music, Search } from 'lucide-react';

export const SearchPageContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeSearch = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(activeSearch);

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

    return (
        <div className='container mx-auto px-4 py-8'>
            {/* Search Form */}
            <form onSubmit={handleSearch} className='mx-auto mb-8 max-w-4xl'>
                <div className='flex gap-2'>
                    <div className='relative flex-1'>
                        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                        <Input
                            type='text'
                            placeholder='ابحث عن البودكاست والحلقات... (اضغط / للتركيز)'
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
            <div className='mx-auto max-w-6xl'>
                {error && (
                    <Card className='border-destructive'>
                        <CardContent className='pt-6'>
                            <p className='text-destructive'>
                                خطأ:{' '}
                                {error instanceof Error
                                    ? error.message
                                    : 'حدث خطأ ما'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {isLoading && (
                    <div className='py-8 text-center'>
                        <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin' />
                        <p className='text-muted-foreground'>البحث في آيتيونز...</p>
                    </div>
                )}

                {data && totalResults > 0 && (
                    <div className='space-y-8'>
                        {/* Podcasts Section */}
                        <PodcastSection podcasts={allPodcasts} />

                        {/* Episodes Section */}
                        <EpisodeSection episodes={allEpisodes} />

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
                                            تحميل المزيد...
                                        </>
                                    ) : (
                                        <>
                                            <Search className='mr-2 h-4 w-4' />
                                            تحميل نتائج أكثر
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Show message when no more results */}
                        {!hasNextPage && totalResults > 0 && (
                            <div className='pt-6 text-center'>
                                <p className='text-muted-foreground text-sm'>
                                    نهاية النتائج ({totalResults} عنصر محمل)
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
                                لم يتم العثور على بودكاست أو حلقات
                            </p>
                            <p className='text-muted-foreground mt-2 text-sm'>
                                جرب مصطلح بحث مختلف
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
