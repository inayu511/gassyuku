// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestModal } from '@/components/RequestModal';
import type { Hotel } from '@/types';

const supabaseSpies = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));

  return { from, insert };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: supabaseSpies.from,
  },
}));

const hotel: Hotel = {
  id: 'test-hotel',
  name: 'テスト合宿施設',
  area: 'テスト地域',
  main_image_url: 'https://example.invalid/hotel.jpg',
  images: [],
  tags: ['テスト'],
  capacity: 30,
  description: 'テスト用の施設です。',
  facility_info: {},
};

const fetchMock = vi.fn<typeof fetch>();

describe('RequestModal inquiry pause containment', () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseSpies.from.mockClear();
    supabaseSpies.insert.mockClear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows the paused dialog without personal-information form elements', () => {
    const { container } = render(
      <RequestModal hotel={hotel} isOpen onClose={vi.fn()} />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('現在、問い合わせ受付を一時停止しています。')).toBeDefined();
    expect(container.querySelectorAll('form, input, textarea, select')).toHaveLength(0);
  });

  it('calls onClose from both close controls', () => {
    const onClose = vi.fn();
    render(<RequestModal hotel={hotel} isOpen onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button', { name: '閉じる' });
    expect(closeButtons).toHaveLength(2);

    closeButtons.forEach((button) => fireEvent.click(button));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('performs no submission, notification, read, or save and only removes legacy PII keys', () => {
    localStorage.setItem('gasshuku_requests', 'TEST_PII_SENTINEL_REQUEST');
    localStorage.setItem('gasshuku_inquiries', 'TEST_PII_SENTINEL_INQUIRY');
    localStorage.setItem('unrelated_test_state', 'preserve');

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const clearSpy = vi.spyOn(Storage.prototype, 'clear');

    render(<RequestModal hotel={hotel} isOpen onClose={vi.fn()} />);

    expect(supabaseSpies.from).not.toHaveBeenCalled();
    expect(supabaseSpies.insert).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(removeItemSpy.mock.calls).toEqual([
      ['gasshuku_requests'],
      ['gasshuku_inquiries'],
    ]);
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe('unrelated_test_state');
  });
});
