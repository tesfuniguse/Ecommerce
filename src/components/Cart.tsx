/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Trash2, Tag, ArrowRight, Minus, Plus, Sparkles } from 'lucide-react';
import { CartItem, PromoCode, Product } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  currentLang: 'en' | 'am';
  promo: PromoCode | null;
  onApplyPromo: (promo: PromoCode | null) => void;
  viewedProductIds?: string[];
  wishlistProductIds?: string[];
  onAddToCart?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export default function Cart({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
  currentLang,
  promo,
  onApplyPromo,
  viewedProductIds = [],
  wishlistProductIds = [],
  onAddToCart,
  onSelectProduct,
}: CartProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [loadingPromo, setLoadingPromo] = useState(false);

  // AI recommendations state
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || cart.length === 0) return;
    setLoading(true);
    fetch('/api/products/recommendations/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartProductIds: cart.map(item => item.product.id),
        viewedProductIds,
        wishlistProductIds,
      })
    })
      .then(res => res.json())
      .then(data => {
        setRecommendations(data.recommendations || []);
        setReason(currentLang === 'en' ? data.aiReasonEn : (data.aiReasonAm || data.aiReasonEn));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [isOpen, cart, viewedProductIds, wishlistProductIds, currentLang]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.priceETB * item.quantity, 0);
  const discount = promo ? subtotal * (promo.discountPercent / 100) : 0;
  const shipping = subtotal > 15000 ? 0 : subtotal === 0 ? 0 : 350; // free shipping over 15K ETB
  const total = subtotal - discount + shipping;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoError('');
    setLoadingPromo(true);

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput }),
      });

      if (res.ok) {
        const validatedPromo = await res.json();
        onApplyPromo(validatedPromo);
        setPromoInput('');
      } else {
        const err = await res.json();
        setPromoError(err.error || 'Invalid promo code');
      }
    } catch (err) {
      setPromoError('Failed to validate promotional code');
    } finally {
      setLoadingPromo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-stone-900 text-stone-200 border-l border-stone-800 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-stone-800/80 flex justify-between items-center bg-stone-900">
            <h2 className="text-base font-sans font-bold text-stone-100 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <span>{currentLang === 'en' ? 'Your Shopping Bag' : 'የገበያ ሳጥንዎ'}</span>
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-850 flex items-center justify-center text-stone-600 border border-stone-800">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-xs text-stone-500">
                  {currentLang === 'en' ? 'Your shopping bag is empty.' : 'የገበያ ሳጥንዎ ባዶ ነው።'}
                </p>
                <button
                  onClick={onClose}
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs px-4 py-2 rounded font-semibold cursor-pointer"
                >
                  {currentLang === 'en' ? 'Continue Shopping' : 'ግዢ ለመቀጠል'}
                </button>
              </div>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex space-x-4 p-3 bg-stone-950 rounded-lg border border-stone-850">
                    
                    {/* Image */}
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-stone-900">
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-semibold text-stone-200 truncate">
                        {currentLang === 'en' ? item.product.nameEn : item.product.nameAm}
                      </h4>

                      {/* Meta: selected attributes */}
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                          {item.selectedSize && `Size: ${item.selectedSize}`} {item.selectedColor && `| Color: ${item.selectedColor}`}
                        </p>
                      )}

                      {/* Qty controller and price */}
                      <div className="flex justify-between items-center mt-2">
                        
                        {/* Qty buttons */}
                        <div className="flex items-center bg-stone-900 border border-stone-800 rounded">
                          <button
                            onClick={() => onUpdateQty(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono text-[10px] font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQty(index, item.quantity + 1)}
                            disabled={item.quantity >= item.product.inventory}
                            className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="font-mono text-xs font-bold text-amber-500">
                          {(item.product.priceETB * item.quantity).toLocaleString()} ETB
                        </span>

                      </div>
                    </div>

                    {/* Remove */}
                    <button onClick={() => onRemoveItem(index)} className="text-stone-600 hover:text-red-500 p-1 flex-shrink-0 self-start cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                ))}

                {/* Personalized Cart Recommendations */}
                {recommendations.length > 0 && (
                  <div className="mt-8 border-t border-stone-850 pt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <h3 className="text-xs font-sans font-bold text-stone-100 uppercase tracking-wider">
                        {currentLang === 'en' ? 'Complete Your Look' : 'ልብስዎን ያሟሉ'}
                      </h3>
                    </div>
                    <p className="text-[10px] italic text-stone-400 mb-4 bg-stone-900/40 p-2.5 rounded border border-stone-850/50 leading-relaxed">
                      "{reason || (currentLang === 'en' ? 'Curating matching leather accents for you...' : 'የተመረጡ የቆዳ መለዋወጫዎችን በመተንተን ላይ...')}"
                    </p>

                    {loading ? (
                      <div className="py-4 flex justify-center">
                        <div className="w-5 h-5 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recommendations.slice(0, 3).map((rec) => (
                          <div key={rec.id} className="flex justify-between items-center bg-stone-950 p-2.5 rounded border border-stone-850">
                            <div
                              className="flex items-center space-x-3 cursor-pointer group flex-grow min-w-0"
                              onClick={() => onSelectProduct && onSelectProduct(rec)}
                            >
                              <div className="w-10 h-10 rounded overflow-hidden bg-stone-900 flex-shrink-0">
                                <img src={rec.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="min-w-0 flex-grow">
                                <p className="text-[11px] font-bold text-stone-200 truncate group-hover:text-amber-500 transition-colors">
                                  {currentLang === 'en' ? rec.nameEn : rec.nameAm}
                                </p>
                                <p className="text-[10px] text-amber-500 font-mono font-bold mt-0.5">{rec.priceETB.toLocaleString()} ETB</p>
                              </div>
                            </div>

                            <button
                              onClick={() => onAddToCart && onAddToCart(rec)}
                              className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-stone-950 border border-amber-500/20 px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold flex-shrink-0"
                            >
                              {currentLang === 'en' ? '+ Add' : '+ ጨምር'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Checkout Calculations */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-stone-800 bg-stone-950/50 space-y-4">
              
              {/* Promo code entry */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder={currentLang === 'en' ? 'Promo Code' : 'የቅናሽ ኮድ'}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                  <Tag className="absolute right-3 top-2.5 w-3.5 h-3.5 text-stone-500" />
                </div>
                <button
                  type="submit"
                  disabled={loadingPromo}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-4 py-2 rounded cursor-pointer border border-stone-700"
                >
                  {loadingPromo ? '...' : (currentLang === 'en' ? 'Apply' : 'ተግብር')}
                </button>
              </form>

              {promoError && <p className="text-[10px] text-red-500 font-mono">{promoError}</p>}
              
              {promo && (
                <div className="flex justify-between items-center bg-amber-600/10 border border-amber-500/20 px-3 py-1.5 rounded text-amber-500 text-xs font-mono">
                  <span>{promo.code} ({promo.discountPercent}% OFF)</span>
                  <button onClick={() => onApplyPromo(null)} className="hover:text-stone-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bill Details */}
              <div className="space-y-2 border-t border-stone-850 pt-4">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>{currentLang === 'en' ? 'Subtotal' : 'ከፊል ድምር'}</span>
                  <span className="font-mono">{subtotal.toLocaleString()} ETB</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-amber-500 font-mono">
                    <span>{currentLang === 'en' ? 'Discount' : 'ቅናሽ'}</span>
                    <span>-{discount.toLocaleString()} ETB</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-stone-400">
                  <span>{currentLang === 'en' ? 'Express Delivery' : 'ማድረሻ'}</span>
                  <span className="font-mono">{shipping === 0 ? (currentLang === 'en' ? 'FREE' : 'ነጻ') : `${shipping} ETB`}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-100 font-bold border-t border-stone-800 pt-3">
                  <span>{currentLang === 'en' ? 'Total Bill' : 'ጠቅላላ ድምር'}</span>
                  <span className="font-mono text-amber-500">{total.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Proceed to checkout button */}
              <button
                onClick={onCheckout}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-3 rounded font-sans font-semibold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/15 cursor-pointer"
              >
                <span>{currentLang === 'en' ? 'Secure Checkout' : 'ክፍያ ለመፈጸም'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
