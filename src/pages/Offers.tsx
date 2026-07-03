import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['All', 'Movies', 'Bank Offer', 'Premium', 'Special', 'Wallet', 'Group'];

export const Offers: React.FC = () => {
  const { offers, showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? offers : offers.filter(o => o.category === activeCategory);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    showToast(`Coupon code "${code}" copied!`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3">🎁 Offers & Deals</h1>
          <p className="text-gray-400 text-lg">Save big on your next movie experience</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat ? 'bg-[#e53935] text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Offers Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(offer => (
            <div key={offer.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#e53935]/40 transition-all group">
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 left-3 bg-[#e53935] text-white text-sm font-black px-3 py-1.5 rounded-full shadow-lg">
                  {offer.discount}
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                  {offer.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-white font-bold text-lg mb-2">{offer.title}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{offer.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-xs">Valid till {offer.validTill}</span>
                  <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">{offer.category}</span>
                </div>

                {/* Code Copy */}
                <div
                  onClick={() => copyCode(offer.code)}
                  className="flex items-center justify-between bg-white/5 border border-dashed border-white/20 hover:border-[#e53935]/50 rounded-xl px-4 py-3 cursor-pointer transition-all group/code"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Code:</span>
                    <span className="text-[#e53935] font-mono font-bold tracking-wider">{offer.code}</span>
                  </div>
                  <span className="text-gray-400 group-hover/code:text-white text-xs transition-colors">📋 Copy</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Available Codes Section */}
        <div className="mt-12 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">💡 How to Use Coupons</h2>
          <p className="text-gray-400 text-center mb-6">Apply coupon codes during checkout to avail discounts</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Select Movie', desc: 'Browse and choose your favourite movie', icon: '🎬' },
              { step: '2', title: 'Choose Seats', desc: 'Pick your preferred seats from the map', icon: '💺' },
              { step: '3', title: 'Apply Coupon', desc: 'Enter coupon code at payment to save', icon: '🎁' },
            ].map(step => (
              <div key={step.step} className="text-center p-5 bg-white/5 rounded-xl border border-white/10">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="w-8 h-8 bg-[#e53935] rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-3">{step.step}</div>
                <h3 className="text-white font-bold mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
