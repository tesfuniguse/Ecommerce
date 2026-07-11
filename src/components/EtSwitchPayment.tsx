/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Phone, CheckCircle2, AlertCircle, Loader2,
  Lock, RefreshCw, Compass, ShieldCheck, HelpCircle, Building2, Smartphone, KeyRound, ArrowRight
} from 'lucide-react';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { alertSystem } from '../lib/alerts';

interface EtSwitchPaymentProps {
  order: Order;
  currentLang: 'en' | 'am';
  onPaymentSuccess: (updatedOrder: Order) => void;
  onCancel: () => void;
}

const SUPPORTED_BANKS = [
  { id: 'cbe', nameEn: 'Commercial Bank of Ethiopia (CBE)', nameAm: 'የኢትዮጵያ ንግድ ባንክ (CBE)', color: 'bg-indigo-900 border-indigo-700' },
  { id: 'dashen', nameEn: 'Dashen Bank', nameAm: 'ዳሽን ባንክ', color: 'bg-amber-900 border-amber-700' },
  { id: 'awash', nameEn: 'Awash Bank', nameAm: 'አዋሽ ባንክ', color: 'bg-emerald-900 border-emerald-700' },
  { id: 'abyssinia', nameEn: 'Bank of Abyssinia', nameAm: 'የአቢሲኒያ ባንክ', color: 'bg-stone-850 border-stone-700' },
  { id: 'coop', nameEn: 'Cooperative Bank of Oromia', nameAm: 'የኦሮሚያ ህብረት ስራ ባንክ', color: 'bg-red-950 border-red-800' },
  { id: 'wegagen', nameEn: 'Wegagen Bank', nameAm: 'ወጋገን ባንክ', color: 'bg-blue-950 border-blue-800' },
  { id: 'telebirr', nameEn: 'Telebirr Wallet', nameAm: 'ቴሌብር ዲጂታል ዋሌት', color: 'bg-sky-950 border-sky-800' },
];

export default function EtSwitchPayment({
  order,
  currentLang,
  onPaymentSuccess,
  onCancel,
}: EtSwitchPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentPayload, setPaymentPayload] = useState<{
    merchantCode: string;
    reference: string;
    amount: number;
    channel: string;
  } | null>(null);

  // Flow State
  const [paymentOption, setPaymentOption] = useState<'card' | 'account' | 'wallet'>('card');
  const [selectedBank, setSelectedBank] = useState('cbe');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes countdown
  const [pollingCount, setPollingCount] = useState(0);
  const [isSandboxPaid, setIsSandboxPaid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [simulatingCallback, setSimulatingCallback] = useState(false);

  // 1. Initiate ET-Switch Transaction Payload on load
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetch('/api/payments/et-switch/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            currentLang === 'en'
              ? 'Failed to establish ET-Switch interoperable secure gateway.'
              : 'የኢቲ-ስዊች ክፍያ ማስተላለፊያ መስመር መዘርጋት አልተቻለም።'
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
          setError(err.message || 'Error securing ET-Switch gateway.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [order.id, currentLang]);

  // 2. Countdown timer for expiration
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // 3. Polling for order status confirmation
  useEffect(() => {
    if (loading || error || isSandboxPaid) return;

    const interval = setInterval(() => {
      setPollingCount((prev) => prev + 1);
      
      fetch(`/api/orders/${order.id}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch status');
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
    }, 3000);

    return () => clearInterval(interval);
  }, [order.id, loading, error, isSandboxPaid, onPaymentSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 4. Simulate card/account payment direct submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentOption === 'card') {
      if (cardNumber.length < 16 || !cardHolder || !cardExpiry || !cardPin) {
        alertSystem.showAlert(
          currentLang === 'en' ? 'Please complete all card authentication credentials.' : 'እባክዎ ሁሉንም የካርድ መረጃዎችን በተገቢው ያስገቡ።',
          { type: 'warning' }
        );
        return;
      }
    } else if (paymentOption === 'account') {
      if (!accountNumber || phoneNumber.length < 9) {
        alertSystem.showAlert(
          currentLang === 'en' ? 'Please enter a valid account number and mobile phone.' : 'እባክዎ ትክክለኛ የባንክ ሒሳብ እና ስልክ ቁጥር ያስገቡ።',
          { type: 'warning' }
        );
        return;
      }
      if (!otpSent) {
        // Send OTP Simulation
        setProcessingPayment(true);
        setTimeout(() => {
          setProcessingPayment(false);
          setOtpSent(true);
          alertSystem.showAlert(
            currentLang === 'en' ? 'An interactive OTP authentication code has been dispatched to your mobile.' : 'የማረጋገጫ የአንድ ጊዜ ኮድ (OTP) ወደ ስልክዎ ተልኳል።',
            { type: 'success' }
          );
        }, 1200);
        return;
      } else {
        if (otpCode.length < 4) {
          alertSystem.showAlert(
            currentLang === 'en' ? 'Please enter the 4 or 6 digit verification code sent to your phone.' : 'እባክዎ የተላከሎትን ባለ 4 ወይም 6 አሃዝ ኮድ ያስገቡ።',
            { type: 'warning' }
          );
          return;
        }
      }
    } else {
      if (walletPhone.length < 9) {
        alertSystem.showAlert(
          currentLang === 'en' ? 'Please enter your connected mobile wallet phone number.' : 'እባክዎ የተገናኘውን የስልክ ቁጥር ያስገቡ።',
          { type: 'warning' }
        );
        return;
      }
      if (!otpSent) {
        setProcessingPayment(true);
        setTimeout(() => {
          setProcessingPayment(false);
          setOtpSent(true);
          alertSystem.showAlert(
            currentLang === 'en' ? 'Please authorize the push prompt on your wallet app or enter the secure SMS code.' : 'በእጅዎ በሚገኘው የኪስ ቦርሳ መተግበሪያ ላይ ያለውን ጥያቄ ያጽድቁ ወይም የማረጋገጫ ኮዱን ያስገቡ።',
            { type: 'success' }
          );
        }, 1250);
        return;
      }
    }

    setProcessingPayment(true);
    const mockRef = `ETS-${Date.now().toString().slice(-8)}`;

    try {
      const res = await fetch(`/api/orders/${order.id}/pay-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: mockRef, method: 'et_switch' }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setIsSandboxPaid(true);
        setTimeout(() => {
          onPaymentSuccess(updatedOrder);
        }, 1500);
      } else {
        throw new Error('ET-Switch authorization failed.');
      }
    } catch (err: any) {
      console.error(err);
      alertSystem.showAlert(err.message || 'Authorization failed. Please try again.', { type: 'error' });
    } finally {
      setProcessingPayment(false);
    }
  };

  // 5. Direct Sandbox auto-payment bypass
  const handleTriggerSandboxCallback = async () => {
    setSimulatingCallback(true);
    const mockRef = `ETS-AUTO-${Date.now().toString().slice(-8)}`;

    try {
      const res = await fetch(`/api/orders/${order.id}/pay-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: mockRef, method: 'et_switch' }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setIsSandboxPaid(true);
        setTimeout(() => {
          onPaymentSuccess(updatedOrder);
        }, 1500);
      } else {
        throw new Error('Sandbox simulation failed.');
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
      {/* Official ET-Switch EthioPay Emerald Accent Stripe */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-600"></div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
              {currentLang === 'en' ? 'Securing Interoperability...' : 'የባንኮች ትስስር እየተረጋገጠ ነው...'}
            </h4>
            <p className="text-[10px] text-stone-500 max-w-xs mx-auto font-sans leading-relaxed">
              {currentLang === 'en'
                ? 'Handshaking cryptographic parameters with ET-Switch National Clearing Gateway. Securing central bank clearing certificate.'
                : 'ከኢትዮጵያ ብሄራዊ የክፍያ ስዊች (ET-Switch) ጋር የደህንነት ማረጋገጫዎች እየተለዋወጡ ነው። እባክዎ ይጠብቁ።'}
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
              {currentLang === 'en' ? 'National Gateway Security Error' : 'የብሄራዊ መክፈያ በር ግንኙነት ስህተት'}
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
              {currentLang === 'en' ? 'ET-Switch Payment Cleared!' : 'ክፍያው በኢቲ-ስዊች ተረጋግጧል!'}
            </h4>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              {currentLang === 'en'
                ? 'Central clearing successful. The order payload has been locked and transfer validation generated successfully.'
                : 'ብሄራዊ ማስተካከያው በተሳካ ሁኔታ ተጠናቋል። ለትዕዛዝዎ ዲጂታል ማረጋገጫ ተዘጋጅቶ ትእዛዙ ተመዝግቧል።'}
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
                <span className="bg-emerald-600 text-stone-100 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wide">
                  ET-Switch Interoperable
                </span>
                <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                  {currentLang === 'en' ? 'National Payment Gateway' : 'ብሄራዊ የክፍያ ስርአት'}
                </span>
              </div>
              <h3 className="text-sm font-sans font-bold text-stone-200 mt-1">
                {currentLang === 'en' ? 'Ethiopian Unified Interoperable Payment' : 'የተቀናጀ የኢትዮጵያ ባንኮችና ዋሌቶች መክፈያ'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono text-stone-500 block uppercase">{currentLang === 'en' ? 'Session Timeout' : 'ክፍለ-ጊዜው የሚያበቃው'}</span>
              <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-stone-950 p-3 rounded border border-stone-850 flex justify-between items-center text-xs">
            <div>
              <span className="text-stone-500 text-[10px] block uppercase font-mono">{currentLang === 'en' ? 'Clearing Reference' : 'የማስተካከያ መለያ'}</span>
              <span className="font-mono text-stone-300 text-xs">{paymentPayload?.reference}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 text-[10px] block uppercase font-mono">{currentLang === 'en' ? 'Unified Amount Due' : 'የክፍያ ጠቅላላ መጠን'}</span>
              <span className="font-mono text-emerald-400 font-bold text-base">{order.total.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Interactive Channel Selection Tab */}
          <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 rounded border border-stone-850">
            <button
              type="button"
              onClick={() => { setPaymentOption('card'); setOtpSent(false); }}
              className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex flex-col items-center gap-1 ${
                paymentOption === 'card' ? 'bg-emerald-600 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{currentLang === 'en' ? 'EthioPay Card' : 'ኢትዮ-ፔይ ካርድ'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setPaymentOption('account'); setOtpSent(false); }}
              className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex flex-col items-center gap-1 ${
                paymentOption === 'account' ? 'bg-emerald-600 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{currentLang === 'en' ? 'Direct Account' : 'የባንክ ሒሳብ'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setPaymentOption('wallet'); setOtpSent(false); }}
              className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex flex-col items-center gap-1 ${
                paymentOption === 'wallet' ? 'bg-emerald-600 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{currentLang === 'en' ? 'Mobile Wallet' : 'የኪስ ቦርሳ'}</span>
            </button>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmitPayment} className="space-y-4 bg-stone-950/30 p-4 rounded border border-stone-850">
            {paymentOption === 'card' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-stone-400 text-[10px] font-mono uppercase tracking-widest mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{currentLang === 'en' ? 'EthioPay ATM / POS Debit Details' : 'የኢትዮ-ፔይ ካርድ መረጃ ማስገቢያ'}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Card Number' : 'የካርድ ቁጥር'}</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="5085 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-mono tracking-widest text-stone-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Expiry (MM/YY)' : 'የማብቂያ ቀን (ወር/አመት)'}</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-mono text-stone-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'ATM PIN' : 'የካርድ ሚስጢር ቁጥር (PIN)'}</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={cardPin}
                      onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-mono text-stone-200 outline-none tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Cardholder Name' : 'የካርዱ ባለቤት ስም'}</label>
                  <input
                    type="text"
                    placeholder="ALEMU KEBEDE"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-sans text-stone-200 outline-none"
                  />
                </div>
              </div>
            )}

            {paymentOption === 'account' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-stone-400 text-[10px] font-mono uppercase tracking-widest mb-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{currentLang === 'en' ? 'Direct Bank Clearing (Debeled via ET-Switch)' : 'ቀጥታ የባንክ ሒሳብ ማስተላለፊያ'}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Select Bank' : 'ባንኩን ይምረጡ'}</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-sans text-stone-200 outline-none cursor-pointer"
                  >
                    {SUPPORTED_BANKS.filter(b => b.id !== 'telebirr').map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {currentLang === 'en' ? bank.nameEn : bank.nameAm}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Bank Account Number' : 'የባንክ ሒሳብ ቁጥር'}</label>
                    <input
                      type="text"
                      placeholder="1000123456789"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-mono text-stone-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Registered Phone' : 'የተመዘገበበት ስልክ'}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-stone-500 font-mono">+251</span>
                      <input
                        type="text"
                        maxLength={9}
                        placeholder="911234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded pl-14 pr-3 py-2 text-xs font-mono text-stone-200 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-950/20 border border-emerald-500/20 rounded p-3 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{currentLang === 'en' ? 'Verify Secure One-Time PIN' : 'ባለ ስድስት አሃዝ ሚስጢር ኮድ (OTP)'}</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-32 bg-stone-950 border border-emerald-500/40 text-center tracking-widest font-mono text-base focus:border-emerald-500 rounded py-1 text-stone-200 outline-none"
                    />
                    <p className="text-[9px] text-stone-500 leading-normal font-sans">
                      {currentLang === 'en' ? 'Enter the security OTP code pushed to your phone for bank clearance verification.' : 'የባንኩን ክፍያ ፈቃድ ለማረጋገጥ ወደ ስልክዎ የተላከውን የይለፍ ቃል ያስገቡ።'}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {paymentOption === 'wallet' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-stone-400 text-[10px] font-mono uppercase tracking-widest mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{currentLang === 'en' ? 'Interoperable Mobile Wallet Portal' : 'ተንቀሳቃሽ የኪስ ቦርሳ (Wallet) አማራጭ'}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Choose Connected Wallet' : 'የመክፈያ ቦርሳውን ይምረጡ'}</label>
                  <select
                    className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded px-3 py-2 text-xs font-sans text-stone-200 outline-none cursor-pointer"
                  >
                    <option value="telebirr">Telebirr Wallet (ኢትዮ ቴሌኮም)</option>
                    <option value="cbebirr">CBE Birr (የኢትዮጵያ ንግድ ባንክ)</option>
                    <option value="awashbirr">Awash Birr (አዋሽ ባንክ)</option>
                    <option value="hellocash">HelloCash (አንበሳ / ወጋገን)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-stone-500">{currentLang === 'en' ? 'Wallet Mobile Number' : 'የኪስ ቦርሳ ስልክ ቁጥር'}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-stone-500 font-mono">+251</span>
                    <input
                      type="text"
                      maxLength={9}
                      placeholder="911234567"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500 rounded pl-14 pr-3 py-2 text-xs font-mono text-stone-200 outline-none"
                    />
                  </div>
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-950/20 border border-emerald-500/20 rounded p-3"
                  >
                    <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase mb-1 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{currentLang === 'en' ? 'Awaiting Smart Wallet Push Auth...' : 'በስልክዎ ላይ ክፍያውን እንዲያፀድቁ እየተጠበቀ ነው...'}</span>
                    </p>
                    <p className="text-[9px] text-stone-400 leading-normal">
                      {currentLang === 'en'
                        ? 'A payment authorization prompt was sent. Confirm the transaction of '
                        : 'የትእዛዙን ጠቅላላ ክፍያ '}
                      <strong className="text-emerald-400">{order.total.toLocaleString()} ETB</strong>
                      {currentLang === 'en' ? ' inside your wallet app.' : ' በኪስ ቦርሳ መተግበሪያዎ ላይ ሆነው ያረጋግጡ።'}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={processingPayment}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-stone-950 py-2.5 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentLang === 'en' ? 'Authenticating Securely...' : 'የደህንነት ማረጋገጫ በመደረግ ላይ...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentOption === 'account' && !otpSent ? (currentLang === 'en' ? 'Request Authorization OTP' : 'ሚስጢር ቁጥር (OTP) ጠይቅ') : 
                     paymentOption === 'wallet' && !otpSent ? (currentLang === 'en' ? 'Secure Payment Channel' : 'በዋሌት ክፍያ ጀምር') :
                     (currentLang === 'en' ? `Authorize ${order.total.toLocaleString()} ETB via ET-Switch` : `ክፍያውን በኢቲ-ስዊች አረጋግጥ`)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Real-time Status Polling feedback indicator */}
          <div className="bg-stone-950/40 p-3 rounded-lg border border-stone-850 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span className="text-stone-400">
                {currentLang === 'en'
                  ? 'Awaiting central banking clearance signal...'
                  : 'ከብሄራዊ ማስተካከያ ማእከል የክፍያ መልስ በመጠበቅ ላይ...'}
              </span>
            </div>
            <span className="text-stone-500">
              {currentLang === 'en' ? `Pulse #${pollingCount}` : `ምልክት #${pollingCount}`}
            </span>
          </div>

          {/* DEV SANDBOX SIMULATOR PANEL */}
          <div className="border-t border-stone-850 pt-4 mt-2 space-y-3">
            <div className="flex justify-between items-center bg-emerald-600/10 border border-emerald-500/20 rounded px-2.5 py-1.5 text-[9px] font-mono text-emerald-400">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                ET-SWITCH UNIFIED SANDBOX ACTIVE
              </span>
              <span>TESTING MODE</span>
            </div>

            <p className="text-[10px] text-stone-400 leading-normal font-sans">
              {currentLang === 'en'
                ? 'Since you are inside our sandbox preview workspace, you can bypass the SMS/card sequence entirely and mock a central clearing success callback to verify state transitions in real time.'
                : 'ማሳያ መድረክ ላይ ስለሆኑ፣ ሁሉንም የካርድና የስልክ ማረጋገጫዎች በማለፍ ክፍያው በተሳካ ሁኔታ መጠናቀቁን የሚያረጋግጠውን የባንክ ማረጋገጫ በመጫን ሂደቱን መሞከር ይችላሉ።'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
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
                    <span>Bypass & Clear Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
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
