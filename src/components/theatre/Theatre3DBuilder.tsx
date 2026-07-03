import React, { useState, useEffect } from 'react';
import { apiSave3DConfig, apiGet3DConfig } from '../../services/theatreOwnerApiService';

interface Props {
  theatreId: string;
}

export const Theatre3DBuilder: React.FC<Props> = ({ theatreId }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    rows: 12,
    seatsPerRow: 20,
    balcony: false,
    screenWidth: 40,
    screenHeight: 20,
    seatSpacing: 1.2,
    rowSpacing: 2,
    vipRows: 2,
    reclinerRows: 0,
    stairs: true
  });
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet3DConfig(theatreId).then(res => {
      if (res.ok && res.data?.config) {
         setConfig({ ...config, ...res.data.config });
      }
      setLoading(false);
    });
  }, [theatreId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(c => ({
      ...c,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await apiSave3DConfig(theatreId, config);
    if (res.ok) {
       setSaved(true);
       setTimeout(() => setSaved(false), 3000);
    } else {
       alert('Failed to save 3D constraints');
    }
    setLoading(false);
  };

  if (loading && !saved) return <div className="p-8 text-center text-white">Loading 3D Engine...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-[#0a0510] text-white min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500">Live 3D Theatre Builder</h2>
          <p className="text-gray-400 text-sm mt-1">Adjust numerical parameters to build an algorithmically accurate WebGL theatre.</p>
        </div>
        <button onClick={handleSave} className="bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-2 rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform">
          {saved ? 'Saved ✓' : 'Save Config'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Layout */}
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-5">
           <h3 className="font-bold text-lg text-indigo-400 border-b border-indigo-900 pb-2">Core Seating Grid</h3>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Total Rows</label>
               <input type="number" name="rows" value={config.rows} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Seats / Row</label>
               <input type="number" name="seatsPerRow" value={config.seatsPerRow} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-2">
             <label className="flex items-center gap-3">
               <input type="checkbox" name="balcony" checked={config.balcony} onChange={handleChange} className="w-5 h-5 accent-pink-500" />
               <span className="text-sm font-semibold">Enable Balcony Tier</span>
             </label>
             <label className="flex items-center gap-3">
               <input type="checkbox" name="stairs" checked={config.stairs} onChange={handleChange} className="w-5 h-5 accent-pink-500" />
               <span className="text-sm font-semibold">Generate Stairs</span>
             </label>
           </div>
        </div>

        {/* Space and Screen */}
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-5">
           <h3 className="font-bold text-lg text-emerald-400 border-b border-emerald-900 pb-2">Screen & Space</h3>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Screen Width (m)</label>
               <input type="number" name="screenWidth" value={config.screenWidth} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Screen Height (m)</label>
               <input type="number" name="screenHeight" value={config.screenHeight} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Seat Spacing (m)</label>
               <input type="number" step="0.1" name="seatSpacing" value={config.seatSpacing} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Row Spacing (m)</label>
               <input type="number" step="0.1" name="rowSpacing" value={config.rowSpacing} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
           </div>
        </div>

        {/* Premium Rows */}
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-5 md:col-span-2">
           <h3 className="font-bold text-lg text-yellow-400 border-b border-yellow-900 pb-2">Premium Configuration</h3>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">VIP Rows count (Front back/Balcony)</label>
               <input type="number" name="vipRows" value={config.vipRows} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
             <div>
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Recliner Rows Count</label>
               <input type="number" name="reclinerRows" value={config.reclinerRows} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 p-2 rounded-lg" />
             </div>
           </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-purple-900/20 border border-purple-800/50 rounded-xl">
        <h4 className="font-bold text-purple-400 mb-1">How it works:</h4>
        <p className="text-sm text-gray-400">Your configuration is dynamically fed into <b>React Three Fiber</b> and <b>Three.js</b> algorithms. When users click "View 3D Experience", the client downloads your metrics and reconstructs your hall mathematically.</p>
      </div>

    </div>
  );
};
