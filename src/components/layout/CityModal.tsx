import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { CITIES } from '../../data/store';

export const CityModal: React.FC = () => {
  const { cityModalOpen, closeCityModal, setCity, currentCity } = useApp();
  const [search, setSearch] = useState('');

  const filtered = CITIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const popular = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata'];

  return (
    <Modal isOpen={cityModalOpen} onClose={closeCityModal} title="Select Your City" size="md">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] border border-white/10"
          autoFocus
        />
        {!search && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Popular Cities</p>
            <div className="grid grid-cols-3 gap-2">
              {popular.map(city => (
                <button
                  key={city}
                  onClick={() => setCity(city)}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border ${
                    currentCity === city
                      ? 'bg-[#e53935] text-white border-[#e53935]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">All Cities</p>
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
            {filtered.map(city => (
              <button
                key={city}
                onClick={() => setCity(city)}
                className={`py-2 px-3 rounded-lg text-sm text-left transition-all ${
                  currentCity === city
                    ? 'bg-[#e53935]/20 text-[#e53935] font-medium'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
