import type { LiffUserProfile } from '@/types';

let liffObject: any = null;

export const initLiff = async (): Promise<{ isReady: boolean; profile: LiffUserProfile | null; error: string | null }> => {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();

  if (!liffId || !/^\d+-\S+$/.test(liffId)) {
    return { isReady: false, profile: null, error: 'LIFF_ID未設定' };
  }

  try {
    const liff = (await import('@line/liff')).default;
    await liff.init({ liffId });
    liffObject = liff;

    if (liff.isLoggedIn()) {
      try {
        const rawProfile = await liff.getProfile();
        return {
          isReady: true,
          profile: {
            displayName: rawProfile.displayName,
            pictureUrl: rawProfile.pictureUrl,
          },
          error: null,
        };
      } catch {
        return { isReady: true, profile: null, error: 'プロフィール取得失敗' };
      }
    } else {
      // LINE環境内で未ログインの場合は自動ログインを試みる（開発環境や通常Webアクセスの場合はスルー）
      if (liff.isInClient()) {
        liff.login();
      }
      return { isReady: true, profile: null, error: null };
    }
  } catch {
    return { isReady: false, profile: null, error: 'LIFF初期化エラー' };
  }
};

export const getLiffObject = () => liffObject;
