'use client';

import React, { useState, useEffect } from 'react';
import { Building2, MapPin, DollarSign, ExternalLink, Send, Sparkles, Search, Filter } from 'lucide-react';
import { RakutenHotelBasicInfo } from '@/lib/rakuten';
import { RequestModal } from './RequestModal';
import { Hotel } from '@/types';

interface RakutenHotelCatalogProps {
  initialKeyword?: string;
}

export const RakutenHotelCatalog: React.FC<RakutenHotelCatalogProps> = ({
  initialKeyword = '合宿',
}) => {
  const [hotels, setHotels] = useState<RakutenHotelBasicInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>(initialKeyword);
  const [activeCategory, setActiveCategory] = useState<string>('全般');

  // 見積もりモーダル制御用 State
  const [selectedHotelForModal, setSelectedHotelForModal] = useState<Hotel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const categories = [
    { label: '全般', query: '合宿' },
    { label: '🏀 体育館あり', query: '合宿 体育館' },
    { label: '⚽ 私有グラウンド', query: '合宿 グラウンド' },
    { label: '♨️ 大部屋・温泉', query: '合宿 温泉 大部屋' },
    { label: '⚾ 野球場完備', query: '合宿 野球場' },
  ];

  const fetchHotels = async (searchKeyword: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rakuten?keyword=${encodeURIComponent(searchKeyword)}&hits=12`);
      const data = await res.json();
      if (data.success && Array.isArray(data.hotels)) {
        setHotels(data.hotels);
      } else {
        setHotels([]);
      }
    } catch (err) {
      console.error('Failed to load Rakuten hotels:', err);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels(keyword);
  }, [keyword]);

  const handleCategoryClick = (categoryLabel: string, categoryQuery: string) => {
    setActiveCategory(categoryLabel);
    setKeyword(categoryQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHotels(keyword);
  };

  // 楽天の宿データをアプリ共通の Hotel 型へマッピングしてモーダルを開く
  const handleOpenInquiryModal = (rakutenHotel: RakutenHotelBasicInfo) => {
    const mappedHotel: Hotel = {
      id: String(rakutenHotel.hotelNo),
      name: rakutenHotel.hotelName,
      location: `${rakutenHotel.address1} ${rakutenHotel.address2}`,
      pricePerNight: rakutenHotel.hotelMinCharge ? `${rakutenHotel.hotelMinCharge.toLocaleString()}円〜` : '要問合せ',
      imageUrl: rakutenHotel.hotelImageUrl || rakutenHotel.hotelThumbnailUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      description: rakutenHotel.hotelSpecial || 'サークル合宿・スポーツ遠征に最適な設備が整った宿泊施設です。',
      tags: ['楽天トラベル連携', '合宿対応', '団体歓迎'],
      capacity: '30〜200名',
      facilities: ['大部屋', '宴会場', '送迎対応可'],
      sports: ['体育館', 'グラウンド', '会議室'],
    };

    setSelectedHotelForModal(mappedHotel);
    setIsModalOpen(true);
  };

  return (
    <section className="w-full py-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-brand-600 font-extrabold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Rakuten Travel API Dynamic Integration</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              全国の合宿対応宿カタログ <span className="text-brand-600 text-sm font-normal ml-2">（楽天トラベルリアルタイム取得）</span>
            </h2>
          </div>

          {/* Keyword Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="エリア名・施設で検索 (例: 軽井沢)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:border-brand-500 outline-none w-64 shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center space-x-1"
            >
              <span>検索</span>
            </button>
          </form>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat.label, cat.query)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.label
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 space-y-3 animate-pulse border border-slate-100 shadow-sm">
                <div className="w-full h-48 bg-slate-200 rounded-2xl" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold text-base">該当する合宿宿が見つかりませんでした</h3>
            <p className="text-slate-400 text-xs mt-1">検索キーワードを変更してお試しください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <div
                key={hotel.hotelNo}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={hotel.hotelImageUrl || hotel.hotelThumbnailUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={hotel.hotelName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-brand-400" />
                    <span className="truncate max-w-[150px]">{hotel.address1}</span>
                  </div>
                  {hotel.hotelMinCharge > 0 && (
                    <div className="absolute bottom-3 right-3 bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center space-x-0.5">
                      <DollarSign className="w-3 h-3" />
                      <span>{hotel.hotelMinCharge.toLocaleString()}円〜 / 泊</span>
                    </div>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {hotel.hotelName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {hotel.hotelSpecial || `${hotel.address1} ${hotel.address2} に位置する合宿・団体対応宿泊施設。`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* Primary Button for LIFF / Supabase Inquiry */}
                    <button
                      onClick={() => handleOpenInquiryModal(hotel)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-700 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>この宿で無料見積もり・空室確認をする</span>
                    </button>

                    {/* Official Rakuten Link */}
                    {hotel.hotelInformationUrl && (
                      <a
                        href={hotel.hotelInformationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 text-center text-slate-400 hover:text-slate-600 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors"
                      >
                        <span>楽天トラベル公式詳細を見る</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 見積もり依頼モーダル (引き継がれた宿データで表示) */}
      <RequestModal
        hotel={selectedHotelForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};
