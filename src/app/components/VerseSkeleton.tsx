import React from 'react';

const VerseSkeleton: React.FC = () => {
  return (
    <div className="glass-morphism p-6 rounded-2xl shadow-lg border border-white/10 mb-4 animate-pulse">
      <div className="space-y-4">
        {/* Verse Number Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-20 bg-gray-700 rounded"></div>
        </div>

        {/* Arabic Text Skeleton */}
        <div className="text-center">
          <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-full mx-auto"></div>
        </div>

        {/* Transliteration Skeleton */}
        <div className="text-center border-t border-white/10 pt-4">
          <div className="h-5 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>

        {/* Translation Skeleton */}
        <div className="text-center border-t border-white/10 pt-4">
          <div className="h-5 bg-gray-700 rounded w-5/6 mx-auto mb-2"></div>
          <div className="h-5 bg-gray-700 rounded w-4/5 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default VerseSkeleton;