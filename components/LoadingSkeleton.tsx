
import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-pulse-subtle">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
           <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
        </div>
        <div className="space-y-4">
           <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full"></div>
           <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
           </div>
        </div>
      </div>
      <div className="p-8 bg-white dark:bg-dark-lighter rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
         <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
         <div className="h-20 bg-gray-50 dark:bg-gray-800 rounded-xl w-full"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
