import React, { useState, useEffect } from 'react';
import { apiUploadTheatreMedia, apiGetTheatreMedia } from '../../services/theatreOwnerApiService';

interface Props {
  theatreId: string;
}

const SECTIONS = ['frontLeft', 'frontCenter', 'frontRight', 'middleLeft', 'middleCenter', 'middleRight', 'backLeft', 'backCenter', 'backRight', 'balconyLeft', 'balconyCenter', 'balconyRight'];
const PANORAMAS = ['hallCenter', 'lobby', 'balcony', 'entrance', 'frontRow'];

export const TheatreMediaManager: React.FC<Props> = ({ theatreId }) => {
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    const res = await apiGetTheatreMedia(theatreId);
    if (res.ok && res.data?.media) setMedia(res.data.media);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, [theatreId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, type: 'screenView' | 'panoramaView') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(section);
    const res = await apiUploadTheatreMedia(theatreId, section, type, file);
    if (res.ok) {
       await fetchMedia();
    } else {
       alert('Upload failed.');
    }
    setUploading(null);
  };

  if (loading) return <div className="p-8 text-center text-white">Loading Media Vault...</div>;

  return (
    <div className="p-6 bg-[#0a0510] min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-2">Theatre Media & 360 Vault</h2>
      <p className="text-gray-400 mb-8">Upload realistic views exactly from these seat perspectives.</p>

      {/* Screen Views */}
      <h3 className="text-xl font-bold mb-4 text-purple-400 border-b border-purple-900 pb-2">Real Seat Screen Mapping</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {SECTIONS.map(sec => {
          const url = media?.screenViews?.[sec];
          return (
            <div key={sec} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 relative group">
               <h4 className="font-bold text-sm text-gray-300 capitalize mb-2">{sec.replace(/([A-Z])/g, ' $1').trim()}</h4>
               <div className="aspect-video w-full rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden relative">
                 {uploading === sec ? (
                    <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                 ) : url ? (
                    <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + url : `http://localhost:5000${url}`} className="w-full h-full object-cover" alt={sec} />
                 ) : (
                    <span className="text-xs text-gray-600">No Image</span>
                 )}
                 {/* Upload overlay */}
                 <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-10">
                   <span className="bg-purple-600 px-3 py-1 text-xs rounded-full shadow-lg">+ Upload</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, sec, 'screenView')} />
                 </label>
               </div>
            </div>
          );
        })}
      </div>

      {/* Panoramas */}
      <h3 className="text-xl font-bold mb-4 text-cyan-400 border-b border-cyan-900 pb-2">360° Panorama Scenes</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {PANORAMAS.map(sec => {
          const url = media?.panoramaViews?.[sec];
          return (
             <div key={sec} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 relative group">
             <h4 className="font-bold text-sm text-gray-300 capitalize mb-2">{sec.replace(/([A-Z])/g, ' $1').trim()} Panorama</h4>
             <div className="aspect-[2/1] w-full rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden relative">
               {uploading === sec ? (
                  <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
               ) : url ? (
                  <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + url : `http://localhost:5000${url}`} className="w-full h-full object-cover grayscale opacity-60" alt={sec} />
               ) : (
                  <span className="text-xs text-gray-600">No Equirectangular Image</span>
               )}
               {/* Upload overlay */}
               <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-10">
                 <span className="bg-cyan-600 px-3 py-1 text-xs rounded-full shadow-lg">+ Upload 360</span>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, sec, 'panoramaView')} />
               </label>
             </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
