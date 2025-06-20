import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { ThemeProvider } from 'next-themes';

import '@/app/globals.css';
import { Providers } from '@/lib/providers';
import { Toaster } from '@/registry/new-york-v4/ui/sonner';
import '@/styles/components.css';

const elMessiri = localFont({
    src: './fonts/ElMessiri.ttf',
    variable: '--font-el-messiri',
    weight: '100 900'
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900'
});

export const metadata: Metadata = {
    title: 'تطبيق البحث في آيتيونز',
    description: 'ابحث عن البودكاست وحلقات البودكاست من متجر آيتيونز'
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <html suppressHydrationWarning lang='ar' dir='rtl'>
            <body
                className={`${elMessiri.variable} ${geistMono.variable} bg-background text-foreground overscroll-none antialiased`}>
                <ThemeProvider attribute='class'>
                    <Providers>
                        {children}
                        <Toaster />
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
};

export default Layout;
