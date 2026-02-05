
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';

const AdBanner: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    
    // 既存の内容をクリア
    bannerRef.current.innerHTML = '';

    if (showAds) {
        // React環境で安全に広告を表示するため、iframe内にスクリプトを展開する
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '300px';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.title = "Advertisement";
        
        bannerRef.current.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100%;}</style></head>
                <body>
                    <script async="async" data-cfasync="false" src="https://pl28654616.effectivegatecpm.com/7fc3cc745c4b31d1928e463b50abab50/invoke.js"></script>
                    <div id="container-7fc3cc745c4b31d1928e463b50abab50"></div>
                </body>
                </html>
            `);
            doc.close();
        }
    }
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center my-8 min-h-[300px] items-center overflow-hidden">
      <div ref={bannerRef} className="w-full max-w-[350px]"></div>
    </div>
  );
};

export default AdBanner;
