'use client';

import React from 'react';
import { Heart, MapPin, Users, ChevronRight } from 'lucide-react';
import { Hotel } from '@/types';

interface AccommodationCardProps {
  hotel: Hotel;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (hotel: Hotel) => void;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({
  hotel,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-float border border-slate-100 transition-all duration-300 flex flex-col group">
      {/* Cover Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={hotel.main_image_url || hotel.images[0]}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Favorite Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(hotel.id);
          }}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-slate-700 shadow-md active:scale-90 transition-transform"
          aria-label="お気に入り登録"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
            }`}
          />
        </button>

        {/* Area & Capacity Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/20">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>{hotel.area}</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/20">
            <Users className="w-3 h-3 text-amber-300" />
            <span>最大{hotel.capacity}名収容</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title */}
          <h3 className="font-bold text-base text-slate-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
            {hotel.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-snug">
            {hotel.description}
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hotel.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
              >
                #{tag}
              </span>
            ))}
            {hotel.tags.length > 4 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px]">
                +{hotel.tags.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Footer CTA Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-brand-700 font-extrabold">サークル限定プランあり</span>

          <button
            onClick={() => onSelect(hotel)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-sm"
          >
            <span>詳細を見る</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
