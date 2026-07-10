/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditCard, Truck, CheckCircle, QrCode, ClipboardList, ShieldAlert, Award, FileText, ArrowRight, Sparkles, Camera } from 'lucide-react';
import { CartItem, Address, Order, PromoCode, User } from '../types';
import QrScanner from './QrScanner';
import TelebirrPayment from './TelebirrPayment';

interface CheckoutProps {
  cart: CartItem[];
  user: User | null;
  promo: PromoCode | null;
  currentLang: 'en' | 'am';
  onOrderCompleted: (order: Order) => void;
  onClose: () => void;
  onApplyPromo?: (promo: PromoCode | null) => void;
}

export default function Checkout({
  cart,
  user,
  promo,
  currentLang,
  onOrderCompleted,
  onClose,
  onApplyPromo,
}: CheckoutProps) {
  // Address form
  const [fullName, setFullName] = useState(user?.name || '');
  const [city, setCity] = useState('Addis Ababa');
  const [subCity, setSubCity] = useState('Bole');
  const [woreda, setWoreda] = useState('03');
  const [phone, setPhone] = useState(user?.savedAddresses?.[0]?.phone || '+2519');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'bank_transfer' | 'cod'>('telebirr');

  // Checkout workflow step
  const [step, setStep] = useState<'details' | 'payment_sim' | 'success'>('details');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulation parameters
  const [simulateSuccess, setSimulateSuccess] = useState(false);
  const [simReference, setSimReference] = useState('');

  // Active checkout promo code (initially from props)
  const [activePromo, setActivePromo] = useState<PromoCode | null>(promo);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState('');

  const handleValidateAndApplyPromo = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setPromoError('');
    setLoadingPromo(true);
    setScannedFeedback('');

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply.trim() }),
      });

      if (res.ok) {
        const validatedPromo: PromoCode = await res.json();
        setActivePromo(validatedPromo);
        if (onApplyPromo) {
          onApplyPromo(validatedPromo);
        }
        setPromoInput('');
        setScannedFeedback(
          currentLang === 'en'
            ? `Voucher Applied: ${validatedPromo.code} (${validatedPromo.discountPercent}% OFF)`
            : `የቅናሽ ኮድ ተፈጽሟል፡ ${validatedPromo.code} (${validatedPromo.discountPercent}% ቅናሽ)`
        );
      } else {
        const err = await res.json();
        setPromoError(err.error || (currentLang === 'en' ? 'Invalid promo code' : 'ትክክለኛ ያልሆነ የቅናሽ ኮድ'));
      }
    } catch (err) {
      setPromoError(currentLang === 'en' ? 'Failed to validate promotional code' : 'ኮዱን ማረጋገጥ አልተቻለም');
    } finally {
      setLoadingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setActivePromo(null);
    if (onApplyPromo) {
      onApplyPromo(null);
    }
    setScannedFeedback('');
    setPromoError('');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.priceETB * item.quantity, 0);
  const discount = activePromo ? subtotal * (activePromo.discountPercent / 100) : 0;
  const shipping = subtotal > 15000 ? 0 : 350;
  const total = subtotal - discount + shipping;

  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setFullName(user?.name || '');
      setCity('Addis Ababa');
      setSubCity('Bole');
      setWoreda('03');
      setPhone('+2519');
    } else {
      const selected = user?.savedAddresses?.find(a => a.id === addrId);
      if (selected) {
        setFullName(selected.fullName);
        setCity(selected.city);
        setSubCity(selected.subCity || '');
        setWoreda(selected.woreda || '');
        setPhone(selected.phone);
      }
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    setLoading(true);

    const activeAddress: Address = {
      id: selectedAddressId === 'new' ? `addr-${Date.now()}` : selectedAddressId,
      fullName,
      city,
      subCity,
      woreda,
      phone,
      isDefault: false,
    };

    // If logged in, save the address back to user profiles
    if (user && selectedAddressId === 'new') {
      await fetch('/api/auth/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, address: activeAddress }),
      });
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          userName: fullName,
          userEmail: user?.email || 'guest@ethiopianleather.com',
          items: cart,
          subtotal,
          discount,
          shipping,
          total,
          promoCode: activePromo?.code || null,
          shippingAddress: activeAddress,
          paymentMethod,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        setCreatedOrder(order);

        if (paymentMethod === 'cod') {
          // Cash on Delivery proceeds straight to success
          setStep('success');
          onOrderCompleted(order);
        } else {
          // Telebirr and Bank Transfer show the payment simulation page
          setStep('payment_sim');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!createdOrder) return;
    setSimulateSuccess(true);

    const ref = paymentMethod === 'telebirr'
      ? `TB-${Date.now().toString().slice(-8)}`
      : `CBE-${Date.now().toString().slice(-8)}`;

    try {
      const res = await fetch(`/api/orders/${createdOrder.id}/pay-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref, method: paymentMethod }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setCreatedOrder(updatedOrder);
        setSimReference(ref);
        setTimeout(() => {
          setStep('success');
          onOrderCompleted(updatedOrder);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setSimulateSuccess(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-stone-200">
      
      {/* Checkout step views */}
      {step === 'details' && (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery address banner */}
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-6">
              <h2 className="text-base font-sans font-bold text-stone-100 flex items-center space-x-2.5 mb-6">
                <Truck className="w-5 h-5 text-amber-500" />
                <span>{currentLang === 'en' ? 'Delivery Address' : 'የማድረሻ አድራሻ'}</span>
              </h2>

              {/* Saved Addresses dropdown */}
              {user && user.savedAddresses && user.savedAddresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-mono font-bold text-stone-400 uppercase mb-2">
                    {currentLang === 'en' ? 'Select Saved Address' : 'የተቀመጠ አድራሻ ይምረጡ'}
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {user.savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          selectedAddressId === addr.id ? 'bg-amber-600/10 border-amber-500' : 'bg-stone-950 border-stone-850 hover:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="saved_address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => handleSelectAddress(addr.id)}
                            className="text-amber-500 focus:ring-0"
                          />
                          <div className="text-xs">
                            <p className="font-bold text-stone-200">{addr.fullName}</p>
                            <p className="text-stone-400">{addr.city}, {addr.subCity}, {addr.woreda} - {addr.phone}</p>
                          </div>
                        </div>
                      </label>
                    ))}

                    <label
                      className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition-all ${
                        selectedAddressId === 'new' ? 'bg-amber-600/10 border-amber-500' : 'bg-stone-950 border-stone-850 hover:border-stone-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saved_address"
                        checked={selectedAddressId === 'new'}
                        onChange={() => handleSelectAddress('new')}
                        className="text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-stone-200">{currentLang === 'en' ? 'Enter New Address' : 'አዲስ አድራሻ ያስገቡ'}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-stone-400 uppercase mb-1">
                    {currentLang === 'en' ? 'Full Name' : 'ሙሉ ስም'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Alula Tesfaye"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-400 uppercase mb-1">
                      {currentLang === 'en' ? 'City' : 'ከተማ'}
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Addis Ababa">Addis Ababa (አዲስ አበባ)</option>
                      <option value="Adama">Adama (አዳማ)</option>
                      <option value="Hawassa">Hawassa (ሀዋሳ)</option>
                      <option value="Bahir Dar">Bahir Dar (ባህር ዳር)</option>
                      <option value="Mekelle">Mekelle (መቀሌ)</option>
                      <option value="Bishoftu">Bishoftu (ቢሾፍቱ)</option>
                      <option value="Dire Dawa">Dire Dawa (ድሬዳዋ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-400 uppercase mb-1">
                      {currentLang === 'en' ? 'Subcity / Suburb' : 'ክፍለ ከተማ / ሰፈር'}
                    </label>
                    <input
                      type="text"
                      value={subCity}
                      onChange={(e) => setSubCity(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Bole"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-400 uppercase mb-1">
                      {currentLang === 'en' ? 'Woreda / Block' : 'ወረዳ / ቤት ቁጥር'}
                    </label>
                    <input
                      type="text"
                      value={woreda}
                      onChange={(e) => setWoreda(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      placeholder="e.g. 03"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-stone-400 uppercase mb-1">
                    {currentLang === 'en' ? 'Mobile Phone' : 'የስልክ ቁጥር'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="e.g. +251911223344"
                  />
                </div>
              </div>
            </div>

            {/* Payment selections */}
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-6">
              <h2 className="text-base font-sans font-bold text-stone-100 flex items-center space-x-2.5 mb-6">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <span>{currentLang === 'en' ? 'Select Payment Method' : 'የክፍያ ዘዴ ይምረጡ'}</span>
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <label
                  className={`p-4 rounded-lg border flex items-start justify-between cursor-pointer transition-all ${
                    paymentMethod === 'telebirr' ? 'bg-amber-600/10 border-amber-500' : 'bg-stone-950 border-stone-850 hover:border-stone-800'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'telebirr'}
                      onChange={() => setPaymentMethod('telebirr')}
                      className="text-amber-500 focus:ring-0 mt-1"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-200 flex items-center gap-1.5">
                        <span className="bg-blue-600 text-stone-100 font-mono px-1.5 py-0.5 rounded text-[10px] font-bold">telebirr</span>
                        <span>{currentLang === 'en' ? 'Telebirr Wallet Integration' : 'ክፍያ በቴሌብር የክፍያ ስማርት የኪስ ቦርሳ'}</span>
                      </p>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {currentLang === 'en'
                          ? 'Instant digital verification. Generates a secure invoice QR code. Scanned from your Telebirr app.'
                          : 'ፈጣን ዲጂታል ማረጋገጫ። ከቴሌብር መተግበሪያዎ የሚቃኝ የ QR ኮድ ያመነጫል።'}
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-lg border flex items-start justify-between cursor-pointer transition-all ${
                    paymentMethod === 'bank_transfer' ? 'bg-amber-600/10 border-amber-500' : 'bg-stone-950 border-stone-850 hover:border-stone-800'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="text-amber-500 focus:ring-0 mt-1"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-200">
                        {currentLang === 'en' ? 'Bank Transfer (CBE, Awash, Dashen)' : 'በባንክ ማስተላለፍ (CBE፣ አዋሽ፣ ዳሽን)'}
                      </p>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {currentLang === 'en'
                          ? 'Manually transfer using your mobile banking app. Send reference and clear screenshot for speed confirmation.'
                          : 'በተንቀሳቃሽ ስልክ ባንክ መተግበሪያዎ ያስተላልፉ። ፈጣን ማረጋገጫ ለማግኘት የማጣቀሻ ቁጥር ይላኩ።'}
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-lg border flex items-start justify-between cursor-pointer transition-all ${
                    paymentMethod === 'cod' ? 'bg-amber-600/10 border-amber-500' : 'bg-stone-950 border-stone-850 hover:border-stone-800'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-amber-500 focus:ring-0 mt-1"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-200">
                        {currentLang === 'en' ? 'Cash on Delivery (COD)' : 'በእጅ ክፍያ (እቃው ሲደርስዎ)'}
                      </p>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {currentLang === 'en'
                          ? 'Available for Addis Ababa orders only. Pay cash or transfer upon receiving and inspecting your leather products.'
                          : 'ለአዲስ አበባ ከተማ ትዕዛዞች ብቻ የሚሰራ። እቃዎችን ሲረከቡ በጥሬ ገንዘብ ወይም በቴሌብር ይክፈሉ።'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order summary & Action button */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-6">
              <h2 className="text-base font-sans font-bold text-stone-100 mb-6">
                {currentLang === 'en' ? 'Order Summary' : 'የትዕዛዝዎ ማጠቃለያ'}
              </h2>

              {/* Items strip list */}
              <div className="divide-y divide-stone-800/80 mb-6">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-grow pr-3">
                      <p className="font-semibold text-stone-200 truncate">
                        {currentLang === 'en' ? item.product.nameEn : item.product.nameAm}
                      </p>
                      <p className="text-stone-500 font-mono mt-0.5">
                        Qty: {item.quantity} {item.selectedSize && `| Size: ${item.selectedSize}`}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-amber-500 flex-shrink-0">
                      {(item.product.priceETB * item.quantity).toLocaleString()} ETB
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo code & QR scan section */}
              <div className="py-4 border-t border-stone-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-sans font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>{currentLang === 'en' ? 'Have a Promo Code?' : 'የቅናሽ ኮድ አለዎት?'}</span>
                  </span>
                  
                  {/* QR Scan Button */}
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="flex items-center gap-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-500 px-2.5 py-1.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{currentLang === 'en' ? 'Scan QR Code' : 'QR ኮድ ይቃኙ'}</span>
                  </button>
                </div>

                {/* Promo Code Input group */}
                {!activePromo ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder={currentLang === 'en' ? 'e.g. ADDISNEW' : 'ለምሳሌ ADDISNEW'}
                      className="flex-grow bg-stone-950 border border-stone-850 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 uppercase font-mono"
                    />
                    <button
                      type="button"
                      disabled={loadingPromo || !promoInput.trim()}
                      onClick={() => handleValidateAndApplyPromo(promoInput)}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-50 disabled:hover:bg-stone-800 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {loadingPromo ? '...' : (currentLang === 'en' ? 'Apply' : 'ተግብር')}
                    </button>
                  </div>
                ) : (
                  /* Active promo applied pill */
                  <div className="bg-amber-950/20 border border-amber-500/20 rounded p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded bg-amber-600/15 flex items-center justify-center text-amber-500 font-bold text-[9px] mt-0.5">✓</div>
                      <div>
                        <p className="font-bold text-stone-200 font-mono text-[11px]">{activePromo.code}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5 font-sans">
                          {currentLang === 'en' ? activePromo.descriptionEn : activePromo.descriptionAm}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-stone-500 hover:text-stone-300 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Error or Success feedback message */}
                {promoError && (
                  <p className="text-[10px] text-red-500 font-mono mt-1">{promoError}</p>
                )}
                {scannedFeedback && !promoError && (
                  <p className="text-[10px] text-emerald-500 font-mono mt-1">{scannedFeedback}</p>
                )}
              </div>

              {/* Receipt break downs */}
              <div className="space-y-3 pt-4 border-t border-stone-800">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>{currentLang === 'en' ? 'Subtotal' : 'ከፊል ድምር'}</span>
                  <span className="font-mono">{subtotal.toLocaleString()} ETB</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-amber-500 font-mono">
                    <span>{currentLang === 'en' ? 'Voucher Discount' : 'የቅናሽ ኮድ'}</span>
                    <span>-{discount.toLocaleString()} ETB</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-stone-400">
                  <span>{currentLang === 'en' ? 'Express Delivery' : 'ፈጣን ማድረሻ'}</span>
                  <span className="font-mono">{shipping === 0 ? (currentLang === 'en' ? 'FREE' : 'ነጻ') : `${shipping} ETB`}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-100 font-bold border-t border-stone-800 pt-4">
                  <span>{currentLang === 'en' ? 'Total Bill' : 'ጠቅላላ ድምር'}</span>
                  <span className="font-mono text-amber-500 text-lg">{total.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-4 rounded-md font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-900/15 mt-6 cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>{currentLang === 'en' ? 'Placing Order...' : 'በማስኬድ ላይ...'}</span>
                ) : (
                  <>
                    <span>{currentLang === 'en' ? 'Confirm and Place Order' : 'ትዕዛዙን ያረጋግጡ'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

      {/* Payment simulation (for Telebirr/Bank Transfer) */}
      {step === 'payment_sim' && createdOrder && (
        paymentMethod === 'telebirr' ? (
          <TelebirrPayment
            order={createdOrder}
            currentLang={currentLang}
            onPaymentSuccess={(updatedOrder) => {
              setCreatedOrder(updatedOrder);
              setStep('success');
              onOrderCompleted(updatedOrder);
            }}
            onCancel={() => setStep('details')}
          />
        ) : (
          <div className="max-w-md mx-auto bg-stone-900 border border-amber-500/15 rounded-lg p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-500 mx-auto">
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg font-sans font-bold text-stone-100">
                {currentLang === 'en' ? 'CBE Bank Transfer Instruction' : 'የCBE ባንክ ዝውውር መመሪያ'}
              </h2>
              <p className="text-xs text-stone-400 mt-1 font-mono">
                Order ID: {createdOrder.id} | Amount: {createdOrder.total.toLocaleString()} ETB
              </p>
            </div>

            {/* Payment instructions details */}
            <div className="bg-stone-950 p-5 rounded-lg border border-stone-850 text-left space-y-3.5">
              <p className="text-xs font-bold text-amber-500 uppercase font-mono">
                Commercial Bank of Ethiopia (CBE)
              </p>
              <div className="space-y-1 bg-stone-900 p-3 rounded text-xs font-mono">
                <p><span className="text-stone-500">Account Name:</span> Ethiopian Leather Store</p>
                <p><span className="text-stone-500">Account Number:</span> 1000459812403</p>
                <p><span className="text-stone-500">Amount due:</span> {createdOrder.total.toLocaleString()} ETB</p>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {currentLang === 'en'
                  ? 'Transfer the total amount via CBE Birr or Mobile Banking, then enter the transaction reference number below to simulate automatic confirmation.'
                  : 'ጠቅላላ ሂሳቡን በCBE Birr ወይም በሞባይል ባንኪንግ ያስተላልፉ፣ ከዚያ ክፍያውን ለማረጋገጥ የማጣቀሻ ቁጥሩን ከታች ያስገቡ።'}
              </p>
            </div>

            {/* Simulate actions */}
            <div className="space-y-3">
              <button
                onClick={handleSimulatePayment}
                disabled={simulateSuccess}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-stone-100 py-3.5 rounded-md font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {simulateSuccess ? (
                  <span>{currentLang === 'en' ? 'Verifying payment on CBE...' : 'ክፍያ በመረጋገጥ ላይ...'}</span>
                ) : (
                  <>
                    <span>
                      {currentLang === 'en' ? 'Verify CBE Bank Transfer Instantly' : 'ክፍያውን አሁን አረጋግጥ'}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setStep('details'); }}
                className="w-full border border-stone-700 bg-stone-900/50 hover:bg-stone-800 text-stone-300 py-3.5 rounded-md font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {currentLang === 'en' ? 'Cancel & Edit Details' : 'ይቅርዝ ማስተካከያ'}
              </button>
            </div>
          </div>
        )
      )}

      {/* Success Receipt view */}
      {step === 'success' && createdOrder && (
        <div className="max-w-md mx-auto bg-stone-900 border border-emerald-500/20 rounded-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-500 mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-sans font-bold text-stone-100">
              {currentLang === 'en' ? 'Thank You for Your Order!' : 'ስለ ትዕዛዝዎ እናመሰግናለን!'}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {currentLang === 'en'
                ? `Order ${createdOrder.id} has been registered securely.`
                : `የእርስዎ ትዕዛዝ ቁጥር ${createdOrder.id} በተሳካ ሁኔታ ተመዝግቧል።`}
            </p>
          </div>

          {/* Details receipt box */}
          <div className="bg-stone-950 p-5 rounded-lg border border-stone-850 text-left space-y-3 font-mono text-xs text-stone-300">
            <div className="flex justify-between border-b border-stone-900 pb-2.5">
              <span className="text-stone-500">{currentLang === 'en' ? 'Tracking Number' : 'መከታተያ ቁጥር'}</span>
              <span className="font-bold text-amber-500">{createdOrder.trackingNumber}</span>
            </div>
            <div className="flex justify-between border-b border-stone-900 pb-2.5">
              <span className="text-stone-500">{currentLang === 'en' ? 'Payment Status' : 'ክፍያ ሁኔታ'}</span>
              <span className="font-bold text-emerald-500">{createdOrder.paymentStatus.toUpperCase()}</span>
            </div>
            {createdOrder.paymentReference && (
              <div className="flex justify-between border-b border-stone-900 pb-2.5">
                <span className="text-stone-500">{currentLang === 'en' ? 'TXN Reference' : 'ማጣቀሻ ቁጥር'}</span>
                <span>{createdOrder.paymentReference}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-stone-900 pb-2.5">
              <span className="text-stone-500">{currentLang === 'en' ? 'Shipping Address' : 'ማድረሻ አድራሻ'}</span>
              <span className="truncate max-w-[200px]">{createdOrder.shippingAddress.fullName} - {createdOrder.shippingAddress.city}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-stone-400 font-bold">{currentLang === 'en' ? 'Total Paid' : 'ጠቅላላ ክፍያ'}</span>
              <span className="font-bold text-amber-500">{createdOrder.total.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="bg-amber-600/5 border border-amber-500/10 rounded-lg p-4 text-xs text-stone-400 leading-relaxed text-left flex items-start space-x-3">
            <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>
              {currentLang === 'en'
                ? `An automated digital receipt & PDF invoice has been prepared. Your premium leather goods are being packed. Expect delivery in ${createdOrder.shippingAddress.city === 'Addis Ababa' ? '24 hours' : '2-3 business days'}.`
                : `ራስ-ሰር ዲጂታል ደረሰኝ እና የፒዲኤፍ ኢንቮይስ ተዘጋጅቷል። እቃዎችዎን በመጫን ላይ እንገኛለን። እቃው በ ${createdOrder.shippingAddress.city === 'Addis Ababa' ? '24 ሰዓት' : 'ከ2-3 የሥራ ቀናት'} ውስጥ ይደርስዎታል።`}
            </p>
          </div>

          {/* Return actions */}
          <button
            onClick={onClose}
            className="w-full bg-stone-800 hover:bg-stone-750 text-stone-200 py-3 rounded-md font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {currentLang === 'en' ? 'Continue Shopping' : 'ወደ ገበያው ይመለሱ'}
          </button>
        </div>
      )}

      {/* QR Scanner Overlay Component */}
      <QrScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(code) => {
          setScannerOpen(false);
          handleValidateAndApplyPromo(code);
        }}
        currentLang={currentLang}
      />

    </div>
  );
}
