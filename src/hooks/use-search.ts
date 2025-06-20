import { useInfiniteQuery } from '@tanstack/react-query';

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

interface SearchResponse {
    podcasts: Podcast[];
    episodes: Episode[];
    pagination?: {
        offset: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

const fetchSearch = async (
    searchTerm: string,
    offset: number = 0
): Promise<SearchResponse> => {
    // First trigger the search API to fetch and save new data (no pagination)
    const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);

    if (!searchResponse.ok) {
        throw new Error('Failed to search');
    }

    // Wait for the search to complete
    await searchResponse.json();

    // Then fetch results from our database with pagination
    const resultsResponse = await fetch(
        `/api/results?q=${encodeURIComponent(searchTerm)}&offset=${offset}&limit=20`
    );

    if (!resultsResponse.ok) {
        throw new Error('Failed to fetch results');
    }

    return resultsResponse.json();
};

export const useSearch = (searchTerm: string) => {
    return useInfiniteQuery({
        queryKey: ['search', searchTerm],
        queryFn: ({ pageParam = 0 }) => fetchSearch(searchTerm, pageParam),
        getNextPageParam: (lastPage, allPages) => {
            // Check if there are more results to fetch from database
            if (lastPage.pagination?.hasMore) {
                return lastPage.pagination.offset + lastPage.pagination.limit;
            }
            // No more pagination needed since search API fetches all results at once
            return undefined;
        },
        enabled: !!searchTerm && searchTerm.length > 0,
        staleTime: 1 * 60 * 1000, // Reduced to 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
        refetchOnWindowFocus: false,
        initialPageParam: 0
    });
};
