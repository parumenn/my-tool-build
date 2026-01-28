import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';

// --- AdBanner2 (468x60) ---
export const AdBanner2: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const bannerRef = useRef<HTMLDivElement>(null);

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
        <html><body style="margin:0;display:flex;justify-content:center;">
          <script>atOptions={'key':'6440c8d3cc819aafb0e098549141eae2','format':'iframe','height':60,'width':468,'params':{}};</script>
          <script src="https://www.highperformanceformat.com/6440c8d3cc819aafb0e098549141eae2/invoke.js"></script>
        </body></html>
      `);
      doc.close();
    }
  }, [showAds]);

  if (!showAds) return null;
  return (
    <div className="scale-[0.5] origin-top h-[30px]">
      <div ref={bannerRef} className="w-[468px] h-[60px]"></div>
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