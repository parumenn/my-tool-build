
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from './AppContext';

// --- AdBanner2 (Horizontal/Responsive) ---
export const AdBanner2: React.FC = () => {
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
    <div className="w-full flex justify-center overflow-hidden my-4 min-h-[60px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
           data-ad-client="ca-pub-8961158026153736"
           data-ad-slot="your-slot-id-here"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

// --- AdBanner3 (Vertical/Skyscraper) ---
export const AdBanner3: React.FC = () => {
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
    <div className="flex justify-center py-2 min-h-[250px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-8961158026153736"
           data-ad-slot="your-slot-id-here"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};
