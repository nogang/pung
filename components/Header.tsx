'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">💨</span>
          <h1 className="text-xl font-bold text-white">Pung</h1>
          <span className="text-sm text-zinc-500">1시간 후 사라지는 익명 커뮤니티</span>
        </Link>
      </div>
    </header>
  );
}
