'use client';
import { useCallback, useEffect, useState, useRef } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, MapRef } from 'react-map-gl/mapbox';
import { X, Navigation, Car, Info, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ItineraryItem } from './ItineraryTimeline';

interface Map3DProps {
    activeItem?: ItineraryItem | null;
    onCloseMap?: () => void;
}

export default function Map3D({ activeItem, onCloseMap }: Map3DProps) {
    const mapRef = useRef<MapRef>(null);

    // Smart default center: use destination-appropriate center when GPS is unavailable
    const getDefaultCenter = (): [number, number] => {
        if (activeItem) {
            const dest = (activeItem as any).destination || '';
            if (dest.includes('La Union') || dest.includes('Elyu')) {
                return [120.3214, 16.6192]; // Urbiztondo, San Juan, La Union
            }
            if (dest.includes('En Route') || dest === 'Home' || dest.includes('San Pedro')) {
                return [121.0434, 14.4869]; // SM Bicutan area (home base)
            }
        }
        return [120.5960, 16.4023]; // Baguio City center
    };

    const [userCoords, setUserCoords] = useState<[number, number]>(getDefaultCenter());
    const userCoordsRef = useRef<[number, number]>(getDefaultCenter());
    const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
    const [routeETA, setRouteETA] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(false);

    // Reset default center when switching destination context (Baguio ↔ La Union)
    useEffect(() => {
        if (!locationEnabled) {
            const center = getDefaultCenter();
            setUserCoords(center);
            userCoordsRef.current = center;
        }
    }, [activeItem?.destination]);

    // Initial Geolocation lazy fetch — only runs once per activeItem change
    useEffect(() => {
        if (activeItem && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                    setUserCoords(coords);
                    userCoordsRef.current = coords;
                    setLocationEnabled(true);
                },
                (err) => {
                    console.log('Geolocation denied or failed, using default coords', err);
                    setLocationEnabled(false);
                }
            );
        }
    }, [activeItem]);

    // Two-step animation:
    // Step 1: Immediately fly to destination pin (before route loads)
    // Step 2: Once route loads, smoothly zoom out to show full route with both pins
    useEffect(() => {
        if (!activeItem || !activeItem.location) {
            setDestCoords(null);
            setRouteGeoJSON(null);
            setRouteETA(null);
            return;
        }

        const fetchRoute = async () => {
            setIsLoading(true);
            setRouteETA("Calculating...");
            setRouteGeoJSON(null); // Clear old route
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!token) return;

            try {
                let destLngLat: [number, number] | null = null;

                // Priority 1: Verified CSV coordinates
                if (activeItem.lat && activeItem.lng) {
                    destLngLat = [activeItem.lng, activeItem.lat];
                }

                // Priority 2: Mapbox autocomplete coordinates (custom items)
                if (!destLngLat && activeItem.coordinates && activeItem.coordinates.length === 2) {
                    destLngLat = activeItem.coordinates as [number, number];
                }

                // Priority 3: Mapbox geocoding (last resort)
                if (!destLngLat) {
                    const dest = (activeItem as any).destination || '';
                    const regionHint = dest.includes('La Union') || dest.includes('Elyu')
                        ? 'La Union Philippines'
                        : 'Baguio City Philippines';

                    const searchQueries = [
                        `${activeItem.location} ${regionHint}`,
                        `${activeItem.activity} ${regionHint}`,
                        `${activeItem.location} Philippines`
                    ];

                    for (const query of searchQueries) {
                        const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&country=PH`;
                        const geoRes = await fetch(geoUrl);
                        const geoData = await geoRes.json();
                        if (geoData.features && geoData.features.length > 0) {
                            destLngLat = geoData.features[0].center as [number, number];
                            break;
                        }
                    }
                }

                if (!destLngLat) {
                    setRouteETA("Location not found");
                    setIsLoading(false);
                    return;
                }

                setDestCoords(destLngLat);

                // ── STEP 1: Immediately fly to the destination pin ──
                if (mapRef.current) {
                    const map = mapRef.current.getMap();
                    map.flyTo({
                        center: destLngLat,
                        zoom: 15,
                        pitch: 60,
                        bearing: -20,
                        duration: 1200,
                        essential: true
                    });
                }

                // Fetch Directions with full accuracy params (Try Traffic first)
                const origin = userCoordsRef.current;
                let routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin[0]},${origin[1]};${destLngLat[0]},${destLngLat[1]}?geometries=geojson&overview=full&steps=true&annotations=distance,duration,congestion&access_token=${token}`;
                let routeRes = await fetch(routeUrl);
                let routeData = await routeRes.json();

                // Fallback to standard driving if driving-traffic fails (e.g., for very long routes like Manila to Baguio)
                if (!routeData.routes || routeData.routes.length === 0) {
                    console.log("driving-traffic failed or returned no routes, falling back to standard driving profile...");
                    routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destLngLat[0]},${destLngLat[1]}?geometries=geojson&overview=full&steps=true&annotations=distance,duration&access_token=${token}`;
                    routeRes = await fetch(routeUrl);
                    routeData = await routeRes.json();
                }

                if (routeData.routes && routeData.routes.length > 0) {
                    const routeInfo = routeData.routes[0];
                    const route = routeInfo.geometry;

                    // ETA formatting
                    const durationMins = Math.ceil(routeInfo.duration / 60);
                    if (durationMins < 1) setRouteETA("< 1 min drive");
                    else if (durationMins < 60) setRouteETA(`${durationMins} min drive`);
                    else {
                        const hrs = Math.floor(durationMins / 60);
                        const mins = durationMins % 60;
                        setRouteETA(`${hrs}h ${mins}m drive`);
                    }

                    setRouteGeoJSON({
                        type: 'Feature',
                        properties: {},
                        geometry: route
                    });

                    // ── STEP 2: After a brief pause, smoothly zoom out to show the full route ──
                    setTimeout(() => {
                        if (mapRef.current) {
                            const map = mapRef.current.getMap();
                            const coords = route.coordinates as [number, number][];
                            if (coords && coords.length > 0) {
                                let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
                                for (const [lng, lat] of coords) {
                                    if (lng < minLng) minLng = lng;
                                    if (lng > maxLng) maxLng = lng;
                                    if (lat < minLat) minLat = lat;
                                    if (lat > maxLat) maxLat = lat;
                                }
                                // Also include user coords in bounds
                                const uc = userCoordsRef.current;
                                if (uc[0] < minLng) minLng = uc[0];
                                if (uc[0] > maxLng) maxLng = uc[0];
                                if (uc[1] < minLat) minLat = uc[1];
                                if (uc[1] > maxLat) maxLat = uc[1];

                                const bounds: [[number, number], [number, number]] = [
                                    [minLng, minLat],
                                    [maxLng, maxLat]
                                ];

                                // Safely fit bounds with smaller padding to avoid Mapbox Canvas errors on mobile/small screens
                                // and maxZoom to prevent infinite zooming if origin/dest are the exact same point
                                map.fitBounds(bounds, {
                                    padding: { top: 80, bottom: 120, left: 40, right: 40 },
                                    duration: 2000,
                                    pitch: 45,
                                    bearing: 0,
                                    maxZoom: 16
                                });
                            }
                        }
                    }, 1200); // Wait for step 1 fly animation to finish
                } else {
                    setRouteETA("No route found");
                }
            } catch (error) {
                console.error("Error fetching map data: ", error);
                setRouteETA("Error calculating route");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoute();
    }, [activeItem]); // Only re-fetch when activeItem changes, NOT on userCoords change

    const onMapLoad = useCallback((e: any) => {
        const map = e.target;
        // Add 3D terrain
        try {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14
            });
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        } catch (e) {
            console.log("Skipping 3D terrain init error", e);
        }

        // Add 3D buildings
        const layers = map.getStyle().layers;
        const labelLayerId = layers?.find(
            (layer: any) => layer.type === 'symbol' && layer.layout['text-field']
        )?.id;

        if (!map.getLayer('add-3d-buildings')) {
            try {
                map.addLayer(
                    {
                        id: 'add-3d-buildings',
                        source: 'composite',
                        'source-layer': 'building',
                        filter: ['==', 'extrude', 'true'],
                        type: 'fill-extrusion',
                        minzoom: 15,
                        paint: {
                            'fill-extrusion-color': '#aaa',
                            'fill-extrusion-height': [
                                'interpolate', ['linear'], ['zoom'],
                                15, 0,
                                15.05, ['get', 'height']
                            ],
                            'fill-extrusion-base': [
                                'interpolate', ['linear'], ['zoom'],
                                15, 0,
                                15.05, ['get', 'min_height']
                            ],
                            'fill-extrusion-opacity': 0.6
                        }
                    },
                    labelLayerId
                );
            } catch (e) { }
        }
    }, []);

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 p-8 text-center">
                <h3 className="text-xl font-medium mb-2 text-zinc-200">Mapbox Token Required</h3>
                <p className="text-sm">Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-slate-100">
            {/* Top Bar for Map Context */}
            {activeItem && (
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start gap-2">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-slate-200/50 flex-1">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5" />
                            Directions to next stop
                        </p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{activeItem.location}</p>
                        {isLoading && <p className="text-xs text-slate-500 animate-pulse mt-1">Calculating best route...</p>}
                        {!locationEnabled && routeETA && !isLoading && (
                            <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                ETA is estimated from Baguio City Center. Enable Location for live updates.
                            </p>
                        )}
                    </div>

                    {onCloseMap && (
                        <button
                            onClick={onCloseMap}
                            className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-200/50 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 120.5960, // Baguio City
                    latitude: 16.4023,
                    zoom: 14,
                    pitch: 60,
                    bearing: -20
                }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                onLoad={onMapLoad}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="bottom-right" />

                {/* Render the Waze-like Blue Route Line */}
                {routeGeoJSON && (
                    <Source id="route" type="geojson" data={routeGeoJSON}>
                        <Layer
                            id="route-line-casing"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{ 'line-color': '#2563eb', 'line-width': 10, 'line-opacity': 0.3 }}
                        />
                        <Layer
                            id="route-line"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{ 'line-color': '#3b82f6', 'line-width': 5 }}
                        />
                    </Source>
                )}

                {/* User Current Location Marker (always visible when viewing route) */}
                {userCoords && activeItem && (
                    <Marker longitude={userCoords[0]} latitude={userCoords[1]}>
                        <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg ring-4 ring-blue-500/30 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                    </Marker>
                )}

                {/* Destination Marker */}
                {destCoords && (
                    <Marker longitude={destCoords[0]} latitude={destCoords[1]}>
                        <div className="relative flex flex-col items-center">
                            <div className="w-8 h-8 bg-rose-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative z-10 transition-transform hover:scale-110">
                                <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                            <div className="h-8 w-1 bg-gradient-to-b from-rose-500 to-transparent -mt-1 opacity-80" />
                        </div>
                    </Marker>
                )}
            </Map>

            {/* Glass overlay effect when no active location */}
            {!activeItem && (
                <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]" />
            )}

            {/* Smart Animated ETA and Details Card */}
            <AnimatePresence>
                {activeItem && routeETA && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                        className="absolute bottom-6 left-4 right-4 z-30"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                            <div className="p-5 flex-1 relative overflow-hidden">
                                {/* Decorative gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60" />

                                <h3 className="text-xl font-extrabold text-slate-800 mb-1 relative z-10">{activeItem.activity}</h3>
                                <div className="flex items-center text-sm font-medium text-slate-500 mb-3 relative z-10">
                                    <MapPin className="w-4 h-4 mr-1.5 text-rose-500" />
                                    {activeItem.location}
                                </div>

                                {activeItem.notes && (
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 relative z-10 leading-relaxed">
                                        <span className="font-semibold text-slate-700 block mb-1">Things to do:</span>
                                        {activeItem.notes}
                                    </p>
                                )}
                            </div>

                            {/* ETA & Action Panel */}
                            <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col justify-center items-center md:items-start min-w-[180px]">
                                <div className="text-center md:text-left w-full">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Time</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-2xl font-black text-blue-600 mb-4">
                                        <Car className="w-6 h-6" />
                                        {routeETA}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (destCoords) {
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${destCoords[1]},${destCoords[0]}`, '_blank');
                                            }
                                        }}
                                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Navigation className="w-4 h-4 fill-current" />
                                        Let's Go!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
