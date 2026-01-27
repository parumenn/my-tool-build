
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';

const AdBanner2: React.FC = () => {
  const { showAds } = useContext(AppContext);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    
    bannerRef.current.innerHTML = '';

    if (showAds) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '468px';
        iframe.style.height = '60px';
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
                <head><style>body{margin:0;padding:0;overflow:hidden;background:transparent;display:flex;justify-content:center;align-items:center;}</style></head>
                <body>
                    <script type="text/javascript">
                        atOptions = {
                            'key' : '6440c8d3cc819aafb0e098549141eae2',
                            'format' : 'iframe',
                            'height' : 60,
                            'width' : 468,
                            'params' : {}
                        };
                    </script>
                    <script type="text/javascript" src="https://www.highperformanceformat.com/6440c8d3cc819aafb0e098549141eae2/invoke.js"></script>
                </body>
                </html>
            `);
            doc.close();
        }
    }
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center py-2 border-t border-gray-100 dark:border-gray-800 overflow-hidden mt-2">
      {/* 468px width ad scaled down to fit in sidebar (approx 250px) */}
      <div className="scale-[0.5] origin-top h-[30px]">
        <div ref={bannerRef} className="w-[468px] h-[60px]"></div>
      </div>
    </div>
  );
};

export default AdBanner2;
