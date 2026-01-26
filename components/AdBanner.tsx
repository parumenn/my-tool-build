
import React, { useContext } from 'react';
import { AppContext } from '../App';

const AdBanner: React.FC = () => {
  // Use showAds instead of adBlockDetected as it's defined in AppContext
  const { showAds } = useContext(AppContext);

  // Hide the banner if showAds is false
  if (!showAds) return null;

  return (
    <div className="w-full flex justify-center my-8 bg-gray-50 dark:bg-dark-lighter/50 rounded-lg overflow-hidden border border-dashed border-gray-200 dark:border-gray-700 min-h-[100px] items-center text-xs text-gray-400">
      <div className="text-center w-full">
         <span className="block mb-2 text-[10px] uppercase tracking-wider">Advertisement</span>
         {/* The Moneytizerなどの新しい広告タグをここに配置 */}
         <div id="moneytizer-ad-placeholder"></div>
      </div>
    </div>
  );
};

export default AdBanner;
