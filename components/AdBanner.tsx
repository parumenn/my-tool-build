
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from './AppContext';

const AdBanner: React.FC = () => {
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
    <div className="w-full flex justify-center my-8 min-h-[300px] items-center overflow-hidden" ref={adRef}>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', maxWidth: '300px', height: '250px' }}
           data-ad-client="ca-pub-8961158026153736"
           data-ad-slot="f08c47fec0942fa0"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdBanner;
