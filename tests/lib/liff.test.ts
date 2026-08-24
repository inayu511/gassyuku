import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const liffSdk = vi.hoisted(() => ({
  getProfile: vi.fn(),
  init: vi.fn(),
  isInClient: vi.fn(),
  isLoggedIn: vi.fn(),
  login: vi.fn(),
}));

vi.mock('@line/liff', () => ({
  default: liffSdk,
}));

const importLiff = async () => {
  vi.resetModules();
  return import('@/lib/liff');
};

const testLiffId = ['1234567890', 'test-channel'].join('-');
const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;

const hideConsole = () =>
  consoleMethods.map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

const expectNoConsoleCalls = (spies: ReturnType<typeof hideConsole>) => {
  spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
};

describe('LIFF public configuration and privacy', () => {
  beforeEach(() => {
    Object.values(liffSdk).forEach((mock) => mock.mockReset());
    liffSdk.isInClient.mockReturnValue(false);
    liffSdk.isLoggedIn.mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(['', 'invalid-id'])('does not load or initialize LIFF for missing or invalid IDs', async (liffId) => {
    vi.stubEnv('NEXT_PUBLIC_LIFF_ID', liffId);
    const { getLiffObject, initLiff } = await importLiff();

    await expect(initLiff()).resolves.toEqual({
      isReady: false,
      profile: null,
      error: 'LIFF_ID未設定',
    });
    expect(liffSdk.init).not.toHaveBeenCalled();
    expect(liffSdk.login).not.toHaveBeenCalled();
    expect(liffSdk.getProfile).not.toHaveBeenCalled();
    expect(getLiffObject()).toBeNull();
  });

  it('initializes normal web mode only with the configured LIFF ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_LIFF_ID', testLiffId);
    liffSdk.init.mockResolvedValue(undefined);
    const { getLiffObject, initLiff } = await importLiff();

    await expect(initLiff()).resolves.toEqual({ isReady: true, profile: null, error: null });
    expect(liffSdk.init).toHaveBeenCalledOnce();
    expect(liffSdk.init).toHaveBeenCalledWith({ liffId: testLiffId });
    expect(liffSdk.login).not.toHaveBeenCalled();
    expect(liffSdk.getProfile).not.toHaveBeenCalled();
    expect(getLiffObject()).toBe(liffSdk);
  });

  it('returns a fixed error and never logs a raw initialization error', async () => {
    const sentinel = 'TEST_LIFF_INIT_PII_SENTINEL';
    const consoleSpies = hideConsole();
    vi.stubEnv('NEXT_PUBLIC_LIFF_ID', testLiffId);
    liffSdk.init.mockRejectedValue(new Error(sentinel));
    const { getLiffObject, initLiff } = await importLiff();

    const result = await initLiff();

    expect(result).toEqual({ isReady: false, profile: null, error: 'LIFF初期化エラー' });
    expect(JSON.stringify(result)).not.toContain(sentinel);
    expectNoConsoleCalls(consoleSpies);
    expect(getLiffObject()).toBeNull();
  });

  it('keeps only display fields and never logs a rejected raw profile', async () => {
    const sentinel = 'TEST_LIFF_PROFILE_PII_SENTINEL';
    const consoleSpies = hideConsole();
    vi.stubEnv('NEXT_PUBLIC_LIFF_ID', testLiffId);
    liffSdk.init.mockResolvedValue(undefined);
    liffSdk.isLoggedIn.mockReturnValue(true);
    liffSdk.getProfile.mockRejectedValue(new Error(sentinel));
    const { initLiff } = await importLiff();

    const result = await initLiff();

    expect(result).toEqual({ isReady: true, profile: null, error: 'プロフィール取得失敗' });
    expect(JSON.stringify(result)).not.toContain(sentinel);
    expectNoConsoleCalls(consoleSpies);
  });

  it('does not retain the unused LIFF user ID or status message', async () => {
    const consoleSpies = hideConsole();
    vi.stubEnv('NEXT_PUBLIC_LIFF_ID', testLiffId);
    liffSdk.init.mockResolvedValue(undefined);
    liffSdk.isLoggedIn.mockReturnValue(true);
    liffSdk.getProfile.mockResolvedValue({
      userId: 'TEST_USER_ID_SENTINEL',
      displayName: 'テスト表示名',
      pictureUrl: 'https://example.invalid/profile.png',
      statusMessage: 'TEST_STATUS_MESSAGE_SENTINEL',
    });
    const { initLiff } = await importLiff();

    await expect(initLiff()).resolves.toEqual({
      isReady: true,
      profile: {
        displayName: 'テスト表示名',
        pictureUrl: 'https://example.invalid/profile.png',
      },
      error: null,
    });
    expectNoConsoleCalls(consoleSpies);
  });
});
