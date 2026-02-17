
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from './AppContext';

// --- AdBanner2 (468x60) ---
export const AdBanner2: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAds && adRef.current && (window as any).adsbygoogle) {
      try {
        (window as any).adsbygoogle.push({});
      } catch (e) {
        // 既に広告が挿入されている場合のエラーを無視
      }
    }
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center overflow-hidden my-4" style={{ minHeight: '60px' }} ref={adRef}>
      <ins className="adsbygoogle"
           style={{ display: 'inline-block', width: '468px', height: '60px' }}
           data-ad-client="ca-pub-8961158026153736"
           data-ad-slot="f08c47fec0942fa0"></ins>
    </div>
  );
};

// --- AdBanner3 (160x300) ---
export const AdBanner3: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAds && adRef.current && (window as any).adsbygoogle) {
      try {
        (window as any).adsbygoogle.push({});
      } catch (e) {
        // 既に広告が挿入されている場合のエラーを無視
      }
    }
  }, [showAds]);

  if (!showAds) return null;
  return (
    <div className="flex justify-center py-2" style={{ minHeight: '300px' }} ref={adRef}>
      <ins className="adsbygoogle"
           style={{ display: 'inline-block', width: '160px', height: '600px' }}
           data-ad-client="ca-pub-8961158026153736"
           data-ad-slot="f08c47fec0942fa0"></ins>
    </div>
  );
};
