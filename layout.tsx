import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LiffProvider } from '@/components/LiffProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'ガッシク.LINE - サークル合宿専門 宿カタログ＆見積もり',
  description: '大学生サークル幹事のための合宿所一括検索・空き確認・見積もり比較LINEミニアプリ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans bg-slate-100 min-h-screen`}>
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
