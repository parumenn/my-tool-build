
import React, { useContext } from 'react';
import { AppContext } from './AppContext';

// --- AdBanner2 (468x60) ---
export const AdBanner2: React.FC = () => {
  const { showAds } = useContext(AppContext);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center overflow-hidden my-4" style={{ minHeight: '60px' }}>
      {/* 広告スペース (スクリプト削除済み) */}
    </div>
  );
};

// --- AdBanner3 (160x300) ---
export const AdBanner3: React.FC = () => {
  const { showAds } = useContext(AppContext);

  if (!showAds) return null;
  return (
    <div className="flex justify-center py-2" style={{ minHeight: '300px' }}>
      {/* 広告スペース (スクリプト削除済み) */}
    </div>
  );
};
