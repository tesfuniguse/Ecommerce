import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Truck, MapPin, Warehouse, Hammer, Navigation, Flag, Compass, HelpCircle } from 'lucide-react';

interface GoogleLiveTrackingMapProps {
  currentLang: 'en' | 'am';
  subCity?: string;
  simProgress: number;
}

// Coordinates mapping for Addis Ababa subcities
const getDestinationCoords = (subCity?: string) => {
  const sc = (subCity || '').toLowerCase().trim();
  if (sc.includes('bole')) return { lat: 8.9892, lng: 38.7891 };
  if (sc.includes('lideta')) return { lat: 9.0084, lng: 38.7394 };
  if (sc.includes('kirkos')) return { lat: 9.0115, lng: 38.7615 };
  if (sc.includes('arada')) return { lat: 9.0350, lng: 38.7540 };
  if (sc.includes('ketema')) return { lat: 9.0320, lng: 38.7320 };
  if (sc.includes('yeka')) return { lat: 9.0290, lng: 38.8020 };
  if (sc.includes('nifas') || sc.includes('lafto')) return { lat: 8.9650, lng: 38.7280 };
  if (sc.includes('kolfe') || sc.includes('keran')) return { lat: 9.0180, lng: 38.6980 };
  if (sc.includes('akaki') || sc.includes('kalit')) return { lat: 8.8950, lng: 38.7860 };
  if (sc.includes('gullele')) return { lat: 9.0620, lng: 38.7280 };
  return { lat: 9.0192, lng: 38.7891 }; // Default Bole-ish area
};

// Sub-component to compute routes and render Polylines
function RouteDisplay({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const fallbackPolylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clear previous routes/polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null);
      fallbackPolylineRef.current = null;
    }

    // Default fallback: draw simple connecting lines
    const drawFallback = () => {
      const poly = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
      poly.setMap(map);
      fallbackPolylineRef.current = poly;

      // Adjust map bounds to include all key points
      const bounds = new google.maps.LatLngBounds();
      points.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    };

    if (!routesLib) {
      drawFallback();
      return;
    }

    // Try computing the primary route from origin to destination via waypoints if supported,
    // or direct route with fallback.
    routesLib.Route.computeRoutes({
      origin: points[0],
      destination: points[points.length - 1],
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#f59e0b',
            strokeWeight: 4.5,
            strokeOpacity: 0.85
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport, { top: 40, bottom: 40, left: 40, right: 40 });
        }
      } else {
        drawFallback();
      }
    }).catch((err) => {
      console.warn("ComputeRoutes failed, using clean direct polylines fallback.", err);
      drawFallback();
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
      if (fallbackPolylineRef.current) fallbackPolylineRef.current.setMap(null);
    };
  }, [routesLib, map, points]);

  return null;
}

export default function GoogleLiveTrackingMap({
  currentLang,
  subCity,
  simProgress,
}: GoogleLiveTrackingMapProps) {
  const destinationGps = getDestinationCoords(subCity);

  // Define 4 main shipment nodes
  const points = [
    { lat: 8.9806, lng: 38.7578 },  // Bole Depot
    { lat: 9.0084, lng: 38.7394 },  // Lideta Workshop
    { lat: 9.0345, lng: 38.7518 },  // Piazza Hub
    destinationGps                  // Destination Home
  ];

  // Helper to interpolate truck coordinate along the route
  const getTruckGps = (progress: number) => {
    if (progress <= 0) return points[0];
    if (progress >= 100) return points[3];
    
    const segmentLength = 100 / (points.length - 1);
    const segmentIdx = Math.min(Math.floor(progress / segmentLength), points.length - 2);
    const segmentProgress = (progress - segmentIdx * segmentLength) / segmentLength;
    
    const start = points[segmentIdx];
    const end = points[segmentIdx + 1];
    
    return {
      lat: start.lat + (end.lat - start.lat) * segmentProgress,
      lng: start.lng + (end.lng - start.lng) * segmentProgress
    };
  };

  const currentTruckGps = getTruckGps(simProgress);

  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  if (!hasValidKey) {
    return (
      <div id="gmp-setup-splash" className="bg-stone-950 border border-stone-850 p-6 rounded-lg text-left space-y-4">
        <div className="flex items-center gap-2 text-amber-500">
          <HelpCircle className="w-5 h-5 animate-bounce" />
          <h4 className="text-sm font-sans font-bold uppercase tracking-wider">
            {currentLang === 'en' ? 'Google Maps API Key Required' : 'የጎግል ካርታዎች ኤፒአይ ቁልፍ ያስፈልጋል'}
          </h4>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed font-sans">
          {currentLang === 'en' 
            ? 'To unlock the interactive satellite maps, GPS telemetry tracking, and precise courier street navigation, please configure a Google Maps Platform key.' 
            : 'የተቀናጀውን የሳተላይት መከታተያ፣ የጂፒኤስ ጉዞ እና የመልዕክተኛውን የቀጥታ የጎዳና ላይ መገኛ ለመመልከት እባክዎ የጎግል ካርታዎች ቁልፍ ያክሉ።'}
        </p>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded text-xs space-y-3">
          <p className="text-amber-500 font-mono font-bold uppercase tracking-wider text-[10px]">
            {currentLang === 'en' ? 'Setup Guide Instructions' : 'የማስተካከያ መመሪያዎች'}
          </p>
          <ol className="list-decimal list-inside space-y-2 text-stone-300 leading-relaxed font-sans">
            <li>
              {currentLang === 'en' ? 'Obitain a Google Maps API Key:' : 'የጎግል ካርታዎች የኤፒአይ ቁልፍ ያግኙ፡'}{' '}
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-500 underline hover:text-amber-400 font-mono"
              >
                Get Key Link
              </a>
            </li>
            <li>
              {currentLang === 'en' 
                ? 'Click on the Settings gear icon (⚙️) in the top-right corner of AI Studio.'
                : 'በላይኛው ቀኝ ጥግ ላይ ያለውን የማስተካከያ ምልክት (⚙️) ይጫኑ።'}
            </li>
            <li>
              {currentLang === 'en'
                ? 'Select "Secrets", add GOOGLE_MAPS_PLATFORM_KEY as the key, and paste your API key as the value.'
                : '"Secrets" የሚለውን መርጠው GOOGLE_MAPS_PLATFORM_KEY በማለት ቁልፉን ያስገቡ።'}
            </li>
            <li>
              {currentLang === 'en'
                ? 'Press Enter. The application will rebuild automatically and activate live mapping.'
                : 'የማረጋገጫ ቁልፉን ሲጫኑ መተግበሪያው በራሱ ተስተካክሎ የቀጥታ ካርታውን ያነቃዋል።'}
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div id="google-live-tracking-panel" className="space-y-4">
      {/* Map Widget Frame */}
      <div className="border border-stone-850 rounded-lg overflow-hidden bg-stone-950 relative shadow-inner">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: 9.01, lng: 38.76 }}
            defaultZoom={12}
            mapId="CRAFT_LEATHER_NAV_MAP"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '380px' }}
            disableDefaultUI={true}
            zoomControl={true}
            gestureHandling="cooperative"
          >
            {/* Compute and display polyline path */}
            <RouteDisplay points={points} />

            {/* Checkpoint 1: Bole Depot */}
            <AdvancedMarker position={points[0]} title="Bole Depot (Origin)">
              <div 
                style={{ width: '36px', height: '36px' }}
                className="bg-stone-900 border-2 border-amber-600 rounded-full flex items-center justify-center text-amber-500 shadow-lg hover:scale-110 transition-transform"
              >
                <Warehouse className="w-4 h-4" />
              </div>
            </AdvancedMarker>

            {/* Checkpoint 2: Lideta Workshop */}
            <AdvancedMarker position={points[1]} title="Lideta Workshop">
              <div 
                style={{ width: '36px', height: '36px' }}
                className="bg-stone-900 border-2 border-amber-500 rounded-full flex items-center justify-center text-amber-400 shadow-lg hover:scale-110 transition-transform"
              >
                <Hammer className="w-4 h-4" />
              </div>
            </AdvancedMarker>

            {/* Checkpoint 3: Piazza Transit Hub */}
            <AdvancedMarker position={points[2]} title="Piazza Transit Hub">
              <div 
                style={{ width: '36px', height: '36px' }}
                className="bg-stone-900 border-2 border-orange-500 rounded-full flex items-center justify-center text-orange-400 shadow-lg hover:scale-110 transition-transform"
              >
                <Compass className="w-4 h-4" />
              </div>
            </AdvancedMarker>

            {/* Checkpoint 4: Home Destination */}
            <AdvancedMarker position={points[3]} title={`Destination Home (${subCity || 'Default'})`}>
              <div 
                style={{ width: '36px', height: '36px' }}
                className="bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 shadow-lg hover:scale-110 transition-transform"
              >
                <Flag className="w-4 h-4 animate-pulse" />
              </div>
            </AdvancedMarker>

            {/* Simulated Live Courier Truck Marker */}
            {simProgress > 0 && (
              <AdvancedMarker position={currentTruckGps} title="Live Delivery Courier">
                <div 
                  style={{ width: '42px', height: '42px' }}
                  className="bg-amber-600 border-2 border-white rounded-full flex items-center justify-center text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.7)] animate-bounce"
                >
                  <Truck className="w-5 h-5 fill-current" />
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>

        {/* Small floating status overlay */}
        <div className="absolute top-3 left-3 bg-stone-950/90 border border-stone-850 px-3 py-1.5 rounded text-[10px] font-mono text-stone-300 flex items-center gap-1.5 backdrop-blur shadow-md pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="font-bold">GOOGLE MAPS FEED</span>
        </div>
      </div>

      {/* Navigation directions summary panel */}
      <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[10px] text-stone-400">
        <div className="bg-stone-950/60 p-3 rounded border border-stone-900">
          <span className="text-stone-500 block uppercase">{currentLang === 'en' ? 'Current Route Segment' : 'የአሁኑ መለያ ስፍራ'}</span>
          <span className="text-stone-200 font-bold block mt-1 text-xs">
            {simProgress === 0 && (currentLang === 'en' ? 'Awaiting Dispatch' : 'አልተጀመረም')}
            {simProgress > 0 && simProgress < 25 && (currentLang === 'en' ? 'Bole Depot ➔ Lideta' : 'ቦሌ መጋዘን ➔ ልደታ')}
            {simProgress >= 25 && simProgress < 50 && (currentLang === 'en' ? 'At Lideta Workshop' : 'ልደታ የቆዳ ጥበብ')}
            {simProgress >= 50 && simProgress < 80 && (currentLang === 'en' ? 'Lideta ➔ Piazza Transit' : 'ልደታ ➔ ፒያሳ ማከፋፈያ')}
            {simProgress >= 80 && simProgress < 100 && (currentLang === 'en' ? 'Piazza ➔ Delivery Destination' : 'ፒያሳ ➔ መዳረሻ አድራሻ')}
            {simProgress === 100 && (currentLang === 'en' ? 'Arrived at Destination' : 'መዳረሻ ስፍራ ደርሷል')}
          </span>
        </div>

        <div className="bg-stone-950/60 p-3 rounded border border-stone-900">
          <span className="text-stone-500 block uppercase">{currentLang === 'en' ? 'Satellite Coordinates' : 'የሳተላይት መገኛ (GPS)'}</span>
          <span className="text-amber-500 font-bold block mt-1 text-xs">
            {currentTruckGps.lat.toFixed(5)}° N, {currentTruckGps.lng.toFixed(5)}° E
          </span>
        </div>

        <div className="bg-stone-950/60 p-3 rounded border border-stone-900">
          <span className="text-stone-500 block uppercase">{currentLang === 'en' ? 'Live Courier Info' : 'የመልዕክተኛ መረጃ'}</span>
          <span className="text-stone-200 font-bold block mt-1 text-xs flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-amber-500" />
            {simProgress > 0 ? (currentLang === 'en' ? 'Abebe (Motorcycle Express)' : 'አበበ (ፈጣን ሞተር)') : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
