import { Suspense } from 'react';

import { SearchPageContent } from '@/components/SearchPageContent';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

import { Loader2 } from 'lucide-react';

// Loading fallback component
const SearchPageFallback = () => (
    <div className='container mx-auto px-4 py-8'>
        <div className='py-8 text-center'>
            <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin' />
            <p className='text-muted-foreground'>تحميل التطبيق...</p>
        </div>
    </div>
);

const Page = () => {
    return (
        <div className='bg-background min-h-screen'>
            {/* Theme Switcher - Top Right Corner */}
            <div className='fixed top-4 right-4 z-50'>
                <ThemeSwitcher />
            </div>

            {/* Main Content with Suspense */}
            <Suspense fallback={<SearchPageFallback />}>
                <SearchPageContent />
            </Suspense>
        </div>
    );
};

export default Page;
