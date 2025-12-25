import React from 'react';

interface LoadingDisplayProps {
  message: string;
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in">
      <div className="relative w-24 h-24">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
        {/* Spinning Ring */}
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        {/* Inner Pulse */}
        <div className="absolute inset-4 bg-indigo-500/20 rounded-full animate-pulse"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-medium text-white">{message}</h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          AI video generation involves complex rendering. This may take 1-2 minutes.
        </p>
      </div>
    </div>
  );
};