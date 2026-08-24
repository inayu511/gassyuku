import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/notify/route';

const fixedResponse = {
  success: false,
  message: 'お問い合わせ受付は一時停止中です。',
};

const invokePost = POST as unknown as (request: Request) => Promise<Response>;
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/notify inquiry pause containment', () => {
  it('always returns the fixed 503 response and required cache headers', async () => {
    const response = await POST();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Retry-After')).toBe('3600');
    expect(await response.json()).toEqual(fixedResponse);
  });

  it('does not parse malformed JSON before returning 503', async () => {
    const request = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    const arrayBufferSpy = vi.spyOn(request, 'arrayBuffer');
    const blobSpy = vi.spyOn(request, 'blob');
    const formDataSpy = vi.spyOn(request, 'formData');
    const jsonSpy = vi.spyOn(request, 'json');
    const textSpy = vi.spyOn(request, 'text');

    const response = await invokePost(request);

    expect(response.status).toBe(503);
    expect(arrayBufferSpy).not.toHaveBeenCalled();
    expect(blobSpy).not.toHaveBeenCalled();
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('does not send, log, or echo request content containing a PII sentinel', async () => {
    const sentinel = 'TEST_PII_SENTINEL_DO_NOT_ECHO';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => undefined);
    const request = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sentinel, details: sentinel }),
    });

    const response = await invokePost(request);
    const responseText = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(responseText)).toEqual(fixedResponse);
    expect(responseText).not.toContain(sentinel);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(traceSpy).not.toHaveBeenCalled();
  });
});
