'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initLiff } from '@/lib/liff';
import { LiffUserProfile } from '@/types';

interface LiffContextType {
  isReady: boolean;
  profile: LiffUserProfile | null;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  isReady: false,
  profile: null,
  error: null,
});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<LiffUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initLiff().then((result) => {
      setIsReady(result.isReady);
      setProfile(result.profile);
      setError(result.error);
    });
  }, []);

  return (
    <LiffContext.Provider value={{ isReady, profile, error }}>
      {children}
    </LiffContext.Provider>
  );
};
