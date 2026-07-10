/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Order, Product } from '../types';
import {
  Search, Check, Clock, Package, Truck, CheckCircle2,
  AlertCircle, Calendar, MapPin, CreditCard, ChevronRight, HelpCircle, ArrowLeft,
  MessageSquare, RotateCcw, Printer, FileText, Play, Pause, Compass, Activity, Info, Map, Sparkles, History, Gauge, Navigation
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

interface OrderStatusProps {
  currentLang: 'en' | 'am';
  initialOrder?: Order | null;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onReorder?: (order: Order) => void;
}

interface DeliveryCountdownProps {
  order: Order;
  currentLang: 'en' | 'am';
}

function DeliveryCountdown({ order, currentLang }: DeliveryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  } | null>(null);

  useEffect(() => {
    if (order.orderStatus === 'cancelled' || order.orderStatus === 'delivered') {
      return;
    }

    const calculateTimeLeft = () => {
      const orderTime = new Date(order.createdAt).getTime();
      const targetTime = orderTime + 3 * 24 * 60 * 60 * 1000; // 3-day standard delivery window
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isOverdue: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt, order.orderStatus]);

  if (order.orderStatus === 'cancelled') {
    return null;
  }

  if (order.orderStatus === 'delivered') {
    return (
      <div className="bg-stone-900/50 border border-emerald-500/20 rounded-lg p-4 font-mono mb-6 text-center">
        <div className="text-emerald-500 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          {currentLang === 'en' ? 'Shipment Safely Delivered' : 'ትዕዛዝዎ በሰላም ደርሷል'}
        </div>
        <p className="text-[10px] text-stone-400 mt-1 font-sans">
          {currentLang === 'en' 
            ? 'Delivery successfully completed within the 3-day artisanal dispatch standard.'
            : 'ትዕዛዝዎ በ3 ቀናት ውስጥ በተሳካ ሁኔታ ደርሷል።'}
        </p>
      </div>
    );
  }

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds, isOverdue } = timeLeft;

  return (
    <div className="bg-stone-900/60 border border-amber-500/20 rounded-lg p-5 font-mono mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-1 bg-amber-500/10 text-amber-500 text-[8px] uppercase font-bold tracking-widest border-bl border-stone-850">
        {currentLang === 'en' ? 'Standard 3-Day Window' : 'መደበኛ ባለ 3-ቀን መስኮት'}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Estimation text */}
        <div className="text-center md:text-left">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            {currentLang === 'en' ? 'Estimated Arrival Countdown' : 'የመድረሻ ግምታዊ የጊዜ ቆጠራ'}
          </span>
          <p className="text-xs text-stone-300 font-sans leading-relaxed">
            {isOverdue ? (
              currentLang === 'en' 
                ? 'Your handcrafted masterpiece is scheduled to arrive at any moment.' 
                : 'የእጅ ሥራ ጥበብ ምርትዎ በማንኛውም ሰከንድ ይደርሳል።'
            ) : (
              currentLang === 'en'
                ? `Standard delivery window expires in:`
                : `መደበኛ የማድረሻ ጊዜ ለማለቅ የቀረው ጊዜ፡`
            )}
          </p>
        </div>

        {/* Countdown digits display */}
        <div className="flex items-center gap-2">
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="bg-stone-950 border border-stone-800 text-stone-100 font-bold text-base w-12 h-11 flex items-center justify-center rounded shadow-inner">
              {String(days).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-stone-500 uppercase mt-1 font-sans">
              {currentLang === 'en' ? 'Days' : 'ቀናት'}
            </span>
          </div>

          <span className="text-stone-600 font-bold text-lg mb-4">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="bg-stone-950 border border-stone-800 text-stone-100 font-bold text-base w-12 h-11 flex items-center justify-center rounded shadow-inner">
              {String(hours).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-stone-500 uppercase mt-1 font-sans">
              {currentLang === 'en' ? 'Hrs' : 'ሰዓታት'}
            </span>
          </div>

          <span className="text-stone-600 font-bold text-lg mb-4">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="bg-stone-950 border border-stone-800 text-stone-100 font-bold text-base w-12 h-11 flex items-center justify-center rounded shadow-inner">
              {String(minutes).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-stone-500 uppercase mt-1 font-sans">
              {currentLang === 'en' ? 'Mins' : 'ደቂቃዎች'}
            </span>
          </div>

          <span className="text-stone-600 font-bold text-lg mb-4">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="bg-stone-950 border border-stone-800 text-amber-500 font-bold text-base w-12 h-11 flex items-center justify-center rounded shadow-inner">
              {String(seconds).padStart(2, '0')}
            </div>
            <span className="text-[9px] text-stone-500 uppercase mt-1 font-sans">
              {currentLang === 'en' ? 'Secs' : 'ሰከንዶች'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OrderStatusProgressBarProps {
  order: Order;
  currentLang: 'en' | 'am';
}

interface OrderStatusProgressBarProps {
  order: Order;
  currentLang: 'en' | 'am';
}

function OrderStatusProgressBar({ order, currentLang }: OrderStatusProgressBarProps) {
  if (order.orderStatus === 'cancelled') return null;

  const stages = [
    {
      key: 'pending',
      labelEn: 'Confirmed',
      labelAm: 'ተረጋግጧል',
      percent: 25,
      icon: Clock,
      locationEn: 'Zema Bole HQ Depot',
      locationAm: 'ዜማ ቦሌ ዋና መጋዘን',
      durationEn: 'Instant',
      durationAm: 'ወዲያውኑ',
      craftTitleEn: 'Artisanal Selection & Allocation',
      craftTitleAm: 'የጥራት ምርጫ እና ማስተካከል',
      craftDescEn: 'Your luxury selection is verified. A certified master artisan hand-selects the finest grade-A full-grain Ethiopian leather hide from our sustainable highlands stock, checking for optimal density and grain pattern consistency.',
      craftDescAm: 'ትዕዛዝዎ ተረጋግጧል። ባለሙያዎቻችን ለትዕዛዝዎ የሚሆን ምርጥ ደረጃ-ኤ ሙሉ-የቆዳ ጥሬ ዕቃን ከደጋው የኢትዮጵያ ከብቶች ቆዳ በጥንቃቄ መርጠው ያዘጋጃሉ፤ ይህም ጥንካሬውን እና ውበቱን ያረጋግጣል።'
    },
    {
      key: 'processing',
      labelEn: 'Crafting',
      labelAm: 'በማዘጋጀት ላይ',
      percent: 50,
      icon: Package,
      locationEn: 'Lideta Artisanal Workshop',
      locationAm: 'ልደታ የቆዳ ጥበብ ክፍል',
      durationEn: '24-48 Hours',
      durationAm: 'ከ24-48 ሰዓታት',
      craftTitleEn: 'Precision Cutting & Saddle Stitching',
      craftTitleAm: 'በትክክለኛነት መቁረጥ እና በእጅ መስፋት',
      craftDescEn: 'Our craftspeople execute razor-sharp pattern cutting to minimize seams. Edges are hand-bevelled and polished with organic beeswax. Stitching is completed manually using heavy-duty, double-saddle wax thread to ensure a lifetime of durability.',
      craftDescAm: 'ቆዳው በትክክለኛ መቁረጫ ቅርጽ ይወጣል። ጠርዞቹ በንብ ሰም ይታሸጋሉ። ከዚያም ባለሙያዎች በሰም የተነከረ ጠንካራ ክር በመጠቀም በእጃቸው ይሰፉታል፤ ይህም ለብዙ ዓመታት በጽናት እንዲያገለግል ያደርገዋል።'
    },
    {
      key: 'shipped',
      labelEn: 'Shipped',
      labelAm: 'ተልኳል',
      percent: 75,
      icon: Truck,
      locationEn: 'Addis Ababa Central Dispatch',
      locationAm: 'አዲስ አበባ ዋና ማከፋፈያ',
      durationEn: '1-2 Days',
      durationAm: 'ከ1-2 ቀናት',
      craftTitleEn: 'Conditioning, Packing & Dispatch',
      craftTitleAm: 'ቆዳን መንከባከብ፣ ማሸግ እና መላክ',
      craftDescEn: 'The completed item undergoes rigorous quality audits. It is treated with premium organic leather conditioners, carefully wrapped in soft unbleached cotton dust sleeves, placed inside our protective signature rigid gift box, and dispatched.',
      craftDescAm: 'ያለቀው ምርት ጥብቅ የጥራት ቁጥጥር ይደረግበታል። በቆዳ ማለስለሻ ክሬም ከታሸ በኋላ ከጥጥ በተሠራ ልዩ ከረጢት እና የዜማ የራሱ በሆነ ውብ ሳጥን ውስጥ ታሽጎ ለአቅራቢዎቻችን ይላካል።'
    },
    {
      key: 'delivered',
      labelEn: 'Delivered',
      labelAm: 'ደርሷል',
      percent: 100,
      icon: CheckCircle2,
      locationEn: 'Specified Hand-off Point',
      locationAm: 'የተቀባይ አድራሻ',
      durationEn: 'Completed',
      durationAm: 'ተጠናቋል',
      craftTitleEn: 'Pristine Personal Hand-off',
      craftTitleAm: 'በእጅ ርክክብ ማጠናቀቅ',
      craftDescEn: 'Our courier conducts a secure hand-off directly at your address. Each parcel includes a registered authenticity certificate stamped with our tannery origin mark and a comprehensive leather longevity manual.',
      craftDescAm: 'አቅራቢዎቻችን ምርቱን ደጅዎ ድረስ በታማኝነት ያደርሳሉ። እያንዳንዱ ምርት ከማረጋገጫ ሰርተፊኬት እና የቆዳውን እድሜ ለማርዘም የሚረዱ የጥንቃቄ መመሪያዎችን የያዘ ማስታወሻ ጋር አብሮ ይሰጥዎታል።'
    },
  ];

  const getProgressDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { index: 0, percent: 25 };
      case 'processing':
        return { index: 1, percent: 50 };
      case 'shipped':
        return { index: 2, percent: 75 };
      case 'delivered':
        return { index: 3, percent: 100 };
      default:
        return { index: 0, percent: 25 };
    }
  };

  const actualDetails = getProgressDetails(order.orderStatus);
  const [selectedIdx, setSelectedIdx] = useState(actualDetails.index);
  const [activeTab, setActiveTab] = useState<'craft' | 'simulator' | 'logs'>('craft');

  // Simulator state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(2);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logTerminalEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logTerminalEndRef.current) {
      logTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simLogs]);

  // Handle order status updates external
  useEffect(() => {
    setSelectedIdx(actualDetails.index);
  }, [order.orderStatus]);

  // Clean simulator on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const getSimulatedCoordinates = (progress: number) => {
    const points = [
      { x: 45, y: 70, name: currentLang === 'en' ? 'Bole Depot' : 'ቦሌ መጋዘን' },
      { x: 175, y: 35, name: currentLang === 'en' ? 'Lideta Workshop' : 'ልደታ የሥራ ክፍል' },
      { x: 305, y: 95, name: currentLang === 'en' ? 'Piazza Transit' : 'ፒያሳ ማከፋፈያ' },
      { x: 435, y: 55, name: `${order.shippingAddress.subCity || 'Destination'}` }
    ];
    
    if (progress <= 0) return points[0];
    if (progress >= 100) return points[3];
    
    const segmentLength = 100 / (points.length - 1);
    const segmentIdx = Math.min(Math.floor(progress / segmentLength), points.length - 2);
    const segmentProgress = (progress - segmentIdx * segmentLength) / segmentLength;
    
    const start = points[segmentIdx];
    const end = points[segmentIdx + 1];
    
    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress,
      name: end.name
    };
  };

  const getSimulatedGps = (progress: number) => {
    const points = [
      { lat: 8.9806, lng: 38.7578 }, // Bole
      { lat: 9.0084, lng: 38.7394 }, // Lideta
      { lat: 9.0345, lng: 38.7518 }, // Piazza
      { lat: 9.0192, lng: 38.7891 }  // Destination subcity
    ];
    
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

  const startTrackingSimulation = () => {
    if (isSimulating) {
      // Pause
      setIsSimulating(false);
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setSimLogs(prev => [...prev, `[INFO] Satellite tracking stream paused by user.`]);
    } else {
      // Start/Resume
      setIsSimulating(true);
      const startProg = simProgress >= 100 ? 0 : simProgress;
      if (startProg === 0) {
        setSimLogs([
          `[00:00:00] [🛰️ INITIATED] Connecting to Zema-Sat tracking grid...`,
          `[00:00:01] [🛰️ CONNECTED] Handshaking secure port on Bole Satellite Array.`,
          `[00:00:02] [🛰️ FEED] High-precision GPS tracking locked on Order ID: ${order.id}.`
        ]);
        setSimProgress(0);
      } else {
        setSimLogs(prev => [...prev, `[INFO] Satellite tracking stream resumed.`]);
      }

      const intervalMs = 150 / simSpeed;

      simIntervalRef.current = setInterval(() => {
        setSimProgress((prev) => {
          const next = Math.min(prev + 1, 100);
          
          // Check milestones to append corresponding logs
          const ticks = {
            10: currentLang === 'en' 
              ? `[00:10:15] [📦 QUALITY CHECK] Packing specialist confirms natural beeswax polishing is complete.`
              : `[00:10:15] [📦 የጥራት ቁጥጥር] ምርቱ በንብ ሰም የመታሸት ሂደቱ በተሳካ ሁኔታ መጠናቀቁ ተረጋግጧል።`,
            25: currentLang === 'en'
              ? `[00:25:30] [🏭 DISPATCH] Scanned out of Bole HQ Depot. Placed inside climate-controlled electric cargo van.`
              : `[00:25:30] [🏭 መነሻ] ከቦሌ መጋዘን ወጥቷል። በኤሌክትሪክ በሚሠራው ዘመናዊ ማጓጓዣ መኪና ውስጥ ተጭኗል።`,
            35: currentLang === 'en'
              ? `[00:35:10] [🛰️ TELEMETRY] Electric van approaching Africa Avenue bypass. Transmitting normal engine metrics.`
              : `[00:35:10] [🛰️ ቴሌሜትሪ] ማጓጓዣው መኪና በአፍሪካ ጎዳና በኩል እያለፈ ነው። ሁሉም መረጃዎች ጤናማ ናቸው።`,
            50: currentLang === 'en'
              ? `[00:50:00] [📍 WORKSHOP GATE] Vehicle entered Lideta artisanal corridor checkpoint for localized parcel sorting.`
              : `[00:50:00] [📍 ኬላ] ተሽከርካሪው ለልዩ ምደባ ወደ ልደታ ማከፋፈያ ጣቢያ ደርሷል።`,
            65: currentLang === 'en'
              ? `[00:65:45] [🚚 IN-TRANSIT] Sorted successfully. Courier Abebe assigned. Departing Lideta Sorting Facility.`
              : `[00:65:45] [🚚 በመንገድ ላይ] ምደባው ተጠናቋል። አቅራቢ አበበ ተረክቧል። ከልደታ ወጥቷል።`,
            80: currentLang === 'en'
              ? `[00:80:20] [🛰️ SATELLITE] Route projection shows passing through Piazza historic junction. Altitude: 2355 meters.`
              : `[00:80:20] [🛰️ ሳተላይት] ማጓጓዣው በፒያሳ በኩል እየተጓዘ መሆኑን ያሳያል። ከፍታ፡ 2355 ሜትር።`,
            90: currentLang === 'en'
              ? `[00:90:50] [🚨 LAST MILE] Approaching specified delivery zone in ${order.shippingAddress.subCity || 'sub-city'}. Speed calibrated to 22 km/h.`
              : `[00:90:50] [🚨 መዳረሻ] ወደ መዳረሻው በ${order.shippingAddress.subCity || 'ክፍለ ከተማ'} እየቀረበ ነው። ፍጥነት ወደ 22 ኪሜ/በሰዓት ቀንሷል።`,
            100: currentLang === 'en'
              ? `[01:00:00] [🎉 DELIVERED] Secure handheld terminal hand-stamped. Certificate of authentic leather origin delivered. Handover complete!`
              : `[01:00:00] [🎉 ደርሷል] ምርቱ በሰላም የተቀባዩ እጅ ደርሷል። የመነሻ ሰርተፊኬት ተሰጥቷል። ርክክብ ተጠናቋል!`
          };

          const logMessage = (ticks as any)[next];
          if (logMessage) {
            setSimLogs(prevLogs => [...prevLogs, logMessage]);
          }

          if (next >= 100) {
            setIsSimulating(false);
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          }
          return next;
        });
      }, intervalMs);
    }
  };

  const resetTrackingSimulation = () => {
    setIsSimulating(false);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimProgress(0);
    setSimLogs([`[INFO] Tracker simulation reset. Ready to start.`]);
  };

  const changeSimSpeed = (speed: 1 | 2 | 4) => {
    setSimSpeed(speed);
    if (isSimulating) {
      // Re-initialize interval with new speed
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      const intervalMs = 150 / speed;
      simIntervalRef.current = setInterval(() => {
        setSimProgress((prev) => {
          const next = Math.min(prev + 1, 100);
          const ticks = {
            10: currentLang === 'en' 
              ? `[00:10:15] [📦 QUALITY CHECK] Packing specialist confirms natural beeswax polishing is complete.`
              : `[00:10:15] [📦 የጥራት ቁጥጥር] ምርቱ በንብ ሰም የመታሸት ሂደቱ በተሳካ ሁኔታ መጠናቀቁ ተረጋግጧል።`,
            25: currentLang === 'en'
              ? `[00:25:30] [🏭 DISPATCH] Scanned out of Bole HQ Depot. Placed inside climate-controlled electric cargo van.`
              : `[00:25:30] [🏭 መነሻ] ከቦሌ መጋዘን ወጥቷል። በኤሌክትሪክ በሚሠራው ዘመናዊ ማጓጓዣ መኪና ውስጥ ተጭኗል።`,
            35: currentLang === 'en'
              ? `[00:35:10] [🛰️ TELEMETRY] Electric van approaching Africa Avenue bypass. Transmitting normal engine metrics.`
              : `[00:35:10] [🛰️ ቴሌሜትሪ] ማጓጓዣው መኪና በአፍሪካ ጎዳና በኩል እያለፈ ነው። ሁሉም መረጃዎች ጤናማ ናቸው።`,
            50: currentLang === 'en'
              ? `[00:50:00] [📍 WORKSHOP GATE] Vehicle entered Lideta artisanal corridor checkpoint for localized parcel sorting.`
              : `[00:50:00] [📍 ኬላ] ተሽከርካሪው ለልዩ ምደባ ወደ ልደታ ማከፋፈያ ጣቢያ ደርሷል።`,
            65: currentLang === 'en'
              ? `[00:65:45] [🚚 IN-TRANSIT] Sorted successfully. Courier Abebe assigned. Departing Lideta Sorting Facility.`
              : `[00:65:45] [🚚 በመንገድ ላይ] ምደባው ተጠናቋል። አቅራቢ አበበ ተረክቧል። ከልደታ ወጥቷል።`,
            80: currentLang === 'en'
              ? `[00:80:20] [🛰️ SATELLITE] Route projection shows passing through Piazza historic junction. Altitude: 2355 meters.`
              : `[00:80:20] [🛰️ ሳተላይት] ማጓጓዣው በፒያሳ በኩል እየተጓዘ መሆኑን ያሳያል። ከፍታ፡ 2355 ሜትር።`,
            90: currentLang === 'en'
              ? `[00:90:50] [🚨 LAST MILE] Approaching specified delivery zone in ${order.shippingAddress.subCity || 'sub-city'}. Speed calibrated to 22 km/h.`
              : `[00:90:50] [🚨 መዳረሻ] ወደ መዳረሻው በ${order.shippingAddress.subCity || 'ክፍለ ከተማ'} እየቀረበ ነው። ፍጥነት ወደ 22 ኪሜ/በሰዓት ቀንሷል።`,
            100: currentLang === 'en'
              ? `[01:00:00] [🎉 DELIVERED] Secure handheld terminal hand-stamped. Certificate of authentic leather origin delivered. Handover complete!`
              : `[01:00:00] [🎉 ደርሷል] ምርቱ በሰላም የተቀባዩ እጅ ደርሷል። የመነሻ ሰርተፊኬት ተሰጥቷል። ርክክብ ተጠናቋል!`
          };

          const logMessage = (ticks as any)[next];
          if (logMessage) {
            setSimLogs(prevLogs => [...prevLogs, logMessage]);
          }

          if (next >= 100) {
            setIsSimulating(false);
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          }
          return next;
        });
      }, intervalMs);
    }
  };

  const selectedStage = stages[selectedIdx] || stages[0];
  const currentStageDetails = stages[actualDetails.index];

  // Helper to generate static chronological milestone logs based on order createdAt
  const generateMilestoneLogs = () => {
    const createdDate = new Date(order.createdAt);
    const logs = [];

    // Confirmed
    logs.push({
      time: createdDate.toLocaleString(),
      titleEn: 'Order Payment Confirmed',
      titleAm: 'ክፍያ ተረጋግጧል',
      descEn: 'Electronic transaction security clearance completed. Handcraft file opened for master tailors.',
      descAm: 'የክፍያ ደህንነት ማረጋገጫ ተጠናቋል። የእጅ ሥራ መዝገብ ለባለሙያዎቻችን ተከፍቷል።'
    });

    // Processing
    if (actualDetails.index >= 1) {
      const procTime = new Date(createdDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      logs.push({
        time: procTime.toLocaleString(),
        titleEn: 'Artisanal Hide Allocation',
        titleAm: 'የጥራት ቆዳ መረጣ',
        descEn: 'Grade-A highland full-grain leather hide inspected and assigned to cutting desk.',
        descAm: 'ደረጃ-ኤ የደጋ ቆዳ በጥራት ቁጥጥር ተመርጦ ለስራ ተዘጋጅቷል።'
      });

      const stitchTime = new Date(createdDate.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
      logs.push({
        time: stitchTime.toLocaleString(),
        titleEn: 'Hand-stretching & Stitching',
        titleAm: 'ማስተካከል እና በእጅ መስፋት',
        descEn: 'Precision manual pattern cutting executed. Double-saddle waxing and stitching initiated at Lideta workshop.',
        descAm: 'በትክክለኛ መቁረጫ ቅርጽ ወጥቷል። በሰም የተነከረ ጠንካራ ክር በእጅ የመስፋት ስራ በልደታ የቆዳ ጥበብ ክፍል ተጀምሯል።'
      });
    }

    // Shipped
    if (actualDetails.index >= 2) {
      const shipTime = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
      logs.push({
        time: shipTime.toLocaleString(),
        titleEn: 'Parcel Wrapped & Shipped',
        titleAm: 'ምርቱ ታሽጎ ተልኳል',
        descEn: 'Rigorous 12-point quality inspection approved. Wrapped in cotton dust bag and dispatched with Zema courier Abebe.',
        descAm: 'ባለ 12-ደረጃ የጥራት ቁጥጥር አልፏል። በጥጥ ከረጢት ተጠቅልሎ ከአቅራቢ አበበ ጋር ጉዞ ጀምሯል።'
      });
    }

    // Delivered
    if (actualDetails.index >= 3) {
      const delivTime = new Date(createdDate.getTime() + 48 * 60 * 60 * 1000); // 48 hours later
      logs.push({
        time: delivTime.toLocaleString(),
        titleEn: 'Secure Handover Completed',
        titleAm: 'ርክክብ በሰላም ተጠናቋል',
        descEn: 'Delivered in-person with signed hand-terminal. Origin Authenticity certificate and care guide supplied.',
        descAm: 'ለተቀባዩ በሰላም ደርሷል። የመነሻ ማረጋገጫ ሰርተፊኬት እና የጥንቃቄ መመሪያ አብሮ ተሰጥቷል።'
      });
    }

    return logs.reverse(); // Newest logs first
  };

  const computedLogs = generateMilestoneLogs();
  const simulatedPos = getSimulatedCoordinates(simProgress);
  const simulatedGps = getSimulatedGps(simProgress);

  return (
    <div className="bg-stone-900/60 border border-stone-850 rounded-lg p-6 mb-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Decorative background canvas lines representing leather stitching */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-500/20" style={{ backgroundImage: 'linear-gradient(to right, #d97706 50%, transparent 50%)', backgroundSize: '12px 100%' }}></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-stone-800/60 pb-4">
        <div>
          <h3 className="text-sm font-sans font-bold text-stone-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
            {currentLang === 'en' ? 'Interactive Shipment Tracker' : 'የተጠናከረ የትዕዛዝ መከታተያ'}
          </h3>
          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
            {currentLang === 'en' ? 'Click on any stage node below to explore its artisanal milestone' : 'ዝርዝር መረጃዎችን ለማየት ከታች ያሉትን ደረጃዎች ይጫኑ'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-full shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[10px] font-mono text-stone-300">
            {currentLang === 'en' ? `Active: ${currentStageDetails.labelEn}` : `አሁን ላይ፡ ${currentStageDetails.labelAm}`}
          </span>
        </div>
      </div>

      {/* Main Interactive Progress Track */}
      <div className="relative h-3 bg-stone-950 rounded-full border border-stone-800 mb-10 overflow-visible mt-8 mx-2">
        {/* Glow backdrop fill bar */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
          style={{ width: `${actualDetails.percent}%` }}
        />

        {/* Interactive Nodes */}
        <div className="absolute inset-0 flex justify-between items-center -top-[8px] px-1">
          {stages.map((stage, idx) => {
            const isCompleted = idx < actualDetails.index;
            const isCurrent = idx === actualDetails.index;
            const isSelected = idx === selectedIdx;
            const StageIcon = stage.icon;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className="relative flex flex-col items-center group cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/50 rounded-full"
              >
                {/* Visual Circle Node */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2 text-[10px] relative z-10 ${
                    isSelected 
                      ? 'bg-amber-500 border-amber-400 text-stone-950 scale-125 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                      : isCompleted
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-stone-950 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : isCurrent
                      ? 'bg-stone-950 border-amber-500 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse'
                      : 'bg-stone-900 border-stone-800 text-stone-600 hover:border-stone-500 hover:text-stone-300'
                  }`}
                >
                  {isCompleted && !isSelected ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <StageIcon className="w-3.5 h-3.5" />
                  )}

                  {/* Tiny indicator badge for current status */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-stone-950 animate-bounce"></span>
                  )}
                </div>

                {/* Node Text Label below */}
                <div className="absolute top-9 flex flex-col items-center w-14 sm:w-20 md:w-auto">
                  <span
                    className={`text-[8px] sm:text-[9px] md:text-[10px] text-center font-mono font-bold tracking-tight leading-tight transition-all duration-300 md:whitespace-nowrap ${
                      isSelected
                        ? 'text-amber-400 font-extrabold text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wide'
                        : isCurrent
                        ? 'text-amber-500'
                        : isCompleted
                        ? 'text-stone-300'
                        : 'text-stone-500 group-hover:text-stone-300'
                    }`}
                  >
                    {currentLang === 'en' ? stage.labelEn : stage.labelAm}
                  </span>
                  
                  {/* Selected Indicator Underline Dot */}
                  {isSelected && (
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 mt-0.5"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Tabs Header */}
      <div className="mt-12 flex items-center justify-start border-b border-stone-800/80 mb-5 gap-1">
        <button
          onClick={() => setActiveTab('craft')}
          className={`px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'craft'
              ? 'border-amber-500 text-amber-500 bg-amber-500/5'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-850/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {currentLang === 'en' ? 'Craft details' : 'የእጅ ጥበብ መረጃ'}
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-amber-500 text-amber-500 bg-amber-500/5'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-850/30'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          {currentLang === 'en' ? 'Live GPS Simulator' : 'የቀጥታ ጉዞ መከታተያ'}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-amber-500 text-amber-500 bg-amber-500/5'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-850/30'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {currentLang === 'en' ? 'Artisanal Logs' : 'የሂደት መዝገቦች'}
        </button>
      </div>

      {/* Tabs Content Display with beautiful Framer Motion crossfade */}
      <div className="min-h-[180px]">
        <AnimatePresence mode="wait">
          {activeTab === 'craft' && (
            <motion.div
              key="craft-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-stone-950/40 border border-stone-850/80 p-5 rounded-lg flex flex-col md:flex-row gap-5 items-start"
            >
              {/* Left Side: Specific stage metadata */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {currentLang === 'en' ? 'Selected Phase' : 'የተመረጠው ደረጃ'}
                    </span>
                    <h4 className="text-sm font-sans font-bold text-stone-100 mt-2">
                      {currentLang === 'en' ? selectedStage.craftTitleEn : selectedStage.craftTitleAm}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-stone-500 uppercase">{currentLang === 'en' ? 'Facility Location' : 'የስራ ቦታ'}</p>
                    <p className="text-xs font-bold text-stone-300">{currentLang === 'en' ? selectedStage.locationEn : selectedStage.locationAm}</p>
                  </div>
                </div>

                <p className="text-xs text-stone-400 leading-relaxed font-sans">
                  {currentLang === 'en' ? selectedStage.craftDescEn : selectedStage.craftDescAm}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-stone-900/60 font-mono text-[10px]">
                  <div className="bg-stone-950/60 p-2.5 rounded border border-stone-900">
                    <span className="text-stone-500 uppercase block">{currentLang === 'en' ? 'Estimated Duration' : 'የሚወስደው ጊዜ'}</span>
                    <span className="text-stone-300 font-bold block mt-0.5">{currentLang === 'en' ? selectedStage.durationEn : selectedStage.durationAm}</span>
                  </div>
                  <div className="bg-stone-950/60 p-2.5 rounded border border-stone-900">
                    <span className="text-stone-500 uppercase block">{currentLang === 'en' ? 'Milestone Status' : 'የደረጃው ሁኔታ'}</span>
                    <span className={`font-bold block mt-0.5 ${
                      selectedIdx < actualDetails.index 
                        ? 'text-emerald-500' 
                        : selectedIdx === actualDetails.index 
                        ? 'text-amber-500 animate-pulse' 
                        : 'text-stone-600'
                    }`}>
                      {selectedIdx < actualDetails.index 
                        ? (currentLang === 'en' ? 'Completed & Sealed' : 'ተጠናቋል') 
                        : selectedIdx === actualDetails.index 
                        ? (currentLang === 'en' ? 'Currently In-Progress' : 'በሂደት ላይ') 
                        : (currentLang === 'en' ? 'Awaiting Phase' : 'ገና አልደረሰም')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Small illustration/badge of the stage */}
              <div className="w-full md:w-48 bg-stone-950 border border-stone-850 p-4 rounded-lg flex flex-col items-center justify-center text-center self-stretch">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                  selectedIdx <= actualDetails.index ? 'bg-amber-500/10 border-amber-500/30' : 'bg-stone-900 border-stone-800'
                } border-2`}>
                  {(() => {
                    const StageIcon = selectedStage.icon;
                    return <StageIcon className={`w-7 h-7 ${selectedIdx === actualDetails.index ? 'text-amber-500 animate-pulse' : selectedIdx < actualDetails.index ? 'text-amber-600' : 'text-stone-700'}`} />;
                  })()}
                </div>
                <h5 className="text-[11px] font-mono font-bold text-stone-300 uppercase tracking-widest">{currentLang === 'en' ? selectedStage.labelEn : selectedStage.labelAm}</h5>
                <p className="text-[9px] text-stone-500 mt-1.5 font-sans leading-tight">
                  {currentLang === 'en' ? 'Premium hand-tanned leather accessory' : 'በእጅ ጥበብ የተሰራ የኢትዮጵያ የቆዳ ውጤት'}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-stone-950/40 border border-stone-850/80 p-5 rounded-lg space-y-4"
            >
              <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" />
                {currentLang === 'en' ? 'Official Shipment History Audit' : 'የሂደት ታሪክ ማረጋገጫ መዝገብ'}
              </h4>

              <div className="relative pl-6 space-y-6">
                {/* Timeline vertical connector */}
                <div className="absolute top-1 bottom-1 left-2.5 w-[1px] bg-stone-800"></div>

                {computedLogs.map((log, index) => (
                  <div key={index} className="relative flex flex-col sm:flex-row sm:items-start gap-2">
                    {/* Timestamp Node Circle */}
                    <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-amber-500 border border-stone-950 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>

                    {/* Date Time left column */}
                    <div className="min-w-[150px] font-mono text-[10px] text-stone-500 font-bold">
                      {log.time}
                    </div>

                    {/* Description right column */}
                    <div className="min-w-0 flex-grow">
                      <h5 className="text-[11px] font-sans font-bold text-stone-200 uppercase tracking-wide">
                        {currentLang === 'en' ? log.titleEn : log.titleAm}
                      </h5>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-normal font-sans">
                        {currentLang === 'en' ? log.descEn : log.descAm}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div
              key="simulator-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Tracker simulation control block */}
              <div className="bg-stone-950/40 border border-stone-850/80 p-5 rounded-lg flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    {currentLang === 'en' ? 'Satellite GPS Transit Simulator' : 'የሳተላይት መከታተያ ሲሙሌተር'}
                  </h4>
                  <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                    {currentLang === 'en' 
                      ? 'Simulate the in-real-time dispatch of your artisanal parcel across Addis Ababa sorting facilities.'
                      : 'የተሰፋው የቆዳ እቃዎ ከአዲስ አበባ ቦሌ መጋዘን ተነስቶ ደጅዎ እስኪደርስ ያለውን ጉዞ ይኮርጁ።'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-center lg:self-auto">
                  {/* Speed toggle */}
                  <div className="flex bg-stone-950 border border-stone-850 rounded p-0.5 text-[9px] font-mono">
                    <button
                      onClick={() => changeSimSpeed(1)}
                      className={`px-2 py-1 rounded transition-all ${simSpeed === 1 ? 'bg-amber-600 font-bold text-stone-950' : 'text-stone-400 hover:text-stone-200'}`}
                    >
                      1x
                    </button>
                    <button
                      onClick={() => changeSimSpeed(2)}
                      className={`px-2 py-1 rounded transition-all ${simSpeed === 2 ? 'bg-amber-600 font-bold text-stone-950' : 'text-stone-400 hover:text-stone-200'}`}
                    >
                      2x
                    </button>
                    <button
                      onClick={() => changeSimSpeed(4)}
                      className={`px-2 py-1 rounded transition-all ${simSpeed === 4 ? 'bg-amber-600 font-bold text-stone-950' : 'text-stone-400 hover:text-stone-200'}`}
                    >
                      4x
                    </button>
                  </div>

                  {/* Play Pause buttons */}
                  <button
                    onClick={startTrackingSimulation}
                    className={`px-4 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isSimulating 
                        ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30' 
                        : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>{currentLang === 'en' ? 'Pause Stream' : 'አቁም'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{simProgress > 0 ? (currentLang === 'en' ? 'Resume Stream' : 'ቀጥል') : (currentLang === 'en' ? 'Start GPS Stream' : 'ጀምር')}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTrackingSimulation}
                    className="px-3 py-2 bg-stone-900 border border-stone-800 hover:border-stone-700 hover:text-stone-200 text-[10px] font-mono font-bold uppercase rounded cursor-pointer transition-all"
                  >
                    {currentLang === 'en' ? 'Reset' : 'እንደገና'}
                  </button>
                </div>
              </div>

              {/* Main Visual SVG Route Journey Map */}
              <div className="bg-stone-950 border border-stone-850 p-6 rounded-lg relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                    <Map className="w-3.5 h-3.5 text-amber-500" />
                    {currentLang === 'en' ? 'Interactive Flight / Route Telemetry' : 'የቀጥታ ጉዞ ካርታ መረጃ'}
                  </span>
                  {simProgress > 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1 animate-pulse">
                      <Navigation className="w-3 h-3 text-amber-500" />
                      GPS: {simulatedGps.lat.toFixed(4)}° N, {simulatedGps.lng.toFixed(4)}° E
                    </span>
                  )}
                </div>

                {/* SVG Map Path */}
                <div className="w-full h-32 bg-stone-900/40 rounded border border-stone-900/60 relative overflow-hidden flex items-center justify-center">
                  {/* Visual grid lines for military-grade telemetry styling */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

                  <svg className="w-full h-full" viewBox="0 0 490 110" preserveAspectRatio="none">
                    {/* Background Connecting Path Line */}
                    <path
                      d="M 45 70 Q 110 30 175 35 T 305 95 Q 370 70 435 55"
                      fill="none"
                      stroke="#292524"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Glowing Filled Sim Path Line */}
                    {simProgress > 0 && (
                      <path
                        d="M 45 70 Q 110 30 175 35 T 305 95 Q 370 70 435 55"
                        fill="none"
                        stroke="url(#sim-gradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="490"
                        strokeDashoffset={490 - (490 * simProgress) / 100}
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="sim-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d97706" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>

                    {/* Station nodes */}
                    {/* Node 1: Bole */}
                    <circle cx="45" cy="70" r="5" fill={simProgress >= 25 ? '#f59e0b' : '#292524'} stroke={simProgress >= 25 ? '#fff' : '#44403c'} strokeWidth="1.5" />
                    <text x="45" y="88" fill={simProgress >= 25 ? '#fff' : '#78716c'} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BOLE</text>

                    {/* Node 2: Lideta */}
                    <circle cx="175" cy="35" r="5" fill={simProgress >= 50 ? '#f59e0b' : '#292524'} stroke={simProgress >= 50 ? '#fff' : '#44403c'} strokeWidth="1.5" />
                    <text x="175" y="22" fill={simProgress >= 50 ? '#fff' : '#78716c'} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">LIDETA</text>

                    {/* Node 3: Piazza */}
                    <circle cx="305" cy="95" r="5" fill={simProgress >= 80 ? '#f59e0b' : '#292524'} stroke={simProgress >= 80 ? '#fff' : '#44403c'} strokeWidth="1.5" />
                    <text x="305" y="108" fill={simProgress >= 80 ? '#fff' : '#78716c'} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">PIAZZA</text>

                    {/* Node 4: Destination */}
                    <circle cx="435" cy="55" r="5" fill={simProgress >= 100 ? '#10b981' : '#292524'} stroke={simProgress >= 100 ? '#fff' : '#44403c'} strokeWidth="1.5" />
                    <text x="435" y="42" fill={simProgress >= 100 ? '#10b981' : '#78716c'} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">HOME</text>

                    {/* Moving vehicle dot */}
                    {simProgress > 0 && (
                      <circle
                        cx={simulatedPos.x}
                        cy={simulatedPos.y}
                        r="8"
                        fill="#d97706"
                        stroke="#fff"
                        strokeWidth="2"
                        className="transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                      />
                    )}
                  </svg>

                  {/* Simulated location label overlay */}
                  {simProgress > 0 && (
                    <div
                      className="absolute px-2.5 py-1 bg-amber-600 text-stone-950 text-[9px] font-mono font-bold rounded shadow-lg select-none transition-all duration-300 flex items-center gap-1"
                      style={{
                        left: `${Math.max(10, Math.min(80, (simulatedPos.x / 490) * 100))}%`,
                        top: `${Math.max(10, Math.min(70, (simulatedPos.y / 110) * 100 - 15))}%`
                      }}
                    >
                      <Truck className="w-3.5 h-3.5 animate-bounce" />
                      <span>{simulatedPos.name} ({simProgress}%)</span>
                    </div>
                  )}
                </div>

                {/* Simulated Telemetry Logging console */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-stone-500">
                    <span>{currentLang === 'en' ? 'Live Sat-Com Logs Console' : 'የቀጥታ ግንኙነት መከታተያ ፅሁፎች'}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      SYSTEM ONLINE
                    </span>
                  </div>

                  <div className="bg-stone-950 rounded border border-stone-850 p-3 h-32 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 shadow-inner">
                    {simLogs.length === 0 ? (
                      <div className="text-stone-600 italic">
                        {currentLang === 'en' 
                          ? 'Satellite feed dormant. Start GPS Stream above to run real-time tracking...' 
                          : 'ማሳያ መረጃዎች ዝግጁ ናቸው። ለመከታተል የሳተላይት መረጃ መጀመሪያ ከላይ ያስጀምሩ...'}
                      </div>
                    ) : (
                      simLogs.map((log, lIdx) => (
                        <div key={lIdx} className="leading-relaxed border-b border-stone-900/30 pb-1">
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={logTerminalEndRef} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function OrderStatus({
  currentLang,
  initialOrder,
  onClose,
  onSelectProduct,
  onReorder,
}: OrderStatusProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
    }
  }, [initialOrder]);

  const handleGeneratePDF = () => {
    if (!order) return;
    setPdfGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Palette
      const primaryColor = [28, 25, 23]; // stone-900 (#1c1917)
      const accentColor = [217, 119, 6]; // amber-600 (#d97706)
      const textColor = [68, 64, 60]; // stone-700 (#44403c)
      const lightTextColor = [120, 113, 108]; // stone-500 (#78716c)
      const borderColor = [231, 229, 228]; // stone-200 (#e7e5e4)

      let y = 20;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > 270) {
          doc.addPage();
          // Small running header on subsequent pages
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
          doc.text(`Zema Leather | Invoice for Order ID: ${order.id}`, 20, 12);
          doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          doc.setLineWidth(0.2);
          doc.line(20, 14, 190, 14);
          y = 22;
        }
      };

      // Header Brand (Left Column)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Zema Leather', 20, y);

      // Header Title (Right Column)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('OFFICIAL RECEIPT', 190, y, { align: 'right' });

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text('AUTHENTIC ETHIOPIAN CRAFTSMANSHIP', 20, y);

      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Order ID: ${order.id}`, 190, y, { align: 'right' });

      // Header Line
      y += 8;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);

      y += 12;

      // Metadata Block (2 columns)
      // Headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Order Information', 20, y);
      doc.text('Shipping Address', 110, y);

      // Draw box outlines
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setFillColor(252, 251, 249); // Warm off-white background
      doc.roundedRect(20, y + 4, 80, 42, 2, 2, 'FD');
      doc.roundedRect(110, y + 4, 80, 42, 2, 2, 'FD');

      // Fill left box (Order Info)
      let innerY = y + 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text('Date Placed:', 24, innerY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 96, innerY, { align: 'right' });

      innerY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text('Tracking ID:', 24, innerY);
      doc.setFont('helvetica', 'bold');
      doc.text(order.trackingNumber, 96, innerY, { align: 'right' });

      innerY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text('Payment Status:', 24, innerY);
      doc.setFont('helvetica', 'bold');
      if (order.paymentStatus === 'completed') {
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text('PAID / COMPLETED', 96, innerY, { align: 'right' });
      } else {
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text('PENDING', 96, innerY, { align: 'right' });
      }

      innerY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text('Payment Method:', 24, innerY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(order.paymentMethod.replace('_', ' ').toUpperCase(), 96, innerY, { align: 'right' });

      // Fill right box (Shipping Address)
      innerY = y + 11;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(order.shippingAddress.fullName, 114, innerY);

      innerY += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.subCity}`, 114, innerY);

      if (order.shippingAddress.woreda) {
        innerY += 6;
        doc.text(`Woreda: ${order.shippingAddress.woreda}`, 114, innerY);
      }

      innerY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text('Phone:', 114, innerY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(order.shippingAddress.phone, 186, innerY, { align: 'right' });

      y += 56;

      // Table Header Row
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Items Summary', 20, y);

      y += 4;
      doc.setFillColor(245, 245, 244); // light stone fill
      doc.rect(20, y, 170, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('Product Details', 22, y + 5.5);
      doc.text('Qty', 115, y + 5.5, { align: 'center' });
      doc.text('Price', 150, y + 5.5, { align: 'right' });
      doc.text('Amount', 188, y + 5.5, { align: 'right' });

      y += 8;

      // Loop items
      order.items.forEach((item) => {
        const hasOptions = !!(item.selectedSize || item.selectedColor);
        const itemRowHeight = hasOptions ? 12 : 8;

        checkPageBreak(itemRowHeight);

        // Draw light item separator line
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.2);
        doc.line(20, y, 190, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(item.product.nameEn || item.product.nameAm, 22, y + 5);

        if (hasOptions) {
          let optionsText = '';
          if (item.selectedSize) optionsText += `Size: ${item.selectedSize}  `;
          if (item.selectedColor) optionsText += `Color: ${item.selectedColor}`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
          doc.text(optionsText, 22, y + 9);
        }

        // Qty, Price, Amount
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(String(item.quantity), 115, y + 5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.text(`${item.product.priceETB.toLocaleString()} ETB`, 150, y + 5, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text(`${(item.product.priceETB * item.quantity).toLocaleString()} ETB`, 188, y + 5, { align: 'right' });

        y += itemRowHeight;
      });

      // Bottom line of table
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);

      y += 6;

      // Financial calculations section
      checkPageBreak(35);

      const summaryStartX = 120;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      // Subtotal
      doc.text('Subtotal:', summaryStartX, y);
      doc.text(`${order.subtotal.toLocaleString()} ETB`, 188, y, { align: 'right' });

      // Discount
      if (order.discount > 0) {
        y += 6;
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text('Discount Applied:', summaryStartX, y);
        doc.text(`-${order.discount.toLocaleString()} ETB`, 188, y, { align: 'right' });
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      }

      // Shipping
      y += 6;
      doc.text('Delivery & Handling:', summaryStartX, y);
      doc.text(`${order.shipping.toLocaleString()} ETB`, 188, y, { align: 'right' });

      // Border separator
      y += 6;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.3);
      doc.line(summaryStartX, y - 2, 190, y - 2);

      // Total Paid
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('Total Paid:', summaryStartX, y + 3);
      doc.text(`${order.total.toLocaleString()} ETB`, 188, y + 3, { align: 'right' });

      // Footer
      y = 245; // Fixed near the bottom of page
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setFillColor(252, 251, 249);
      doc.roundedRect(20, y, 170, 24, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('Thank you for choosing Zema Leather!', 105, y + 5, { align: 'center' });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text(
        'We celebrate centuries of fine Ethiopian tannery craftsmanship, blended with elegant contours to provide authentic, highly durable legacy accessories.',
        105,
        y + 11,
        { align: 'center', maxWidth: 150 }
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        'Zema Leather Co. | Addis Ababa, Ethiopia | support@zemaleather.com | www.zemaleather.com',
        105,
        y + 19,
        { align: 'center' }
      );

      doc.save(`Zema-Leather-Receipt-${order.id}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    fetch(`/api/orders/track/${searchQuery.trim()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(currentLang === 'en' ? 'No order found with this tracking number or ID.' : 'በዚህ የመከታተያ ቁጥር ወይም መለያ ምንም ትዕዛዝ አልተገኘም።');
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setOrder(null);
        setError(err.message || 'Error retrieving order.');
        setLoading(false);
      });
  };

  const getWhatsAppSupportUrl = (ord: Order) => {
    const phone = '251911223344';
    const text = currentLang === 'en'
      ? `Hello Support! I am checking the progress of Order ID "${ord.id}" (Tracking: ${ord.trackingNumber}). The current status is "${ord.orderStatus}". I'd like an update.`
      : `ሰላም! የትዕዛዝ መለያ ቁጥር "${ord.id}" (መከታተያ፡ ${ord.trackingNumber}) ያለበትን ሁኔታ እያረጋገጥኩ ነው። የአሁኑ ሁኔታ "${ord.orderStatus}" ነው። እባክዎ ተጨማሪ መረጃ ይስጡኝ።`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Define steps
  const steps = [
    {
      key: 'pending',
      titleEn: 'Order Placed',
      titleAm: 'ትዕዛዝ ተቀምጧል',
      descEn: 'We have successfully received your luxury order.',
      descAm: 'ትዕዛዝዎን በተሳካ ሁኔታ ተቀብለናል።',
      icon: Clock,
    },
    {
      key: 'processing',
      titleEn: 'Crafting & Processing',
      titleAm: 'በማዘጋጀት ላይ',
      descEn: 'Our master leather artisans are preparing and packing your selection.',
      descAm: 'ባለሙያዎቻችን ምርትዎን እያዘጋጁ እና እያሸጉ ነው።',
      icon: Package,
    },
    {
      key: 'shipped',
      titleEn: 'In Transit',
      titleAm: 'በመንገድ ላይ',
      descEn: 'Your parcel has departed our Addis Ababa tannery depot.',
      descAm: 'ምርትዎ ከአዲስ አበባ መጋዘን ወጥቶ ጉዞ ጀምሯል።',
      icon: Truck,
    },
    {
      key: 'delivered',
      titleEn: 'Delivered',
      titleAm: 'ደርሷል',
      descEn: 'Arrived safely at your specified destination.',
      descAm: 'በሰላም በተጠቀሰው አድራሻዎ ደርሷል።',
      icon: CheckCircle2,
    },
  ];

  // Map order status to numeric progress
  const getActiveStepIndex = (status: string) => {
    if (status === 'pending') return 0;
    if (status === 'processing') return 1;
    if (status === 'shipped') return 2;
    if (status === 'delivered') return 3;
    return -1; // cancelled or unknown
  };

  const activeIndex = order ? getActiveStepIndex(order.orderStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-stone-200">
      
      {/* Header back navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-stone-400 hover:text-amber-500 transition-colors text-xs font-mono cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'en' ? 'Back to Store' : 'ወደ መደብር ይመለሱ'}</span>
        </button>

        <h1 className="text-sm font-mono font-bold text-amber-500 uppercase tracking-widest">
          {currentLang === 'en' ? 'Real-time Order Tracking' : 'የቀጥታ ትዕዛዝ መከታተያ'}
        </h1>
      </div>

      {/* Tracker Search Bar */}
      <div className="bg-stone-900 border border-stone-850 p-6 rounded-lg mb-8 shadow-xl">
        <h2 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider mb-3">
          {currentLang === 'en' ? 'Track Any Order' : 'ማንኛውንም ትዕዛዝ ይከታተሉ'}
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
            <input
              type="text"
              required
              placeholder={currentLang === 'en' ? 'Enter Order ID or Tracking Number (e.g. ETL-123456-789)...' : 'የትዕዛዝ መለያ ወይም የመከታተያ ቁጥር ያስገቡ...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded pl-10 pr-4 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 px-6 py-2.5 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></span>
                <span>{currentLang === 'en' ? 'Searching...' : 'በመፈለግ ላይ...'}</span>
              </span>
            ) : (
              currentLang === 'en' ? 'Track Progress' : 'ደረጃውን አሳይ'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center space-x-2 text-red-500 bg-red-950/20 border border-red-900/40 p-3 rounded text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {order ? (
        <div className="space-y-8">
          
          {/* Order Snapshot Card */}
          <div className="bg-stone-950 border border-stone-850 rounded-lg p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-900 pb-5 mb-5 gap-4">
              <div>
                <p className="text-[10px] text-amber-500 font-mono uppercase tracking-widest">
                  {currentLang === 'en' ? 'Located Order' : 'የተገኘ ትዕዛዝ'}
                </p>
                <h3 className="text-sm font-sans font-bold text-stone-100 mt-1">
                  Order ID: <span className="font-mono text-stone-200">{order.id}</span>
                </h3>
                <p className="text-xs text-stone-400 font-mono mt-1">
                  Tracking Code: <span className="text-stone-200 font-bold">{order.trackingNumber}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="no-print inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-sm hover:shadow-amber-500/20 shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{currentLang === 'en' ? 'Print Receipt' : 'ደረሰኝ አትም'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  disabled={pdfGenerating}
                  className="no-print inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-100 text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-sm hover:shadow-stone-800/20 disabled:opacity-50 shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>{pdfGenerating ? (currentLang === 'en' ? 'Generating...' : 'በማዘጋጀት ላይ...') : (currentLang === 'en' ? 'Download PDF' : 'PDF አውርድ')}</span>
                </button>

                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded bg-stone-900 border border-stone-800 text-xs font-mono font-bold ${
                  order.orderStatus === 'cancelled' ? 'text-red-500 border-red-900/30 bg-red-950/10' : 'text-stone-300'
                }`}>
                  <span className="uppercase">{currentLang === 'en' ? order.orderStatus : (order.orderStatus === 'pending' ? 'በመጠባበቅ ላይ' : order.orderStatus === 'processing' ? 'በማዘጋጀት ላይ' : order.orderStatus === 'shipped' ? 'በመንገድ ላይ' : order.orderStatus === 'delivered' ? 'ደርሷል' : 'ተሰርዟል')}</span>
                </span>

                <span className={`px-3 py-1 rounded text-xs font-mono font-bold border uppercase ${
                  order.paymentStatus === 'completed' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-600/10 border-amber-500/20 text-amber-500'
                }`}>
                  {currentLang === 'en' ? `Payment: ${order.paymentStatus}` : `ክፍያ፡ ${order.paymentStatus === 'completed' ? 'ተጠናቋል' : 'በመጠባበቅ ላይ'}`}
                </span>
              </div>
            </div>

            {/* Visual Delivery Countdown Timer */}
            <DeliveryCountdown order={order} currentLang={currentLang} />

            {/* Visual Order Status Progress Bar */}
            <OrderStatusProgressBar order={order} currentLang={currentLang} />

            {/* Quick Resolution Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-stone-900/40 border border-stone-900/60 rounded-lg p-4 font-mono">
              {/* Contact Support */}
              <div className="flex flex-col justify-between p-3.5 bg-stone-950/60 border border-stone-850 rounded hover:border-amber-500/20 transition-all">
                <div>
                  <h4 className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {currentLang === 'en' ? 'Contact Support' : 'ድጋፍ ያግኙ'}
                  </h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal font-sans">
                    {currentLang === 'en' 
                      ? 'Have questions about dispatch routes, custom options, or delays?' 
                      : 'ስለ ማድረሻ መንገዶች፣ ተጨማሪ ምርጫዎች ወይም መዘግየት ጥያቄ አልዎት?'}
                  </p>
                </div>
                <div className="mt-3">
                  <a
                    href={getWhatsAppSupportUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-stone-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer w-full text-center"
                  >
                    {currentLang === 'en' ? 'Direct Help Desk' : 'የድጋፍ መስጫ ይገናኙ'}
                  </a>
                </div>
              </div>

              {/* Reorder Items */}
              <div className="flex flex-col justify-between p-3.5 bg-stone-950/60 border border-stone-850 rounded hover:border-amber-500/20 transition-all">
                <div>
                  <h4 className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {currentLang === 'en' ? 'Reorder' : 'ድጋሚ እዘዝ'}
                  </h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal font-sans">
                    {currentLang === 'en'
                      ? 'Add all artisanal products in this order back into your current cart.'
                      : 'በዚህ ትዕዛዝ ውስጥ ያሉትን ሁሉንም ምርቶች በድጋሚ ወደ ጋሪዎ ያስገቡ።'}
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => onReorder && onReorder(order)}
                    className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer w-full text-center"
                  >
                    {currentLang === 'en' ? 'Duplicate to Cart' : 'ወደ ጋሪው አባዛ'}
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Step Indicator (Timeline) */}
            {order.orderStatus === 'cancelled' ? (
              <div className="bg-red-950/10 border border-red-900/20 p-5 rounded-lg flex items-center space-x-4 mb-6">
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    {currentLang === 'en' ? 'Order Cancelled' : 'ትዕዛዝ ተሰርዟል'}
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed mt-1">
                    {currentLang === 'en' 
                      ? 'This order has been cancelled and refunded or rejected. Please contact support via WhatsApp if you believe this was an error.'
                      : 'ይህ ትዕዛዝ ተሰርዟል። ስህተት መሆኑን ካመኑ እባክዎን በዋትስአፕ የደንበኞች ድጋፍን ያነጋግሩ።'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest mb-6 text-center">
                  {currentLang === 'en' ? 'Delivery Timeline Progress' : 'የማድረስ ደረጃ ሂደት'}
                </h4>

                {/* Desktop Step Row */}
                <div className="hidden md:flex items-start justify-between relative">
                  {/* Connecting Line Background */}
                  <div className="absolute top-5 left-[12%] right-[12%] h-[2px] bg-stone-800 z-0"></div>
                  {/* Glowing active line */}
                  {activeIndex > 0 && (
                    <div 
                      className="absolute top-5 left-[12%] h-[2px] bg-amber-500 z-0 transition-all duration-1000" 
                      style={{ width: `${(activeIndex / 3) * 76}%` }}
                    ></div>
                  )}

                  {steps.map((st, sIdx) => {
                    const isCompleted = sIdx < activeIndex;
                    const isActive = sIdx === activeIndex;
                    const isUpcoming = sIdx > activeIndex;
                    const StepIcon = st.icon;

                    return (
                      <div key={st.key} className="flex-1 flex flex-col items-center text-center z-10 px-2">
                        {/* Step Circle */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                          isCompleted ? 'bg-amber-500 border-amber-500 text-stone-950' : 
                          isActive ? 'bg-stone-950 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/20' : 
                          'bg-stone-900 border-stone-800 text-stone-500'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <StepIcon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                          )}
                        </div>

                        {/* Step Label */}
                        <h5 className={`text-xs font-sans font-bold mt-3 ${
                          isActive ? 'text-amber-500' : isCompleted ? 'text-stone-300' : 'text-stone-500'
                        }`}>
                          {currentLang === 'en' ? st.titleEn : st.titleAm}
                        </h5>

                        <p className="text-[10px] text-stone-400 leading-normal mt-1.5 max-w-[160px] opacity-80">
                          {currentLang === 'en' ? st.descEn : st.descAm}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Step Column (Vertical layout) */}
                <div className="md:hidden space-y-6 relative pl-8">
                  {/* Vertical line background */}
                  <div className="absolute top-2 bottom-2 left-3.5 w-[2px] bg-stone-800 z-0"></div>
                  {/* Active glowing line */}
                  {activeIndex > 0 && (
                    <div 
                      className="absolute top-2 left-3.5 w-[2px] bg-amber-500 z-0 transition-all duration-1000"
                      style={{ height: `${(activeIndex / 3) * 90}%` }}
                    ></div>
                  )}

                  {steps.map((st, sIdx) => {
                    const isCompleted = sIdx < activeIndex;
                    const isActive = sIdx === activeIndex;
                    const StepIcon = st.icon;

                    return (
                      <div key={st.key} className="flex items-start space-x-4 relative z-10">
                        {/* Circle */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 border-2 -ml-1.5 ${
                          isCompleted ? 'bg-amber-500 border-amber-500 text-stone-950' : 
                          isActive ? 'bg-stone-950 border-amber-500 text-amber-500 shadow-md' : 
                          'bg-stone-900 border-stone-800 text-stone-500'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <StepIcon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-grow">
                          <h5 className={`text-xs font-sans font-bold ${
                            isActive ? 'text-amber-500 font-bold' : isCompleted ? 'text-stone-300' : 'text-stone-500'
                          }`}>
                            {currentLang === 'en' ? st.titleEn : st.titleAm}
                          </h5>
                          <p className="text-[10px] text-stone-400 leading-normal mt-0.5">
                            {currentLang === 'en' ? st.descEn : st.descAm}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meta details Grid (Shipping & Payment) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-stone-900 pt-6">
              
              {/* Delivery Address */}
              <div className="bg-stone-900/30 p-4 rounded border border-stone-900/50">
                <div className="flex items-center space-x-2 text-stone-400 mb-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {currentLang === 'en' ? 'Delivery Destination' : 'ማድረሻ አድራሻ'}
                  </span>
                </div>
                <div className="text-xs text-stone-300 leading-relaxed pl-6 space-y-1">
                  <p className="font-bold text-stone-200">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.subCity}</p>
                  {order.shippingAddress.woreda && <p>Woreda: {order.shippingAddress.woreda}</p>}
                  <p className="font-mono text-[11px] text-stone-400 mt-1">Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-stone-900/30 p-4 rounded border border-stone-900/50">
                <div className="flex items-center space-x-2 text-stone-400 mb-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {currentLang === 'en' ? 'Billing & Payment' : 'የክፍያ መረጃ'}
                  </span>
                </div>
                <div className="text-xs text-stone-300 leading-relaxed pl-6 space-y-1">
                  <p>
                    {currentLang === 'en' ? 'Payment Method:' : 'የክፍያ አማራጭ፡'}{' '}
                    <span className="font-bold text-stone-200 uppercase">{order.paymentMethod.replace('_', ' ')}</span>
                  </p>
                  <p>
                    {currentLang === 'en' ? 'Reference Code:' : 'የማጣቀሻ ቁጥር፡'}{' '}
                    <span className="font-mono text-[11px] text-amber-500 break-all">
                      {order.paymentReference || (currentLang === 'en' ? 'Not Applicable' : 'የለም')}
                    </span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {currentLang === 'en' ? 'Placed on:' : 'የተመዘገበበት ቀን፡'}{' '}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

            </div>

            {/* Help & Support Button linking to pre-populated WhatsApp Support */}
            <div className="mt-8 border-t border-stone-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/20 -mx-6 -mb-6 p-6">
              <div className="flex items-start space-x-3 text-left">
                <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-stone-200">
                    {currentLang === 'en' ? 'Need delivery updates?' : 'ስለ ማድረሻው ጥያቄ አለዎት?'}
                  </h5>
                  <p className="text-[10px] text-stone-400 leading-normal mt-0.5">
                    {currentLang === 'en' 
                      ? 'Our customer service team is online to assist with transport routes, handovers, or product guides.'
                      : 'የደንበኞች አገልግሎት ቡድናችን በትራንስፖርት፣ በምርት ወይም በሌሎች ጥያቄዎች ላይ ለመርዳት ዝግጁ ነው።'}
                  </p>
                </div>
              </div>

              <a
                href={getWhatsAppSupportUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 px-5 py-2 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2"
              >
                <span>{currentLang === 'en' ? 'Chat on WhatsApp' : 'በዋትስአፕ አውሩ'}</span>
              </a>
            </div>

          </div>

          {/* Detailed Order Items */}
          <div className="bg-stone-900 border border-stone-850 rounded-lg p-6">
            <h4 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest mb-4">
              {currentLang === 'en' ? 'Artisanal Items In This Order' : 'በዚህ ትዕዛዝ ውስጥ ያሉ ዕቃዎች'}
            </h4>

            <div className="divide-y divide-stone-800/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer group min-w-0 flex-grow"
                    onClick={() => onSelectProduct && onSelectProduct(item.product)}
                  >
                    <div className="w-12 h-12 rounded overflow-hidden bg-stone-950 flex-shrink-0 border border-stone-800">
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-200 group-hover:text-amber-500 transition-colors truncate">
                        {currentLang === 'en' ? item.product.nameEn : item.product.nameAm}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                        Qty: {item.quantity} {item.selectedSize && `| Size: ${item.selectedSize}`} {item.selectedColor && `| Color: ${item.selectedColor}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs flex-shrink-0">
                    <p className="font-bold text-stone-300">{(item.product.priceETB * item.quantity).toLocaleString()} ETB</p>
                    <p className="text-[10px] text-stone-500">({item.product.priceETB.toLocaleString()} ETB / item)</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial summary breakdown */}
            <div className="border-t border-stone-800/80 pt-4 mt-4 space-y-2 font-mono text-xs text-stone-400">
              <div className="flex justify-between">
                <span>{currentLang === 'en' ? 'Subtotal' : 'ንዑስ ድምር'}</span>
                <span className="text-stone-300">{order.subtotal.toLocaleString()} ETB</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>{currentLang === 'en' ? 'Discount Applied' : 'ቅናሽ'}</span>
                  <span>-{order.discount.toLocaleString()} ETB</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{currentLang === 'en' ? 'Delivery Fee' : 'የማድረሻ ዋጋ'}</span>
                <span className="text-stone-300">{order.shipping.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-stone-100 font-bold border-t border-stone-800/50 pt-2 text-sm">
                <span>{currentLang === 'en' ? 'Total Paid' : 'ጠቅላላ የተከፈለ'}</span>
                <span className="text-amber-500">{order.total.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Empty/Initial Welcome Screen for Tracker */
        <div className="text-center py-16 bg-stone-900/30 border border-stone-850/60 rounded-lg p-8">
          <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-sans font-bold text-stone-200">
            {currentLang === 'en' ? 'No Order Loaded' : 'ምንም ትዕዛዝ አልተመረጠም'}
          </h3>
          <p className="text-xs text-stone-400 leading-relaxed max-w-md mx-auto mt-2">
            {currentLang === 'en' 
              ? 'Enter your unique luxury tracking number or order ID above to view real-time tanning process, transit route updates, and direct support options.'
              : 'የትዕዛዝ መከታተያ ቁጥር ወይም የትዕዛዝ መለያ ከላይ ያስገቡ። የማድረሻ ሂደትን ደረጃ በደረጃ የቀጥታ መከታተል ይችላሉ።'}
          </p>
        </div>
      )}

      {/* Style overrides for standard print layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        #print-invoice {
          display: none;
        }
        @media print {
          /* Hide all screen components */
          #root {
            display: none !important;
          }
          /* Show print invoice */
          #print-invoice {
            display: block !important;
            background: white !important;
            color: #1c1917 !important;
            width: 100% !important;
            padding: 24px !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      {/* Printable Invoice Container Portal (Rendered as direct child of body for precise print layouts) */}
      {order && createPortal(
        <div id="print-invoice">
          <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1c1917', lineHeight: '1.5' }}>
            
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1c1917', paddingBottom: '20px', marginBottom: '25px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0' }}>Zema Leather</h1>
                <p style={{ fontSize: '10px', color: '#6b6661', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authentic Ethiopian Craftsmanship</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#d97706', margin: '0' }}>Invoice / Receipt</h2>
                <p style={{ fontSize: '11px', color: '#6b6661', margin: '2px 0 0 0' }}>Order ID: {order.id}</p>
              </div>
            </div>

            {/* Metadata Block (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              {/* Order details */}
              <div style={{ border: '1px solid #e7e5e4', padding: '15px', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b6661', letterSpacing: '0.05em', marginTop: '0', marginBottom: '10px', borderBottom: '1px solid #e7e5e4', paddingBottom: '5px' }}>Order Information</h3>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#6b6661', fontWeight: '500' }}>Date:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#6b6661', fontWeight: '500' }}>Tracking ID:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace' }}>{order.trackingNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#6b6661', fontWeight: '500' }}>Payment Status:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '700', textTransform: 'uppercase', color: order.paymentStatus === 'completed' ? '#059669' : '#d97706' }}>
                        {order.paymentStatus}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#6b6661', fontWeight: '500' }}>Payment Method:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600', textTransform: 'uppercase' }}>{order.paymentMethod.replace('_', ' ')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Delivery address */}
              <div style={{ border: '1px solid #e7e5e4', padding: '15px', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b6661', letterSpacing: '0.05em', marginTop: '0', marginBottom: '10px', borderBottom: '1px solid #e7e5e4', paddingBottom: '5px' }}>Shipping Address</h3>
                <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{order.shippingAddress.fullName}</p>
                  <p style={{ margin: '0 0 2px 0' }}>{order.shippingAddress.city}, {order.shippingAddress.subCity}</p>
                  {order.shippingAddress.woreda && <p style={{ margin: '0 0 2px 0' }}>Woreda: {order.shippingAddress.woreda}</p>}
                  <p style={{ fontWeight: '500', color: '#6b6661', margin: '6px 0 0 0' }}>Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b6661', letterSpacing: '0.05em', marginTop: '0', marginBottom: '10px' }}>Items Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1c1917', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', color: '#6b6661' }}>Product Details</th>
                    <th style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', color: '#6b6661', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', color: '#6b6661', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', color: '#6b6661', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e7e5e4' }}>
                      <td style={{ padding: '12px 0' }}>
                        <p style={{ fontWeight: 'bold', margin: '0' }}>{currentLang === 'en' ? item.product.nameEn : item.product.nameAm}</p>
                        {(item.selectedSize || item.selectedColor) && (
                          <p style={{ fontSize: '10px', color: '#6b6661', margin: '4px 0 0 0' }}>
                            {item.selectedSize && `Size: ${item.selectedSize}`} {item.selectedSize && item.selectedColor && '|'} {item.selectedColor && `Color: ${item.selectedColor}`}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontFamily: 'monospace' }}>{item.product.priceETB.toLocaleString()} ETB</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>{(item.product.priceETB * item.quantity).toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
              <div style={{ width: '250px' }}>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#6b6661' }}>Subtotal:</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace' }}>{order.subtotal.toLocaleString()} ETB</td>
                    </tr>
                    {order.discount > 0 && (
                      <tr style={{ color: '#059669' }}>
                        <td style={{ padding: '6px 0' }}>Discount:</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace' }}>-{order.discount.toLocaleString()} ETB</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: '6px 0', color: '#6b6661', borderBottom: '1px solid #e7e5e4' }}>Shipping & Handling:</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace', borderBottom: '1px solid #e7e5e4' }}>{order.shipping.toLocaleString()} ETB</td>
                    </tr>
                    <tr style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      <td style={{ padding: '10px 0' }}>Total Paid:</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#d97706', fontFamily: 'monospace' }}>{order.total.toLocaleString()} ETB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fine Print Footer */}
            <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: '15px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thank you for your purchase!</p>
              <p style={{ fontSize: '9px', color: '#6b6661', margin: '0' }}>We celebrate centuries of fine Ethiopian tannery craftsmanship, blended with elegant contours to provide authentic, highly durable legacy accessories.</p>
              <p style={{ fontSize: '9px', color: '#6b6661', margin: '5px 0 0 0', fontFamily: 'monospace' }}>Zema Leather Co. | Addis Ababa, Ethiopia | support@zemaleather.com | www.zemaleather.com</p>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
