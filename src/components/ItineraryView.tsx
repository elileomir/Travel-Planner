'use client';

import { useState } from 'react';
import { MapIcon, LayoutListIcon } from 'lucide-react';
import ItineraryTimeline, { ItineraryItem } from './ItineraryTimeline';
import Map3D from './Map3D';
import { motion, AnimatePresence } from 'framer-motion';

export default function ItineraryView({ itineraryData }: { itineraryData: any[] }) {
    const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);

    // Format CSV data to match the expected timeline interface
    const formattedItems = itineraryData.filter(i => i.Activity).map((item, index) => {
        const dayStr = item.Day || 'Unknown Day';
        let baseDate = new Date('2026-03-19T00:00:00'); // default
        if (dayStr.includes('Mar 19')) baseDate = new Date('2026-03-19');
        if (dayStr.includes('Mar 20')) baseDate = new Date('2026-03-20');
        if (dayStr.includes('Mar 21')) baseDate = new Date('2026-03-21');
        if (dayStr.includes('Mar 22')) baseDate = new Date('2026-03-22');
        if (dayStr.includes('Mar 23')) baseDate = new Date('2026-03-23');
        if (dayStr.includes('Mar 24')) baseDate = new Date('2026-03-24');
        if (dayStr.includes('Mar 25')) baseDate = new Date('2026-03-25');

        // approximate actual Time object by parsing "01:00 AM"
        try {
            if (item.Time) {
                const [timePart, modifier] = item.Time.split(' ');
                let [hours, minutes] = timePart.split(':').map(Number);
                if (hours === 12 && modifier === 'AM') hours = 0;
                if (modifier === 'PM' && hours < 12) hours += 12;
                baseDate.setHours(hours, minutes, 0, 0);
            }
        } catch { } // ignore bad parse

        // Detect destination: use CSV's Destination column, detect "Home" for drive-home items
        let destination = item.Destination || 'Baguio';
        const actLower = (item.Activity || '').toLowerCase();
        if (actLower.includes('drive back home') || actLower.includes('depart home') || actLower.includes('drive home')) {
            destination = 'Home';
        }

        return {
            id: String(index),
            day: dayStr,
            time: item.Time,
            duration: item.Duration && (item.Duration.toLowerCase().includes('hour') || item.Duration.toLowerCase().includes('hr'))
                ? (parseFloat(item.Duration) * 60) || 60
                : parseInt(item.Duration) || 60,
            activity: item.Activity,
            location: item.Location,
            cost: parseFloat(item['Cost per Person (₱)']) || 0,
            notes: item.Notes,
            link: item.Link,
            actualDate: baseDate,
            lat: item.Latitude ? Number(item.Latitude) : undefined,
            lng: item.Longitude ? Number(item.Longitude) : undefined,
            destination
        };
    });

    return (
        <div className="flex flex-col md:flex-row w-full flex-1 relative overflow-hidden bg-slate-50">
            {/* Left Panel: Itinerary Details */}
            <div className={`w-full md:w-[600px] flex flex-col bg-white border-r border-slate-200 flex-1 relative z-20 ${activeItem ? 'hidden md:flex' : 'flex'}`}>
                <ItineraryTimeline
                    initialItems={formattedItems}
                    onShowMap={(item) => {
                        setActiveItem(item);
                    }}
                />
            </div>

            {/* Right Panel: Lazy Map (Only visible occasionally or on desktop) */}
            <div className={`flex-1 relative ${activeItem ? 'flex' : 'hidden'} md:flex bg-slate-100 items-center justify-center`}>

                {!activeItem && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 backdrop-blur-sm z-10 px-8 text-center">
                        <MapIcon className="w-16 h-16 mb-4 text-blue-200" />
                        <h3 className="text-xl font-bold text-slate-700">Explore the Map</h3>
                        <p className="max-w-xs mt-2 text-slate-500">Tap "Show Route" on any itinerary item to reveal its location and get live directions.</p>
                    </div>
                )}

                <Map3D
                    activeItem={activeItem}
                    onCloseMap={() => setActiveItem(null)}
                />
            </div>
        </div>
    );
}
