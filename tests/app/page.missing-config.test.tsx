// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from '@/app/page';

vi.mock('@/lib/supabase', () => ({
  supabase: null,
}));

describe('catalog without public Supabase configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the five-item local catalog and paused inquiry UI without network access', async () => {
    const { container } = render(<HomePage />);

    await waitFor(() => expect(screen.getByText('5件')).toBeDefined());
    expect(screen.getAllByRole('button', { name: '詳細を見る' })).toHaveLength(5);
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: '詳細を見る' })[0]);
    expect(screen.getByText('宿の概要')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'この宿で見積もり・空き確認をする' }));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('現在、問い合わせ受付を一時停止しています。')).toBeDefined();
    expect(container.querySelectorAll('form, input, textarea, select')).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
