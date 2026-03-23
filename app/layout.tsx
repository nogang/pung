import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pung - 1시간 후 사라지는 익명 커뮤니티',
  description: '공감 받고 싶은 욕구와 비밀 유지 욕구를 동시에 만족시키는 익명 커뮤니티',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-zinc-900 text-white min-h-screen`}>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
