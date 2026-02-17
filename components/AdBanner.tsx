
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from './AppContext';

const AdBanner: React.FC = () => {
  const { showAds } = useContext(AppContext);

  useEffect(() => {
    if (showAds) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense load error", e);
      }
    }
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center my-8 min-h-[100px] items-center overflow-hidden bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="w-full max-w-[90vw] text-center">
        <span className="text-[10px] text-gray-400 block mb-1">Sponsored</span>
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-8961158026153736"
             data-ad-slot="your-slot-id-here"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default AdBanner;
