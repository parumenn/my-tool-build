
import React, { useContext } from 'react';
import { AppContext } from './AppContext';

const AdBanner: React.FC = () => {
  const { showAds } = useContext(AppContext);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center my-8 min-h-[300px] items-center overflow-hidden">
      {/* 広告スペース (スクリプト削除済み) */}
    </div>
  );
};

export default AdBanner;
