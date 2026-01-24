import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdBanner: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Only push the ad once
    if (adRef.current && !initialized.current) {
       try {
         (window.adsbygoogle = window.adsbygoogle || []).push({});
         initialized.current = true;
       } catch (e) {
         console.error('AdSense Error', e);
       }
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-8 bg-gray-50 dark:bg-dark-lighter/50 rounded-lg overflow-hidden border border-dashed border-gray-200 dark:border-gray-700 min-h-[100px] items-center text-xs text-gray-400">
      <div className="text-center w-full">
         <span className="block mb-2 text-[10px] uppercase tracking-wider">Advertisement</span>
         <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-8961158026153736"
             data-ad-slot="auto"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default AdBanner;