'use client';

import { X, Navigation, MapPin, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { ItineraryItem } from './ItineraryTimeline';

interface NavigationSheetProps {
    item: ItineraryItem | null;
    onClose: () => void;
}

export default function NavigationSheet({ item, onClose }: NavigationSheetProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted || !item) return null;

    // Resolve coordinates: prefer lat/lng from CSV, then coordinates from autocomplete
    const lat = item.lat || (item.coordinates ? item.coordinates[1] : null);
    const lng = item.lng || (item.coordinates ? item.coordinates[0] : null);
    const hasCoords = lat != null && lng != null;

    // Destination context for theming
    const dest = item.destination || '';
    const isElyu = dest.includes('La Union') || dest.includes('Elyu');
    const accentColor = isElyu ? 'amber' : 'blue';

    // Mapbox Static Image (lightweight — no SDK, just a URL)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const staticMapUrl = hasCoords && mapboxToken
        ? `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-l+ef4444(${lng},${lat})/${lng},${lat},14,0/400x200@2x?access_token=${mapboxToken}`
        : null;

    // Deep links for navigation apps
    const googleMapsUrl = hasCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || item.activity)}`;

    const wazeUrl = hasCoords
        ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
        : `https://waze.com/ul?q=${encodeURIComponent(item.location || item.activity)}&navigate=yes`;

    const appleMapsUrl = hasCoords
        ? `https://maps.apple.com/?daddr=${lat},${lng}`
        : `https://maps.apple.com/?q=${encodeURIComponent(item.location || item.activity)}`;

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="nav-sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    key="nav-sheet-content"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-slate-300 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="px-5 pt-2 pb-4 flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isElyu ? 'text-amber-600' : 'text-blue-600'}`}>
                                {isElyu ? '🏖️ La Union' : '🏔️ Baguio'}
                            </p>
                            <h3 className="text-lg font-extrabold text-slate-900 leading-tight truncate">
                                {item.activity}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{item.location}</span>
                            </div>
                            {item.time && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>{item.time} · {item.duration} min</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Static Map Image */}
                    {staticMapUrl && (
                        <div className="mx-5 mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                            <img
                                src={staticMapUrl}
                                alt={`Map of ${item.location}`}
                                className="w-full h-[140px] object-cover"
                                loading="eager"
                            />
                        </div>
                    )}

                    {!hasCoords && (
                        <div className="mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-700 font-medium">
                            ⚠️ Exact coordinates unavailable. Navigation will use address search.
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="px-5 pb-6 space-y-3">
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                        >
                            <Navigation className="w-5 h-5 fill-current" />
                            Navigate with Google Maps
                            <ExternalLink className="w-4 h-4 opacity-60" />
                        </a>

                        <a
                            href={wazeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-4 bg-[#33ccff] hover:bg-[#26b8e8] text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-[#33ccff]/20 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.486 2 2 6.486 2 12c0 1.395.288 2.725.808 3.935C4.295 19.505 7.883 22 12 22c4.117 0 7.705-2.495 9.192-6.065A9.967 9.967 0 0 0 22 12c0-5.514-4.486-10-10-10zm-3 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                            </svg>
                            Navigate with Waze
                            <ExternalLink className="w-4 h-4 opacity-60" />
                        </a>

                        <a
                            href={appleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
                        >
                            <MapPin className="w-4 h-4" />
                            Open in Apple Maps
                        </a>
                    </div>

                    {/* Safe area padding for iPhone notch */}
                    <div className="pb-safe" />
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
