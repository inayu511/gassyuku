import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseSdk = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseSdk.createClient,
}));

const importSupabase = async () => {
  vi.resetModules();
  return import('@/lib/supabase');
};

const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;

const hideConsole = () =>
  consoleMethods.map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

describe('Supabase public configuration', () => {
  beforeEach(() => {
    supabaseSdk.createClient.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates one client only from the configured public URL and anon key', async () => {
    const client = { from: vi.fn() };
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.example.invalid');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'TEST_PUBLIC_ANON_KEY');
    supabaseSdk.createClient.mockReturnValue(client);

    const { supabase } = await importSupabase();

    expect(supabaseSdk.createClient).toHaveBeenCalledTimes(1);
    expect(supabaseSdk.createClient).toHaveBeenCalledWith(
      'https://project.example.invalid',
      'TEST_PUBLIC_ANON_KEY'
    );
    expect(supabase).toBe(client);
  });

  it('allows an HTTP loopback URL for local Supabase development', async () => {
    const client = { from: vi.fn() };
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'TEST_LOCAL_ANON_KEY');
    supabaseSdk.createClient.mockReturnValue(client);

    const { supabase } = await importSupabase();

    expect(supabaseSdk.createClient).toHaveBeenCalledWith(
      'http://127.0.0.1:54321',
      'TEST_LOCAL_ANON_KEY'
    );
    expect(supabase).toBe(client);
  });

  it.each([
    ['', 'TEST_PUBLIC_ANON_KEY'],
    ['https://project.example.invalid', ''],
    ['not-a-url', 'TEST_PUBLIC_ANON_KEY'],
    ['file:///tmp/project', 'TEST_PUBLIC_ANON_KEY'],
    ['http://remote.example.invalid', 'TEST_PUBLIC_ANON_KEY'],
    ['https://user:password@project.example.invalid', 'TEST_PUBLIC_ANON_KEY'],
    ['https://project.example.invalid', 'INVALID KEY WITH SPACES'],
  ])('does not create a client for missing or invalid configuration', async (url, anonKey) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey);

    const { supabase } = await importSupabase();

    expect(supabase).toBeNull();
    expect(supabaseSdk.createClient).not.toHaveBeenCalled();
  });

  it('fails closed without logging if the SDK rejects otherwise valid configuration', async () => {
    const sentinel = 'TEST_CONFIG_ERROR_SENTINEL';
    const consoleSpies = hideConsole();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.example.invalid');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'TEST_PUBLIC_ANON_KEY');
    supabaseSdk.createClient.mockImplementation(() => {
      throw new Error(sentinel);
    });

    const { supabase } = await importSupabase();

    expect(supabase).toBeNull();
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });
});
