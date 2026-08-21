'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Building2 } from 'lucide-react';
import { Hotel, FilterState } from '@/types';
import { INITIAL_HOTELS, AREAS } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { AccommodationCard } from '@/components/AccommodationCard';
import { AccommodationDetail } from '@/components/AccommodationDetail';
import { SearchFilter } from '@/components/SearchFilter';
import { RequestModal } from '@/components/RequestModal';

export default function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>(INITIAL_HOTELS);
  const [isLoading, setIsLoading] = useState(true);

  // Favorites state stored in localStorage
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Active Modals state
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [targetForRequest, setTargetForRequest] = useState<Hotel | null>(null);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    area: 'すべて',
    selectedTags: [],
    minCapacity: 0,
    searchQuery: '',
  });

  // Fetch hotels from Supabase 'hotels' table (Fallback to INITIAL_HOTELS if error/empty)
  useEffect(() => {
    try {
      const savedFavs = JSON.parse(localStorage.getItem('gasshuku_favs') || '[]');
      setFavorites(savedFavs);
    } catch (e) {
      console.error('Failed to load favorites', e);
    }

    const fetchHotels = async () => {
      try {
        const { data, error } = await supabase.from('hotels').select('*');
        if (data && data.length > 0 && !error) {
          setHotels(data as Hotel[]);
        } else if (error) {
          console.warn('Supabase fetch notice (using fallback):', error.message);
        }
      } catch (err) {
        console.warn('Using initial fallback hotels:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // Toggle favorite helper
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('gasshuku_favs', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
      return next;
    });
  };

  // Filter logic
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      if (showFavoritesOnly && !favorites.includes(hotel.id)) {
        return false;
      }

      if (filter.area !== 'すべて' && hotel.area !== filter.area && !hotel.area.includes(filter.area)) {
        return false;
      }

      if (
        filter.selectedTags.length > 0 &&
        !filter.selectedTags.every((t) => hotel.tags.includes(t))
      ) {
        return false;
      }

      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesName = hotel.name.toLowerCase().includes(q);
        const matchesDesc = hotel.description.toLowerCase().includes(q);
        const matchesArea = hotel.area.toLowerCase().includes(q);
        const matchesTags = hotel.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesArea && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [hotels, filter, favorites, showFavoritesOnly]);

  const handleOpenDetail = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsDetailOpen(true);
  };

  const handleOpenRequestModal = (hotel: Hotel) => {
    setTargetForRequest(hotel);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16 antialiased">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
        {/* Header Component */}
        <Header
          favoriteCount={favorites.length}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        {/* Hero & Quick Filter Bar */}
        <div className="p-4 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white rounded-b-3xl shadow-md">
          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>関東近郊・サークル合宿専門カタログ</span>
          </div>
          <h2 className="text-xl font-black leading-snug">
            体育館・BBQ・スタジオ完備<br />
            <span className="bg-gradient-to-r from-brand-500 to-emerald-400 bg-clip-text text-transparent">
              人気宿をサクサク比較＆空き確認
            </span>
          </h2>

          {/* Search Input Bar */}
          <div
            onClick={() => setIsFilterOpen(true)}
            className="mt-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 flex items-center space-x-2 text-slate-300 text-xs cursor-pointer hover:bg-white/15 transition-all"
          >
            <Search className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="flex-1 truncate">
              {filter.searchQuery || '伊豆、軽井沢、体育館、BBQ、スタジオで検索...'}
            </span>
            <span className="bg-brand-600 text-white font-bold px-2.5 py-1 rounded-xl text-[10px]">
              絞り込む
            </span>
          </div>

          {/* Quick Tag Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-3 text-xs">
            {AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setFilter({ ...filter, area })}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                  filter.area === area
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog List Section */}
        <main className="p-4 flex-1 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              <h3 className="font-extrabold text-slate-800 text-sm">
                {showFavoritesOnly ? 'お気に入りキープ一覧' : 'おすすめ合宿所カタログ'}
              </h3>
              <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {filteredHotels.length}件
              </span>
            </div>

            {(filter.area !== 'すべて' || filter.selectedTags.length > 0 || filter.searchQuery) && (
              <button
                onClick={() =>
                  setFilter({ area: 'すべて', selectedTags: [], minCapacity: 0, searchQuery: '' })
                }
                className="text-[11px] font-bold text-brand-600 hover:underline"
              >
                条件解除
              </button>
            )}
          </div>

          {/* Hotels Grid */}
          {filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredHotels.map((hotel) => (
                <AccommodationCard
                  key={hotel.id}
                  hotel={hotel}
                  isFavorite={favorites.includes(hotel.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onSelect={handleOpenDetail}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-600">条件に一致する宿が見つかりませんでした</p>
              <button
                onClick={() => {
                  setShowFavoritesOnly(false);
                  setFilter({ area: 'すべて', selectedTags: [], minCapacity: 0, searchQuery: '' });
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md"
              >
                すべての宿を表示
              </button>
            </div>
          )}
        </main>

        {/* Footer info */}
        <footer className="p-4 bg-slate-50 border-t border-slate-100 text-center text-slate-400 text-[11px]">
          <p>© 2026 ガッシク.LINE - サークル合宿専門 Catalog</p>
        </footer>

        {/* Modals Component */}
        <AccommodationDetail
          hotel={selectedHotel}
          isOpen={isDetailOpen}
          isFavorite={selectedHotel ? favorites.includes(selectedHotel.id) : false}
          onClose={() => setIsDetailOpen(false)}
          onToggleFavorite={handleToggleFavorite}
          onRequestEstimate={(hotelItem) => {
            setIsDetailOpen(false);
            handleOpenRequestModal(hotelItem);
          }}
        />

        <SearchFilter
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filter={filter}
          onChangeFilter={setFilter}
          onReset={() =>
            setFilter({ area: 'すべて', selectedTags: [], minCapacity: 0, searchQuery: '' })
          }
        />

        <RequestModal
          hotel={targetForRequest}
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
        />
      </div>
    </div>
  );
}
