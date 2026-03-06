import React from 'react';
import { CheckCircle2, Circle, Clock, MapPin, ExternalLink, Info, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Itinerary({ itinerary, toggleComplete }: { itinerary: any[], toggleComplete: (id: string) => void }) {
  // Group by day
  const groupedItinerary = itinerary.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-emerald-800 text-white p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-2">Baguio Trip Itinerary</h2>
        <p className="text-emerald-100">March 19-22, 2026 • 2 Persons</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="bg-emerald-900/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <DollarSign size={16} />
            <span>Est. Total: ₱15,792</span>
          </div>
          <div className="bg-emerald-900/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <MapPin size={16} />
            <span>Airbnb Check-in: 2:00 PM</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedItinerary).map(([day, items]) => (
          <div key={day} className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 sticky top-0 bg-slate-50 py-2 z-10 border-b border-slate-200">
              {day}
            </h3>
            <div className="space-y-3">
              {(items as any[]).map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "bg-white p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md",
                    item.completed ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => toggleComplete(item.id)}
                      className="mt-1 flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "font-semibold text-lg",
                          item.completed ? "text-slate-500 line-through" : "text-slate-900"
                        )}>
                          {item.activity}
                        </h4>
                        <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 mt-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        
                        {item.duration !== '-' && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-400" />
                            <span>{item.duration}</span>
                          </div>
                        )}
                        
                        {item.costFor2 > 0 && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={14} className="text-slate-400" />
                            <span>₱{item.costFor2} (for 2)</span>
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 text-sm text-slate-500 bg-slate-50 p-2.5 rounded-lg flex items-start gap-2 border border-slate-100">
                          <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                          <p>{item.notes}</p>
                        </div>
                      )}
                      
                      {item.link && (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3 font-medium transition-colors"
                        >
                          More info <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
