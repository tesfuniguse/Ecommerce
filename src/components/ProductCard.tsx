/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, Eye, Heart, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  currentLang: 'en' | 'am';
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
}

export default function ProductCard({
  product,
  currentLang,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onToggleCompare,
  isCompared = false,
}: ProductCardProps) {
  const [currentInventory, setCurrentInventory] = useState<number>(product.inventory);

  useEffect(() => {
    setCurrentInventory(product.inventory);
  }, [product.inventory]);

  const isOutOfStock = currentInventory === 0;
  const isLowStock = currentInventory > 0 && currentInventory < 5;

  return (
    <div className="group relative bg-stone-900 border border-stone-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-stone-950/50 flex flex-col h-full">
      
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] bg-stone-950 overflow-hidden cursor-pointer" onClick={() => onQuickView({ ...product, inventory: currentInventory })}>
        <img
          src={product.images[0]}
          alt={currentLang === 'en' ? product.nameEn : product.nameAm}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isBestSeller && (
            <span className="bg-amber-600 text-stone-950 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
              {currentLang === 'en' ? 'Best Seller' : 'ተፈላጊ'}
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-emerald-600 text-stone-100 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
              {currentLang === 'en' ? 'New' : 'አዲስ'}
            </span>
          )}
          {isLowStock && (
            <span className="bg-red-600 text-stone-100 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm animate-pulse">
              {currentLang === 'en' ? `Limited Stock (${currentInventory})` : `የተወሰነ ክምችት (${currentInventory})`}
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-stone-800 text-stone-400 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
              {currentLang === 'en' ? 'Sold Out' : 'ያለቀ'}
            </span>
          )}
        </div>

        {/* Floating actions layer */}
        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView({ ...product, inventory: currentInventory }); }}
            className="p-3 bg-stone-900 text-stone-100 hover:text-amber-500 rounded-full transition-colors cursor-pointer border border-stone-700 hover:border-amber-500"
            title="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if(!isOutOfStock) onAddToCart({ ...product, inventory: currentInventory }); }}
            disabled={isOutOfStock}
            className={`p-3 rounded-full transition-colors cursor-pointer border ${
              isOutOfStock
                ? 'bg-stone-850 text-stone-600 border-stone-800 cursor-not-allowed'
                : 'bg-stone-900 text-stone-100 hover:text-amber-500 border-stone-700 hover:border-amber-500'
            }`}
            title="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
          className="absolute top-3 right-3 p-2 bg-stone-900/80 hover:bg-stone-900 text-stone-100 hover:text-red-500 rounded-full border border-stone-800 hover:border-stone-700 transition-all cursor-pointer z-10"
        >
          <motion.div
            animate={isWishlisted ? { scale: [1, 1.4, 0.9, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            whileTap={{ scale: 0.8 }}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </motion.div>
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        
        {/* Category */}
        <p className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mb-1">
          {product.category}
        </p>

        {/* Name */}
        <h3
          className="font-sans text-sm font-semibold text-stone-200 hover:text-amber-500 transition-colors mb-2 cursor-pointer line-clamp-1"
          onClick={() => onQuickView({ ...product, inventory: currentInventory })}
        >
          {currentLang === 'en' ? product.nameEn : product.nameAm}
        </h3>

        {/* Reviews & Compare */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold text-stone-300 font-mono">
              {product.rating}
            </span>
            <span className="text-stone-500 text-[11px]">
              ({product.reviewsCount} {currentLang === 'en' ? 'reviews' : 'ግምገማዎች'})
            </span>
          </div>

          {onToggleCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isCompared
                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-400'
                  : 'bg-stone-950/40 border-stone-850 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
              title={currentLang === 'en' ? 'Compare side-by-side' : 'ጎን ለጎን አወዳድር'}
            >
              <ArrowLeftRight className={`w-3 h-3 ${isCompared ? 'text-amber-400' : 'text-stone-500 group-hover:text-stone-400'}`} />
              <span>{currentLang === 'en' ? 'Compare' : 'አወዳድር'}</span>
            </button>
          )}
        </div>

        {/* Sizes Badge Row */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.sizes.map((sz) => (
              <span key={sz} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-850 text-stone-400">
                {sz}
              </span>
            ))}
          </div>
        )}

        {/* Urgency low stock notice */}
        {isLowStock && (
          <div className="mb-3 px-2.5 py-1 bg-red-950/20 border border-red-900/30 rounded flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              {currentLang === 'en' ? 'Hurry!' : 'ይፍጠኑ!'}
            </span>
            <span className="text-[10px] font-mono font-semibold text-red-300">
              {currentLang === 'en' ? `Only ${currentInventory} left` : `${currentInventory} ብቻ ቀርቷል`}
            </span>
          </div>
        )}

        {/* Pricing and Quick Add footer */}
        <div className="mt-auto pt-3 border-t border-stone-800/80 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-mono text-sm sm:text-base font-bold text-amber-500">
                {product.priceETB.toLocaleString()} ETB
              </span>
              <span className="block text-[10px] text-stone-500 font-mono">
                ~${(product.priceETB / 120).toFixed(0)} USD
              </span>
            </div>

            <button
              disabled={isOutOfStock}
              onClick={() => onAddToCart({ ...product, inventory: currentInventory })}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-stone-600'
              }`}
            >
              {isOutOfStock ? (currentLang === 'en' ? 'Sold Out' : 'ያለቀ') : (currentLang === 'en' ? 'Add' : 'ጨምር')}
            </button>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart({ ...product, inventory: currentInventory })}
            className={`w-full py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isOutOfStock
                ? 'bg-stone-850 text-stone-600 cursor-not-allowed border border-transparent'
                : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md shadow-amber-900/15'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {currentLang === 'en' ? 'Quick Buy' : 'በፍጥነት ግዛ'}
          </button>
        </div>

      </div>
    </div>
  );
}
