import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from './AppContext';

// --- AdBanner2 (468x60) - Auto Scaling ---
export const AdBanner2: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // 468pxのバナーを現在の幅に収めるためのスケールを計算
        // 余裕を持たせるために少し小さめに判定
        let newScale = width < 468 ? width / 468 : 1;
        setScale(newScale);
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    handleResize(); // Initial check

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!bannerRef.current || !showAds) return;
    bannerRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '468px';
    iframe.style.height = '60px';
    iframe.style.border = 'none';
    iframe.title = "Ad2";
    bannerRef.current.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html><body style="margin:0;display:flex;justify-content:center;background:transparent;">
          <script>atOptions={'key':'6440c8d3cc819aafb0e098549141eae2','format':'iframe','height':60,'width':468,'params':{}};</script>
          <script src="https://www.highperformanceformat.com/6440c8d3cc819aafb0e098549141eae2/invoke.js"></script>
        </body></html>
      `);
      doc.close();
    }
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div 
        ref={containerRef} 
        className="w-full flex justify-center overflow-hidden my-4" 
        style={{ height: `${60 * scale}px`, minHeight: '10px' }}
    >
      <div 
        style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center', 
            width: '468px', 
            height: '60px' 
        }}
      >
        <div ref={bannerRef} className="w-[468px] h-[60px]"></div>
      </div>
    </div>
  );
};

// --- AdBanner3 (160x300) ---
export const AdBanner3: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current || !showAds) return;
    bannerRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '160px';
    iframe.style.height = '300px';
    iframe.style.border = 'none';
    iframe.title = "Ad3";
    bannerRef.current.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html><body style="margin:0;display:flex;justify-content:center;">
          <script>atOptions={'key':'93250590c6cc4fa213dc408950ac67ef','format':'iframe','height':300,'width':160,'params':{}};</script>
          <script src="https://www.highperformanceformat.com/93250590c6cc4fa213dc408950ac67ef/invoke.js"></script>
        </body></html>
      `);
      doc.close();
    }
  }, [showAds]);

  if (!showAds) return null;
  return (
    <div className="flex justify-center py-2">
      <div ref={bannerRef} className="w-[160px] h-[300px]"></div>
    </div>
  );
};