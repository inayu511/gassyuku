// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from '@/app/page';

const catalogClient = vi.hoisted(() => {
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));
  return { from, select };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: catalogClient.from,
  },
}));

const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;

const hideConsole = () =>
  consoleMethods.map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

const expectNoConsoleCalls = (spies: ReturnType<typeof hideConsole>) => {
  spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
};

describe('catalog fallback log privacy', () => {
  beforeEach(() => {
    localStorage.clear();
    catalogClient.from.mockClear();
    catalogClient.select.mockReset();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('does not expose a remote response message in console or UI', async () => {
    const sentinel = 'TEST_REMOTE_RESPONSE_PII_SENTINEL';
    const consoleSpies = hideConsole();
    catalogClient.select.mockResolvedValue({ data: null, error: { message: sentinel } });

    const { container } = render(<HomePage />);

    await waitFor(() => expect(catalogClient.select).toHaveBeenCalledOnce());
    expect(screen.getByText('5件')).toBeDefined();
    expect(container.textContent).not.toContain(sentinel);
    expectNoConsoleCalls(consoleSpies);
  });

  it('keeps UI state usable without logging storage or network exceptions', async () => {
    const sentinels = {
      load: 'TEST_STORAGE_LOAD_PII_SENTINEL',
      query: 'TEST_QUERY_ERROR_PII_SENTINEL',
      save: 'TEST_STORAGE_SAVE_PII_SENTINEL',
    };
    const consoleSpies = hideConsole();
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error(sentinels.load);
    });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error(sentinels.save);
    });
    catalogClient.select.mockRejectedValue(new Error(sentinels.query));

    const { container } = render(<HomePage />);
    await waitFor(() => expect(catalogClient.select).toHaveBeenCalledOnce());
    fireEvent.click(screen.getAllByRole('button', { name: 'お気に入り登録' })[0]);

    expect(getItemSpy).toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalled();
    expect(screen.getByText('5件')).toBeDefined();
    Object.values(sentinels).forEach((sentinel) => {
      expect(container.textContent).not.toContain(sentinel);
    });
    expectNoConsoleCalls(consoleSpies);
  });
});
