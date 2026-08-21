'use client';

import React from 'react';
import { Sparkles, Heart, SlidersHorizontal } from 'lucide-react';
import { useLiff } from './LiffProvider';

interface HeaderProps {
  favoriteCount: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onOpenFilter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoriteCount,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  onOpenFilter,
}) => {
  const { profile } = useLiff();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
            <Sparkles className="w-5 h-5 fill-white/20 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-none tracking-tight text-slate-800">
              ガッシク<span className="text-brand-600 font-black">.LINE</span>
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              サークル合宿専門 Catalog
            </p>
          </div>
        </div>

        {/* Action Controls & LINE Profile */}
        <div className="flex items-center space-x-2">
          {/* Favorite Toggle Button */}
          <button
            onClick={onToggleFavoritesOnly}
            className={`relative p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              showFavoritesOnly
                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="お気に入り一覧"
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly || favoriteCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            {favoriteCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* Filter Button */}
          <button
            onClick={onOpenFilter}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center"
            title="絞り込み検索"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* LINE User Profile Badge */}
          {profile?.pictureUrl ? (
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full border-2 border-line-green shadow-sm object-cover"
              title={profile.displayName}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 text-xs font-bold">
              LINE
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
