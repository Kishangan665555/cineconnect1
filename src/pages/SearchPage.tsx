import React from 'react';
import { useApp } from '../context/AppContext';

export const SearchPage: React.FC = () => {
  const { movies, searchQuery, selectMovie } = useApp();

  const results = movies.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
    m.cast.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
    m.director.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f0f1a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            Search Results for "<span className="text-[#e53935]">{searchQuery}</span>"
          </h1>
          <p className="text-gray-400 text-sm">{results.length} results found</p>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-gray-400">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map(m => (
              <div key={m.id} onClick={() => selectMovie(m)} className="group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden mb-3 aspect-[2/3] shadow-lg">
                  <img src={m.poster} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2 bg-black/70 rounded-lg px-2 py-1 flex items-center gap-1">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-white text-xs font-bold">{m.rating}</span>
                  </div>
                  {(m.userRatings?.length ?? 0) > 0 && (
                    <div className="absolute top-2 left-2 bg-green-600/80 rounded-lg px-1.5 py-0.5">
                      <span className="text-white text-xs">👥 {(m.userRatings.reduce((s,r)=>s+r.rating,0)/m.userRatings.length).toFixed(1)}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <button className="w-full bg-[#e53935] text-white text-xs font-bold py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      Book Now
                    </button>
                  </div>
                </div>
                <h3 className="text-white text-sm font-semibold mb-1 line-clamp-1">{m.title}</h3>
                <p className="text-gray-500 text-xs">{m.genre.slice(0, 2).join(', ')}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {m.language.slice(0, 2).map(l => (
                    <span key={l} className="text-xs bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
