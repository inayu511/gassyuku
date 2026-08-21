'use client';

import React, { useState } from 'react';
import { X, Heart, MapPin, Users, CheckCircle2, Bus, Dumbbell, Wine, Flame, Send } from 'lucide-react';
import { Hotel } from '@/types';

interface AccommodationDetailProps {
  hotel: Hotel | null;
  isOpen: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onRequestEstimate: (hotel: Hotel) => void;
}

export const AccommodationDetail: React.FC<AccommodationDetailProps> = ({
  hotel,
  isOpen,
  isFavorite,
  onClose,
  onToggleFavorite,
  onRequestEstimate,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !hotel) return null;

  const imageList = hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.main_image_url];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="w-full max-w-md bg-white h-[92vh] sm:h-[88vh] sm:rounded-3xl flex flex-col shadow-2xl relative overflow-hidden rounded-t-3xl">
        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 pointer-events-auto transition-all shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleFavorite(hotel.id)}
            className="p-2.5 rounded-full bg-white/80 backdrop-blur-md text-slate-800 pointer-events-auto transition-all shadow-md active:scale-90"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
              }`}
            />
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto pb-24 text-slate-800">
          {/* Image Gallery Header */}
          <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
            <img
              src={imageList[activeImageIndex] || hotel.main_image_url}
              alt={`${hotel.name} ${activeImageIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/30" />

            {/* Image Thumbnails Carousel */}
            {imageList.length > 1 && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-white scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hotel Info Body */}
          <div className="p-5 space-y-6">
            {/* Title & Area */}
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-bold text-xs">
                  {hotel.area}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-xs">
                  最大{hotel.capacity}名収容
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {hotel.name}
              </h2>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {hotel.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">宿の概要</h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                {hotel.description}
              </p>
            </div>

            {/* Facility Info Grid */}
            {hotel.facility_info && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  施設・設備スペック
                </h3>
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {hotel.facility_info.gym && (
                    <div className="flex items-start space-x-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <Dumbbell className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-indigo-950 block">体育館・スポーツ施設</span>
                        <span className="text-indigo-900">{hotel.facility_info.gym}</span>
                      </div>
                    </div>
                  )}

                  {hotel.facility_info.compa && (
                    <div className="flex items-start space-x-3 p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                      <Wine className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-950 block">コンパ・宴会条件</span>
                        <span className="text-purple-900">{hotel.facility_info.compa}</span>
                      </div>
                    </div>
                  )}

                  {hotel.facility_info.bbq && (
                    <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                      <Flame className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-950 block">BBQ設備</span>
                        <span className="text-amber-900">{hotel.facility_info.bbq}</span>
                      </div>
                    </div>
                  )}

                  {hotel.facility_info.bus && (
                    <div className="flex items-start space-x-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <Bus className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-950 block">交通・バス送迎</span>
                        <span className="text-emerald-900">{hotel.facility_info.bus}</span>
                      </div>
                    </div>
                  )}

                  {hotel.facility_info.bath && (
                    <div className="flex items-start space-x-3 p-3 rounded-2xl bg-sky-50/60 border border-sky-100">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-sky-950 block">お風呂・温泉</span>
                        <span className="text-sky-900">{hotel.facility_info.bath}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom CTA Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-float z-30">
          <button
            onClick={() => onRequestEstimate(hotel)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-brand-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>この宿で見積もり・空き確認をする</span>
          </button>
        </div>
      </div>
    </div>
  );
};
