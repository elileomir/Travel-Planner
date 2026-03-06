import React, { useState } from 'react';
import { foodGuide, touristSpots } from '../data/baguioData';
import { MapPin, DollarSign, Clock, Star, Map, Utensils, Camera } from 'lucide-react';

export default function Places() {
  const [activeTab, setActiveTab] = useState<'tourist' | 'food'>('tourist');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tourist')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === 'tourist' 
              ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Camera size={18} />
          Tourist Spots
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === 'food' 
              ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Utensils size={18} />
          Food Guide
        </button>
      </div>

      {activeTab === 'tourist' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {touristSpots.map((spot) => (
            <div key={spot.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{spot.attraction}</h3>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                    {spot.category}
                  </span>
                </div>
                
                <div className="space-y-2.5 text-sm text-slate-600 mt-4">
                  <div className="flex items-start gap-2">
                    <DollarSign size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">Fee:</strong> {spot.entranceFee}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">Best Time:</strong> {spot.bestTime} ({spot.duration})</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">Highlights:</strong> {spot.highlights}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{spot.address}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-100 mt-auto flex justify-between items-center">
                <span className="text-xs text-slate-500 truncate max-w-[60%]">{spot.transportation}</span>
                <a 
                  href={spot.googleMaps} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Map size={14} /> Maps
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'food' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foodGuide.map((food) => (
            <div key={food.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{food.restaurant}</h3>
                  <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                    {food.cuisine}
                  </span>
                </div>
                
                <div className="space-y-2.5 text-sm text-slate-600 mt-4">
                  <div className="flex items-start gap-2">
                    <DollarSign size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">Price:</strong> {food.priceRange}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">Specialty:</strong> {food.specialty}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Utensils size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">Must Try:</strong> {food.mustTry}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{food.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-100 mt-auto flex justify-between items-center">
                <div className="truncate max-w-[70%]">
                  <span className="text-sm font-medium text-slate-700">Best for: </span>
                  <span className="text-sm text-slate-600">{food.bestFor}</span>
                </div>
                {food.googleMaps && (
                  <a 
                    href={food.googleMaps} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Map size={14} /> Maps
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
