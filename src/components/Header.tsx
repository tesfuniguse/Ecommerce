/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Heart, Search, User as UserIcon, Menu, X, Shield, Globe, Sun, Moon, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { User, CartItem, Product } from '../types';

interface HeaderProps {
  currentLang: 'en' | 'am';
  setLang: (lang: 'en' | 'am') => void;
  user: User | null;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
  onSearch: (query: string) => void;
  onLogout: () => void;
  onToggleAdmin: () => void;
  isAdminMode: boolean;
  onToggleSeller?: () => void;
  isSellerMode?: boolean;
  cart: CartItem[];
  wishlist: Product[];
  onOpenTracking: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isOverlay?: boolean;
}

export default function Header({
  currentLang,
  setLang,
  user,
  onOpenAuth,
  onOpenCart,
  onOpenWishlist,
  onSelectCategory,
  selectedCategory,
  onSearch,
  onLogout,
  onToggleAdmin,
  isAdminMode,
  onToggleSeller,
  isSellerMode,
  cart,
  wishlist,
  onOpenTracking,
  theme,
  onToggleTheme,
  isOverlay = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const categories = [
    { id: 'All', en: 'All Collections', am: 'ሁሉም ስብስቦች' },
    { id: 'Travel Bags', en: 'Travel Bags', am: 'የጉዞ ቦርሳዎች' },
    { id: 'Leather Bags', en: 'Leather Bags', am: 'የቆዳ ቦርሳዎች' },
    { id: 'Wallets', en: 'Wallets', am: 'የኪስ ቦርሳዎች' },
    { id: 'Belts', en: 'Belts', am: 'ቀበቶዎች' },
    { id: 'Shoes', en: 'Shoes', am: 'ጫማዎች' },
    { id: 'Jackets', en: 'Jackets', am: 'ጃኬቶች' },
    { id: 'Backpacks', en: 'Backpacks', am: 'የጀርባ ቦርሳዎች' },
    { id: 'Handmade Leather Accessories', en: 'Accessories', am: 'ተጨማሪ ዕቃዎች' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  return (
    <header className={isOverlay 
      ? "absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-stone-950/90 via-stone-950/35 to-transparent border-b border-stone-800/10 text-stone-100 transition-all duration-300"
      : "sticky top-0 z-40 bg-stone-900/95 border-b border-stone-800 text-stone-100 backdrop-blur-md transition-all duration-300"
    }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none" onClick={() => onSelectCategory('All')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-600 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-900/20 flex-shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 h-5 text-stone-900" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-sm sm:text-base md:text-xl font-bold tracking-wider block text-amber-500 truncate">
                {currentLang === 'en' ? 'ETHIOPIAN LEATHER' : 'የኢትዮጵያ ሌዘር'}
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-stone-400 block -mt-1 truncate">
                {currentLang === 'en' ? 'Premium Heritage Store' : 'የቅንጦት የቆዳ ውጤቶች'}
              </span>
            </div>
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            {categories.slice(1, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`text-sm font-medium transition-colors cursor-pointer hover:text-amber-500 ${
                  selectedCategory === cat.id ? 'text-amber-500 border-b border-amber-500 pb-1' : 'text-stone-300'
                }`}
              >
                {currentLang === 'en' ? cat.en : cat.am}
              </button>
            ))}
            <button
              onClick={onOpenTracking}
              className="text-xs bg-stone-950 border border-stone-800 text-amber-500 font-mono font-bold tracking-wider px-3 py-1.5 rounded hover:bg-stone-850 hover:border-amber-500/20 transition-all cursor-pointer uppercase"
            >
              {currentLang === 'en' ? 'Track Order' : 'ትዕዛዝ መከታተያ'}
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            
            {/* Search Bar Toggler */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center bg-stone-800 border border-stone-700 rounded-full px-2 py-1">
                  <input
                    type="text"
                    placeholder={currentLang === 'en' ? 'Search...' : 'ፍለጋ...'}
                    value={searchVal}
                    onChange={(e) => {
                      setSearchVal(e.target.value);
                      onSearch(e.target.value);
                    }}
                    className="bg-transparent border-none text-xs focus:ring-0 w-20 xs:w-28 sm:w-48 text-stone-200 outline-none"
                    autoFocus
                  />
                  <button type="submit" className="text-stone-400 hover:text-amber-500 cursor-pointer">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => { setSearchOpen(false); onSearch(''); setSearchVal(''); }} className="ml-1 text-stone-400 hover:text-stone-200 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-full text-stone-300 hover:text-amber-500 transition-colors cursor-pointer"
                  title={currentLang === 'en' ? 'Search' : 'ፍለጋ'}
                >
                  <Search className="w-4.5 h-4.5 sm:w-5 h-5" />
                </button>
              )}
            </div>

            {/* Language Switcher (Hidden on Mobile, placed in Mobile Drawer instead) */}
            <button
              onClick={() => setLang(currentLang === 'en' ? 'am' : 'en')}
              className="hidden md:flex p-1.5 sm:p-2 hover:bg-stone-800 rounded-full text-stone-300 hover:text-amber-500 transition-colors items-center space-x-1 cursor-pointer"
              title={currentLang === 'en' ? 'Switch to Amharic' : 'ወደ እንግሊዘኛ ይቀይሩ'}
            >
              <Globe className="w-4 h-4" />
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                {currentLang === 'en' ? 'AM' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle Button (Hidden on Mobile, placed in Mobile Drawer instead) */}
            <button
              onClick={onToggleTheme}
              className="hidden md:flex p-1.5 sm:p-2 hover:bg-stone-800 rounded-full text-stone-300 hover:text-amber-500 transition-colors items-center cursor-pointer"
              title={theme === 'dark' ? (currentLang === 'en' ? 'Switch to Light Mode' : 'ወደ ብርሃን ሁነታ ይቀይሩ') : (currentLang === 'en' ? 'Switch to Dark Mode' : 'ወደ ጨለማ ሁነታ ይቀይሩ')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={onOpenWishlist}
              className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-full text-stone-300 hover:text-red-500 transition-colors relative cursor-pointer"
              title={currentLang === 'en' ? 'Wishlist' : 'ምኞት ዝርዝር'}
            >
              <motion.div
                key={wishlist.length}
                animate={wishlist.length > 0 ? { scale: [1, 1.4, 0.9, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Heart className="w-4.5 h-4.5 sm:w-5 h-5" />
              </motion.div>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-stone-100 font-mono text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Icon */}
            <button
              onClick={onOpenCart}
              className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-full text-stone-300 hover:text-amber-500 transition-colors relative cursor-pointer"
              title={currentLang === 'en' ? 'Shopping Cart' : 'የገበያ ሳጥን'}
            >
              <ShoppingBag className="w-4.5 h-4.5 sm:w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-stone-950 font-mono text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account or Auth Trigger */}
            {user ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenAuth}
                  className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-full text-stone-300 hover:text-amber-500 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-amber-500/40 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-4.5 h-4.5 sm:w-5 h-5 text-amber-500" />
                  )}
                  <span className="hidden md:inline text-xs font-medium max-w-[80px] truncate text-stone-200">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={onToggleAdmin}
                    className={`hidden sm:flex p-1.5 sm:p-2 rounded-full transition-colors items-center space-x-1 cursor-pointer ${
                      isAdminMode ? 'bg-amber-600 text-stone-950 hover:bg-amber-500' : 'hover:bg-stone-800 text-amber-500'
                    }`}
                    title={isAdminMode ? 'Customer Store View' : 'Admin Dashboard'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}

                {user.role === 'seller' && onToggleSeller && (
                  <button
                    onClick={onToggleSeller}
                    className={`hidden sm:flex p-1.5 sm:p-2 rounded-full transition-colors items-center space-x-1 cursor-pointer ${
                      isSellerMode ? 'bg-purple-600 text-stone-950 hover:bg-purple-500' : 'hover:bg-stone-800 text-purple-400'
                    }`}
                    title={isSellerMode ? 'Customer Store View' : 'Seller Dashboard'}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 p-1.5 sm:px-4 sm:py-2 rounded-md text-xs font-semibold tracking-wider uppercase transition-all shadow-md shadow-amber-900/10 cursor-pointer flex items-center justify-center"
                title={currentLang === 'en' ? 'Login' : 'ግባ'}
              >
                <UserIcon className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">{currentLang === 'en' ? 'Login' : 'ግባ'}</span>
              </button>
            )}

            {/* Mobile Menu Toggler */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-stone-800 rounded-full text-stone-300 lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 border-t border-stone-800 px-4 py-5 space-y-5 animate-in fade-in slide-in-from-top duration-200">
          
          {/* Quick Settings: Language & Theme for Mobile */}
          <div className="flex items-center justify-between bg-stone-950/40 p-3 rounded-lg border border-stone-800/60 mx-1">
            <span className="text-xs text-stone-400 font-medium">
              {currentLang === 'en' ? 'Preferences' : 'ምርጫዎች'}
            </span>
            <div className="flex items-center space-x-2">
              {/* Language switcher inside mobile menu */}
              <button
                onClick={() => setLang(currentLang === 'en' ? 'am' : 'en')}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentLang === 'en' ? 'Amharic (AM)' : 'English (EN)'}</span>
              </button>

              {/* Theme toggle inside mobile menu */}
              <button
                onClick={onToggleTheme}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-amber-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-stone-500 tracking-wider uppercase font-mono font-bold px-2 mb-2">
              {currentLang === 'en' ? 'Categories' : 'ምድቦች'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-xs px-3 py-2.5 rounded-md font-medium transition-colors cursor-pointer truncate ${
                    selectedCategory === cat.id ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
                  }`}
                >
                  {currentLang === 'en' ? cat.en : cat.am}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                onOpenTracking();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center text-xs bg-amber-600/10 border border-amber-500/20 text-amber-500 font-mono font-bold tracking-wider py-2.5 rounded hover:bg-amber-600/20 transition-all cursor-pointer uppercase"
            >
              {currentLang === 'en' ? 'Track Order' : 'ትዕዛዝ መከታተያ'}
            </button>
          </div>

          {user ? (
            <div className="border-t border-stone-800/80 pt-4 space-y-4">
              <div className="flex justify-between items-center bg-stone-950/20 p-2.5 rounded-md border border-stone-800/40">
                <div className="flex items-center space-x-2.5">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-7 h-7 rounded-full object-cover border border-amber-500/35 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-600/10 border border-amber-500/35 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-stone-200">{user.name}</span>
                    <span className="text-[10px] text-stone-500 font-mono uppercase">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                >
                  {currentLang === 'en' ? 'Logout' : 'ውጣ'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {user.role === 'admin' && (
                  <button
                    onClick={() => { onToggleAdmin(); setMobileMenuOpen(false); }}
                    className="w-full bg-stone-950 border border-stone-800 hover:border-amber-500/30 py-2.5 rounded text-center text-xs font-mono font-bold tracking-wider text-amber-500 uppercase cursor-pointer"
                  >
                    {isAdminMode ? 'Customer View' : 'Admin Console'}
                  </button>
                )}

                {user.role === 'seller' && onToggleSeller && (
                  <button
                    onClick={() => { onToggleSeller(); setMobileMenuOpen(false); }}
                    className="w-full bg-stone-950 border border-stone-800 hover:border-purple-500/30 py-2.5 rounded text-center text-xs font-mono font-bold tracking-wider text-purple-400 uppercase cursor-pointer"
                  >
                    {isSellerMode ? 'Customer View' : 'Seller Portal'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="border-t border-stone-800/80 pt-4 space-y-3">
              <p className="text-[11px] text-stone-500 text-center leading-relaxed italic">
                {currentLang === 'en' ? 'Sign in to access your orders, addresses, and premium tracking.' : 'ትዕዛዞችን፣ አድራሻዎችን እና የትዕዛዝ መከታተያዎችን ለማየት ይግቡ።'}
              </p>
              <button
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-2.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all shadow-md shadow-amber-900/10 cursor-pointer text-center"
              >
                {currentLang === 'en' ? 'Sign In / Register' : 'ይግቡ / ይመዝገቡ'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
