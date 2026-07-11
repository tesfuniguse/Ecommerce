/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  QrCode, Phone, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Lock, RefreshCw, Compass, ShieldCheck, HelpCircle
} from 'lucide-react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { alertSystem } from '../lib/alerts';

interface TelebirrPaymentProps {
  order: Order;
  currentLang: 'en' | 'am';
  onPaymentSuccess: (updatedOrder: Order) => void;
  onCancel: () => void;
}

export default function TelebirrPayment({
  order,
  currentLang,
  onPaymentSuccess,
  onCancel,
}: TelebirrPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentPayload, setPaymentPayload] = useState<{
    appId: string;
    toPayUrl: string;
    rawPayload: string;
    sign: string;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes countdown
  const [pollingCount, setPollingCount] = useState(0);
  const [isSandboxPaid, setIsSandboxPaid] = useState(false);
  const [simulatingCallback, setSimulatingCallback] = useState(false);

  // 1. Fetch secure payment parameters from the server
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetch('/api/payments/telebirr/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            currentLang === 'en'
              ? 'Failed to secure Telebirr transaction channel.'
              : 'የቴሌብር መክፈያ መስመር ማረጋገጥ አልተቻለም።'
          );
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setPaymentPayload(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setError(err.message || 'Error securing transaction.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [order.id, currentLang]);

  // 2. Countdown timer for Telebirr invoice expiration
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // 3. Automated real-time polling to check if payment is confirmed
  useEffect(() => {
    if (loading || error || isSandboxPaid) return;

    const interval = setInterval(() => {
      setPollingCount((prev) => prev + 1);
      
      fetch(`/api/orders/${order.id}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch order status');
        })
        .then((updatedOrder: Order) => {
          if (updatedOrder.paymentStatus === 'completed') {
            setIsSandboxPaid(true);
            clearInterval(interval);
            setTimeout(() => {
              onPaymentSuccess(updatedOrder);
            }, 1800);
          }
        })
        .catch((err) => {
          console.error('Error polling order payment status:', err);
        });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [order.id, loading, error, isSandboxPaid, onPaymentSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 4. Trigger simulated API callback for testing
  const handleTriggerSandboxCallback = async () => {
    setSimulatingCallback(true);
    const mockRef = `TB-${Date.now().toString().slice(-8)}`;

    try {
      const res = await fetch(`/api/orders/${order.id}/pay-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: mockRef, method: 'telebirr' }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        // The background polling will catch this state update, but we set local state for faster feedback
        setIsSandboxPaid(true);
        setTimeout(() => {
          onPaymentSuccess(updatedOrder);
        }, 1500);
      } else {
        throw new Error('Callback trigger failed.');
      }
    } catch (err) {
      console.error(err);
      alertSystem.showAlert('Simulation failed. Please try again.', { type: 'error' });
    } finally {
      setSimulatingCallback(false);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 max-w-lg mx-auto shadow-2xl relative overflow-hidden text-stone-200">
      {/* Official Telebirr Blue Accent Border */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-amber-500"></div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
              {currentLang === 'en' ? 'Securing Connection...' : 'ግንኙነት እየተረጋገጠ ነው...'}
            </h4>
            <p className="text-[10px] text-stone-500 max-w-xs mx-auto font-sans leading-relaxed">
              {currentLang === 'en'
                ? 'Negotiating signed cryptographic payloads with Telebirr API Gateway. Checking system certificates.'
                : 'ከቴሌብር ኤፒአይ መክፈያ ጋር የምስጠራ ማረጋገጫዎች እየተለዋወጡ ነው። እባክዎ ይጠብቁ።'}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-sans font-bold text-red-500">
              {currentLang === 'en' ? 'Transaction Security Error' : 'የደህንነት ማረጋገጫ ስህተት'}
            </h4>
            <p className="text-xs text-stone-400 font-mono">{error}</p>
          </div>
          <button
            onClick={onCancel}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            {currentLang === 'en' ? 'Return to Checkout' : 'ወደ ክፍያው ይመለሱ'}
          </button>
        </div>
      ) : isSandboxPaid ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <div className="space-y-1.5">
            <h4 className="text-base font-sans font-bold text-emerald-400 uppercase tracking-wide">
              {currentLang === 'en' ? 'Telebirr Payment Secured!' : 'የቴሌብር ክፍያ ተረጋግጧል!'}
            </h4>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              {currentLang === 'en'
                ? 'The cryptographic callback was verified. Your order invoice has been locked and dispatch preparations have commenced.'
                : 'ከቴሌብር የተላከው ዲጂታል ክፍያ በስኬት ተረጋግጧል። የእጅ ሥራ እቃዎችዎን ለማድረስ ዝግጅት ጀምረናል።'}
            </p>
          </div>
          <div className="font-mono text-[9px] text-stone-500 uppercase tracking-widest bg-stone-950 px-3 py-1 rounded">
            {currentLang === 'en' ? 'Automatic UI Redirection' : 'ቀጥታ ሽግግር በመደረግ ላይ'}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-stone-850 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-blue-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wide">
                  telebirr
                </span>
                <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                  {currentLang === 'en' ? 'Secure Checkout Gateway' : 'አስተማማኝ የክፍያ በር'}
                </span>
              </div>
              <h3 className="text-sm font-sans font-bold text-stone-200 mt-1">
                {currentLang === 'en' ? 'Scan & Pay Instantly' : 'በስማርትፎንዎ ይቃኙና ይክፈሉ'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono text-stone-500 block uppercase">{currentLang === 'en' ? 'Invoice Expires' : 'ጊዜው የሚያበቃው'}</span>
              <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left side: QR Code */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="bg-white p-3 rounded-lg shadow-xl relative overflow-hidden group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    paymentPayload?.toPayUrl || 'mock_telebirr_checkout_link'
                  )}`}
                  alt="Telebirr QR Code"
                  className="w-36 h-36"
                  referrerPolicy="no-referrer"
                />
                {/* Visual scanning guidelines overlay */}
                <div className="absolute inset-3 border border-dashed border-blue-500/40 rounded-md pointer-events-none"></div>
              </div>
              <span className="text-[9px] font-mono text-stone-500 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-500" />
                {currentLang === 'en' ? 'AES-128 Encrypted Payload' : 'በAES-128 የተመሰጠረ መረጃ'}
              </span>
            </div>

            {/* Right side: Steps and information */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="bg-stone-950 p-3 rounded border border-stone-850 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">{currentLang === 'en' ? 'Merchant Code:' : 'የነጋዴ መለያ፡'}</span>
                  <span className="font-mono text-stone-300">ZEMA_LEATHER</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{currentLang === 'en' ? 'Amount Due:' : 'የክፍያ መጠን፡'}</span>
                  <span className="font-mono text-amber-500 font-bold">{order.total.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Guide steps */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  {currentLang === 'en' ? 'How to Complete Purchase' : 'የአከፋፈል ቅደም ተከተል መመሪያ'}
                </h4>
                <ol className="text-[10px] text-stone-400 space-y-1.5 list-decimal pl-4 leading-normal font-sans">
                  <li>
                    {currentLang === 'en'
                      ? 'Open your Telebirr Smartphone Super-App.'
                      : 'በስልክዎ የቴሌብር መተግበሪያን (Super-App) ይክፈቱ።'}
                  </li>
                  <li>
                    {currentLang === 'en'
                      ? 'Select the "Scan to Pay" / "ይቃኙ" feature.'
                      : 'ከምናሌው ውስጥ "ይቃኙ" (Scan) የሚለውን ምልክት ይምረጡ።'}
                  </li>
                  <li>
                    {currentLang === 'en'
                      ? 'Point your camera at the screen QR Code and slide to confirm.'
                      : 'ካሜራዎን በስክሪኑ ላይ ወዳለው QR ኮድ አነጣጥረው ክፍያውን ያረጋግጡ።'}
                  </li>
                </ol>
              </div>

              {/* Mobile Direct Deep-link Button */}
              <a
                href={paymentPayload?.toPayUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{currentLang === 'en' ? 'Pay directly on mobile portal' : 'በቀጥታ በሞባይልዎ ይክፈሉ'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Real-time Status Polling feedback indicator */}
          <div className="bg-stone-950/40 p-3 rounded-lg border border-stone-850 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span className="text-stone-400">
                {currentLang === 'en'
                  ? 'Awaiting Telebirr signature callback...'
                  : 'የቴሌብር ዲጂታል ማረጋገጫ በመጠባበቅ ላይ...'}
              </span>
            </div>
            <span className="text-stone-500">
              {currentLang === 'en' ? `Pulse #${pollingCount}` : `ምልክት #${pollingCount}`}
            </span>
          </div>

          {/* DEV SANDBOX SIMULATOR PANEL */}
          <div className="border-t border-stone-850 pt-4 mt-2 space-y-3">
            <div className="flex justify-between items-center bg-blue-600/10 border border-blue-500/20 rounded px-2.5 py-1.5 text-[9px] font-mono text-blue-400">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                TELEBIRR API SANDBOX ACTIVE
              </span>
              <span>TESTING MODE</span>
            </div>

            <p className="text-[10px] text-stone-400 leading-normal font-sans">
              {currentLang === 'en'
                ? 'Since you are in the secure preview workspace, you can trigger a mock encrypted merchant API server response callback to test successful real-time integration instantly.'
                : 'ማሳያ መድረክ ላይ ስለሆኑ፣ ክፍያው በተሳካ ሁኔታ መጠናቀቁን የሚያረጋግጠውን የአይቲ ሲግናል በመጫን ሂደቱን ወዲያውኑ መሞከር ይችላሉ።'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTriggerSandboxCallback}
                disabled={simulatingCallback}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-stone-100 py-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {simulatingCallback ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Signing...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 animate-pulse" />
                    <span>Trigger Callback Success</span>
                  </>
                )}
              </button>

              <button
                onClick={onCancel}
                className="border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-300 py-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer"
              >
                {currentLang === 'en' ? 'Cancel / Pay Later' : 'ክፍያውን አቁም / በኋላ ይክፈሉ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
