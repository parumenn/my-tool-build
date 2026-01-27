
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';

const AdBanner: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    
    // 既存の内容をクリア（再レンダリング時の重複防止）
    bannerRef.current.innerHTML = '';

    if (showAds) {
        const script = document.createElement('script');
        script.src = "https://pl28582910.effectivegatecpm.com/89/fc/5c/89fc5cacadf6c388bb77821ea21332fa.js";
        script.async = true;
        bannerRef.current.appendChild(script);
    }
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center my-8 min-h-[100px] items-center overflow-hidden">
      <div ref={bannerRef} className="text-center w-full"></div>
    </div>
  );
};

export default AdBanner;
