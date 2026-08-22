import { LiffUserProfile } from '@/types';

let liffObject: any = null;

export const initLiff = async (): Promise<{ isReady: boolean; profile: LiffUserProfile | null; error: string | null }> => {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2011201363-KeBCKcSp';

  if (!liffId) {
    console.warn('LIFF_ID is not defined in environment variables.');
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
            userId: rawProfile.userId,
            displayName: rawProfile.displayName,
            pictureUrl: rawProfile.pictureUrl,
            statusMessage: rawProfile.statusMessage,
          },
          error: null,
        };
      } catch (err: any) {
        console.error('Failed to get LIFF profile:', err);
        return { isReady: true, profile: null, error: 'プロフィール取得失敗' };
      }
    } else {
      // LINE環境内で未ログインの場合は自動ログインを試みる（開発環境や通常Webアクセスの場合はスルー）
      if (liff.isInClient()) {
        liff.login();
      }
      return { isReady: true, profile: null, error: null };
    }
  } catch (err: any) {
    console.error('LIFF initialization error:', err);
    return { isReady: false, profile: null, error: err.message || 'LIFF初期化エラー' };
  }
};

export const getLiffObject = () => liffObject;
