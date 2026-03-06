import React from 'react';
import { Calendar, MapPin, Thermometer, Phone, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

export default function Dashboard({ itinerary }: { itinerary: any[] }) {
  const completedCount = itinerary.filter(i => i.completed).length;
  const totalCount = itinerary.length;
  const progress = Math.round((completedCount / totalCount) * 100) || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Section */}
      <div className="bg-emerald-800 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">Baguio Getaway</h1>
            <div className="bg-emerald-900/60 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-700/50 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              {progress}% Complete
            </div>
          </div>
          <p className="text-emerald-100 text-lg mb-6">March 19-22, 2026 • 2 Persons</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-emerald-700/50">
              <Calendar className="text-emerald-300 mb-2" size={24} />
              <p className="text-sm text-emerald-200">Duration</p>
              <p className="font-semibold">4 Days, 3 Nights</p>
            </div>
            <div className="bg-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-emerald-700/50">
              <MapPin className="text-emerald-300 mb-2" size={24} />
              <p className="text-sm text-emerald-200">Accommodation</p>
              <p className="font-semibold truncate" title="Airbnb">Airbnb</p>
            </div>
            <div className="bg-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-emerald-700/50">
              <Thermometer className="text-emerald-300 mb-2" size={24} />
              <p className="text-sm text-emerald-200">Est. Weather</p>
              <p className="font-semibold">10°C - 20°C</p>
            </div>
            <div className="bg-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-emerald-700/50">
              <AlertTriangle className="text-emerald-300 mb-2" size={24} />
              <p className="text-sm text-emerald-200">Est. Budget</p>
              <p className="font-semibold">₱15,792</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Tips */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            Important Tips
          </h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
              <p><strong>Very Cold Mornings:</strong> Temperatures can drop to 10°C. Bring 3-4 jackets/hoodies for layering.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
              <p><strong>Transportation:</strong> Taxis are honest and use meters (₱50 flag down). Jeepneys are cheaper (₱13) but routes can be confusing.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
              <p><strong>Night Market:</strong> Opens 9:00 PM to 2:00 AM at Harrison Road. Best place for cheap ukay-ukay and street food.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
              <p><strong>Cash is King:</strong> Bring enough cash (₱10,000+ per person) as many small shops and taxis don't accept cards/e-wallets.</p>
            </li>
          </ul>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Phone size={20} className="text-red-500" />
            Emergency
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">General Emergency</p>
              <p className="font-bold text-slate-800 text-lg">911</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Baguio Police</p>
              <p className="font-bold text-slate-800 text-lg">(074) 442-3222</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Tourist Police</p>
              <p className="font-bold text-slate-800 text-lg">(074) 442-6246</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Victory Liner</p>
              <p className="font-bold text-slate-800 text-lg">(02) 8833-5020</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
