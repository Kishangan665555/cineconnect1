import React, { useState, useEffect } from 'react';
import { ThreeTheatreScene } from './3d/ThreeTheatreScene';
import { PhotoSphereViewer } from './3d/PhotoSphereViewer';
import { apiGetTheatreMedia, apiGet3DConfig } from '../services/theatreOwnerApiService';

export interface TheatreViewData {
  theatreId: string;
  view2DImage?: string;
  panoramaImage?: string;
  uploadedImages?: string[];
  seatViewMapping?: { rowPrefix: string; distance?: number; angle?: number; panoramaImage?: string }[];
}

interface Props {
  theatreId: string;
  seat: any;
  movieTitle: string;
  onClose: () => void;
  [key: string]: any; // Allow legacy extra props from SeatSelection
}

export const SeatExperienceModal: React.FC<Props> = ({ theatreId, seat, movieTitle, onClose }) => {
  const [tab, setTab] = useState<'2d' | '360' | '3d'>('3d');
  
  const [media, setMedia] = useState<any>(null);
  const [threeConfig, setThreeConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      const [mRes, cRes] = await Promise.all([
         apiGetTheatreMedia(theatreId),
         apiGet3DConfig(theatreId)
      ]);
      if (mRes.ok) setMedia(mRes.data?.media);
      if (cRes.ok) setThreeConfig(cRes.data?.config);
      setLoading(false);
    };
    fetchAssets();
  }, [theatreId]);

  // Rough estimation of "Section" based on row.
  const getSimulatedSection = () => {
     let section = '';
     if (['A','B','C'].includes(seat.row)) section = 'front';
     else if (['D','E','F','G'].includes(seat.row)) section = 'middle';
     else section = 'back';
     
     if (seat.col < 5) section += 'Left';
     else if (seat.col > 15) section += 'Right';
     else section += 'Center';
     
     return media?.screenViews?.[section];
  };


  const getRowNumeric = () => {
     return seat.row.charCodeAt(0) - 65; // A = 0
  };

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="bg-[#0a0510] border border-gray-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
         
         {/* Left Controls Panel */}
         <div className="w-full md:w-80 bg-gray-950 p-6 flex flex-col border-r border-gray-800 shrink-0">
            <h2 className="text-3xl font-black text-white mb-1">Row {seat.row}</h2>
            <h3 className="text-purple-400 font-bold mb-6 tracking-widest text-sm uppercase">Seat {seat.id}</h3>
            
            <p className="text-gray-500 text-xs mb-4">Movie: {movieTitle}</p>

            <div className="space-y-4 flex-1">
               <button onClick={() => setTab('3d')} className={`w-full text-left p-4 rounded-xl border transition-all ${tab === '3d' ? 'bg-gradient-to-r from-pink-600 to-orange-500 border-pink-400/50 shadow-lg shadow-pink-500/20' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                  <div className="font-bold text-white mb-1">Live 3D Theatre</div>
                  <div className="text-xs opacity-70">Interactive spatial geometry</div>
               </button>
               <button onClick={() => setTab('360')} className={`w-full text-left p-4 rounded-xl border transition-all ${tab === '360' ? 'bg-gradient-to-r from-cyan-600 to-blue-500 border-cyan-400/50 shadow-lg shadow-cyan-500/20' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                  <div className="font-bold text-white mb-1">360° Panorama</div>
                  <div className="text-xs opacity-70">Photorealistic gyroscope tour</div>
               </button>
               <button onClick={() => setTab('2d')} className={`w-full text-left p-4 rounded-xl border transition-all ${tab === '2d' ? 'bg-gradient-to-r from-purple-600 to-indigo-500 border-purple-400/50 shadow-lg shadow-purple-500/20' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                  <div className="font-bold text-white mb-1">Optical View</div>
                  <div className="text-xs opacity-70">Exact photo mapping from seat</div>
               </button>
            </div>

            <div className="pt-6 border-t border-gray-800 mt-auto flex gap-3">
               <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-500 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2">
                 <span>✅</span> Keep & Close
               </button>
            </div>
         </div>

         {/* Right Render Engine View */}
         <div className="flex-1 relative bg-black flex items-center justify-center p-4">
            {loading ? (
                <div className="text-gray-500 font-mono animate-pulse">Initializing Rendering Engine...</div>
            ) : (
                <>
                   {tab === '2d' && (
                      <div className="w-full h-full flex flex-col items-center justify-center relative bg-gray-900 rounded-xl">
                         {getSimulatedSection() ? (
                            <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + getSimulatedSection() : `http://localhost:5000${getSimulatedSection()}`} className="w-full h-full object-cover rounded-xl" />
                         ) : (
                            <div className="text-gray-500 italic">Optic preview not uploaded by owner</div>
                         )}
                      </div>
                   )}
                   {tab === '360' && (
                      <div className="w-full h-full">
                          {media?.panoramaViews ? (
                             <PhotoSphereViewer 
                                panoramas={media.panoramaViews} 
                                baseUrl={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}
                             />
                          ) : (
                             <div className="text-gray-500 italic h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
                                360° virtual tour maps not yet uploaded by theatre owner.
                             </div>
                          )}
                      </div>
                   )}
                   {tab === '3d' && (
                      <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative border border-gray-800">
                          {threeConfig ? (
                             <ThreeTheatreScene configArg={threeConfig} selectedRow={getRowNumeric()} selectedCol={seat.col} />
                          ) : (
                             <div className="text-gray-500 italic h-full flex items-center justify-center bg-gray-900 rounded-xl p-8 text-center flex-col">
                               <span className="text-3xl mb-2">🎭</span>
                               <span>3D WebGL Config Engine not yet calibrated by Admin.</span>
                             </div>
                          )}
                      </div>
                   )}
                </>
            )}
         </div>

      </div>
    </div>
  );
};
