/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, Shield, ArrowLeft, Plus, Minus, MessageSquare, Sparkles, Heart, ZoomIn, ZoomOut, Maximize2, Check, Share2, Copy, Mail, Eye, Ruler, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Review, User } from '../types';
import FindMySizeAssistant from './FindMySizeAssistant';

interface ProductDetailsProps {
  product: Product;
  currentLang: 'en' | 'am';
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onSelectProduct: (product: Product) => void;
  allProducts: Product[];
  wishlistProductIds?: string[];
  cartProductIds?: string[];
  userId?: string;
  user?: User | null;
  onOpenAuth?: () => void;
  viewedProductIds?: string[];
}

export default function ProductDetails({
  product,
  currentLang,
  onBack,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onSelectProduct,
  allProducts,
  wishlistProductIds = [],
  cartProductIds = [],
  userId,
  user,
  onOpenAuth,
  viewedProductIds = [],
}: ProductDetailsProps) {
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : undefined);
  const [currentInventory, setCurrentInventory] = useState<number>(product.inventory);

  useEffect(() => {
    let stock = product.inventory;
    if (product.sizes && product.sizes.length > 0 && selectedSize) {
      if (product.sizeInventory && product.sizeInventory[selectedSize] !== undefined) {
        stock = product.sizeInventory[selectedSize];
      }
    }
    setCurrentInventory(stock);
    if (quantity > stock && stock > 0) {
      setQuantity(stock);
    } else if (stock === 0) {
      setQuantity(1);
    }
  }, [product, selectedSize]);
  const [selectedColor, setSelectedColor] = useState(product.colorsEn ? product.colorsEn[0] : undefined);

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeMode, setSizeMode] = useState<'assistant' | 'charts'>('assistant');
  const [sizeGuideTab, setSizeGuideTab] = useState<'shoes' | 'belts' | 'jackets' | 'accessories'>(() => {
    const cat = product.category ? product.category.toLowerCase() : '';
    if (cat.includes('shoe') || cat.includes('footwear')) return 'shoes';
    if (cat.includes('belt')) return 'belts';
    if (cat.includes('jacket') || cat.includes('apparel')) return 'jackets';
    if (cat.includes('wallet') || cat.includes('bag') || cat.includes('accessory') || cat.includes('sleeve') || cat.includes('holder')) return 'accessories';
    return 'accessories';
  });

  // Texture Zoom & Inspection state
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (product.rating || '0.0');

  // Social media sharing state & helpers
  const [copied, setCopied] = useState(false);

  // Notify Me states
  const [notifyEmail, setNotifyEmail] = useState('');
  const [submittingNotify, setSubmittingNotify] = useState(false);
  const [notifySuccessMessage, setNotifySuccessMessage] = useState('');
  const [notifyErrorMessage, setNotifyErrorMessage] = useState('');

  const handleNotifySubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;

    setSubmittingNotify(true);
    setNotifySuccessMessage('');
    setNotifyErrorMessage('');

    try {
      const res = await fetch('/api/back-in-stock/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          email: notifyEmail.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotifySuccessMessage(
          currentLang === 'en' 
            ? data.message || 'Successfully subscribed!' 
            : 'በተሳካ ሁኔታ ተመዝግበዋል! እቃው በድጋሚ ሲገባ የኢሜይል መልዕክት እንልክልዎታለን።'
        );
        setNotifyEmail('');
      } else {
        setNotifyErrorMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setNotifyErrorMessage('Network error. Please try again.');
    } finally {
      setSubmittingNotify(false);
    }
  };

  const getShareLink = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?productId=${product.id}`;
  };

  const handleCopyLink = () => {
    const link = getShareLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    const link = getShareLink();
    const shareData = {
      title: currentLang === 'en' ? product.nameEn : product.nameAm,
      text: currentLang === 'en'
        ? `Check out this premium artisan leather masterpiece: ${product.nameEn}!`
        : `ይህንን ድንቅ በእጅ የተሰራ የቆዳ ምርት ይመልከቱ፡ ${product.nameAm}!`,
      url: link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Native share failed or dismissed:', err);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const getWhatsAppShareUrl = () => {
    const text = encodeURIComponent(
      currentLang === 'en'
        ? `Check out this amazing artisanal leather product: ${product.nameEn}! ${getShareLink()}`
        : `ይህንን ድንቅ በእጅ የተሰራ የቆዳ ምርት ይመልከቱ፡ ${product.nameAm}! ${getShareLink()}`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const getTelegramShareUrl = () => {
    const text = encodeURIComponent(
      currentLang === 'en'
        ? `Check out this amazing artisanal leather product: ${product.nameEn}! ${getShareLink()}`
        : `ይህንን ድንቅ በእጅ የተሰራ የቆዳ ምርት ይመልከቱ፡ ${product.nameAm}! ${getShareLink()}`
    );
    return `https://t.me/share/url?url=${encodeURIComponent(getShareLink())}&text=${text}`;
  };

  const getEmailShareUrl = () => {
    const subject = encodeURIComponent(
      currentLang === 'en'
        ? `Artisanal Leather Quality - ${product.nameEn}`
        : `የተመረጠ የቆዳ ጥራት - ${product.nameEn}`
    );
    const body = encodeURIComponent(
      currentLang === 'en'
        ? `Hi! I found this premium product on our artisanal shop:\n\n${product.nameEn}\n${product.descriptionEn}\n\nView details here: ${getShareLink()}`
        : `ሰላም! ይህንን ልዩ ምርት አግኝቼዋለሁ፡\n\n${product.nameAm}\n${product.descriptionAm}\n\nሙሉ ዝርዝሩን እዚህ ይመልከቱ፡ ${getShareLink()}`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  };

  // AI recommendations state
  const [aiRecs, setAiRecs] = useState<Product[]>([]);
  const [aiReason, setAiReason] = useState('');
  const [aiReasonAm, setAiReasonAm] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Recently viewed products state & side-effect
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    try {
      // Filter out the currently selected product
      const otherIds = viewedProductIds.filter(id => id !== product.id);
      
      // Map IDs to actual product objects and limit to last 4
      const items = otherIds
        .map(id => allProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p)
        .slice(0, 4);
        
      setRecentlyViewed(items);
    } catch (e) {
      console.error('Error computing recently viewed products:', e);
    }
  }, [product.id, viewedProductIds, allProducts]);

  // Sync reviewer name with logged in user
  useEffect(() => {
    if (user?.name) {
      setReviewerName(user.name);
    } else {
      setReviewerName('');
    }
  }, [user]);

  // Check purchase status
  useEffect(() => {
    if (userId) {
      setCheckingPurchase(true);
      fetch(`/api/orders/user/${userId}`)
        .then(res => res.json())
        .then(orders => {
          if (Array.isArray(orders)) {
            const purchased = orders.some(order => 
              order.items.some((item: any) => item.product.id === product.id)
            );
            setHasPurchased(purchased);
          } else {
            setHasPurchased(false);
          }
        })
        .catch(err => {
          console.error('Error checking purchase status:', err);
          setHasPurchased(false);
        })
        .finally(() => {
          setCheckingPurchase(false);
        });
    } else {
      setHasPurchased(false);
    }
  }, [product.id, userId]);

  // Sync active image when product changes
  useEffect(() => {
    setActiveImage(product.images[0]);
    setQuantity(1);
    setSelectedSize(product.sizes ? product.sizes[0] : undefined);
    setSelectedColor(product.colorsEn ? product.colorsEn[0] : undefined);
    
    setNotifyEmail('');
    setNotifySuccessMessage('');
    setNotifyErrorMessage('');

    // Fetch Reviews
    fetch(`/api/reviews/${product.id}`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error(err));

    // Fetch AI Recommendations
    setLoadingAi(true);
    let viewedProductIds: string[] = [];
    try {
      const saved = localStorage.getItem('viewedProductIds');
      viewedProductIds = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }

    fetch(`/api/products/${product.id}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        viewedProductIds,
        wishlistProductIds,
        cartProductIds,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setAiRecs(data.recommendations || []);
        setAiReason(data.aiAnalysis || '');
        setAiReasonAm(data.aiAnalysisAm || '');
        setLoadingAi(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingAi(false);
      });
  }, [product, wishlistProductIds, cartProductIds, userId]);

  const [reviewError, setReviewError] = useState('');

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) return;

    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userName: reviewerName,
          rating,
          comment,
          userId,
        }),
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setComment('');
        setRating(5);
      } else {
        const errData = await res.json();
        setReviewError(errData.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('Failed to submit review due to connection error.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isOutOfStock = currentInventory === 0;
  const isLowStock = currentInventory > 0 && currentInventory < 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-stone-200">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-stone-400 hover:text-amber-500 transition-colors mb-8 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">{currentLang === 'en' ? 'Back to collections' : 'ወደ ስብስቦች ይመለሱ'}</span>
      </button>

      {/* Main product display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        
        {/* Left column: Image Gallery & Dynamic Texture Inspection */}
        <div className="lg:col-span-7 space-y-4">
          <div 
            className="relative aspect-[4/3] bg-stone-950 rounded-lg overflow-hidden border border-stone-800 cursor-zoom-in group select-none"
            onMouseEnter={() => setIsHoverZooming(true)}
            onMouseLeave={() => setIsHoverZooming(false)}
            onMouseMove={handleMouseMove}
            onClick={() => {
              setIsLightboxOpen(true);
              setLightboxZoom(1.5);
            }}
          >
            {/* Texture Magnifier Target */}
            <img
              src={activeImage}
              alt={currentLang === 'en' ? product.nameEn : product.nameAm}
              className="w-full h-full object-cover transition-transform duration-150 ease-out"
              style={{
                transform: isHoverZooming ? 'scale(2.4)' : 'scale(1)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
              }}
              referrerPolicy="no-referrer"
            />

            {/* Instruction Badges */}
            <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-2.5 py-1.5 rounded border border-stone-800/80 text-[10px] font-mono text-stone-300 uppercase tracking-wider flex items-center gap-1.5 pointer-events-none transition-opacity group-hover:opacity-0 duration-200">
              <ZoomIn className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentLang === 'en' ? 'Hover to inspect texture' : 'ቆዳውን በቅርብ ለማየት በላዩ ላይ ያንቀሳቅሱ'}</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-stone-950/80 backdrop-blur-md px-2.5 py-1.5 rounded border border-stone-800/80 text-[10px] font-mono text-stone-300 uppercase tracking-wider flex items-center gap-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Maximize2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>{currentLang === 'en' ? 'Click to examine' : 'ለማጉላት ይጫኑ'}</span>
            </div>

            {/* Simulated grain inspection crosshair lines */}
            {isHoverZooming && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute h-full w-[1px] bg-amber-500/10 border-dashed" style={{ left: `${zoomPos.x}%` }}></div>
                <div className="absolute w-full h-[1px] bg-amber-500/10 border-dashed" style={{ top: `${zoomPos.y}%` }}></div>
                <div className="absolute bg-stone-950/90 border border-amber-500/30 text-[9px] font-mono text-amber-500 uppercase tracking-widest px-2 py-1 rounded shadow-xl" style={{ left: `${zoomPos.x + 2}%`, top: `${zoomPos.y + 2}%` }}>
                  {currentLang === 'en' ? 'Authentic Grain Inspection' : 'የቆዳ ቅንጣት ፍተሻ'}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 bg-stone-950 rounded border overflow-hidden cursor-pointer ${
                    activeImage === img ? 'border-amber-500' : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Action Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            {/* Category */}
            <p className="font-mono text-xs uppercase tracking-widest text-amber-500 mb-2">
              {product.category}
            </p>

            {/* Name */}
            <h1 className="font-sans text-3xl font-bold text-stone-100 tracking-tight mb-2">
              {currentLang === 'en' ? product.nameEn : product.nameAm}
            </h1>

            {/* Low stock visual badge */}
            {isLowStock && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  {currentLang === 'en' ? `Only ${currentInventory} left in stock!` : `በክምችት ውስጥ የተረፉት ${currentInventory} እቃዎች ብቻ ናቸው!`}
                </span>
              </div>
            )}

            {/* Reviews and Ratings Summary */}
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-semibold font-mono text-stone-200">
                {averageRating}
              </span>
              <span className="text-stone-500 text-xs">|</span>
              <span className="text-stone-400 text-xs">
                {reviews.length} {currentLang === 'en' ? 'customer reviews' : 'የደንበኞች አስተያየቶች'}
              </span>
            </div>

            {/* Price block */}
            <div className="mb-6 p-4 bg-stone-900 rounded-lg border border-stone-800/80">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-500 block">
                {product.priceETB.toLocaleString()} ETB
              </span>
              <span className="text-stone-500 text-xs font-mono">
                ~${(product.priceETB / 120).toFixed(0)} USD (Exchange rate reference)
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-stone-300 leading-relaxed mb-6">
              {currentLang === 'en' ? product.descriptionEn : product.descriptionAm}
            </p>

            {/* Custom selectors: Sizes and Colors */}
            <div className="space-y-4 mb-6">
              {product.sizes ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                      {currentLang === 'en' ? 'Select Size' : 'መጠን ይምረጡ'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cat = product.category ? product.category.toLowerCase() : '';
                          if (cat.includes('shoe')) setSizeGuideTab('shoes');
                          else if (cat.includes('belt')) setSizeGuideTab('belts');
                          else if (cat.includes('jacket')) setSizeGuideTab('jackets');
                          else setSizeGuideTab('accessories');
                          setSizeMode('assistant');
                          setIsSizeGuideOpen(true);
                        }}
                        className="text-[11px] text-amber-500 hover:text-amber-400 font-mono flex items-center gap-1 cursor-pointer hover:underline transition-all font-bold"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>{currentLang === 'en' ? 'Find My Size' : 'ትክክለኛ መጠኔን ፈልግ'}</span>
                      </button>
                      <span className="text-stone-700 text-[10px] font-mono">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const cat = product.category ? product.category.toLowerCase() : '';
                          if (cat.includes('shoe')) setSizeGuideTab('shoes');
                          else if (cat.includes('belt')) setSizeGuideTab('belts');
                          else if (cat.includes('jacket')) setSizeGuideTab('jackets');
                          else setSizeGuideTab('accessories');
                          setSizeMode('charts');
                          setIsSizeGuideOpen(true);
                        }}
                        className="text-[11px] text-stone-400 hover:text-stone-300 font-mono flex items-center gap-1 cursor-pointer hover:underline transition-all"
                      >
                        <Ruler className="w-3 h-3 text-stone-500" />
                        <span>{currentLang === 'en' ? 'Size Charts' : 'የመጠን ሰንጠረዦች'}</span>
                      </button>
                    </div>
                  </div>
                   <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((sz) => {
                      const szStock = product.sizeInventory ? product.sizeInventory[sz] : undefined;
                      const isSzOutOfStock = szStock === 0;
                      return (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 text-xs font-mono border rounded transition-all cursor-pointer relative ${
                            selectedSize === sz
                              ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold'
                              : isSzOutOfStock
                              ? 'border-stone-900 bg-stone-950/20 text-stone-600 line-through opacity-50'
                              : 'border-stone-800 hover:border-stone-700 text-stone-300'
                          }`}
                        >
                          {sz}
                          {isSzOutOfStock && (
                            <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                          )}
                          {szStock !== undefined && szStock > 0 && szStock < 3 && (
                            <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center py-2 px-3 border border-stone-800/60 bg-stone-900/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-mono text-stone-300">
                      {currentLang === 'en' ? 'Leather Accessory Sizing' : 'የቆዳ አክሰሰሪዎች መጠን መመሪያ'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSizeGuideTab('accessories');
                      setIsSizeGuideOpen(true);
                    }}
                    className="text-[11px] text-amber-500 hover:text-amber-400 font-mono flex items-center gap-1 cursor-pointer hover:underline transition-all font-bold"
                  >
                    <span>{currentLang === 'en' ? 'View Size Guide' : 'የመጠን መመሪያ'}</span>
                  </button>
                </div>
              )}

              {product.colorsEn && (
                <div>
                  <label className="block text-xs font-mono font-bold text-stone-400 uppercase tracking-wider mb-2">
                    {currentLang === 'en' ? 'Select Color' : 'ቀለም ይምረጡ'}
                  </label>
                  <div className="flex gap-2">
                    {product.colorsEn.map((col, idx) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-1.5 text-xs border rounded transition-all cursor-pointer ${
                          selectedColor === col ? 'bg-amber-600 text-stone-950 border-amber-500' : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {currentLang === 'en' ? col : (product.colorsAm ? product.colorsAm[idx] : col)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inventory indicator */}
            <div className="mb-6 flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span className="text-xs text-stone-400">
                {isOutOfStock
                  ? (currentLang === 'en' ? 'Sold Out' : 'ያለቀ ምርት')
                  : isLowStock
                  ? (currentLang === 'en' ? `Limited Stock: Only ${currentInventory} items remaining` : `የተወሰነ ክምችት፡ ${currentInventory} እቃዎች ብቻ ቀርተዋል`)
                  : (currentLang === 'en' ? 'In Stock (Available for fast shipment)' : 'በክምችት ላይ ይገኛል (ፈጣን ማድረስ)')}
              </span>
            </div>
          </div>

          {/* Action buttons (Add to Cart, Wishlist) */}
          <div className="border-t border-stone-800 pt-6 space-y-4">
            
            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                {currentLang === 'en' ? 'Quantity' : 'ብዛት'}
              </span>
              <div className="flex items-center bg-stone-900 border border-stone-800 rounded">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                  className="p-2 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-mono font-bold">{quantity}</span>
                <button
                  disabled={quantity >= currentInventory}
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action triggers */}
            <div className="flex gap-3">
              <button
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product, quantity, selectedSize, selectedColor)}
                className={`flex-grow py-4 rounded-md font-sans font-semibold tracking-wider text-xs uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isOutOfStock
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg shadow-amber-900/15'
                }`}
              >
                <span>{isOutOfStock ? (currentLang === 'en' ? 'Sold Out' : 'ያለቀ') : (currentLang === 'en' ? 'Add to Shopping Cart' : 'ወደ ግዢ ሳጥን ይጨምሩ')}</span>
              </button>

              <button
                onClick={() => onToggleWishlist(product)}
                className="px-4 py-4 border border-stone-800 bg-stone-900/50 hover:bg-stone-800 hover:text-red-500 rounded-md transition-all cursor-pointer"
                title="Add to wishlist"
              >
                <motion.div
                  animate={isWishlisted ? { scale: [1, 1.4, 0.9, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  whileTap={{ scale: 0.8 }}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </motion.div>
              </button>

              <button
                onClick={handleNativeShare}
                className="px-4 py-4 border border-stone-800 bg-stone-900/50 hover:bg-stone-800 hover:text-amber-500 rounded-md transition-all cursor-pointer flex items-center justify-center"
                title={currentLang === 'en' ? 'Share Product' : 'ምርቱን ያጋሩ'}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Notify Me When Back in Stock (Only shown when product is out of stock) */}
            {isOutOfStock && (
              <div className="bg-stone-900/90 border border-amber-600/30 rounded-lg p-5 space-y-3 shadow-md animate-fade-in">
                <div className="flex items-center space-x-2 text-amber-500">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {currentLang === 'en' ? 'Notify Me When Back in Stock' : 'በድጋሚ ሲገባ ያሳውቁኝ'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {currentLang === 'en'
                    ? 'Enter your email address and we will send you an automated email alert the second this premium item is restocked.'
                    : 'የኢሜይል አድራሻዎን ያስገቡ፤ ይህ ልዩ ምርት በድጋሚ ሲገባ አውቶማቲክ የኢሜይል መልዕክት እንልክልዎታለን።'}
                </p>
                <form onSubmit={handleNotifySubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder={currentLang === 'en' ? 'Enter your email address' : 'የኢሜይል አድራሻዎን ያስገቡ'}
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="flex-grow bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-600"
                  />
                  <button
                    type="submit"
                    disabled={submittingNotify}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    {submittingNotify ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-stone-950 border-t-transparent rounded-full" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{currentLang === 'en' ? 'Submit' : 'ያስገቡ'}</span>
                  </button>
                </form>
                {notifySuccessMessage && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded font-sans flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{notifySuccessMessage}</span>
                  </div>
                )}
                {notifyErrorMessage && (
                  <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded font-sans">
                    {notifyErrorMessage}
                  </div>
                )}
              </div>
            )}

            {/* Social Sharing Widget */}
            <div className="bg-stone-900/30 border border-stone-850/60 rounded-lg p-4 font-mono">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-500" />
                  {currentLang === 'en' ? 'Share This Masterpiece' : 'ይህን ድንቅ ስራ ያጋሩ'}
                </span>
                <span className="text-[9px] text-stone-500">
                  {currentLang === 'en' ? 'Select Channel' : 'ቻናል ይምረጡ'}
                </span>
              </div>

              <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-5 gap-2">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className={`flex flex-col items-center justify-center py-2 px-1 border rounded transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      : 'bg-stone-950/50 border-stone-850 hover:border-amber-500/20 text-stone-300 hover:text-stone-100'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {currentLang === 'en' ? 'Copied!' : 'ተገልብጧል!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mb-1" />
                      <span className="text-[9px] uppercase tracking-wider">
                        {currentLang === 'en' ? 'Copy Link' : 'ሊንክ ኮፒ'}
                      </span>
                    </>
                  )}
                </button>

                {/* OS System Share */}
                <button
                  onClick={handleNativeShare}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-stone-950/50 border border-stone-850 hover:border-amber-500/20 text-stone-300 hover:text-stone-100 rounded transition-all cursor-pointer text-center"
                >
                  <Share2 className="w-4 h-4 mb-1 text-amber-500 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-wider">
                    {currentLang === 'en' ? 'System Share' : 'በስልክ አጋራ'}
                  </span>
                </button>

                {/* Telegram */}
                <a
                  href={getTelegramShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-2 px-1 bg-stone-950/50 border border-stone-850 hover:border-amber-500/20 text-stone-300 hover:text-stone-100 rounded transition-all cursor-pointer text-center"
                >
                  <Send className="w-4 h-4 mb-1 text-sky-400" />
                  <span className="text-[9px] uppercase tracking-wider">
                    Telegram
                  </span>
                </a>

                {/* WhatsApp */}
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-2 px-1 bg-stone-950/50 border border-stone-850 hover:border-amber-500/20 text-stone-300 hover:text-stone-100 rounded transition-all cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4 mb-1 text-emerald-500" />
                  <span className="text-[9px] uppercase tracking-wider">
                    WhatsApp
                  </span>
                </a>

                {/* Email */}
                <a
                  href={getEmailShareUrl()}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-stone-950/50 border border-stone-850 hover:border-amber-500/20 text-stone-300 hover:text-stone-100 rounded transition-all cursor-pointer text-center"
                >
                  <Mail className="w-4 h-4 mb-1 text-amber-500" />
                  <span className="text-[9px] uppercase tracking-wider">
                    {currentLang === 'en' ? 'Email' : 'ኢሜይል'}
                  </span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Recently Viewed Carousel Section */}
      {recentlyViewed.length > 0 && (
        <div className="mb-16 border-t border-stone-800/80 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-sans font-bold text-stone-100 flex items-center space-x-2">
              <Eye className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>{currentLang === 'en' ? 'Recently Viewed' : 'በቅርብ የታዩ ምርቶች'}</span>
            </h3>
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
              {currentLang === 'en' ? 'Your History' : 'የእርስዎ ታሪክ'}
            </span>
          </div>

          <div className="relative">
            {/* Horizontal Scroll container */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-stone-800/80 scrollbar-track-transparent snap-x">
              {recentlyViewed.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectProduct(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="min-w-[180px] sm:min-w-[220px] md:min-w-0 md:flex-1 bg-stone-900/40 hover:bg-stone-900 border border-stone-850 hover:border-amber-500/30 rounded-lg p-3 cursor-pointer transition-all snap-start group"
                >
                  <div className="aspect-[4/3] rounded-md overflow-hidden bg-stone-950 mb-3 relative">
                    <img
                      src={item.images[0]}
                      alt={currentLang === 'en' ? item.nameEn : item.nameAm}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-stone-200 line-clamp-1 group-hover:text-amber-500 transition-colors">
                    {currentLang === 'en' ? item.nameEn : item.nameAm}
                  </h4>
                  <p className="text-[11px] font-mono text-amber-500 font-bold mt-1">
                    {item.priceETB.toLocaleString()} ETB
                  </p>
                </div>
              ))}
              {/* Fill remaining slots to keep width beautiful on desktop if fewer than 4 */}
              {recentlyViewed.length < 4 && Array.from({ length: 4 - recentlyViewed.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="hidden md:block md:flex-1 opacity-0 pointer-events-none" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Specifications & Features split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 border-t border-stone-800/80 pt-12">
        <div>
          <h3 className="text-lg font-sans font-bold text-stone-100 mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span>{currentLang === 'en' ? 'Material and Product Features' : 'የምርት እና የቁሳቁስ መገለጫዎች'}</span>
          </h3>
          <ul className="space-y-3">
            {(currentLang === 'en' ? product.featuresEn : product.featuresAm).map((feat, idx) => (
              <li key={idx} className="text-xs text-stone-300 flex items-start space-x-2 leading-relaxed">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI-Powered Companion Recommendations (Gemini API integrated) */}
        <div className="bg-stone-900/40 border border-amber-500/10 rounded-lg p-6 relative overflow-hidden shadow-md shadow-stone-950/20">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-24 h-24 text-amber-500" />
          </div>

          <h3 className="text-lg font-sans font-bold text-stone-100 mb-2 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{currentLang === 'en' ? 'AI Curator Recommendations' : 'አርቴፊሻል ኢንተለጀንስ የቆዳ ምርጫዎች'}</span>
          </h3>
          <p className="font-mono text-[9px] text-amber-500 uppercase tracking-widest mb-4">
            {currentLang === 'en' ? 'Powered by Gemini 2.5 Flash' : 'በጀሚኒ 2.5 ፍላሽ የተጎላበተ'}
          </p>

          {loadingAi ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-amber-500 animate-spin"></div>
              <p className="text-xs text-stone-500">{currentLang === 'en' ? 'Analyzing leather styles...' : 'ምርጫዎችን በመተንተን ላይ...'}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs italic text-stone-300 leading-relaxed mb-6 border-l-2 border-amber-500/40 pl-3">
                "{currentLang === 'en' ? aiReason : (aiReasonAm || aiReason)}"
              </p>

              {/* Recommended items thumbnails */}
              <div className="grid grid-cols-1 min-[450px]:grid-cols-3 gap-3">
                {aiRecs.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onSelectProduct(rec)}
                    className="group/rec bg-stone-950 p-2.5 rounded border border-stone-800 hover:border-amber-500/30 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded overflow-hidden mb-2 bg-stone-900">
                      <img src={rec.images[0]} alt="" className="w-full h-full object-cover group-hover/rec:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-[10px] font-sans font-semibold text-stone-200 line-clamp-1 group-hover/rec:text-amber-500">
                      {currentLang === 'en' ? rec.nameEn : rec.nameAm}
                    </p>
                    <p className="text-[10px] font-mono text-amber-500 font-bold mt-1">
                      {rec.priceETB.toLocaleString()} ETB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-stone-800/80 pt-12">
        <h3 className="text-lg font-sans font-bold text-stone-100 mb-6 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          <span>{currentLang === 'en' ? `Customer Reviews (${reviews.length})` : `የደንበኞች አስተያየቶች (${reviews.length})`}</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Submit a review */}
          <div className="lg:col-span-4 bg-stone-900 p-6 rounded-lg border border-stone-800">
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-4">
              {currentLang === 'en' ? 'Write a review' : 'አስተያየት ይጻፉ'}
            </h4>

            {!userId ? (
              <div className="py-4 text-center space-y-4">
                <p className="text-xs text-stone-400 leading-relaxed">
                  {currentLang === 'en' 
                    ? 'Please sign in to submit a rating and write a review.' 
                    : 'እባክዎ ግምገማ ለመጻፍ መጀመሪያ ይግቡ።'}
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-2 bg-stone-950 hover:bg-stone-850 border border-stone-800 text-amber-500 text-xs font-semibold rounded transition-colors uppercase tracking-wider cursor-pointer"
                >
                  {currentLang === 'en' ? 'Sign In / Register' : 'ይግቡ / ይመዝገቡ'}
                </button>
              </div>
            ) : checkingPurchase ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-5 h-5 mx-auto rounded-full border-2 border-stone-800 border-t-amber-500 animate-spin"></div>
                <p className="text-xs text-stone-400">
                  {currentLang === 'en' ? 'Verifying purchase history...' : 'የግዢ ታሪክዎን በማረጋገጥ ላይ...'}
                </p>
              </div>
            ) : !hasPurchased ? (
              <div className="py-4 text-center space-y-3">
                <div className="inline-flex p-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 mb-2">
                  <Shield className="w-5 h-5" />
                </div>
                <p className="text-xs text-stone-300 font-semibold">
                  {currentLang === 'en' ? 'Verified Purchase Required' : 'የተረጋገጠ ግዢ ያስፈልጋል'}
                </p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {currentLang === 'en' 
                    ? 'Only customers who have purchased this artisan masterpiece can submit reviews.' 
                    : 'ይህንን ምርት የገዙ ደንበኞች ብቻ አስተያየት መጻፍ ይችላሉ።'}
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed italic">
                  {currentLang === 'en'
                    ? 'We protect the authenticity of our reviews by verifying actual ownership.'
                    : 'የአስተያየቶችን ትክክለኛነት ለመጠበቅ ግዢ የፈጸሙ ደንበኞች ብቻ አስተያየት እንዲሰጡ እናደርጋለን።'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded">
                    {reviewError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1">
                    {currentLang === 'en' ? 'Your Name' : 'ስምዎ'}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={!!user?.name}
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className={`w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 ${!!user?.name ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder="e.g. Samuel Alula"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1">
                    {currentLang === 'en' ? 'Rating' : 'ደረጃ'}
                  </label>
                  <div className="flex gap-2 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? 'fill-current' : 'text-stone-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1">
                    {currentLang === 'en' ? 'Your Comment' : 'አስተያየትዎ'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                    placeholder={currentLang === 'en' ? 'Describe your experience with this leather product...' : 'ስለ ምርቱ ዝርዝር አስተያየት ይስጡ...'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-2.5 rounded font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {isSubmittingReview ? (currentLang === 'en' ? 'Submitting...' : 'በማስገባት ላይ...') : (currentLang === 'en' ? 'Submit Review' : 'አስገባ')}
                </button>
              </form>
            )}
          </div>

          {/* Reviews Feed */}
          <div className="lg:col-span-8 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-6">
                {currentLang === 'en' ? 'No reviews yet for this product. Be the first to write one!' : 'እስካሁን ምንም አስተያየት አልተሰጠም። የመጀመሪያው ይሁኑ!'}
              </p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-stone-900/50 p-5 rounded-lg border border-stone-800/60">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-stone-200">{rev.userName}</span>
                      <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 rounded">
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{currentLang === 'en' ? 'Verified Buyer' : 'የተረጋገጠ ገዢ'}</span>
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-stone-500">
                      {new Date(rev.createdAt).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'am-ET')}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex text-amber-500 gap-0.5 mb-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? 'fill-current' : 'text-stone-800'}`} />
                    ))}
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Dynamic Lightbox Modal for Authentic Texture Zoom Examination */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-stone-950/95 backdrop-blur-xl p-6 select-none font-mono text-stone-300">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-stone-900 pb-4">
            <div>
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <Shield className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                  {currentLang === 'en' ? 'Artisanal Grain Quality Check' : 'የቆዳ ጥራት ማረጋገጫ'}
                </span>
              </div>
              <h3 className="text-sm font-sans font-medium text-stone-100 tracking-tight">
                {currentLang === 'en' ? `Examiner View: ${product.nameEn}` : `የምርት ዝርዝር ዕይታ፡ ${product.nameAm}`}
              </h3>
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-stone-100 p-2 rounded cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas & Inspection Area */}
          <div className="flex-1 my-6 flex items-center justify-center overflow-hidden relative border border-stone-900 bg-stone-950 rounded-lg p-4">
            <div 
              className="relative max-w-full max-h-[70vh] aspect-[4/3] rounded overflow-hidden border border-stone-850 shadow-2xl transition-all duration-300"
              style={{ transform: `scale(${lightboxZoom})` }}
            >
              <img
                src={activeImage}
                alt=""
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              
              {/* Scale watermark */}
              <div className="absolute bottom-3 left-3 bg-stone-950/80 px-2 py-1 rounded text-[9px] text-stone-500 border border-stone-900">
                ZOOM MAGNIFICATION: {lightboxZoom.toFixed(1)}x
              </div>
            </div>

            {/* Left helper info */}
            <div className="absolute left-6 bottom-6 hidden md:block max-w-xs bg-stone-900/60 border border-stone-850/80 p-4 rounded backdrop-blur-md">
              <h4 className="text-xs font-bold text-amber-500 mb-1.5 uppercase tracking-wider">
                {currentLang === 'en' ? 'Ethiopian Highlands Leather' : 'የኢትዮጵያ ከፍተኛ ቦታዎች ሌዘር'}
              </h4>
              <p className="text-[10px] leading-relaxed text-stone-400 font-sans">
                {currentLang === 'en'
                  ? 'Our leather exhibits unique natural textures, pores, and pristine grains, ensuring robust durability and high breathability characteristic of premium sheepskin and cowhide.'
                  : 'የእኛ የቆዳ ውጤቶች የተፈጥሮ መስመሮች እና ጥራቶች ያሉባቸው በመሆናቸው አስተማማኝ ጥንካሬንና ከፍተኛ የአየር ዝውውርን የሚያረጋግጡ ናቸው።'}
              </p>
            </div>
          </div>

          {/* Zoom controls & details bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-stone-900 pt-4 gap-4">
            <div className="flex items-center space-x-2 text-stone-500 text-[10px]">
              <span className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase">
                {currentLang === 'en' ? 'Genuine Certification' : 'ኦሪጅናል የተረጋገጠ'}
              </span>
              <span>•</span>
              <span>100% Top-Grain Quality</span>
            </div>

            {/* Interactive Zoom Adjuster slider */}
            <div className="flex items-center space-x-4 bg-stone-900 border border-stone-850 rounded px-4 py-2">
              <button
                disabled={lightboxZoom <= 1.0}
                onClick={() => setLightboxZoom(Math.max(1.0, lightboxZoom - 0.25))}
                className="text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.25"
                value={lightboxZoom}
                onChange={(e) => setLightboxZoom(parseFloat(e.target.value))}
                className="w-32 accent-amber-500 cursor-pointer h-1 rounded-lg appearance-none bg-stone-850"
              />

              <button
                disabled={lightboxZoom >= 3.0}
                onClick={() => setLightboxZoom(Math.min(3.0, lightboxZoom + 0.25))}
                className="text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-amber-500 min-w-[40px] text-right">
                {(lightboxZoom * 100).toFixed(0)}%
              </span>
            </div>

            <div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded cursor-pointer transition-colors"
              >
                {currentLang === 'en' ? 'Exit Inspector' : 'መርማሪውን ዝጋ'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Sizing Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSizeGuideOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-stone-900 border border-stone-800 rounded-lg max-w-2xl w-full p-6 relative shadow-2xl overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1 cursor-pointer transition-colors"
              title={currentLang === 'en' ? 'Close' : 'ዝጋ'}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 bg-amber-500/10 rounded text-amber-500">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-semibold text-stone-100">
                  {currentLang === 'en' ? 'Ethiopian Leather Size Guide' : 'የኢትዮጵያ ሌዘር የመጠን መመሪያ'}
                </h3>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  {currentLang === 'en' ? 'Conversion chart & guidelines for curated artisan leather' : 'ለተመረጡ የእጅ ስራ የቆዳ ውጤቶች የመለኪያ ሰንጠረዥ እና መመሪያ'}
                </p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-stone-950/60 p-1 rounded-md border border-stone-850/60 mb-5">
              <button
                type="button"
                onClick={() => setSizeMode('assistant')}
                className={`flex-1 py-1.5 text-xs font-mono rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sizeMode === 'assistant'
                    ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{currentLang === 'en' ? 'Interactive Size Finder' : 'መጠን መፈለጊያ ረዳት'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSizeMode('charts')}
                className={`flex-1 py-1.5 text-xs font-mono rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sizeMode === 'charts'
                    ? 'bg-amber-600/15 text-amber-500 border border-amber-500/20 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Ruler className="w-3.5 h-3.5 text-stone-500" />
                <span>{currentLang === 'en' ? 'Sizing Conversion Charts' : 'የመጠን ሰንጠረዦች'}</span>
              </button>
            </div>

            {sizeMode === 'assistant' ? (
              <FindMySizeAssistant
                currentLang={currentLang}
                category={product.category || 'jackets'}
                availableSizes={product.sizes}
                onApplySize={(size) => setSelectedSize(size)}
                onClose={() => setIsSizeGuideOpen(false)}
              />
            ) : (
              <>
                {/* Sizing Tabs */}
                <div className="flex border-b border-stone-800 mb-6 gap-2 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setSizeGuideTab('accessories')}
                    className={`pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      sizeGuideTab === 'accessories'
                        ? 'border-amber-500 text-amber-500 font-bold'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {currentLang === 'en' ? 'Bags & Accessories' : 'ቦርሳዎች እና አክሰሰሪዎች'}
                  </button>
                  <button
                    onClick={() => setSizeGuideTab('shoes')}
                    className={`pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      sizeGuideTab === 'shoes'
                        ? 'border-amber-500 text-amber-500 font-bold'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {currentLang === 'en' ? 'Footwear / Shoes' : 'ጫማዎች'}
                  </button>
                  <button
                    onClick={() => setSizeGuideTab('belts')}
                    className={`pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      sizeGuideTab === 'belts'
                        ? 'border-amber-500 text-amber-500 font-bold'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {currentLang === 'en' ? 'Leather Belts' : 'የቆዳ ቀበቶዎች'}
                  </button>
                  <button
                    onClick={() => setSizeGuideTab('jackets')}
                    className={`pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      sizeGuideTab === 'jackets'
                        ? 'border-amber-500 text-amber-500 font-bold'
                        : 'border-transparent text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {currentLang === 'en' ? 'Jackets & Apparel' : 'ጃኬቶች እና አልባሳት'}
                  </button>
                </div>

                {/* Size Chart Contents */}
                <div className="max-h-[250px] overflow-y-auto pr-1">
                  {sizeGuideTab === 'accessories' && (
                    <div className="space-y-4">
                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-stone-800 text-stone-500">
                            <th className="py-2 font-semibold text-amber-500">{currentLang === 'en' ? 'Accessory Type' : 'የምርት ዓይነት'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'Dimensions (W x H x D)' : 'ልኬቶች (ወርድ x ቁመት x ጎን)'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'How to Measure' : 'እንዴት እንደሚለካ'}</th>
                            <th className="py-2 font-semibold text-right">{currentLang === 'en' ? 'Optimal Fit / Capacity' : 'ተስማሚነቱ / አቅም'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850/50 text-stone-300">
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Bifold Wallet' : 'ባለሁለት እጥፍ ቦርሳ'}
                            </td>
                            <td className="py-2 text-stone-400">11.5 x 9.0 x 1.5 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Measure pocket space and folding thickness.'
                                : 'ኪስዎን ወይም የድሮ ቦርሳዎን ልኬት ያረጋግጡ።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? 'Up to 8 cards & flat bills' : 'እስከ 8 ካርዶች እና ገንዘብ'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Slim Cardholder' : 'ቀጭን የካርድ መያዣ'}
                            </td>
                            <td className="py-2 text-stone-400">10.0 x 7.5 x 0.4 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Minimalist front-pocket accessory.'
                                : 'ለፊት ኪስ በጣም ተስማሚ ነው።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? 'Up to 4 cards & folded cash' : 'እስከ 4 ካርዶች እና የታጠፈ ጥሬ ገንዘብ'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Tech Sleeve (13-14")' : 'የላፕቶፕ ማህደር (13-14")'}
                            </td>
                            <td className="py-2 text-stone-400">34.0 x 24.5 x 2.0 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Measure diagonal screen size & outer laptop thickness.'
                                : 'የላፕቶፕዎን ሰያፍ መጠን እና የውጪውን ውፍረት ይለኩ።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? '13" - 14" MacBook / Slim laptops' : '13" - 14" ማክቡክ እና ኤር'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Tech Sleeve (15-16")' : 'የላፕቶፕ ማህደር (15-16")'}
                            </td>
                            <td className="py-2 text-stone-400">38.5 x 27.5 x 2.0 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Measure diagonal screen size & outer laptop thickness.'
                                : 'የላፕቶፕዎን ሰያፍ መጠን እና የውጪውን ውፍረት ይለኩ።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? '15" - 16" MacBook Pro / Slim laptops' : '15" - 16" ማክቡክ ፕሮ'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Tote Bag / Shopper' : 'በትከሻ የሚንጠለጠል ቦርሳ'}
                            </td>
                            <td className="py-2 text-stone-400">38.0 x 30.0 x 12.0 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Strap drop: 25 cm. Measure from shoulder to waist.'
                                : 'የማንጠልጠያ ርዝመት፡ 25 ሴ.ሜ። ከትከሻ እስከ ወገብ ያለውን ርዝመት ይለኩ።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? 'MacBook, tech pouch & notebooks' : 'ማክቡክ፣ የቴክኖሎጂ እቃዎች እና ሰነዶች'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Messenger / Briefcase' : 'የሰነድ እና ላፕቶፕ ቦርሳ'}
                            </td>
                            <td className="py-2 text-stone-400">40.0 x 29.0 x 9.0 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Adjustable shoulder strap. Measure shoulder to hip.'
                                : 'ከትከሻ እስከ ዳሌ ያለውን ርዝመት ይለኩ።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? 'Fits up to 15.6" laptop & papers' : 'እስከ 15.6" ላፕቶፕ እና ማህደሮች'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-stone-200">
                              {currentLang === 'en' ? 'Passport Cover' : 'የፓስፖርት መያዣ'}
                            </td>
                            <td className="py-2 text-stone-400">14.2 x 10.0 x 1.0 cm</td>
                            <td className="py-2 text-stone-400">
                              {currentLang === 'en'
                                ? 'Fits standard international passports.'
                                : 'ደረጃውን የጠበቀ ዓለም አቀፍ ፓስፖርቶች ይስማማል።'}
                            </td>
                            <td className="py-2 text-right text-stone-300">
                              {currentLang === 'en' ? 'Passport, boarding pass & 2 cards' : 'ፓስፖርት፣ የመሳፈሪያ ትኬት እና 2 ካርዶች'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {sizeGuideTab === 'shoes' && (
                    <div className="space-y-4">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-800 text-stone-500">
                            <th className="py-2 font-semibold text-amber-500">{currentLang === 'en' ? 'Ethiopia/EU' : 'ኢትዮጵያ/EU'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? "US Men's" : 'US ወንድ'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? "US Women's" : 'US ሴት'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'UK' : 'UK'}</th>
                            <th className="py-2 font-semibold text-right">{currentLang === 'en' ? 'Foot Length' : 'የእግር ርዝመት'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850/50 text-stone-300">
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">39</td>
                            <td className="py-2.5">6.5</td>
                            <td className="py-2.5">8.0</td>
                            <td className="py-2.5">5.5</td>
                            <td className="py-2.5 text-right">24.6 cm / 9.7"</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">40</td>
                            <td className="py-2.5">7.5</td>
                            <td className="py-2.5">9.0</td>
                            <td className="py-2.5">6.5</td>
                            <td className="py-2.5 text-right">25.4 cm / 10.0"</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">41</td>
                            <td className="py-2.5">8.5</td>
                            <td className="py-2.5">10.0</td>
                            <td className="py-2.5">7.5</td>
                            <td className="py-2.5 text-right">26.0 cm / 10.2"</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">42</td>
                            <td className="py-2.5">9.0</td>
                            <td className="py-2.5">10.5</td>
                            <td className="py-2.5">8.0</td>
                            <td className="py-2.5 text-right">26.7 cm / 10.5"</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">43</td>
                            <td className="py-2.5">10.0</td>
                            <td className="py-2.5">11.5</td>
                            <td className="py-2.5">9.0</td>
                            <td className="py-2.5 text-right">27.3 cm / 10.8"</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">44</td>
                            <td className="py-2.5">11.0</td>
                            <td className="py-2.5">12.5</td>
                            <td className="py-2.5">10.0</td>
                            <td className="py-2.5 text-right">28.0 cm / 11.0"</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">45</td>
                            <td className="py-2.5">12.0</td>
                            <td className="py-2.5">13.5</td>
                            <td className="py-2.5">11.0</td>
                            <td className="py-2.5 text-right">28.7 cm / 11.3"</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sizeGuideTab === 'belts' && (
                    <div className="space-y-4">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-800 text-stone-500">
                            <th className="py-2 font-semibold text-amber-500">{currentLang === 'en' ? 'Ethiopian Size' : 'የኢትዮጵያ መጠን'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'Waist Inches' : 'የወገብ ኢንች'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'Waist CM' : 'የወገብ ሴ.ሜ'}</th>
                            <th className="py-2 font-semibold text-right">{currentLang === 'en' ? 'Standard Size' : 'ደረጃ መጠን'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850/50 text-stone-300">
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">32</td>
                            <td className="py-2.5">28" - 30"</td>
                            <td className="py-2.5">71 - 76 cm</td>
                            <td className="py-2.5 text-right">Small (S)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">34</td>
                            <td className="py-2.5">30" - 32"</td>
                            <td className="py-2.5">76 - 81 cm</td>
                            <td className="py-2.5 text-right">Medium (M)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">36</td>
                            <td className="py-2.5">32" - 34"</td>
                            <td className="py-2.5">81 - 86 cm</td>
                            <td className="py-2.5 text-right">Large (L)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">38</td>
                            <td className="py-2.5">34" - 36"</td>
                            <td className="py-2.5">86 - 91 cm</td>
                            <td className="py-2.5 text-right">X-Large (XL)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">40</td>
                            <td className="py-2.5">36" - 38"</td>
                            <td className="py-2.5">91 - 96 cm</td>
                            <td className="py-2.5 text-right">XX-Large (2XL)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">42</td>
                            <td className="py-2.5">38" - 40"</td>
                            <td className="py-2.5">96 - 101 cm</td>
                            <td className="py-2.5 text-right">3X-Large (3XL)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sizeGuideTab === 'jackets' && (
                    <div className="space-y-4">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-800 text-stone-500">
                            <th className="py-2 font-semibold text-amber-500">{currentLang === 'en' ? 'Ethiopian Letter' : 'ፊደል'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'Chest (Inches)' : 'ደረት (ኢንች)'}</th>
                            <th className="py-2 font-semibold">{currentLang === 'en' ? 'Chest (CM)' : 'ደረት (ሴ.ሜ)'}</th>
                            <th className="py-2 font-semibold text-right">{currentLang === 'en' ? 'Sleeve Length' : 'የእጅ ርዝመት'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850/50 text-stone-300">
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">S</td>
                            <td className="py-2.5">34" - 36"</td>
                            <td className="py-2.5">86 - 91 cm</td>
                            <td className="py-2.5 text-right">81 - 83 cm</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">M</td>
                            <td className="py-2.5">38" - 40"</td>
                            <td className="py-2.5">96 - 101 cm</td>
                            <td className="py-2.5 text-right">83 - 85 cm</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">L</td>
                            <td className="py-2.5">42" - 44"</td>
                            <td className="py-2.5">106 - 111 cm</td>
                            <td className="py-2.5 text-right">85 - 88 cm</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">XL</td>
                            <td className="py-2.5">46" - 48"</td>
                            <td className="py-2.5">116 - 121 cm</td>
                            <td className="py-2.5 text-right">88 - 90 cm</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold text-stone-200">XXL</td>
                            <td className="py-2.5">50" - 52"</td>
                            <td className="py-2.5">127 - 132 cm</td>
                            <td className="py-2.5 text-right">90 - 92 cm</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sizing Guidelines / Tips */}
                <div className="mt-5 pt-4 border-t border-stone-800 text-[11px] text-stone-400 bg-stone-950/40 p-3 rounded border border-stone-850">
                  <span className="block font-mono text-amber-500 font-bold mb-1">
                    {currentLang === 'en' ? '📐 Sizing Artisan Tips' : '📐 የእጅ ባለሙያ ምክሮች'}
                  </span>
                  <p className="leading-relaxed">
                    {currentLang === 'en' 
                      ? "Ethiopian genuine leather garments and footwear naturally stretch and conform to your individual shape over a few wears. If you're caught between sizes, we recommend ordering a size down for footwear (for a snug premium fit that contours beautifully) or a size up for leather jackets (ideal for layered styling)."
                      : "የኢትዮጵያ እውነተኛ የቆዳ አልባሳት እና ጫማዎች ጥቂት ጊዜ ከተጫሙ በኋላ በተፈጥሮ ተለጥጠው ከሰውነትዎ ቅርጽ ጋር ይስማማሉ። በሁለት መጠኖች መካከል ከሆኑ ለጫማዎች አነስተኛውን መጠን (ለጥሩና ምቹ አቀማመጥ) ፣ ለጃኬቶች ደግሞ ትልቁን መጠን እንዲያዝዙ እንመክራለን።"}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="bg-stone-850 hover:bg-stone-800 text-stone-200 text-xs font-mono py-2 px-5 rounded cursor-pointer transition-colors border border-stone-800"
                  >
                    {currentLang === 'en' ? 'Close Guide' : 'መመሪያውን ዝጋ'}
                  </button>
                </div>
              </>
            )}

          </motion.div>
        </div>
      )}

    </div>
  );
}
