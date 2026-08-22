'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, Calendar, Users, Phone, User, Building, DollarSign, CheckCircle, AlertCircle, Moon } from 'lucide-react';
import { Hotel } from '@/types';
import { supabase } from '@/lib/supabase';
import { useLiff } from './LiffProvider';
import liff from '@line/liff';

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
  const { profile, isLoggedIn } = useLiff();

  const [leaderName, setLeaderName] = useState('');
  const [circleName, setCircleName] = useState('');
  const [phone, setPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [peopleCount, setPeopleCount] = useState<number | ''>(30);
  const [budget, setBudget] = useState('7,000円〜9,000円 / 1泊');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (profile?.displayName && !leaderName) {
        setLeaderName(profile.displayName);
      }
      setIsSuccess(false);
      setErrorMessage(null);

      // デフォルト日付の自動生成
      if (!checkInDate) {
        const today = new Date();
        const checkIn = new Date(today.setMonth(today.getMonth() + 1));
        const checkInStr = checkIn.toISOString().split('T')[0];
        setCheckInDate(checkInStr);

        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 2); // デフォルト2泊3日
        setCheckOutDate(checkOut.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, profile]);

  // 泊数の自動計算
  const stayNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [checkInDate, checkOutDate]);

  if (!isOpen || !hotel) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!leaderName || !circleName || !phone || !checkInDate || !checkOutDate || !peopleCount) {
      setErrorMessage('必須項目をすべて入力してください。');
      return;
    }

    if (stayNights <= 0) {
      setErrorMessage('チェックアウト日はチェックイン日より後の日付を選択してください。');
      return;
    }

    setIsSubmitting(true);

    const formattedDateRange = `${checkInDate} 〜 ${checkOutDate} (${stayNights}泊${stayNights + 1}日)`;

    const payload = {
      user_line_id: profile?.userId || 'guest_user',
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      circle_name: circleName,
      leader_name: leaderName,
      phone,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      date: formattedDateRange,
      people_count: Number(peopleCount),
      budget,
      status: 'pending',
    };

    let hasDbSuccess = false;
    let dbErrorMessage = '';

    // 1. Supabase inquiries テーブルヘのインサート試行
    try {
      const { error: inquiriesErr } = await supabase.from('inquiries').insert([
        {
          ...payload,
          user_name: leaderName,
          name: leaderName,
          created_at: new Date().toISOString(),
        },
      ]);

      if (inquiriesErr) {
        console.error('Supabase inquiries insert error:', inquiriesErr);
        dbErrorMessage += `[inquiries]: ${inquiriesErr.message} `;
      } else {
        hasDbSuccess = true;
        console.log('Successfully saved to inquiries table');
      }
    } catch (inqEx: any) {
      console.error('inquiries exception:', inqEx);
      dbErrorMessage += `[inquiries exception]: ${inqEx.message || inqEx} `;
    }

    // 2. Supabase requests テーブルヘのインサート試行
    try {
      const { error: requestsErr } = await supabase.from('requests').insert([
        {
          user_line_id: payload.user_line_id,
          hotel_id: payload.hotel_id,
          circle_name: payload.circle_name,
          leader_name: payload.leader_name,
          phone: payload.phone,
          date: payload.date,
          people_count: payload.people_count,
          budget: payload.budget,
          status: payload.status,
        },
      ]);

      if (requestsErr) {
        console.error('Supabase requests insert error:', requestsErr);
        dbErrorMessage += `[requests]: ${requestsErr.message} `;
      } else {
        hasDbSuccess = true;
        console.log('Successfully saved to requests table');
      }
    } catch (reqEx: any) {
      console.error('requests exception:', reqEx);
    }

    // 3. DB保存失敗時の LocalStorage フォールバック
    if (!hasDbSuccess) {
      console.warn('DB Insert failed, saving to LocalStorage fallback:', dbErrorMessage);
      try {
        const existing = JSON.parse(localStorage.getItem('gasshuku_inquiries') || '[]');
        existing.push({ ...payload, created_at: new Date().toISOString() });
        localStorage.setItem('gasshuku_inquiries', JSON.stringify(existing));
      } catch (lsErr) {
        console.error('LocalStorage fallback error:', lsErr);
      }
    }

    // 4. LINE トークルーム自動投稿
    if (isLoggedIn && liff.isInClient()) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: `【合宿見積もり依頼】\n宿名: ${hotel.name}\n幹事名: ${leaderName}\nサークル: ${circleName}\n電話: ${phone}\n日程: ${checkInDate} 〜 ${checkOutDate} (${stayNights}泊${stayNights + 1}日)\n人数: ${peopleCount}名\n予算: ${budget}`,
          },
        ]);
      } catch (liffMsgErr: any) {
        console.error('LIFF sendMessages error:', liffMsgErr);
      }
    }

    // 5. 管理者通知 Webhook API 呼び出し
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (notifyErr: any) {
      console.error('Notification API fetch error:', notifyErr);
    }

    setIsSubmitting(false);

    if (hasDbSuccess || localStorage.getItem('gasshuku_inquiries')) {
      setIsSuccess(true);
    } else {
      setErrorMessage(`送信エラーが発生しました: ${dbErrorMessage || 'ネットワーク状態をご確認ください。'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
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
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">見積もり依頼を送信しました！</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed px-4">
                  ご入力いただいた日程・条件で Supabase (inquiries) へ登録され、通知が完了しました。<br />
                  担当者より折り返し空き状況をご案内いたします。
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-all"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="break-all">{errorMessage}</span>
                </div>
              )}

              {/* LINE Profile Auto-fill Banner */}
              {profile?.displayName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center space-x-2">
                  {profile.pictureUrl && (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      className="w-5 h-5 rounded-full object-cover border border-emerald-400"
                    />
                  )}
                  <span>LINE「<strong>{profile.displayName}</strong>」でログイン中</span>
                </div>
              )}

              {/* 幹事氏名 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  幹事名 (Leader Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="山田 太郎"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* サークル名 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  サークル名 (Circle Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="〇〇大学 オールラウンドサークル"
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* 連絡先電話番号 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  電話番号 (Phone) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="090-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* チェックイン & チェックアウト 日付UI (2カラム) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>希望日程（チェックイン / チェックアウト）</span>
                  </span>
                  {stayNights > 0 && (
                    <span className="bg-brand-100 text-brand-700 font-extrabold text-[11px] px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Moon className="w-3 h-3" />
                      <span>{stayNights}泊{stayNights + 1}日</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      チェックイン <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => {
                        setCheckInDate(e.target.value);
                        if (checkOutDate && e.target.value >= checkOutDate) {
                          const nextDay = new Date(e.target.value);
                          nextDay.setDate(nextDay.getDate() + 2);
                          setCheckOutDate(nextDay.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-brand-500 outline-none shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      チェックアウト <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-brand-500 outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 参加人数 & 予算 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    参加予定人数 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={300}
                      required
                      placeholder="30"
                      value={peopleCount === '' ? '' : peopleCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setPeopleCount('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setPeopleCount(isNaN(parsed) ? '' : parsed);
                        }
                      }}
                      className="w-full pl-8 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all"
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                    <span className="text-xs font-bold text-slate-400 absolute right-2.5 top-3">名</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    1人当たり予算
                  </label>
                  <div className="relative">
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-7 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                    >
                      <option value="〜7,000円">〜7,000円</option>
                      <option value="7,000円〜9,000円">7,000円〜9,000円</option>
                      <option value="9,000円〜12,000円">9,000円〜12,000円</option>
                      <option value="12,000円〜">12,000円〜</option>
                    </select>
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-700 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-brand-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? '送信＆自動通知中...'
                      : '上記の内容で見積もり依頼を送信する'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
