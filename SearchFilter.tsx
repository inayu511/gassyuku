'use client';

import React from 'react';
import { X, Search, Check, RotateCcw } from 'lucide-react';
import { FilterState } from '@/types';
import { AREAS, POPULAR_TAGS } from '@/lib/mockData';

interface SearchFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filter: FilterState;
  onChangeFilter: (newFilter: FilterState) => void;
  onReset: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  isOpen,
  onClose,
  filter,
  onChangeFilter,
  onReset,
}) => {
  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    const isSelected = filter.selectedTags.includes(tag);
    const newTags = isSelected
      ? filter.selectedTags.filter((t) => t !== tag)
      : [...filter.selectedTags, tag];

    onChangeFilter({ ...filter, selectedTags: newTags });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-slate-800 text-base">条件で絞り込む</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Keyword Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              キーワード・宿名検索
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="例: バスケット, 体育館, 温泉..."
                value={filter.searchQuery}
                onChange={(e) => onChangeFilter({ ...filter, searchQuery: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Area Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              合宿エリア
            </label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area) => {
                const isSelected = filter.area === area;
                return (
                  <button
                    key={area}
                    onClick={() => onChangeFilter({ ...filter, area })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facility & Feature Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              施設条件・設備タグ
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => {
                const isSelected = filter.selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center space-x-3">
          <button
            onClick={onReset}
            className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center space-x-1 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>リセット</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform"
          >
            この条件で検索する
          </button>
        </div>
      </div>
    </div>
  );
};
