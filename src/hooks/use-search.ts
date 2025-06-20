import { useInfiniteQuery } from '@tanstack/react-query';

interface SearchResult {
    trackId: number;
    searchTerm: string;
    wrapperType?: string | null;
    kind?: string | null;
    artistId?: number | null;
    collectionId?: number | null;
    artistName?: string | null;
    collectionName?: string | null;
    trackName?: string | null;
    collectionCensoredName?: string | null;
    trackCensoredName?: string | null;
    artistViewUrl?: string | null;
    collectionViewUrl?: string | null;
    trackViewUrl?: string | null;
    previewUrl?: string | null;
    artworkUrl30?: string | null;
    artworkUrl60?: string | null;
    artworkUrl100?: string | null;
    collectionPrice?: number | null;
    trackPrice?: number | null;
    collectionHdPrice?: number | null;
    trackHdPrice?: number | null;
    releaseDate?: string | null;
    collectionExplicitness?: string | null;
    trackExplicitness?: string | null;
    discCount?: number | null;
    discNumber?: number | null;
    trackCount?: number | null;
    trackNumber?: number | null;
    trackTimeMillis?: number | null;
    country?: string | null;
    currency?: string | null;
    primaryGenreName?: string | null;
    contentAdvisoryRating?: string | null;
    shortDescription?: string | null;
    longDescription?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SearchResponse {
    resultCount: number;
    results: SearchResult[];
    searchTerm: string;
    hasMore: boolean;
    newResultsCount: number;
    offset: number;
}

const fetchSearch = async (searchTerm: string, offset: number = 0): Promise<SearchResponse> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&offset=${offset}&limit=20`);

    if (!response.ok) {
        throw new Error('Failed to search');
    }

    return response.json();
};

export const useSearch = (searchTerm: string) => {
    return useInfiniteQuery({
        queryKey: ['search', searchTerm],
        queryFn: ({ pageParam = 0 }) => fetchSearch(searchTerm, pageParam),
        getNextPageParam: (lastPage) => {
            if (lastPage.hasMore) {
                return lastPage.offset + 20;
            }
            return undefined;
        },
        enabled: !!searchTerm && searchTerm.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
        initialPageParam: 0
    });
};
