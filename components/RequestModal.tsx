'use client';

import React, { useEffect } from 'react';
import { CirclePause, X } from 'lucide-react';
import { Hotel } from '@/types';

interface RequestModalProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  hotel,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    try {
      localStorage.removeItem('gasshuku_requests');
      localStorage.removeItem('gasshuku_inquiries');
    } catch {
      // Storageを利用できない環境でも、受付停止画面はそのまま表示する。
    }
  }, []);

  if (!isOpen || !hotel) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-paused-title"
      aria-describedby="request-paused-description"
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
              見積もり・空き確認依頼
            </span>
            <h2 className="font-bold text-slate-800 text-base line-clamp-1">
              {hotel.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <CirclePause className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 id="request-paused-title" className="text-base font-extrabold text-slate-900">
              現在、問い合わせ受付を一時停止しています。
            </h3>
            <p
              id="request-paused-description"
              className="mt-2 text-sm leading-relaxed text-slate-600"
            >
              受付再開までしばらくお待ちください。
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
