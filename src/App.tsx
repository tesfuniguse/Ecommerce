/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Product, CartItem, PromoCode, Order, SystemNotification } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';
import OrderStatus from './components/OrderStatus';
import FAQAccordion from './components/FAQAccordion';
import { Sparkles, Heart, X, Search, ShoppingBag, Eye, LogIn, ChevronLeft, ChevronRight, Award, Bell, CheckCircle, Mail, Tag, Copy, Check, AlertTriangle, RefreshCw, Share2, QrCode, ArrowLeftRight, Star, ShoppingCart, Github, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { alertSystem } from './lib/alerts';

/**
 * A robust fetch wrapper that handles timeouts, checks content-types,
 * and avoids parsing HTML/non-JSON error pages.
 */
async function safeFetchJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000,
  fallback: T | null = null
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(id);

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!response.ok) {
      if (contentType.includes('application/json')) {
        let errData: any = null;
        try {
          errData = JSON.parse(text);
        } catch {
          // ignore parsing error for non-JSON content
        }
        if (errData) {
          throw new Error(errData.error || errData.message || `Server error: ${response.status}`);
        }
      }
      throw new Error(`Server returned status ${response.status}. The service might be temporarily unavailable.`);
    }

    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON response but received non-JSON payload.');
    }

    try {
      return JSON.parse(text) as T;
    } catch (parseErr: any) {
      throw new Error(`Failed to parse response: ${parseErr.message}`);
    }
  } catch (error: any) {
    clearTimeout(id);
    const isAbort = error.name === 'AbortError' || 
                    String(error.message || '').toLowerCase().includes('abort') ||
                    String(error || '').toLowerCase().includes('abort');
    
    if (isAbort) {
      console.log(`[safeFetchJson] Fetch to ${url} was aborted (normal lifecycle).`);
    } else {
      console.error(`[safeFetchJson] Error fetching ${url}:`, error.message || error);
    }
    
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
}

const categoriesList = [
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

export default function App() {
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [pendingShareWishlistIds, setPendingShareWishlistIds] = useState<string[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);
  const [authInfoMsg, setAuthInfoMsg] = useState('');

  // SSO States
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [githubAuthLoading, setGithubAuthLoading] = useState(false);
  const [linkedinAuthLoading, setLinkedinAuthLoading] = useState(false);

  // OAuth SSO Message Listener (Google, GitHub, LinkedIn)
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user: authUser, token } = event.data;
        if (authUser && token) {
          localStorage.setItem('user', JSON.stringify(authUser));
          localStorage.setItem('token', token);
          setUser(authUser);
          setAuthOpen(false);
          setAuthEmail('');
          setAuthPassword('');
          setAuthError('');
          setAuthInfoMsg(lang === 'en' ? `Successfully logged in as ${authUser.name}!` : `በመለያዎ በተሳካ ሁኔታ ገብተዋል፦ ${authUser.name}!`);
        }
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        const errMsg = event.data.error;
        setAuthError(lang === 'en' ? `Single Sign-On failed: ${decodeURIComponent(errMsg || 'Unknown error')}` : `በመለያ መግባት አልተሳካም፦ ${decodeURIComponent(errMsg || 'ያልታወቀ ስህተት')}`);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [lang]);

  // Sync Local Auth with Backend User Profile on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Error restoring user session:', e);
    }
  }, []);

  // Theme control state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      // Apply transition class to enable smooth transition across all components
      document.documentElement.classList.add('theme-transitioning');
      
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
      localStorage.setItem('theme', theme);
      
      // Remove transition class after the transition finishes to prevent side-effects on other animations
      const timer = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 450);
      
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Error syncing theme:', e);
    }
  }, [theme]);
  
  // Modals & Panels Toggles
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isSellerMode, setIsSellerMode] = useState(false);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Custom User-friendly Alert & Confirm state
  const [customToasts, setCustomToasts] = useState<Array<{ id: string; message: string; title?: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [customConfirm, setCustomConfirm] = useState<{
    message: string;
    title?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    const unsubscribeAlert = alertSystem.onAlert((message, options) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setCustomToasts(prev => [...prev, {
        id,
        message,
        title: options?.title,
        type: options?.type || 'info'
      }]);
      
      const duration = options?.duration || 4500;
      setTimeout(() => {
        setCustomToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    });

    const unsubscribeConfirm = alertSystem.onConfirm((message, onConfirm, onCancel, options) => {
      setCustomConfirm({
        message,
        title: options?.title,
        onConfirm: () => {
          setCustomConfirm(null);
          onConfirm();
        },
        onCancel: () => {
          setCustomConfirm(null);
          onCancel?.();
        },
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        type: options?.type || 'info'
      });
    });

    return () => {
      unsubscribeAlert();
      unsubscribeConfirm();
    };
  }, []);

  // Newsletter Signup for Returning Users State & Effects
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [newsletterError, setNewsletterError] = useState('');
  const [promoCodeUnlocked, setPromoCodeUnlocked] = useState<string | null>(null);
  const [newsletterCopied, setNewsletterCopied] = useState(false);

  useEffect(() => {
    try {
      const hasVisited = localStorage.getItem('has_visited');
      const hasSubscribed = localStorage.getItem('newsletter_subscribed');
      const hasDismissed = localStorage.getItem('newsletter_dismissed');

      if (!hasVisited) {
        // First visit: flag them as visited so they count as "returning" next time, but do not show the popup now.
        localStorage.setItem('has_visited', 'true');
      } else {
        // Returning user! Show popup if they haven't subscribed or dismissed yet.
        if (!hasSubscribed && !hasDismissed) {
          const timer = setTimeout(() => {
            setNewsletterOpen(true);
          }, 2500); // 2.5 seconds elegant artisan delay
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      console.error('Error checking returning user status:', e);
    }
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      setNewsletterError(lang === 'en' ? 'Please enter a valid email address.' : 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።');
      setNewsletterStatus('error');
      return;
    }

    setNewsletterStatus('submitting');
    setNewsletterError('');

    try {
      const data = await safeFetchJson<{
        promoCode: string;
        discountPercent: number;
        messageEn: string;
        messageAm: string;
      }>('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      }, 10000);

      setPromoCodeUnlocked(data.promoCode);
      setNewsletterStatus('success');
      localStorage.setItem('newsletter_subscribed', 'true');

      // Instantly apply promo code to active checkout promo state for convenience!
      setPromo({
        code: data.promoCode,
        discountPercent: data.discountPercent,
        descriptionEn: data.messageEn,
        descriptionAm: data.messageAm,
        isActive: true
      });
    } catch (error: any) {
      setNewsletterError(error.message || (lang === 'en' ? 'An unexpected error occurred.' : 'ያልተጠበቀ ስህተት ተከስቷል።'));
      setNewsletterStatus('error');
    }
  };

  const handleDismissNewsletter = () => {
    setNewsletterOpen(false);
    try {
      localStorage.setItem('newsletter_dismissed', 'true');
    } catch (e) {
      console.error('Error dismissing newsletter popup:', e);
    }
  };

  // Real-time Notification System States
  const [realtimeNotification, setRealtimeNotification] = useState<SystemNotification | null>(null);

  // Establish WebSocket connection for real-time notification dispatch
  useEffect(() => {
    if (!user) {
      setRealtimeNotification(null);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/?userId=${user.id}`;
    
    let socket: WebSocket;
    let reconnectTimeout: any;

    function connect() {
      console.log('Establishing real-time notification channel:', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'notification') {
            const notif: SystemNotification = payload.data;
            setRealtimeNotification(notif);
            
            // Dispatch a window event to update the Customer Dashboard if open
            window.dispatchEvent(new CustomEvent('new-notification', { detail: notif }));
          }
        } catch (e) {
          console.error('Error handling notification payload:', e);
        }
      };

      socket.onclose = () => {
        console.log('Real-time connection closed. Attempting reconnect in 5s...');
        reconnectTimeout = setTimeout(() => {
          if (user) connect();
        }, 5000);
      };

      socket.onerror = (err) => {
        console.warn('Real-time channel warning:', err);
        socket.close();
      };
    }

    connect();

    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnect on cleanup
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [user]);

  // Auto-dismiss real-time toast notification after 8 seconds
  useEffect(() => {
    if (realtimeNotification) {
      const timer = setTimeout(() => {
        setRealtimeNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [realtimeNotification]);

  // Products Database
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Size filtering & sorting states
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');

  // Auth Form State
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Two-Way OTP (2FA) State
  const [otpRequired, setOtpRequired] = useState<boolean>(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string>('');
  const [isSimulatedOtp, setIsSimulatedOtp] = useState<boolean>(false);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string>('');

  // Email Verification State
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Active checkout promo code
  const [promo, setPromo] = useState<PromoCode | null>(null);

  // AI Daily Highlight State (Gemini-powered personalized suggestion)
  const [aiHeadline, setAiHeadline] = useState('Dynamic Craft Highlight');
  const [aiHighlight, setAiHighlight] = useState<Product | null>(null);
  const [aiReason, setAiReason] = useState('');
  const [aiLoading, setAiLoading] = useState(true);

  const fetchProducts = () => {
    setLoadingProducts(true);
    safeFetchJson<Product[]>('/api/products', {}, 35000, [])
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
        setLoadingProducts(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Check for shared wishlist link on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('wishlistShare');
      if (shareData) {
        const ids = shareData.split(',').filter(Boolean);
        if (ids.length > 0) {
          setPendingShareWishlistIds(ids);
          // If the user is not signed in, open the auth modal with an info tip
          if (!user) {
            setAuthTab('login');
            setAuthOpen(true);
            setAuthInfoMsg(lang === 'en'
              ? 'Please sign in or register to automatically import and save your shared wishlist!'
              : 'እባክዎ የተጋራውን የምኞት ዝርዝር ለማስገባት እና ለማስቀመጥ ይግቡ ወይም ይመዝገቡ!');
          }
        }
      }
    } catch (e) {
      console.error('Error parsing wishlistShare query param:', e);
    }
  }, [lang]);

  // Merge shared wishlist when authenticated and products are loaded
  useEffect(() => {
    if (user && pendingShareWishlistIds.length > 0 && products.length > 0) {
      const sharedProducts = products.filter(p => pendingShareWishlistIds.includes(p.id));
      if (sharedProducts.length > 0) {
        setWishlist(prev => {
          const merged = [...prev];
          sharedProducts.forEach(prod => {
            if (!merged.some(item => item.id === prod.id)) {
              merged.push(prod);
            }
          });
          return merged;
        });

        // Trigger a beautiful, elegant system-wide toast notification
        const notif: SystemNotification = {
          id: `notif-${Date.now()}`,
          titleEn: 'Wishlist Synchronized',
          titleAm: 'የምኞት ዝርዝር ተመሳስሏል',
          messageEn: `Successfully imported ${sharedProducts.length} item(s) from the shared link to your curated wishlist!`,
          messageAm: `ከተጋራው ሊንክ ${sharedProducts.length} እቃ(ዎች) በተሳካ ሁኔታ ወደ ምኞት ዝርዝርዎ ተጨምረዋል!`,
          type: 'system',
          createdAt: new Date().toISOString(),
          isRead: false
        };
        setRealtimeNotification(notif);
        // Also open the wishlist modal so they can see their imported items!
        setWishlistOpen(true);
      }
      
      // Clear pending and URL parameter to avoid double-triggering
      setPendingShareWishlistIds([]);
      setAuthInfoMsg('');
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('wishlistShare');
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch (e) {
        console.error(e);
      }
    }
  }, [user, pendingShareWishlistIds, products]);

  // User Behavior Tracking State
  const [viewedProductIds, setViewedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('viewedProductIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save viewedProductIds to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('viewedProductIds', JSON.stringify(viewedProductIds));
  }, [viewedProductIds]);

  // Product Comparison States & Handlers
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const handleToggleCompare = (product: Product) => {
    setComparedProductIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      } else {
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, product.id];
      }
    });
  };

  const comparedProducts = React.useMemo(() => {
    return comparedProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [comparedProductIds, products]);

  // Track product view when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setViewedProductIds(prev => {
        const filtered = prev.filter(id => id !== selectedProduct.id);
        const updated = [selectedProduct.id, ...filtered].slice(0, 10); // Keep last 10 viewed
        return updated;
      });
    }
  }, [selectedProduct]);

  // Recently Viewed Horizontal Carousel ref and scroll function
  const recentlyViewedRef = React.useRef<HTMLDivElement>(null);
  const scrollRecentlyViewed = (direction: 'left' | 'right') => {
    if (recentlyViewedRef.current) {
      const { scrollLeft, clientWidth } = recentlyViewedRef.current;
      const scrollAmount = clientWidth * 0.75;
      recentlyViewedRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Personalized Recommendation list for homepage (based on behavior)
  const [personalizedRecs, setPersonalizedRecs] = useState<Product[]>([]);
  const [personalizedRecsReason, setPersonalizedRecsReason] = useState('');
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);

  useEffect(() => {
    if (products.length === 0) return;
    setLoadingPersonalized(true);

    safeFetchJson<{ recommendations: Product[]; aiReasonEn: string; aiReasonAm?: string }>(
      '/api/products/recommendations/personalized',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          viewedProductIds,
          wishlistProductIds: wishlist.map(p => p.id),
          cartProductIds: cart.map(item => item.product.id),
        })
      },
      20000,
      { recommendations: [], aiReasonEn: 'Custom tailoring elite selections to match your visual palette...', aiReasonAm: 'የእርስዎን ምርጫ መሰረት ያደረጉ እቃዎችን በመምረጥ ላይ...' }
    )
      .then(data => {
        const recs = data.recommendations && data.recommendations.length > 0
          ? data.recommendations
          : products.slice(0, 4);
        setPersonalizedRecs(recs);
        setPersonalizedRecsReason(lang === 'en' ? data.aiReasonEn : (data.aiReasonAm || data.aiReasonEn));
        setLoadingPersonalized(false);
      })
      .catch(err => {
        console.error('Personalized recommendations fetch error:', err);
        // Fallback to top products if call fails
        setPersonalizedRecs(products.slice(0, 4));
        setLoadingPersonalized(false);
      });
  }, [products, viewedProductIds, wishlist, cart, user, lang]);

  // Sync AI Matchmaker suggestion from all available products with personalization payload
  useEffect(() => {
    if (products.length === 0) return;
    setAiLoading(true);

    safeFetchJson<{ highlightId?: string; aiAnalysis: string; aiAnalysisAm?: string }>(
      '/api/products/recommendations/daily',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          viewedProductIds,
          wishlistProductIds: wishlist.map(p => p.id),
          cartProductIds: cart.map(item => item.product.id),
        })
      },
      20000,
      { aiAnalysis: 'Enriching today’s selection with local leather tanneries data...', aiAnalysisAm: 'የዛሬውን ምርጫ የቆዳ ውጤቶች መረጃ መሰረት በማድረግ በማዘጋጀት ላይ...' }
    )
      .then((data) => {
        setAiHeadline(lang === 'en' ? 'AI Leather Curator' : 'የአርቴፊሻል ኢንተለጀንስ የቆዳ ምርጫ');
        setAiReason(lang === 'en' ? data.aiAnalysis : (data.aiAnalysisAm || data.aiAnalysis));
        const matchingProduct = products.find((p) => p.id === data.highlightId);
        setAiHighlight(matchingProduct || products[0]);
        setAiLoading(false);
      })
      .catch((err) => {
        console.error('Daily recommendations fetch error:', err);
        setAiHighlight(products[0]);
        setAiLoading(false);
      });
  }, [products, viewedProductIds, wishlist, cart, user, lang]);

  const getWhatsAppUrl = () => {
    const phone = '251911223344'; // Customer Support Team
    let text = '';

    if (isAdminMode && user?.role === 'admin') {
      text = lang === 'en' 
        ? "Hello Support! I am currently in the Admin Operations Console and need technical assistance."
        : "ሰላም! የአስተዳዳሪ ገጽ ላይ ነኝ፤ የቴክኒክ ድጋፍ እፈልጋለሁ።";
    } else if (isDashboardOpen && user) {
      text = lang === 'en'
        ? `Hello Support! I am logged into my account (Email: ${user.email}) and viewing my customer dashboard. I'd like to make an inquiry.`
        : `ሰላም! አካውንቴ ውስጥ ገብቼ ገጽ ላይ ነኝ (ኢሜይል፡ ${user.email})። መረጃ መጠየቅ ፈልጌ ነበር።`;
    } else if (checkoutOpen) {
      text = lang === 'en'
        ? `Hello Support! I am on the checkout page with items in my shopping bag and need assistance with my payment or delivery.`
        : `ሰላም! ክፍያ መፈጸሚያ ገጽ ላይ ነኝ፤ ስለ ክፍያ ወይም አቅርቦት እርዳታ እፈልጋለሁ።`;
    } else if (selectedProduct) {
      text = lang === 'en'
        ? `Hello Support! I am viewing the product "${selectedProduct.nameEn}" (Price: ${selectedProduct.priceETB} ETB) and would like more details.`
        : `ሰላም! "${selectedProduct.nameAm}" የተባለውን ምርት እየተመለከትኩ ነው (ዋጋ፡ ${selectedProduct.priceETB} ብር)። ተጨማሪ መረጃ ፈልጌ ነበር።`;
    } else {
      text = lang === 'en'
        ? "Hello Support! I am browsing the Ethiopian Leather Store website and would like some help finding the perfect item."
        : "ሰላም! የኢትዮጵያ ሌዘር መደብር ድረ-ገጽን እየጎበኘሁ ነው፤ ምርጥ ምርጫዎችን ለማግኘት እርዳታ እፈልጋለሁ።";
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleCheckVerification = async () => {
    setVerificationChecking(true);
    setVerificationError('');
    setVerificationSuccess('');
    setTimeout(() => {
      setIsEmailVerified(true);
      setVerificationSuccess(lang === 'en' ? 'Email successfully verified!' : 'ኢሜይልዎ በተሳካ ሁኔታ ተረጋግጧል!');
      setVerificationChecking(false);
    }, 1000);
  };

  const handleResendVerification = async () => {
    setVerificationChecking(true);
    setVerificationError('');
    setVerificationSuccess('');
    setTimeout(() => {
      setVerificationSuccess(lang === 'en' ? 'Verification email resent successfully (simulated)!' : 'የማረጋገጫ ኢሜይል በተሳካ ሁኔታ እንደገና ተልኳል (የተመሰለ)!');
      setVerificationChecking(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
      const data = await response.json();
      
      if (data.isConfigured && data.url) {
        const width = 550;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          data.url,
          'google_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
        
        if (!authWindow) {
          setAuthError(lang === 'en' ? 'Popup blocker detected. Please allow popups to sign in with Google.' : 'የፖፕአፕ ማገጃ ተገኝቷል። እባክዎን በጉግል ለመግባት ፖፕአፕ ይፍቀዱ።');
        }
      } else {
        setAuthError(
          lang === 'en' 
            ? 'Google SSO credentials are not configured on the server. Please define GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
            : 'የጉግል መለያ ቅንብሮች በአገልጋዩ ላይ አልተዋቀሩም። እባክዎ GOOGLE_CLIENT_ID እና GOOGLE_CLIENT_SECRET የአካባቢ ተለዋዋጮችን ይግለጹ።'
        );
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(lang === 'en' ? `Failed to initiate Google Sign-In: ${err.message}` : `የጉግል መግቢያ ማስጀመር አልተሳካም፦ ${err.message}`);
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setGithubAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(window.location.origin)}`);
      const data = await response.json();
      
      if (data.isConfigured && data.url) {
        const width = 550;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          data.url,
          'github_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
        
        if (!authWindow) {
          setAuthError(lang === 'en' ? 'Popup blocker detected. Please allow popups to sign in with GitHub.' : 'የፖፕአፕ ማገጃ ተገኝቷል። እባክዎን በጊትሃብ ለመግባት ፖፕአፕ ይፍቀዱ።');
        }
      } else {
        setAuthError(
          lang === 'en' 
            ? 'GitHub SSO credentials are not configured on the server. Please define GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.'
            : 'የጊትሃብ መለያ ቅንብሮች በአገልጋዩ ላይ አልተዋቀሩም። እባክዎ GITHUB_CLIENT_ID እና GITHUB_CLIENT_SECRET የአካባቢ ተለዋዋጮችን ይግለጹ።'
        );
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(lang === 'en' ? `Failed to initiate GitHub Sign-In: ${err.message}` : `የጊትሃብ መግቢያ ማስጀመር አልተሳካም፦ ${err.message}`);
    } finally {
      setGithubAuthLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`/api/auth/linkedin/url?origin=${encodeURIComponent(window.location.origin)}`);
      const data = await response.json();
      
      if (data.isConfigured && data.url) {
        const width = 550;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          data.url,
          'linkedin_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
        
        if (!authWindow) {
          setAuthError(lang === 'en' ? 'Popup blocker detected. Please allow popups to sign in with LinkedIn.' : 'የፖፕአፕ ማገጃ ተገኝቷል። እባክዎን በሊንክድኢን ለመግባት ፖፕአፕ ይፍቀዱ።');
        }
      } else {
        setAuthError(
          lang === 'en' 
            ? 'LinkedIn SSO credentials are not configured on the server. Please define LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.'
            : 'የሊንክድኢን መለያ ቅንብሮች በአገልጋዩ ላይ አልተዋቀሩም። እባክዎ LINKEDIN_CLIENT_ID እና LINKEDIN_CLIENT_SECRET የአካባቢ ተለዋዋጮችን ይግለጹ።'
        );
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(lang === 'en' ? `Failed to initiate LinkedIn Sign-In: ${err.message}` : `የሊንክድኢን መግቢያ ማስጀመር አልተሳካም፦ ${err.message}`);
    } finally {
      setLinkedinAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const data = await safeFetchJson<{ user: User }>('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, code: otpCode }),
      });

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthOpen(false);
      setOtpRequired(false);
      setVerificationId('');
      setOtpCode('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setIsSimulatedOtp(false);
      setSimulatedOtpCode('');
      
      if (data.user.role === 'admin') {
        setIsAdminMode(true);
      } else {
        setIsDashboardOpen(true);
      }
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      setAuthError(err.message || 'Verification code is invalid or has expired.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setAuthError('');
    setResendSuccessMsg('');
    try {
      const data = await safeFetchJson<{ success: boolean; verificationId: string; code?: string; isSimulated?: boolean }>('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, name: authName }),
      });

      if (data.success) {
        setVerificationId(data.verificationId);
        setIsSimulatedOtp(!!data.isSimulated);
        setSimulatedOtpCode(data.code || '');
        setResendSuccessMsg(lang === 'en' ? 'A new verification code has been sent!' : 'አዲስ የማረጋገጫ ኮድ ተልኳል!');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setAuthError(err.message || 'Failed to resend verification code.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetSuccess('');
    setResendSuccessMsg('');
    setAuthLoading(true);

    if (authTab === 'forgot') {
      try {
        if (!authEmail) {
          setAuthError(lang === 'en' ? 'Please enter your email address.' : 'እባክዎ መጀመሪያ የኢሜይል አድራሻዎን ያስገቡ።');
          setAuthLoading(false);
          return;
        }
        setResetSuccess(lang === 'en' ? 'Password reset (simulated)! Please contact support or use another email to register.' : 'የይለፍ ቃል ዳግም ማስጀመር (ማስመሰያ)! እባክዎ ድጋፍ ሰጪን ያነጋግሩ ወይም ለመመዝገብ ሌላ ኢሜይል ይጠቀሙ።');
        setAuthError('');
      } catch (err: any) {
        console.error('Password reset error:', err);
        setAuthError('Failed to process password reset request.');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    const isLogin = authTab === 'login';

    try {
      if (isLogin) {
        const data = await safeFetchJson<{ success: boolean; otpRequired: boolean; verificationId: string; email: string; code?: string; isSimulated?: boolean }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail }),
        });

        if (data.otpRequired) {
          setOtpRequired(true);
          setVerificationId(data.verificationId);
          setIsSimulatedOtp(!!data.isSimulated);
          setSimulatedOtpCode(data.code || '');
        }
      } else {
        if (authPassword.length < 6) {
          setAuthError(lang === 'en' ? 'Password must be at least 6 characters long.' : 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።');
          setAuthLoading(false);
          return;
        }

        const data = await safeFetchJson<{ success: boolean; otpRequired: boolean; verificationId: string; email: string; code?: string; isSimulated?: boolean }>('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: authName, email: authEmail }),
        });

        if (data.otpRequired) {
          setOtpRequired(true);
          setVerificationId(data.verificationId);
          setIsSimulatedOtp(!!data.isSimulated);
          setSimulatedOtpCode(data.code || '');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAdminMode(false);
    setIsDashboardOpen(false);
  };

  const scrollToFAQ = (category?: 'shipping' | 'returns' | 'et_switch') => {
    setIsAdminMode(false);
    setIsDashboardOpen(false);
    setCheckoutOpen(false);
    setIsTrackingOpen(false);
    setSelectedProduct(null);

    setTimeout(() => {
      const element = document.getElementById('faq-accordion-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        if (category) {
          const filterBtn = document.getElementById(`faq-filter-${category}`);
          if (filterBtn) {
            (filterBtn as HTMLButtonElement).click();
          }
        }
      }
    }, 120);
  };

  const handleAddToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedSize === size &&
        item.selectedColor === color
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity, selectedSize: size, selectedColor: color }]);
    }
    setCartOpen(true);
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const handleToggleWishlist = (product: Product) => {
    const isPresent = wishlist.some((item) => item.id === product.id);
    if (isPresent) {
      setWishlist(wishlist.filter((item) => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const handleShareWishlist = () => {
    if (wishlist.length === 0) return;
    try {
      const ids = wishlist.map((p) => p.id).join(',');
      const shareUrl = `${window.location.origin}?wishlistShare=${ids}`;
      
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopiedShare(true);
          setTimeout(() => setCopiedShare(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy share link:', err);
        });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExploreCollections = () => {
    setSelectedCategory('All');
    setSelectedProduct(null);
    setIsAdminMode(false);
    setIsSellerMode(false);
    setIsDashboardOpen(false);
    setCheckoutOpen(false);
    setIsTrackingOpen(false);

    // Give a micro-delay for the virtual DOM to update and render the catalog grid section, then scroll to it smoothly.
    setTimeout(() => {
      const element = document.getElementById('catalog-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Helper to get size score for sorting
  const getSizeValue = (size: string): number => {
    const s = size.trim().toUpperCase();
    if (!isNaN(Number(s))) {
      return Number(s);
    }
    const sizeMap: { [key: string]: number } = {
      'XXS': 1, '2XS': 1,
      'XS': 2,
      'S': 3,
      'M': 4,
      'L': 5,
      'XL': 6,
      'XXL': 7, '2XL': 7,
      'XXXL': 8, '3XL': 8,
      'XXXXL': 9, '4XL': 9,
    };
    return sizeMap[s] || 0;
  };

  const getProductMinSize = (product: Product): number => {
    if (!product.sizes || product.sizes.length === 0) return 999;
    return Math.min(...product.sizes.map(getSizeValue));
  };

  const getProductMaxSize = (product: Product): number => {
    if (!product.sizes || product.sizes.length === 0) return -1;
    return Math.max(...product.sizes.map(getSizeValue));
  };

  // Get all unique sizes for filter option dropdown
  const allUniqueSizes = Array.from(
    new Set<string>(
      products
        .flatMap(p => (p.sizes || []) as string[])
        .filter(Boolean)
    )
  ).sort((a, b) => getSizeValue(a) - getSizeValue(b));

  // Filtered and sorted products catalog grid
  const filteredProducts = products
    .filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        p.nameEn.toLowerCase().includes(searchLower) ||
        p.nameAm.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower);
      const matchesSize = selectedSize === 'All' || (p.sizes && p.sizes.includes(selectedSize));
      return matchesCategory && matchesSearch && matchesSize;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') {
        return a.priceETB - b.priceETB;
      }
      if (sortBy === 'priceDesc') {
        return b.priceETB - a.priceETB;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'sizeAsc') {
        const minA = getProductMinSize(a);
        const minB = getProductMinSize(b);
        if (minA !== minB) return minA - minB;
        return a.priceETB - b.priceETB;
      }
      if (sortBy === 'sizeDesc') {
        const maxA = getProductMaxSize(a);
        const maxB = getProductMaxSize(b);
        if (maxA !== maxB) return maxB - maxA;
        return b.priceETB - a.priceETB;
      }
      if (sortBy === 'sizeVariety') {
        const lenA = a.sizes?.length || 0;
        const lenB = b.sizes?.length || 0;
        return lenB - lenA;
      }
      return 0;
    });

  const isFilterActive = selectedCategory !== 'All' || selectedSize !== 'All' || sortBy !== 'default' || searchQuery !== '';

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSize('All');
    setSortBy('default');
    setSearchQuery('');
  };

  const isHomeScreen = !selectedProduct && !checkoutOpen && !isTrackingOpen && !(isAdminMode && user?.role === 'admin') && !(isSellerMode && user?.role === 'seller') && !(isDashboardOpen && user);

  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100 flex flex-col justify-between selection:bg-amber-600 selection:text-stone-950 animate-fadeIn">
      
      {/* Universal header component */}
      <Header
        currentLang={lang}
        setLang={setLang}
        user={user}
        onOpenAuth={() => {
          if (user) {
            setIsDashboardOpen(true);
            setIsAdminMode(false);
            setIsSellerMode(false);
          } else {
            setAuthTab('login');
            setAuthOpen(true);
          }
        }}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedProduct(null);
          setCheckoutOpen(false);
          setIsDashboardOpen(false);
          setIsAdminMode(false);
          setIsSellerMode(false);

          // Smooth scroll to catalog section
          setTimeout(() => {
            const element = document.getElementById('catalog-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
        selectedCategory={selectedCategory}
        onSearch={setSearchQuery}
        onLogout={handleLogout}
        onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
        isAdminMode={isAdminMode}
        onToggleSeller={() => setIsSellerMode(!isSellerMode)}
        isSellerMode={isSellerMode}
        cart={cart}
        wishlist={wishlist}
        onOpenTracking={() => {
          setTrackingOrder(null);
          setIsTrackingOpen(true);
          setCheckoutOpen(false);
          setIsDashboardOpen(false);
          setSelectedProduct(null);
          setIsAdminMode(false);
          setIsSellerMode(false);
        }}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        isOverlay={isHomeScreen}
      />

      {/* Main Container */}
      <main className="flex-grow">
        
        {/* VIEW: Admin Operations Console */}
        {isAdminMode && user?.role === 'admin' ? (
          <AdminDashboard
            currentLang={lang}
            onClose={() => setIsAdminMode(false)}
            allProducts={products}
            onRefreshProducts={fetchProducts}
          />
        ) : isSellerMode && user?.role === 'seller' ? (
          <SellerDashboard
            user={user}
            currentLang={lang}
            onClose={() => setIsSellerMode(false)}
            onRefreshProducts={fetchProducts}
            allProducts={products}
          />
        ) : isDashboardOpen && user ? (
          /* VIEW: Customer account dashboard */
          !isEmailVerified && user.role !== 'admin' ? (
            <div className="max-w-md mx-auto my-12 p-8 bg-stone-900 border border-stone-800 rounded-lg shadow-xl shadow-stone-950/50 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 animate-pulse">
                  <Mail className="w-12 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-serif font-bold text-stone-100 tracking-wide">
                  {lang === 'en' ? 'Email Verification Required' : 'የኢሜይል ማረጋገጫ ያስፈልጋል'}
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed font-sans">
                  {lang === 'en' 
                    ? `We have sent a verification email to ${user.email}. Please verify your account to unlock full dashboard access.` 
                    : `ለኢሜይል አድራሻዎ ${user.email} የማረጋገጫ ሊንክ ልከናል። እባክዎ ሙሉ ዳሽቦርድ ለመጠቀም መለያዎን ያረጋግጡ።`}
                </p>
              </div>

              {verificationSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs rounded font-mono flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{verificationSuccess}</span>
                </div>
              )}

              {verificationError && (
                <div className="p-3 bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded font-mono flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleCheckVerification}
                  disabled={verificationChecking}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 py-2.5 rounded font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {verificationChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{lang === 'en' ? 'Checking...' : 'በማጣራት ላይ...'}</span>
                    </>
                  ) : (
                    <span>{lang === 'en' ? "I've Verified My Email" : 'ኢሜይሌን አረጋግጫለሁ'}</span>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleResendVerification}
                    disabled={verificationChecking}
                    className="flex-1 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-800 disabled:text-stone-600 border border-stone-850 text-stone-300 py-2 rounded font-sans text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    {lang === 'en' ? 'Resend Email' : 'ዳግም ላክ'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-stone-950 hover:bg-stone-800 border border-stone-850 text-stone-400 hover:text-stone-200 py-2 rounded font-sans text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    {lang === 'en' ? 'Sign Out' : 'ውጣ'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsDashboardOpen(false)}
                  className="text-stone-500 hover:text-stone-300 text-xs font-mono tracking-wider transition-all cursor-pointer bg-transparent border-0"
                >
                  {lang === 'en' ? '← Back to Shopping' : '← ወደ ግብይት ተመለስ'}
                </button>
              </div>
            </div>
          ) : (
            <CustomerDashboard
              user={user}
              currentLang={lang}
              onLogout={handleLogout}
              onClose={() => setIsDashboardOpen(false)}
              onTrackOrder={(ord) => {
                setTrackingOrder(ord);
                setIsTrackingOpen(true);
                setIsDashboardOpen(false);
              }}
              onOpenSellerPortal={() => {
                setIsSellerMode(true);
                setIsDashboardOpen(false);
              }}
              onUserUpdated={(updatedUser) => {
                setUser(updatedUser);
              }}
            />
          )
        ) : checkoutOpen ? (
          /* VIEW: Checkout flow */
          <Checkout
            cart={cart}
            user={user}
            promo={promo}
            currentLang={lang}
            onOrderCompleted={() => {
              setCart([]);
              setPromo(null);
            }}
            onClose={() => setCheckoutOpen(false)}
          />
        ) : isTrackingOpen ? (
          /* VIEW: Order status tracking progress view */
          <OrderStatus
            currentLang={lang}
            initialOrder={trackingOrder}
            onClose={() => {
              setIsTrackingOpen(false);
              setTrackingOrder(null);
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setIsTrackingOpen(false);
              setTrackingOrder(null);
            }}
            onReorder={(ord) => {
              ord.items.forEach((item) => {
                handleAddToCart(item.product, item.quantity, item.selectedSize, item.selectedColor);
              });
              setRealtimeNotification({
                id: `reorder-${Date.now()}`,
                titleEn: 'Order Reordered!',
                titleAm: 'በድጋሚ ታዟል!',
                messageEn: `Successfully duplicated ${ord.items.length} item(s) from Order #${ord.id} into your cart.`,
                messageAm: `በተሳካ ሁኔታ ${ord.items.length} ምርቶችን ከትዕዛዝ ቁጥር #${ord.id} ወደ ጋሪዎ ጨምረናል።`,
                type: 'system',
                createdAt: new Date().toISOString(),
                isRead: false,
              });
              setCartOpen(true);
              setIsTrackingOpen(false);
              setTrackingOrder(null);
            }}
          />
        ) : selectedProduct ? (
          /* VIEW: Product detail with multiple images & AI Companion recommendations */
          <ProductDetails
            product={selectedProduct}
            currentLang={lang}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={wishlist.some((item) => item.id === selectedProduct.id)}
            onSelectProduct={setSelectedProduct}
            allProducts={products}
            wishlistProductIds={wishlist.map(p => p.id)}
            cartProductIds={cart.map(item => item.product.id)}
            userId={user?.id}
            user={user}
            onOpenAuth={() => {
              setAuthTab('login');
              setAuthOpen(true);
            }}
            viewedProductIds={viewedProductIds}
          />
        ) : (
          /* VIEW: Homepage / Catalog */
          <div>
            <Hero currentLang={lang} onExplore={handleExploreCollections} />

            {/* AI Daily Curator Feature banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
              <div className="bg-stone-900 border border-amber-500/10 rounded-lg p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-stone-950/40">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Sparkles className="w-32 h-32 text-amber-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left block information */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="inline-flex items-center space-x-2 bg-amber-600/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-500 text-[10px] font-mono tracking-widest uppercase">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>{aiHeadline}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-sans font-bold text-stone-100 tracking-tight">
                      {lang === 'en' ? 'Today’s Bespoke Heritage Recommendation' : 'የዛሬው ልዩ እውነተኛ የቆዳ ምርት'}
                    </h2>

                    <p className="text-sm italic text-stone-300 leading-relaxed max-w-2xl border-l-2 border-amber-500/30 pl-4">
                      "{aiReason || (lang === 'en' ? 'Analyzing luxury full-grain Ethiopian leather matchmakers...' : 'ለእርስዎ ተስማሚ የሆኑ የቅንጦት የቆዳ ውጤቶችን በመተንተን ላይ...')}"
                    </p>
                  </div>

                  {/* Right block product teaser */}
                  <div className="lg:col-span-4">
                    {aiLoading || !aiHighlight ? (
                      <div className="py-6 flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setSelectedProduct(aiHighlight)}
                        className="group bg-stone-950 border border-stone-850 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-all shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-stone-900 border border-stone-850">
                            <img src={aiHighlight.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">{aiHighlight.category}</p>
                            <h4 className="text-sm font-semibold text-stone-200 group-hover:text-amber-500 transition-colors line-clamp-1">
                              {lang === 'en' ? aiHighlight.nameEn : aiHighlight.nameAm}
                            </h4>
                            <p className="font-mono text-xs text-amber-500 font-bold mt-0.5">{aiHighlight.priceETB.toLocaleString()} ETB</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-amber-500 transition-colors" />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* AI Personalized Recommendation Gallery */}
            {personalizedRecs.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="border border-stone-850 bg-stone-900/20 p-6 rounded-lg shadow-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-850/60 pb-4 mb-6 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <h3 className="text-sm font-sans font-bold text-stone-100 uppercase tracking-widest">
                          {lang === 'en' ? 'Bespoke Curated For You' : 'ለእርስዎ በተለየ ሁኔታ የተመረጡ'}
                        </h3>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-relaxed italic">
                        "{personalizedRecsReason || (lang === 'en' ? 'Bespoke recommendations analyzing your tastes and wishlist.' : 'ፍላጎትዎን እና ምርጫዎን መሰረት ያደረጉ ልዩ አስተያየቶች።')}"
                      </p>
                    </div>
                  </div>

                  {loadingPersonalized ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-8 h-8 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {personalizedRecs.slice(0, 4).map((prod) => (
                        <ProductCard
                          key={`pers-${prod.id}`}
                          product={prod}
                          currentLang={lang}
                          onQuickView={setSelectedProduct}
                          onAddToCart={(p) => handleAddToCart(p, 1)}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={wishlist.some((item) => item.id === prod.id)}
                          onToggleCompare={handleToggleCompare}
                          isCompared={comparedProductIds.includes(prod.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recently Viewed Section */}
            {viewedProductIds.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="border border-stone-850 bg-stone-900/20 p-6 rounded-lg shadow-lg relative">
                  <div className="flex justify-between items-center border-b border-stone-850/60 pb-4 mb-6">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-amber-500 animate-pulse" />
                        <h3 className="text-sm font-sans font-bold text-stone-100 uppercase tracking-widest">
                          {lang === 'en' ? 'Recently Viewed' : 'በቅርብ ጊዜ ያዩዋቸው'}
                        </h3>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-relaxed italic">
                        {lang === 'en' 
                          ? "Items you've interacted with during your current session." 
                          : "በዚህ ቆይታ ውስጥ የተመለከቷቸው ምርቶች።"}
                      </p>
                    </div>

                    {/* Carousel Navigation Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => scrollRecentlyViewed('left')}
                        className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-500 transition-all cursor-pointer"
                        title={lang === 'en' ? 'Previous' : 'ቀዳሚ'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => scrollRecentlyViewed('right')}
                        className="p-1.5 rounded-full bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-500 transition-all cursor-pointer"
                        title={lang === 'en' ? 'Next' : 'ቀጣይ'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scroll Container */}
                  <div
                    ref={recentlyViewedRef}
                    className="flex overflow-x-auto gap-6 scrollbar-none snap-x snap-mandatory scroll-smooth pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {viewedProductIds
                      .map(id => products.find(p => p.id === id))
                      .filter((p): p is Product => !!p)
                      .map((prod) => (
                        <div key={`recent-${prod.id}`} className="w-72 flex-shrink-0 snap-start">
                          <ProductCard
                            product={prod}
                            currentLang={lang}
                            onQuickView={setSelectedProduct}
                            onAddToCart={(p) => handleAddToCart(p, 1)}
                            onToggleWishlist={handleToggleWishlist}
                            isWishlisted={wishlist.some((item) => item.id === prod.id)}
                            onToggleCompare={handleToggleCompare}
                            isCompared={comparedProductIds.includes(prod.id)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Catalog Grid Section */}
            <div id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              
              {/* Category Title Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-850 pb-6 mb-10 gap-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-sans font-semibold text-stone-100 tracking-tight">
                    {selectedCategory === 'All'
                      ? (lang === 'en' ? 'Our Heritage Masterpieces' : 'የባህላዊ የቆዳ ስራ ውጤቶች')
                      : selectedCategory}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <p className="text-xs text-stone-500 font-mono">
                      {filteredProducts.length} {lang === 'en' ? 'masterpieces available' : 'የተመረጡ እቃዎች ይገኛሉ'}
                    </p>
                    {selectedSize !== 'All' && (
                      <span className="text-[10px] bg-amber-600/10 border border-amber-600/20 text-amber-500 px-1.5 py-0.5 rounded font-mono">
                        {lang === 'en' ? `Size: ${selectedSize}` : `መጠን: ${selectedSize}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Size Filter Dropdown */}
                  <div className="flex items-center space-x-2 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5">
                    <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{lang === 'en' ? 'Size' : 'መጠን'}:</span>
                    <select
                      id="size-filter-select"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="bg-transparent text-xs font-mono text-stone-300 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="All" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'All Sizes' : 'ሁሉም መጠኖች'}</option>
                      {allUniqueSizes.map((sz) => (
                        <option key={sz} value={sz} className="bg-stone-900 text-stone-300">
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center space-x-2 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5">
                    <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{lang === 'en' ? 'Sort By' : 'ደርድር'}:</span>
                    <select
                      id="catalog-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-mono text-stone-300 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="default" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Featured' : 'የተመረጡት'}</option>
                      <option value="priceAsc" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Price: Low to High' : 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ'}</option>
                      <option value="priceDesc" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Price: High to Low' : 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ'}</option>
                      <option value="rating" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Customer Rating' : 'ደረጃ፡ ከከፍተኛ ወደ ዝቅተኛ'}</option>
                      <option value="sizeAsc" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Size: Smallest First' : 'መጠን፡ ከትንሽ ወደ ትልቅ'}</option>
                      <option value="sizeDesc" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Size: Largest First' : 'መጠን፡ ከትልቅ ወደ ትንሽ'}</option>
                      <option value="sizeVariety" className="bg-stone-900 text-stone-300">{lang === 'en' ? 'Most Size Options' : 'የመጠን ምርጫ ብዛት'}</option>
                    </select>
                  </div>

                  {/* Reset Filters button */}
                  {isFilterActive && (
                    <button
                      id="reset-catalog-filters-btn"
                      onClick={handleResetFilters}
                      className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded px-3 py-1.5 text-xs font-mono transition-all cursor-pointer shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Reset Filters' : 'አስጀምር'}</span>
                    </button>
                  )}

                  {searchQuery && (
                    <p className="text-xs text-amber-500 font-mono self-center pl-1">
                      {lang === 'en' ? `Showing results for "${searchQuery}"` : `ለ "${searchQuery}" የተገኙ ውጤቶች`}
                    </p>
                  )}
                </div>
              </div>

              {/* Two-Column Layout: Sidebar Category Filter + Products Grid */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Side Category Filter Sidebar */}
                <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 bg-stone-900/40 border border-stone-850 rounded-lg p-4 sm:p-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-800/60">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500/95">
                        {lang === 'en' ? 'Category Filter' : 'ምድብ ማጣሪያ'}
                      </h3>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {categoriesList.length} {lang === 'en' ? 'types' : 'አይነቶች'}
                      </span>
                    </div>

                    <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none snap-x">
                      {categoriesList.map((cat) => {
                        const isActive = selectedCategory === cat.id;
                        const count = cat.id === 'All' 
                          ? products.length 
                          : products.filter(p => p.category === cat.id).length;
                        
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setSelectedProduct(null);
                              setCheckoutOpen(false);
                              setIsDashboardOpen(false);
                              setIsAdminMode(false);
                              setIsSellerMode(false);
                              
                              // Scroll catalog section into view on mobile
                              const catalogEl = document.getElementById('catalog-section');
                              if (catalogEl && window.innerWidth < 1024) {
                                catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded text-left transition-all text-xs font-medium cursor-pointer shrink-0 snap-start border ${
                              isActive
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/60 border-transparent'
                            } w-auto lg:w-full`}
                          >
                            <span className="truncate mr-3">{lang === 'en' ? cat.en : cat.am}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-950 text-stone-500'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                {/* Right Side Products Grid */}
                <div className="flex-1 w-full">
                  {loadingProducts ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin"></div>
                      <p className="text-xs text-stone-500 font-mono">Loading premium products...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-24 text-stone-500 border border-dashed border-stone-800 rounded-lg">
                      <p className="text-xs font-mono">{lang === 'en' ? 'No masterpieces matched your search filters.' : 'ለፍለጋዎ የሚሆን እቃ አልተገኘም።'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          currentLang={lang}
                          onQuickView={setSelectedProduct}
                          onAddToCart={(p) => handleAddToCart(p, 1)}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={wishlist.some((item) => item.id === prod.id)}
                          onToggleCompare={handleToggleCompare}
                          isCompared={comparedProductIds.includes(prod.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* FAQ Accordion Section on main storefront view */}
        {!isAdminMode && !isDashboardOpen && !checkoutOpen && !isTrackingOpen && !selectedProduct && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <FAQAccordion lang={lang} />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-stone-950 border-t border-stone-850/80 text-stone-400 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <span className="font-sans text-base font-bold tracking-wider text-amber-500">
              {lang === 'en' ? 'ETHIOPIAN LEATHER STORE' : 'የኢትዮጵያ ሌዘር መደብር'}
            </span>
            <p className="text-xs leading-relaxed text-stone-500">
              {lang === 'en'
                ? 'We celebrate centuries of fine Ethiopian tannery craftsmanship, blended with elegant contours to provide authentic, highly durable legacy accessories.'
                : 'የዘመናት ጥራት ያለው የኢትዮጵያ ቆዳ ፍቅፋቂ የእጅ ጥበብን ውበት ጠብቆ ለትውልድ የሚቆዩ እውነተኛ መለዋወጫዎችን ለማቅረብ እንሰራለን።'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-4">
              {lang === 'en' ? 'Customer Care' : 'የደንበኞች አገልግሎት'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={(e) => { e.preventDefault(); scrollToFAQ('et_switch'); }}
                  className="hover:text-amber-500 transition-colors cursor-pointer text-left font-sans"
                >
                  {lang === 'en' ? 'ET-Switch Payment FAQs' : 'የኢቲ-ስዊች አከፋፈል መመሪያዎች'}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => { e.preventDefault(); scrollToFAQ('shipping'); }}
                  className="hover:text-amber-500 transition-colors cursor-pointer text-left font-sans"
                >
                  {lang === 'en' ? 'Shipping & Delivery Policies' : 'የማድረሻ እና ስርጭት መመሪያዎች'}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => { e.preventDefault(); scrollToFAQ('returns'); }}
                  className="hover:text-amber-500 transition-colors cursor-pointer text-left font-sans"
                >
                  {lang === 'en' ? 'Return & Adjustment Policies' : 'የዕቃ መመለስ እና ማስተካከያ መመሪያዎች'}
                </button>
              </li>
              <li className="pt-2 border-t border-stone-900">
                <button
                  id="whatsapp-footer-qr-btn"
                  onClick={(e) => { e.preventDefault(); setShowWhatsAppQR(true); }}
                  className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer text-left font-sans flex items-center gap-1.5 font-medium"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'WhatsApp Support (Scan QR)' : 'የዋትስአፕ እገዛ (QR ይቃኙ)'}</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-4">
              {lang === 'en' ? 'Flagship Atelier' : 'ዋናው ማምረቻ ቅርንጫፍ'}
            </h4>
            <p className="text-xs leading-relaxed text-stone-500">
              Bole Atlas Area, Heritage Court <br />
              Addis Ababa, Ethiopia <br />
              info@ethiopianleather.com
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-4">
              {lang === 'en' ? 'Promotions & Inquiries' : 'ቅናሾች እና መረጃዎች'}
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 w-full"
              />
              <button className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-1.5 rounded border border-stone-700 font-semibold">
                Join
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-stone-900 text-center text-[10px] text-stone-600 font-mono">
          © 2026 Ethiopian Leather Store. Handcrafted with genuine highland cow and sheep hides. All rights reserved.
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {authOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={() => { setAuthOpen(false); setAuthInfoMsg(''); }}></div>
          
          <div className="relative bg-stone-900 border border-stone-800 rounded-lg max-w-md w-full p-6 sm:p-8 shadow-2xl z-10 text-stone-200">
            
            {/* Close */}
            <button onClick={() => { setAuthOpen(false); setAuthInfoMsg(''); }} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ShoppingBag className="w-6 h-6 text-stone-900" />
              </div>
              <h3 className="text-lg font-sans font-bold text-stone-100 uppercase tracking-wider">
                {lang === 'en' ? 'Ethiopian Leather Store' : 'የኢትዮጵያ ሌዘር መደብር'}
              </h3>
            </div>

            {otpRequired ? (
              /* Two-Way Authentication OTP Screen */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
                    <QrCode className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-sans font-bold text-stone-100 uppercase tracking-widest">
                    {lang === 'en' ? 'Two-Way Authentication' : 'ሁለት-ደረጃ ማረጋገጫ'}
                  </h4>
                  <p className="text-xs text-stone-400 font-sans leading-relaxed">
                    {lang === 'en'
                      ? `For enhanced security, a 6-digit verification code was sent to your inbox at ${authEmail}. Please input it below.`
                      : `ለላቀ ደህንነት ሲባል ባለ 6-አሃዝ የማረጋገጫ ኮድ ወደ ${authEmail} ልከናል:: እባክዎ ኮዱን ከታች ያስገቡ::`}
                  </p>
                </div>

                {/* Error banner */}
                {authError && (
                  <div className="bg-red-950/40 border border-red-900/30 text-red-400 text-xs p-3 rounded font-mono leading-relaxed">
                    <span>{authError}</span>
                  </div>
                )}

                {/* Real-time 2FA verification */}

                {resendSuccessMsg && (
                  <p className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs p-3 rounded font-mono text-center">
                    {resendSuccessMsg}
                  </p>
                )}

                {isSimulatedOtp && simulatedOtpCode && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-left space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                      <span>🔧 Demo Sandbox Mode</span>
                      <span className="text-[10px] text-stone-500 font-normal">| የማሳያ ሁኔታ</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                      {lang === 'en'
                        ? 'No active outbound SMTP server is configured. For easy demo/review access, use the simulated verification code below:'
                        : 'የኢሜል መላኪያ አልተዋቀረም:: ለማሳያነት የሚከተለውን ኮድ ይጠቀሙ::'}
                    </p>
                    <div className="flex items-center justify-between bg-stone-950 border border-stone-850 p-2.5 rounded">
                      <span className="font-mono text-lg font-bold text-amber-500 tracking-wider">
                        {simulatedOtpCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(simulatedOtpCode)}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {lang === 'en' ? 'Auto-Fill' : 'ኮድ ሙላ'}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1.5 text-center">
                    {lang === 'en' ? 'Enter 6-Digit Code' : 'ባለ 6-አሃዝ ኮድ ያስገቡ'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-4 py-3 text-lg text-center tracking-[0.5em] text-amber-500 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || otpCode.length !== 6}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 py-3 rounded font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-900/20"
                >
                  {authLoading ? '...' : (lang === 'en' ? 'Verify & Continue' : 'አረጋግጥ እና ቀጥል')}
                </button>

                <div className="flex justify-between items-center text-xs font-mono pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequired(false);
                      setOtpCode('');
                      setResendSuccessMsg('');
                      setAuthError('');
                    }}
                    className="text-stone-400 hover:text-stone-200 hover:underline cursor-pointer bg-transparent border-0"
                  >
                    {lang === 'en' ? '← Back' : '← ተመለስ'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-amber-500 hover:text-amber-400 hover:underline cursor-pointer bg-transparent border-0"
                  >
                    {lang === 'en' ? 'Resend Code' : 'ኮድ እንደገና ላክ'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Tabs / Header */}
                {authTab !== 'forgot' ? (
                  <div className="flex border-b border-stone-850 mb-6 font-mono text-xs">
                    <button
                      onClick={() => { setAuthTab('login'); setAuthError(''); setResetSuccess(''); }}
                      className={`flex-grow pb-2 font-bold cursor-pointer transition-all ${
                        authTab === 'login' ? 'text-amber-500 border-b border-amber-500' : 'text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      {lang === 'en' ? 'Sign In' : 'ግባ'}
                    </button>
                    <button
                      onClick={() => { setAuthTab('register'); setAuthError(''); setResetSuccess(''); }}
                      className={`flex-grow pb-2 font-bold cursor-pointer transition-all ${
                        authTab === 'register' ? 'text-amber-500 border-b border-amber-500' : 'text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      {lang === 'en' ? 'Register Account' : 'ይመዝገቡ'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <h4 className="text-sm font-mono font-bold text-amber-500 uppercase tracking-wider">
                      {lang === 'en' ? 'Reset Password' : 'የይለፍ ቃልዎን ይቀይሩ'}
                    </h4>
                  </div>
                )}

                {/* Info message banner */}
                {authInfoMsg && (
                  <div className="bg-amber-950/40 border border-amber-900/30 text-amber-400 text-xs p-3 rounded mb-4 font-mono leading-relaxed flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <span>{authInfoMsg}</span>
                  </div>
                )}

                {/* Success banner */}
                {resetSuccess && (
                  <p className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs p-3 rounded mb-4 font-mono">
                    {resetSuccess}
                  </p>
                )}

                {/* Error banner */}
                {authError && (
                  <div className="bg-red-950/40 border border-red-900/30 text-red-400 text-xs p-3 rounded mb-4 font-mono leading-relaxed">
                    <span>{authError}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authTab === 'forgot' && (
                    <p className="text-xs text-stone-400 font-sans leading-relaxed mb-4">
                      {lang === 'en' 
                        ? "Enter your email address below and we will send you a secure link to reset your password." 
                        : "የይለፍ ቃልዎን ዳግም ለማስጀመር እባክዎ ኢሜይልዎን ያስገቡ። የዳግም ማስጀመሪያ ሊንክ እንልክልዎታለን።"}
                    </p>
                  )}

                  {authTab === 'register' && (
                    <div>
                      <label className="block text-xs font-mono text-stone-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                        placeholder="e.g. Kedir Alula"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-stone-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="name@example.com"
                    />
                  </div>

                  {authTab !== 'forgot' && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-mono text-stone-400">Password</label>
                        {authTab === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setAuthTab('forgot'); setAuthError(''); setResetSuccess(''); }}
                            className="text-[11px] font-mono text-amber-500 hover:text-amber-400 hover:underline cursor-pointer bg-transparent border-0 p-0"
                          >
                            {lang === 'en' ? 'Forgot password?' : 'የይለፍ ቃልዎን ረስተዋል?'}
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-3 rounded font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-900/20"
                  >
                    {authLoading ? '...' : authTab === 'forgot' ? (lang === 'en' ? 'Send Reset Link' : 'የይለፍ ቃል ዳግም ማስጀመሪያ ላክ') : authTab === 'login' ? (lang === 'en' ? 'Log In' : 'ግባ') : (lang === 'en' ? 'Create Account' : 'መለያ ፍጠር')}
                  </button>

                  {authTab === 'forgot' && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => { setAuthTab('login'); setAuthError(''); setResetSuccess(''); }}
                        className="text-xs font-mono text-stone-400 hover:text-stone-200 hover:underline cursor-pointer bg-transparent border-0"
                      >
                        {lang === 'en' ? '← Back to Sign In' : '← ወደ መግቢያ ተመለስ'}
                      </button>
                    </div>
                  )}
                </form>

                {authTab !== 'forgot' && (
                  <>
                    {/* Separator Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-800"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-stone-900 px-2 text-stone-500 font-mono text-[10px] tracking-wider">
                          {lang === 'en' ? 'Or login with' : 'ወይም በዚህ ይግቡ'}
                        </span>
                      </div>
                    </div>

                    {/* SSO Providers Login Grid */}
                    <div className="space-y-2">
                      {/* Google Login button */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleAuthLoading || githubAuthLoading || linkedinAuthLoading || authLoading}
                        className="w-full bg-stone-950 border border-stone-800 hover:bg-stone-900/60 hover:border-stone-700 text-stone-200 py-3 rounded font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg"
                      >
                        <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          {googleAuthLoading 
                            ? '...' 
                            : (lang === 'en' ? 'Sign in with Google' : 'በጉግል መለያ ይግቡ')}
                        </span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        {/* GitHub Login button */}
                        <button
                          type="button"
                          onClick={handleGitHubSignIn}
                          disabled={googleAuthLoading || githubAuthLoading || linkedinAuthLoading || authLoading}
                          className="bg-stone-950 border border-stone-800 hover:bg-stone-900/60 hover:border-stone-700 text-stone-200 py-2.5 rounded font-sans font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                        >
                          <Github className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>
                            {githubAuthLoading 
                              ? '...' 
                              : (lang === 'en' ? 'GitHub' : 'ጊትሃብ')}
                          </span>
                        </button>

                        {/* LinkedIn Login button */}
                        <button
                          type="button"
                          onClick={handleLinkedInSignIn}
                          disabled={googleAuthLoading || githubAuthLoading || linkedinAuthLoading || authLoading}
                          className="bg-stone-950 border border-stone-800 hover:bg-stone-900/60 hover:border-stone-700 text-stone-200 py-2.5 rounded font-sans font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                        >
                          <Linkedin className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>
                            {linkedinAuthLoading 
                              ? '...' 
                              : (lang === 'en' ? 'LinkedIn' : 'ሊንክድኢን')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

                {/* Sandbox & Setup Panel removed for secure production build */}
              </div>
            </div>
          )}

      {/* Cart Slider Overlay */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        currentLang={lang}
        promo={promo}
        onApplyPromo={setPromo}
        viewedProductIds={viewedProductIds}
        wishlistProductIds={wishlist.map((p) => p.id)}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onSelectProduct={setSelectedProduct}
      />

      {/* Wishlist Overlay Modal */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={() => setWishlistOpen(false)}></div>
          
          <div className="relative bg-stone-900 border border-stone-800 rounded-lg max-w-lg w-full p-6 shadow-2xl z-10 text-stone-200">
            <button onClick={() => setWishlistOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-center mb-6 pr-8">
              <h3 className="text-base font-sans font-bold text-stone-100 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <span>{lang === 'en' ? 'Your Curated Wishlist' : 'የተመረጡ ምኞቶችዎ'}</span>
              </h3>
              {wishlist.length > 0 && (
                <button
                  onClick={handleShareWishlist}
                  className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-750 text-amber-500 hover:text-amber-400 border border-stone-700 hover:border-amber-500/30 px-3 py-1.5 rounded text-xs font-mono font-bold cursor-pointer transition-all shrink-0"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lang === 'en' ? 'Copied!' : 'ተቀድቷል!'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Share' : 'አጋራ'}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {wishlist.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-6 text-center">{lang === 'en' ? 'No items saved in wishlist.' : 'እስካሁን ምንም እቃ አልተቀመጠም።'}</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {wishlist.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-stone-950 p-3 rounded-lg border border-stone-850">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setSelectedProduct(item); setWishlistOpen(false); }}>
                      <div className="w-12 h-12 rounded overflow-hidden bg-stone-900">
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-200 line-clamp-1">{lang === 'en' ? item.nameEn : item.nameAm}</p>
                        <p className="text-[10px] text-amber-500 font-mono font-bold mt-0.5">{item.priceETB.toLocaleString()} ETB</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => { handleAddToCart(item, 1); setWishlistOpen(false); }}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleToggleWishlist(item)}
                        className="text-stone-500 hover:text-red-500 p-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Returning User Newsletter Signup Popup */}
      {newsletterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md" onClick={handleDismissNewsletter}></div>
          
          <div className="relative bg-stone-900 border border-amber-500/30 rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl z-10 text-stone-200 overflow-hidden">
            {/* Elegant Background Stamp Overlay */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-amber-500/5 flex items-center justify-center text-amber-500/5 select-none pointer-events-none font-mono text-[10px] rotate-12">
              <div className="border-4 border-dashed border-amber-500/5 rounded-full p-8 text-center">
                GENUINE HERITAGE
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={handleDismissNewsletter} 
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1.5 rounded-full hover:bg-stone-850/80 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {newsletterStatus !== 'success' ? (
              <div>
                {/* Stamp Icon */}
                <div className="w-12 h-12 rounded-full bg-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-5 shadow-lg">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>

                <h3 className="text-xl font-sans font-bold text-stone-100 tracking-tight leading-tight">
                  {lang === 'en' ? 'Unlock Artisanal Privilege' : 'የእጅ ባለሙያነት መብትን ያግኙ'}
                </h3>
                <p className="text-xs text-stone-400 mt-2 font-sans leading-relaxed">
                  {lang === 'en'
                    ? "Welcome back. As a returning connoisseur of exquisite craftsmanship, subscribe to our newsletter for early access to new releases and a special reward."
                    : "እንኳን ደህና መጡ። የቆዳ ምርቶች ደንበኛ እንደመሆንዎ፥ ለአዳዲስ ምርቶች ቀዳሚ ለመሆን እና ልዩ ሽልማት ለማግኘት ለኢሜይል ደብዳቤያችን ይመዝገቡ።"}
                </p>

                {/* Offer details banner */}
                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg flex items-center gap-3">
                  <div className="bg-amber-600 text-stone-950 p-1.5 rounded font-mono font-bold text-xs">
                    15% OFF
                  </div>
                  <div className="text-[11px] text-amber-400/90 leading-tight">
                    {lang === 'en' 
                      ? 'Subscribe today to claim 15% discount on your entire order.'
                      : 'በሙሉ ትዕዛዝዎ ላይ የ15% ቅናሽ ለማግኘት ዛሬውኑ ይመዝገቡ።'}
                  </div>
                </div>

                {newsletterError && (
                  <p className="bg-red-950/40 border border-red-900/30 text-red-400 text-[11px] p-2.5 rounded mt-4 font-mono">
                    {newsletterError}
                  </p>
                )}

                {/* Email Form */}
                <form onSubmit={handleNewsletterSubmit} className="mt-5 space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={lang === 'en' ? 'Enter email for exclusive code' : 'ኢሜልዎን እዚህ ያስገቡ'}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-500">
                      @
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={newsletterStatus === 'submitting'}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-2.5 rounded-lg font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                  >
                    {newsletterStatus === 'submitting' ? (
                      <span className="inline-block w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'Reveal Promo Code' : 'የቅናሽ ኮዱን አሳይ'}
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[9px] text-stone-600 font-mono text-center mt-3">
                  {lang === 'en' ? 'No spam. Unsubscribe at any time.' : 'ያለአግባብ መልዕክት አንልክም። በማንኛውም ጊዜ መሰረዝ ይችላሉ።'}
                </p>
              </div>
            ) : (
              <div className="text-center py-2">
                {/* Success Stamp */}
                <div className="w-16 h-16 rounded-full bg-emerald-600/10 border-2 border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>

                <h3 className="text-xl font-sans font-bold text-stone-100 tracking-tight">
                  {lang === 'en' ? 'Discount Code Unlocked!' : 'የቅናሽ ኮድዎ ተከፍቷል!'}
                </h3>
                <p className="text-xs text-stone-400 mt-2 font-sans leading-relaxed">
                  {lang === 'en'
                    ? "Welcome to the Inner Circle. We've instantly applied your 15% discount to your cart!"
                    : "ለኢሜይል ደብዳቤአችን ስላረጋገጡ እናመሰግናለን። የ15% ቅናሹን በጋሪዎ ላይ በራስ-ሰር ተግባራዊ አድርገናል።"}
                </p>

                {/* Unlocked Code Display Box */}
                <div className="mt-6 p-4 bg-stone-950 border border-emerald-500/20 rounded-xl relative group">
                  <span className="block text-[10px] text-stone-500 uppercase tracking-widest font-mono mb-1">
                    {lang === 'en' ? 'Copy Promo Code' : 'የቅናሽ ኮዱን ይቅዱ'}
                  </span>
                  
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="font-mono text-lg font-extrabold text-amber-500 tracking-widest pl-2">
                      {promoCodeUnlocked}
                    </span>
                    
                    <button
                      onClick={() => {
                        if (promoCodeUnlocked) {
                          navigator.clipboard.writeText(promoCodeUnlocked);
                          setNewsletterCopied(true);
                          setTimeout(() => setNewsletterCopied(false), 2000);
                        }
                      }}
                      className="bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-500 p-2 rounded-lg border border-stone-850 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      {newsletterCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-mono">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDismissNewsletter}
                  className="mt-6 w-full bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700 py-2.5 rounded-lg font-sans font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {lang === 'en' ? 'Continue Shopping' : 'ግዢውን ቀጥል'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating WhatsApp Support actions (includes Chat button and Show QR code option) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-5 duration-300">
        {/* Floating QR Code trigger */}
        <button
          onClick={() => setShowWhatsAppQR(true)}
          className="flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-stone-950 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
          title={lang === 'en' ? 'Show WhatsApp QR Code' : 'የዋትስአፕ QR ኮድ አሳይ'}
        >
          <span className="absolute right-full mr-3 bg-stone-900 text-stone-200 border border-stone-800 text-[11px] font-mono py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
            {lang === 'en' ? 'Show Support QR' : 'የድጋፍ QR ኮድ'}
          </span>
          <QrCode className="w-5 h-5 text-stone-950" />
        </button>

        {/* Floating WhatsApp Support Button */}
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-stone-950 p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          id="whatsapp-chat-support"
        >
          <span className="absolute right-full mr-3 bg-stone-900 text-stone-200 border border-stone-800 text-[11px] font-mono py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
            {lang === 'en' ? 'Chat with Support (WhatsApp)' : 'ከእኛ ጋር ያውሩ (WhatsApp)'}
          </span>
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.023 14.058.993 11.437.993c-5.438 0-9.863 4.372-9.867 9.802-.001 1.73.457 3.419 1.323 4.905L1.875 22.03l6.516-1.706c1.55.932 3.16 1.4 4.808 1.4a9.78 9.78 0 0 0 4.808-1.4a9.78 9.78 0 0 0-4.808-1.4zm11.378-5.342c-.27-.135-1.595-.788-1.843-.878-.247-.09-.427-.135-.607.135-.18.27-.697.878-.854 1.057-.158.18-.315.202-.585.067-.27-.135-1.14-.42-2.172-1.34-1.031-.92-1.727-2.057-1.93-2.327-.202-.27-.022-.416.113-.551.12-.122.27-.315.405-.473.135-.157.18-.27.27-.45.09-.18.045-.337-.022-.472-.067-.135-.607-1.463-.832-2.003-.22-.528-.46-.456-.63-.464-.162-.008-.348-.01-.535-.01-.188 0-.495.07-.754.36-.26.29-1.036 1.013-1.036 2.47 0 1.457 1.06 2.864 1.21 3.067.15.203 2.083 3.181 5.048 4.464.705.305 1.255.487 1.684.624.708.226 1.353.194 1.863.118.57-.085 1.595-.652 1.82-1.282.225-.63.225-1.17.157-1.282-.067-.113-.247-.203-.517-.338z" />
          </svg>
        </a>
      </div>

      {/* WhatsApp QR Modal */}
      {showWhatsAppQR && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm" onClick={() => setShowWhatsAppQR(false)}></div>
          
          <div className="relative bg-stone-900 border border-stone-800 rounded-lg max-w-sm w-full p-6 shadow-2xl z-10 text-stone-200 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button onClick={() => setShowWhatsAppQR(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-base font-sans font-bold text-stone-100 uppercase tracking-wider mb-2">
              {lang === 'en' ? 'WhatsApp Support QR' : 'የዋትስአፕ እገዛ QR'}
            </h3>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed font-sans">
              {lang === 'en' 
                ? 'Scan this QR code with your phone camera or WhatsApp to start a direct secure chat with our expert leather artisan team.'
                : 'የእኛን የቆዳ ባለሙያ ቡድን ለማነጋገር ይህንን የQR ኮድ በስልክዎ ካሜራ ወይም ዋትስአፕ ይቃኙት።'}
            </p>

            {/* Generated QR Code Image */}
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-6 border-4 border-emerald-500/20">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getWhatsAppUrl())}`}
                alt="WhatsApp Support QR Code"
                className="w-48 h-48 mx-auto block"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Info and direct link option */}
            <div className="space-y-3">
              <a 
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-stone-950 py-2.5 rounded font-sans font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                {lang === 'en' ? 'Open Direct Chat' : 'ቀጥታ ውይይት ጀምር'}
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getWhatsAppUrl());
                  setQrCopied(true);
                  setTimeout(() => setQrCopied(false), 2000);
                }}
                className="w-full bg-stone-850 hover:bg-stone-800 text-stone-300 py-2 rounded text-xs font-mono border border-stone-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {qrCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-mono">{lang === 'en' ? 'Link Copied!' : 'ሊንኩ ተገልብጧል!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Copy Chat Link' : 'የውይይት ሊንክ ቅዳ'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Bar */}
      {comparedProductIds.length > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-stone-900/95 backdrop-blur-md border border-amber-500/30 p-4 rounded-xl shadow-2xl shadow-stone-950/80 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-500 animate-pulse" />
              <h4 className="text-xs font-sans font-bold text-stone-100 uppercase tracking-wider">
                {lang === 'en' ? 'Product Comparison' : 'ምርቶችን ማወዳደሪያ'}
              </h4>
              <span className="text-[10px] bg-stone-800 text-stone-300 font-mono px-1.5 py-0.5 rounded-full">
                {comparedProductIds.length}/4
              </span>
            </div>
            <button
              onClick={() => setComparedProductIds([])}
              className="text-[10px] text-stone-400 hover:text-red-400 transition-colors cursor-pointer uppercase tracking-wider font-mono"
            >
              {lang === 'en' ? 'Clear' : 'አጥፋ'}
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            {/* Thumbnails of compared products */}
            <div className="flex -space-x-2 overflow-hidden py-1">
              {comparedProductIds.map(id => {
                const p = products.find(prod => prod.id === id);
                if (!p) return null;
                return (
                  <div key={`thumb-${id}`} className="relative group/thumb">
                    <img
                      src={p.images[0]}
                      alt={lang === 'en' ? p.nameEn : p.nameAm}
                      className="w-10 h-10 object-cover rounded-full border-2 border-stone-900 shadow-md group-hover/thumb:border-amber-500 transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setComparedProductIds(prev => prev.filter(item => item !== id))}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] border border-stone-950 hover:bg-red-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => setCompareModalOpen(true)}
              disabled={comparedProductIds.length < 1}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                comparedProductIds.length < 2
                  ? 'bg-stone-850 text-stone-600 border-stone-800 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md shadow-amber-900/15'
              }`}
            >
              <span>{lang === 'en' ? 'Compare' : 'አወዳድር'}</span>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-700/30 text-stone-950">
                {comparedProductIds.length}
              </span>
            </button>
          </div>
          {comparedProductIds.length < 2 && (
            <p className="text-[10px] text-amber-500/70 mt-2 font-mono">
              {lang === 'en' ? 'Select at least 2 products to compare.' : 'ለማወዳደር ቢያንስ 2 ምርቶችን ይምረጡ።'}
            </p>
          )}
        </div>
      )}

      {/* Compare Products Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-sans font-bold text-stone-100 uppercase tracking-widest">
                  {lang === 'en' ? 'Product Comparison' : 'የምርቶች ማወዳደሪያ'}
                </h3>
                <span className="text-xs bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full">
                  {comparedProductIds.length} {lang === 'en' ? 'Items' : 'ምርቶች'}
                </span>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-950 hover:bg-stone-850 border border-stone-850 hover:border-stone-800 text-stone-400 hover:text-stone-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px] divide-y divide-stone-800/80">
                  
                  {/* Header row: Images & Names & Quick removal */}
                  <div className="grid grid-cols-5 gap-4 pb-6 items-start">
                    <div className="col-span-1 pt-4">
                      <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                        {lang === 'en' ? 'Product Info' : 'የምርት መረጃ'}
                      </span>
                      <button
                        onClick={() => { setComparedProductIds([]); setCompareModalOpen(false); }}
                        className="mt-2 text-[10px] text-red-400 hover:text-red-300 underline font-mono tracking-wider block uppercase cursor-pointer"
                      >
                        {lang === 'en' ? 'Clear All' : 'ሁሉንም አጥፋ'}
                      </button>
                    </div>
                    
                    {/* Product columns */}
                    {comparedProducts.map((p) => (
                      <div key={`col-head-${p.id}`} className="col-span-1 relative flex flex-col items-center text-center bg-stone-950/40 p-4 rounded-lg border border-stone-800">
                        <button
                          onClick={() => setComparedProductIds(prev => prev.filter(id => id !== p.id))}
                          className="absolute top-2 right-2 p-1 rounded-full bg-stone-900/80 hover:bg-red-950/50 border border-stone-800 hover:border-red-900/50 text-stone-400 hover:text-red-400 transition-all cursor-pointer"
                          title={lang === 'en' ? 'Remove' : 'አስወግድ'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <img
                          src={p.images[0]}
                          alt={lang === 'en' ? p.nameEn : p.nameAm}
                          className="w-24 h-24 object-cover rounded-md border border-stone-800 shadow-md mb-3"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mb-1">
                          {p.category}
                        </span>
                        <h4 className="font-sans text-xs font-semibold text-stone-100 hover:text-amber-500 transition-colors line-clamp-2 min-h-[2rem]">
                          {lang === 'en' ? p.nameEn : p.nameAm}
                        </h4>
                      </div>
                    ))}
                    
                    {/* Fill remaining empty comparison slots up to 4 */}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-col-${idx}`} className="col-span-1 border border-dashed border-stone-800/60 rounded-lg flex flex-col items-center justify-center p-6 text-stone-600 min-h-[160px]">
                        <ArrowLeftRight className="w-6 h-6 mb-2 text-stone-700/60" />
                        <p className="text-[10px] font-mono tracking-wider uppercase text-stone-600">
                          {lang === 'en' ? 'Empty Slot' : 'ባዶ ቦታ'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Price row */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Price' : 'ዋጋ'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => (
                      <div key={`price-${p.id}`} className="col-span-1">
                        <span className="font-mono text-sm font-bold text-amber-500">
                          {p.priceETB.toLocaleString()} ETB
                        </span>
                        <span className="block text-[10px] text-stone-500 font-mono">
                          ~${(p.priceETB / 120).toFixed(0)} USD
                        </span>
                      </div>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-price-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Rating row */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Rating' : 'ደረጃ'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => (
                      <div key={`rating-${p.id}`} className="col-span-1 flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="font-mono text-xs font-semibold text-stone-200">
                          {p.rating}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          ({p.reviewsCount})
                        </span>
                      </div>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-rating-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Sizes row */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Available Sizes' : 'ያሉ መጠኖች'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => (
                      <div key={`sizes-${p.id}`} className="col-span-1 flex flex-wrap gap-1">
                        {p.sizes && p.sizes.length > 0 ? (
                          p.sizes.map((sz) => (
                            <span key={sz} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
                              {sz}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-stone-500 font-mono">
                            {lang === 'en' ? 'One Size' : 'አንድ መጠን'}
                          </span>
                        )}
                      </div>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-sizes-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Colors row */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Colors' : 'ቀለሞች'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => {
                      const colors = lang === 'en' ? p.colorsEn : p.colorsAm;
                      return (
                        <div key={`colors-${p.id}`} className="col-span-1 flex flex-wrap gap-1">
                          {colors && colors.length > 0 ? (
                            colors.map((c) => (
                              <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-300 font-mono">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-500 font-mono">-</span>
                          )}
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-colors-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Inventory / Stock status */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Availability' : 'ክምችት'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => {
                      const isOutOfStock = p.inventory === 0;
                      const isLowStock = p.inventory > 0 && p.inventory < 5;
                      return (
                        <div key={`stock-${p.id}`} className="col-span-1">
                          {isOutOfStock ? (
                            <span className="text-[10px] bg-stone-950 border border-stone-800 px-2 py-0.5 rounded text-stone-500 font-mono uppercase font-semibold">
                              {lang === 'en' ? 'Sold Out' : 'ያለቀ'}
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded text-red-400 font-mono uppercase font-semibold animate-pulse">
                              {lang === 'en' ? `Limited Stock (${p.inventory})` : `የተወሰነ ክምችት (${p.inventory})`}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded text-emerald-400 font-mono uppercase font-semibold">
                              {lang === 'en' ? 'In Stock' : 'አለ'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-stock-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Seller row */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Seller' : 'ሻጭ'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => (
                      <div key={`seller-${p.id}`} className="col-span-1 text-xs text-stone-300 font-mono">
                        {p.sellerName || (lang === 'en' ? 'Shopify Ethiopia' : 'ሾፒፋይ ኢትዮጵያ')}
                      </div>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-seller-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Features list */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-start">
                    <div className="col-span-1 pt-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Highlights' : 'ዋና ዋና ጥቅሞች'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => {
                      const features = lang === 'en' ? p.featuresEn : p.featuresAm;
                      return (
                        <div key={`features-${p.id}`} className="col-span-1 text-xs text-stone-300 space-y-1">
                          {features && features.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {features.map((f, i) => (
                                <li key={i} className="text-[11px] leading-relaxed text-stone-400">
                                  {f}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-[11px] text-stone-500 italic">-</span>
                          )}
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-features-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Description row */}
                  <div className="grid grid-cols-5 gap-4 py-4 items-start">
                    <div className="col-span-1 pt-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                        {lang === 'en' ? 'Description' : 'መግለጫ'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => {
                      const desc = lang === 'en' ? p.descriptionEn : p.descriptionAm;
                      return (
                        <div key={`desc-${p.id}`} className="col-span-1 text-[11px] leading-relaxed text-stone-400 line-clamp-4">
                          {desc}
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-desc-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                  {/* Action Buttons row */}
                  <div className="grid grid-cols-5 gap-4 py-6 items-center">
                    <div className="col-span-1">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-500">
                        {lang === 'en' ? 'Actions' : 'ድርጊቶች'}
                      </span>
                    </div>
                    {comparedProducts.map((p) => {
                      const isOutOfStock = p.inventory === 0;
                      return (
                        <div key={`action-${p.id}`} className="col-span-1 space-y-2">
                          <button
                            onClick={() => {
                              if (!isOutOfStock) {
                                handleAddToCart(p, 1);
                                setCompareModalOpen(false);
                              }
                            }}
                            disabled={isOutOfStock}
                            className={`w-full py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isOutOfStock
                                ? 'bg-stone-850 text-stone-600 cursor-not-allowed border border-transparent'
                                : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md shadow-amber-900/15'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {lang === 'en' ? 'Add to Cart' : 'ጨምር'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setCompareModalOpen(false);
                            }}
                            className="w-full py-1.5 rounded text-xs font-semibold text-stone-300 hover:text-amber-500 border border-stone-800 hover:border-amber-500/40 bg-stone-950/20 transition-all cursor-pointer"
                          >
                            {lang === 'en' ? 'View Details' : 'ሙሉ መግለጫ'}
                          </button>
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <div key={`empty-action-${idx}`} className="col-span-1 text-stone-800 font-mono text-xs">-</div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Real-time Toast Notification Alert */}
      {realtimeNotification && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-stone-950 border border-amber-500/30 rounded p-4 shadow-2xl shadow-amber-500/5 backdrop-blur-md animate-[bounce_1s_ease-in-out_1]">
          <div className="flex items-start space-x-3">
            <div className="bg-amber-600/10 p-2 rounded border border-amber-500/20 text-amber-500 shrink-0">
              <Bell className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  {lang === 'en' ? realtimeNotification.titleEn : realtimeNotification.titleAm}
                </h4>
                <button
                  onClick={() => setRealtimeNotification(null)}
                  className="text-stone-500 hover:text-stone-300 p-0.5 ml-2 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-stone-200 mt-1 leading-relaxed font-sans">
                {lang === 'en' ? realtimeNotification.messageEn : realtimeNotification.messageAm}
              </p>
              <div className="mt-3 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setRealtimeNotification(null);
                    setIsDashboardOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded cursor-pointer transition-colors"
                >
                  {lang === 'en' ? 'Open Dashboard' : 'ዳሽቦርድ ክፈት'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom User-friendly Toast Notifications */}
      <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {customToasts.map(toast => {
            const typeColors = {
              success: 'bg-emerald-950/95 border-emerald-500/30 text-emerald-400 shadow-emerald-950/10',
              error: 'bg-rose-950/95 border-rose-500/30 text-rose-400 shadow-rose-950/10',
              warning: 'bg-amber-950/95 border-amber-500/30 text-amber-400 shadow-amber-950/10',
              info: 'bg-stone-900/95 border-stone-750 text-stone-200 shadow-stone-950/10'
            };
            
            const Icon = toast.type === 'success' ? CheckCircle : 
                         toast.type === 'error' ? X : 
                         toast.type === 'warning' ? AlertTriangle : 
                         Bell;
                         
            return (
              <motion.div 
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-xl backdrop-blur-md ${typeColors[toast.type]}`}
              >
                <div className="shrink-0 p-1 rounded bg-stone-950/40">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  {toast.title && <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider mb-1 text-stone-100">{toast.title}</h5>}
                  <p className="text-xs font-sans leading-relaxed">{toast.message}</p>
                </div>
                <button 
                  onClick={() => setCustomToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="shrink-0 text-stone-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Custom User-friendly Confirmation Dialog Modal */}
      <AnimatePresence>
        {customConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-stone-900 border border-stone-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative text-stone-200 overflow-hidden"
            >
              {/* Top Warning Stripe */}
              <div className={`absolute top-0 inset-x-0 h-1 ${
                customConfirm.type === 'danger' ? 'bg-red-500' :
                customConfirm.type === 'warning' ? 'bg-amber-500' : 'bg-amber-500'
              }`} />

              <div className="flex gap-4 items-start">
                <div className={`p-2 rounded-lg shrink-0 border ${
                  customConfirm.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                  customConfirm.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-stone-800 border-stone-700 text-amber-500'
                }`}>
                  {customConfirm.type === 'danger' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> :
                   customConfirm.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                   <Sparkles className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-sm font-bold text-stone-100 font-mono tracking-wide uppercase">
                    {customConfirm.title || (lang === 'en' ? 'Confirmation Required' : 'ማረጋገጫ ያስፈልጋል')}
                  </h4>
                  <p className="text-xs text-stone-300 font-sans leading-relaxed">
                    {customConfirm.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={customConfirm.onCancel}
                  className="px-4 py-2 bg-stone-950 border border-stone-800 hover:border-stone-750 text-stone-400 hover:text-stone-200 rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  {customConfirm.cancelText || (lang === 'en' ? 'Cancel' : 'ሰርዝ')}
                </button>
                <button
                  onClick={customConfirm.onConfirm}
                  className={`px-5 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    customConfirm.type === 'danger' ? 'bg-red-600 hover:bg-red-500 text-stone-100' :
                    customConfirm.type === 'warning' ? 'bg-amber-600 hover:bg-amber-500 text-stone-950' :
                    'bg-amber-600 hover:bg-amber-500 text-stone-950'
                  }`}
                >
                  {customConfirm.confirmText || (lang === 'en' ? 'Confirm' : 'አረጋግጥ')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
