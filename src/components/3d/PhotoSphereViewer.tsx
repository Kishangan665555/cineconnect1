import React, { useState, useEffect } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import '@photo-sphere-viewer/core/index.css';

interface Props {
  panoramas: {
    hallCenter?: string;
    lobby?: string;
    balcony?: string;
    entrance?: string;
    frontRow?: string;
  };
  baseUrl: string;
}

export const PhotoSphereViewer: React.FC<Props> = ({ panoramas, baseUrl }) => {
  // Extract available valid panoramas into an array
  const availableViews = Object.entries(panoramas || {})
      .filter(([key, val]) => val && typeof val === 'string' && val.trim() !== '')
      .map(([key, val]) => ({
          id: key,
          // Format label from camelCase to Title Case (e.g., 'hallCenter' -> 'Hall Center')
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), 
          url: baseUrl + val
      }));

  const [activeView, setActiveView] = useState(availableViews[0] || null);

  useEffect(() => {
     if (!activeView && availableViews.length > 0) setActiveView(availableViews[0]);
  }, [availableViews]);

  if (availableViews.length === 0) {
      return (
         <div className="text-gray-500 italic h-full flex items-center justify-center bg-gray-900 rounded-xl">
             No 360° panoramas available for this theatre.
         </div>
      );
  }

  return (
    <div className="w-full h-full relative bg-gray-950 rounded-xl overflow-hidden border border-gray-800 flex flex-col shadow-2xl">
      <div className="flex-1 relative bg-black">
         {/* We use a key based on activeView ID to force unmount/remount on change, preventing webgl context bugs with ReactPhotoSphereViewer */}
         {activeView && (
            <ReactPhotoSphereViewer
               key={activeView.id}
               src={activeView.url}
               height={"100%"}
               width={"100%"}
               defaultZoomLvl={0}
               navbar={['autorotate', 'zoom', 'fullscreen']}
            />
         )}
         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs font-bold font-mono shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            360° TOUR : {activeView?.label.toUpperCase()}
         </div>
      </div>
      
      {/* ── INTERACTIVE VIRTUAL TOUR NAVIGATOR ── */}
      <div className="bg-gray-900 p-4 border-t border-gray-800 flex items-center gap-3 overflow-x-auto shrink-0 touch-pan-x">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mr-2 shrink-0 flex items-center gap-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Explore Map
          </span>
          {availableViews.map(view => (
             <button 
                key={view.id}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 group flex items-center gap-2 ${
                   activeView?.id === view.id 
                     ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] border border-cyan-400' 
                     : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
             >
                {activeView?.id === view.id && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                {view.label}
             </button>
          ))}
      </div>
    </div>
  );
};
