
import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-48"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-32"></div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-lighter rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl w-1/3"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl w-full"></div>
          <div className="h-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl w-full"></div>
          <div className="h-48 bg-gray-50 dark:bg-gray-800/50 rounded-3xl w-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
