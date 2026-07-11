/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Product, Order } from '../types';
import { alertSystem } from '../lib/alerts';
import {
  DollarSign, Package, ShoppingBag, TrendingUp, Plus, Edit, Trash2, Check, Truck,
  Settings, Star, X, ChevronRight, Search, Activity, FileText, Upload, Clock, ShieldCheck, HelpCircle,
  BarChart2, RefreshCw, AlertTriangle, MapPin
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

interface SellerDashboardProps {
  user: User;
  currentLang: 'en' | 'am';
  onClose: () => void;
  onRefreshProducts: () => void;
  allProducts: Product[];
}

export default function SellerDashboard({
  user,
  currentLang,
  onClose,
  onRefreshProducts,
  allProducts
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'insights'>('stats');
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Product Form modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [nameEn, setNameEn] = useState('');
  const [nameAm, setNameAm] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAm, setDescAm] = useState('');
  const [priceETB, setPriceETB] = useState<number>(0);
  const [category, setCategory] = useState('Leather Bags');
  const [inventory, setInventory] = useState<number>(10);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInventory, setSizeInventory] = useState<{ [size: string]: number }>({});
  const [colorsEn, setColorsEn] = useState<string[]>([]);
  const [colorsAm, setColorsAm] = useState<string[]>([]);
  const [featuresEn, setFeaturesEn] = useState<string[]>([]);
  const [featuresAm, setFeaturesAm] = useState<string[]>([]);

  // Individual additions for array-type fields
  const [newSize, setNewSize] = useState('');
  const [newColorEn, setNewColorEn] = useState('');
  const [newColorAm, setNewColorAm] = useState('');
  const [newFeatureEn, setNewFeatureEn] = useState('');
  const [newFeatureAm, setNewFeatureAm] = useState('');

  const [savingProduct, setSavingProduct] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Store name parsed from user
  const storeName = (user as any).storeName || `${user.name}'s Tannery`;

  // Filter products for this seller
  useEffect(() => {
    const filtered = allProducts.filter(p => p.sellerId === user.id);
    setSellerProducts(filtered);
  }, [allProducts, user.id]);

  // Load all orders containing products belonging to this seller
  const loadSellerOrders = () => {
    setLoadingOrders(true);
    fetch('/api/orders')
      .then(res => res.json())
      .then((data: Order[]) => {
        // Filter orders that have at least one item of this seller
        const filtered = data.filter(order =>
          order.items.some(item => item.product.sellerId === user.id)
        );
        const uniqueOrders = Array.isArray(filtered) ? Array.from(new Map(filtered.map((o: any) => [o.id, o])).values()) : [];
        setSellerOrders(uniqueOrders);
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingOrders(false);
      });
  };

  useEffect(() => {
    loadSellerOrders();
  }, [user.id]);

  // Open modal for a new product listing
  const handleNewProduct = () => {
    setEditingProduct(null);
    setNameEn('');
    setNameAm('');
    setDescEn('');
    setDescAm('');
    setPriceETB(1500);
    setCategory('Leather Bags');
    setInventory(5);
    setImages(['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800']);
    setSizes([]);
    setSizeInventory({});
    setColorsEn([]);
    setColorsAm([]);
    setFeaturesEn([]);
    setFeaturesAm([]);
    setErrorMsg('');
    setShowProductModal(true);
  };

  // Open modal for editing a product
  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setNameEn(prod.nameEn);
    setNameAm(prod.nameAm);
    setDescEn(prod.descriptionEn);
    setDescAm(prod.descriptionAm);
    setPriceETB(prod.priceETB);
    setCategory(prod.category);
    setInventory(prod.inventory);
    setImages(prod.images || []);
    setSizes(prod.sizes || []);
    setSizeInventory(prod.sizeInventory || {});
    setColorsEn(prod.colorsEn || []);
    setColorsAm(prod.colorsAm || []);
    setFeaturesEn(prod.featuresEn || []);
    setFeaturesAm(prod.featuresAm || []);
    setErrorMsg('');
    setShowProductModal(true);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameAm || !descEn || !descAm || priceETB <= 0) {
      setErrorMsg(currentLang === 'en' ? 'Please fill in all localized names and descriptions.' : 'እባክዎ ሁሉንም አስፈላጊ መረጃዎች በትክክል ይሙሉ::');
      return;
    }

    setSavingProduct(true);
    setErrorMsg('');

    const productPayload = {
      nameEn,
      nameAm,
      descriptionEn: descEn,
      descriptionAm: descAm,
      priceETB: Number(priceETB),
      category,
      inventory: Number(inventory),
      sizeInventory,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
      sizes,
      colorsEn,
      colorsAm,
      featuresEn,
      featuresAm,
      sellerId: user.id,
      sellerName: storeName
    };

    try {
      const url = editingProduct 
        ? `/api/seller/products/${editingProduct.id}` 
        : `/api/seller/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      if (res.ok) {
        setShowProductModal(false);
        onRefreshProducts(); // Trigger core products load
        // Re-fetch locally
        setTimeout(() => {
          onRefreshProducts();
        }, 500);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to save product');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = (pId: string) => {
    alertSystem.showConfirm(
      currentLang === 'en' ? 'Are you sure you want to delete this listing?' : 'ይህን ምርት ከሽያጭ ዝርዝር ውስጥ መሰረዝ መፈለግዎን ያረጋግጣሉ?',
      async () => {
        try {
          const res = await fetch(`/api/seller/products/${pId}?sellerId=${user.id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            onRefreshProducts();
            alertSystem.showAlert(
              currentLang === 'en' ? 'Listing deleted successfully.' : 'ምርቱ ከሽያጭ ዝርዝር ውስጥ በተሳካ ሁኔታ ተሰርዟል።',
              { type: 'success' }
            );
          }
        } catch (err) {
          console.error(err);
        }
      },
      undefined,
      { type: 'danger' }
    );
  };

  // Update specific item fulfillment inside a customer order
  const handleUpdateFulfillment = async (orderId: string, productId: string, nextStatus: 'shipped' | 'delivered') => {
    try {
      const res = await fetch('/api/seller/orders/update-item-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId,
          sellerId: user.id,
          itemStatus: nextStatus
        })
      });
      if (res.ok) {
        loadSellerOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate metrics
  const totalSalesFromSellerItems = sellerOrders.reduce((sum, ord) => {
    if (ord.paymentStatus !== 'completed') return sum;
    const sellerItemsTotal = ord.items
      .filter(item => item.product.sellerId === user.id)
      .reduce((itemSum, item) => itemSum + (item.product.priceETB * item.quantity), 0);
    return sum + sellerItemsTotal;
  }, 0);

  const totalItemsSold = sellerOrders.reduce((sum, ord) => {
    if (ord.paymentStatus !== 'completed') return sum;
    const sellerItemsQty = ord.items
      .filter(item => item.product.sellerId === user.id)
      .reduce((itemSum, item) => itemSum + item.quantity, 0);
    return sum + sellerItemsQty;
  }, 0);

  const pendingFulfillments = sellerOrders.filter(ord => 
    ord.orderStatus !== 'delivered' && ord.orderStatus !== 'cancelled' &&
    ord.items.some(item => item.product.sellerId === user.id && (item as any).fulfillmentStatus !== 'shipped' && (item as any).fulfillmentStatus !== 'delivered')
  ).length;

  const lowStockAlerts = sellerProducts.filter(p => p.inventory <= 2).length;

  // Filtered lists
  const filteredProducts = sellerProducts.filter(p => 
    p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nameAm.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate simple insights chart data
  const categorySalesMap: { [cat: string]: number } = {};
  sellerOrders.forEach(ord => {
    if (ord.paymentStatus !== 'completed') return;
    ord.items.forEach(item => {
      if (item.product.sellerId === user.id) {
        const cat = item.product.category;
        categorySalesMap[cat] = (categorySalesMap[cat] || 0) + (item.product.priceETB * item.quantity);
      }
    });
  });

  const insightsData = Object.keys(categorySalesMap).map(key => ({
    name: key,
    sales: categorySalesMap[key]
  }));

  // Localized texts
  const langText = {
    title: currentLang === 'en' ? 'Seller Management Portal' : 'የሻጭ አስተዳደር ፖርታል',
    subtitle: currentLang === 'en' ? `Store: ${storeName} • Managed by ${user.name}` : `የንግድ ስም: ${storeName} • አስተዳዳሪ: ${user.name}`,
    backBtn: currentLang === 'en' ? '← Back to Store' : '← ወደ ዋናው ገጽ',
    tabStats: currentLang === 'en' ? 'Store Dashboard' : 'የሽያጭ ማጠቃለያ',
    tabProducts: currentLang === 'en' ? 'My Listings' : 'የእኔ ምርቶች',
    tabOrders: currentLang === 'en' ? 'Fulfillment Queue' : 'የትዕዛዝ ማድረሻዎች',
    tabInsights: currentLang === 'en' ? 'Sales Insights' : 'የሽያጭ ትንተና',
    revenue: currentLang === 'en' ? 'Total Store Revenue' : 'ጠቅላላ የሽያጭ ገቢ',
    unitsSold: currentLang === 'en' ? 'Total Leather Goods Sold' : 'ጠቅላላ የተሸጡ እቃዎች',
    pendingOrders: currentLang === 'en' ? 'Pending Fulfillment' : 'በዝግጅት ላይ ያሉ ትዕዛዞች',
    activeProducts: currentLang === 'en' ? 'Active Catalog Listings' : 'ገቢር የሽያጭ እቃዎች',
    lowStock: currentLang === 'en' ? 'Items with Low Stock' : 'ክምችት ያለቀባቸው እቃዎች',
    addProductBtn: currentLang === 'en' ? 'Create Product Listing' : 'አዲስ ምርት መዝግብ',
    productTableHeadName: currentLang === 'en' ? 'Product Detail' : 'የምርት ዝርዝር',
    productTableHeadPrice: currentLang === 'en' ? 'Price' : 'ዋጋ',
    productTableHeadStock: currentLang === 'en' ? 'In Stock' : 'ክምችት',
    productTableHeadActions: currentLang === 'en' ? 'Actions' : 'ድርጊቶች',
    edit: currentLang === 'en' ? 'Edit' : 'አስተካክል',
    delete: currentLang === 'en' ? 'Delete' : 'ሰርዝ',
    ordersTableHeadBuyer: currentLang === 'en' ? 'Buyer / Shipping' : 'ገዢ / አድራሻ',
    ordersTableHeadItems: currentLang === 'en' ? 'Ordered Items' : 'የታዘዙ እቃዎች',
    ordersTableHeadTotal: currentLang === 'en' ? 'My Revenue' : 'የእኔ ድርሻ ገቢ',
    ordersTableHeadStatus: currentLang === 'en' ? 'Fulfillment Status' : 'የማድረሻ ደረጃ',
    shipItemBtn: currentLang === 'en' ? 'Mark as Shipped' : 'ተልኳል በል',
    deliverItemBtn: currentLang === 'en' ? 'Mark as Delivered' : 'ደረሰ በል',
    fulfilledText: currentLang === 'en' ? 'Fulfillment Completed' : 'ማድረስ ተጠናቋል',
    noOrdersText: currentLang === 'en' ? 'No orders containing your items have been placed yet.' : 'የእርስዎን ምርቶች የያዘ ትዕዛዝ እስካሁን አልተቀመጠም።',
    noProductsText: currentLang === 'en' ? 'You have not added any product listings to your shop yet.' : 'እስካሁን ምንም የሽያጭ ምርት አላከሉም።',
  };

  return (
    <div id="seller-dashboard-portal" className="bg-stone-950 text-stone-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header Panel */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-850 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-600/10 text-purple-400 border border-purple-500/25 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Seller Store
            </span>
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-stone-100 mt-2">
            {langText.title}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {langText.subtitle}
          </p>
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center space-x-2 bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-stone-100 border border-stone-800 px-4 py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer self-start md:self-auto"
        >
          <span>{langText.backBtn}</span>
        </button>
      </div>

      {/* Tabs list */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-stone-850">
        <div className="flex space-x-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase border-b-2 tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'stats' 
                ? 'border-purple-500 text-purple-400 bg-purple-950/10' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {langText.tabStats}
          </button>
          
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase border-b-2 tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'products' 
                ? 'border-purple-500 text-purple-400 bg-purple-950/10' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {langText.tabProducts} ({sellerProducts.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase border-b-2 tracking-wider transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'orders' 
                ? 'border-purple-500 text-purple-400 bg-purple-950/10' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {langText.tabOrders}
            {pendingFulfillments > 0 && (
              <span className="ml-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingFulfillments}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase border-b-2 tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'insights' 
                ? 'border-purple-500 text-purple-400 bg-purple-950/10' 
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {langText.tabInsights}
          </button>
        </div>
      </div>

      {/* Primary Dashboard Grid */}
      <div className="max-w-7xl mx-auto">
        
        {/* TAB: STORE OVERVIEW STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Quick alert bar for low stocks */}
            {lowStockAlerts > 0 && (
              <div className="p-4 bg-amber-600/10 border border-amber-500/20 rounded-md text-amber-500 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  <span>
                    {currentLang === 'en' 
                      ? `Alert: You have ${lowStockAlerts} items running low on inventory (2 units or fewer). Please restock them.` 
                      : `ማስጠንቀቂያ፡ ${lowStockAlerts} እቃዎች ክምችታቸው ሊያልቅ ነው (2 ወይም ከዚያ በታች)። እባክዎ ክምችት ይጨምሩ።`}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveTab('products')} 
                  className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-stone-950 text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                >
                  {currentLang === 'en' ? 'Manage Inventory' : 'ክምችት አስተዳድር'}
                </button>
              </div>
            )}

            {/* Metric widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute right-4 top-4 bg-purple-600/10 p-2.5 rounded text-purple-400 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{langText.revenue}</div>
                <div className="text-3xl font-serif font-black text-stone-100 tracking-tight mt-2">
                  {totalSalesFromSellerItems.toLocaleString()} <span className="text-sm font-sans font-medium text-stone-400">ETB</span>
                </div>
                <div className="text-[9px] text-emerald-500 font-mono mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active & Verified Storefront</span>
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute right-4 top-4 bg-purple-600/10 p-2.5 rounded text-purple-400 group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{langText.unitsSold}</div>
                <div className="text-3xl font-serif font-black text-stone-100 tracking-tight mt-2">
                  {totalItemsSold} <span className="text-sm font-sans font-medium text-stone-400">pcs</span>
                </div>
                <div className="text-[9px] text-stone-500 font-mono mt-1">
                  Excludes cancelled/unpaid orders
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute right-4 top-4 bg-purple-600/10 p-2.5 rounded text-purple-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{langText.pendingOrders}</div>
                <div className="text-3xl font-serif font-black text-amber-500 tracking-tight mt-2">
                  {pendingFulfillments}
                </div>
                <div className="text-[9px] text-amber-500/80 font-mono mt-1">
                  Awaiting seller dispatch
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute right-4 top-4 bg-purple-600/10 p-2.5 rounded text-purple-400 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{langText.activeProducts}</div>
                <div className="text-3xl font-serif font-black text-stone-100 tracking-tight mt-2">
                  {sellerProducts.length}
                </div>
                <div className="text-[9px] text-stone-500 font-mono mt-1">
                  Active in Zema Leather catalog
                </div>
              </div>

            </div>

            {/* Quick Actions Card & Quick Insights Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-4 bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-stone-300 uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 flex items-center justify-between">
                    <span>Quick Store Actions</span>
                    <Settings className="w-4 h-4 text-stone-500" />
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed mb-6">
                    Manage your authentic Ethiopian tannery stock, fulfill pending orders, or create high-quality premium listings to attract buyers.
                  </p>
                </div>
                
                <div className="space-y-2.5">
                  <button
                    onClick={handleNewProduct}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/10 hover:shadow-purple-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{langText.addProductBtn}</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('products')}
                    className="w-full bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-850 py-3 px-4 rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>Manage My Listings</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-850 py-3 px-4 rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Delivery Queue</span>
                  </button>
                </div>
              </div>

              {/* Quick Products Glance */}
              <div className="lg:col-span-8 bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg">
                <h3 className="text-sm font-mono font-bold text-stone-300 uppercase tracking-wider mb-4 border-b border-stone-800 pb-2">
                  Store Performance & Standards
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-stone-950/60 p-4 border border-stone-850 rounded-md">
                    <h4 className="text-xs font-bold text-stone-200 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Authenticity Requirement
                    </h4>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Zema Leather enforces standard regulations for listings. Every listed product must consist of genuine, locally-processed Ethiopian sheep, goat, or bovine leather. Faux leather (PU, plastic-coated textiles) is strictly prohibited.
                    </p>
                  </div>

                  <div className="bg-stone-950/60 p-4 border border-stone-850 rounded-md">
                    <h4 className="text-xs font-bold text-stone-200 mb-1 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-purple-400" />
                      Fulfillment SLAs
                    </h4>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Sellers must package and mark orders as "Shipped" within 48 hours of order placement. Ensure physical delivery details match perfectly to prevent delivery friction in major hubs like Addis Ababa, Hawassa, and Adama.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: PRODUCT CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Catalog Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-900 border border-stone-850 p-4 rounded-md">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={currentLang === 'en' ? 'Search catalog listings...' : 'የሽያጭ ዝርዝር ውስጥ ይፈልጉ...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-10 py-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <button
                onClick={handleNewProduct}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/10 hover:shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{langText.addProductBtn}</span>
              </button>
            </div>

            {/* Catalog list */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-850 rounded-lg text-stone-500 font-mono text-xs">
                {langText.noProductsText}
              </div>
            ) : (
              <div className="bg-stone-900 border border-stone-850 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 bg-stone-950/40 text-stone-500 font-mono uppercase text-[10px]">
                        <th className="p-4">{langText.productTableHeadName}</th>
                        <th className="p-4">{currentLang === 'en' ? 'Category' : 'ምድብ'}</th>
                        <th className="p-4 text-right">{langText.productTableHeadPrice}</th>
                        <th className="p-4 text-center">{langText.productTableHeadStock}</th>
                        <th className="p-4 text-right">{langText.productTableHeadActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-950/20 transition-all">
                          <td className="p-4 flex items-center space-x-3">
                            <img 
                              src={p.images[0]} 
                              alt={p.nameEn} 
                              className="w-12 h-12 object-cover rounded bg-stone-950 border border-stone-800"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-stone-200">
                                {currentLang === 'en' ? p.nameEn : p.nameAm}
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                                ID: {p.id}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-stone-400">
                            {p.category}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-stone-200 text-sm">
                            {p.priceETB.toLocaleString()} ETB
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              p.inventory <= 2 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {p.inventory} units
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="bg-stone-950 hover:bg-stone-850 text-stone-300 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-mono font-bold transition-all inline-flex items-center gap-1 cursor-pointer border border-stone-850"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>{langText.edit}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-mono font-bold transition-all inline-flex items-center gap-1 cursor-pointer border border-red-900/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{langText.delete}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB: ORDER FULFILLMENT QUEUE */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {loadingOrders ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-850 rounded-lg text-stone-500 font-mono text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Fetching buyer orders...</span>
              </div>
            ) : sellerOrders.length === 0 ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-850 rounded-lg text-stone-500 font-mono text-xs">
                {langText.noOrdersText}
              </div>
            ) : (
              <div className="space-y-4">
                
                {sellerOrders.map((ord) => {
                  // Filter items that belong to this seller
                  const sellerItems = ord.items.filter(item => item.product.sellerId === user.id);
                  const sellerItemsRevenue = sellerItems.reduce((sum, item) => sum + (item.product.priceETB * item.quantity), 0);

                  return (
                    <div key={ord.id} className="bg-stone-900 border border-stone-850 rounded-lg p-6 shadow-md hover:border-stone-800 transition-all space-y-4">
                      
                      {/* Header line */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-850 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-purple-400">Order ID: {ord.id}</span>
                            <span className="bg-stone-950 border border-stone-800 text-[10px] px-2 py-0.5 rounded text-stone-400 font-mono">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`text-[10px] font-semibold font-mono uppercase px-2 py-0.5 rounded border ${
                              ord.paymentStatus === 'completed' 
                                ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-600/10 border-amber-500/20 text-amber-500'
                            }`}>
                              Payment: {ord.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 font-mono block">YOUR PENDING REVENUE:</span>
                          <span className="font-mono font-black text-stone-100 text-sm">{sellerItemsRevenue.toLocaleString()} ETB</span>
                        </div>
                      </div>

                      {/* Content block: 2 Columns */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Delivery address details */}
                        <div className="lg:col-span-5 bg-stone-950/60 p-4 border border-stone-850 rounded-md text-xs space-y-2">
                          <h4 className="font-mono font-bold text-[10px] text-stone-500 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            Shipping Details
                          </h4>
                          <div className="space-y-1 text-stone-300">
                            <div className="font-bold text-stone-100 text-xs">{ord.shippingAddress.fullName}</div>
                            <div>City: {ord.shippingAddress.city}, Subcity: {ord.shippingAddress.subCity || 'N/A'}</div>
                            {ord.shippingAddress.woreda && <div>Woreda: {ord.shippingAddress.woreda}</div>}
                            <div className="font-mono font-semibold text-stone-400 mt-2">Phone: {ord.shippingAddress.phone}</div>
                            <div className="text-[10px] text-stone-500 uppercase mt-2">METHOD: {ord.paymentMethod.replace('_', ' ')}</div>
                          </div>
                        </div>

                        {/* Items listed and actions */}
                        <div className="lg:col-span-7 space-y-3">
                          <h4 className="font-mono font-bold text-[10px] text-stone-500 uppercase tracking-wider flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            Your Products In This Order
                          </h4>
                          
                          <div className="space-y-2.5">
                            {sellerItems.map((item, idx) => {
                              const fulfillmentStatus = (item as any).fulfillmentStatus || 'pending';
                              
                              return (
                                <div key={idx} className="bg-stone-950/40 border border-stone-850 p-3 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="flex items-center space-x-3">
                                    <img 
                                      src={item.product.images[0]} 
                                      alt={item.product.nameEn} 
                                      className="w-10 h-10 object-cover rounded bg-stone-950 border border-stone-850"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div>
                                      <div className="font-bold text-stone-200 text-xs">
                                        {currentLang === 'en' ? item.product.nameEn : item.product.nameAm}
                                      </div>
                                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                                        Qty: {item.quantity} • {item.selectedSize ? `Size: ${item.selectedSize}` : ''} {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Controls for shipping */}
                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                                      fulfillmentStatus === 'delivered'
                                        ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400'
                                        : fulfillmentStatus === 'shipped'
                                          ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 animate-pulse'
                                          : 'bg-amber-600/10 border-amber-500/20 text-amber-500'
                                    }`}>
                                      {fulfillmentStatus === 'delivered' ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                      <span>{fulfillmentStatus.toUpperCase()}</span>
                                    </span>

                                    {fulfillmentStatus === 'pending' && (
                                      <button
                                        onClick={() => handleUpdateFulfillment(ord.id, item.product.id, 'shipped')}
                                        className="bg-purple-600 hover:bg-purple-500 text-stone-950 font-mono font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                                      >
                                        <Truck className="w-3.5 h-3.5" />
                                        <span>Ship Item</span>
                                      </button>
                                    )}

                                    {fulfillmentStatus === 'shipped' && (
                                      <button
                                        onClick={() => handleUpdateFulfillment(ord.id, item.product.id, 'delivered')}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Delivered</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>
        )}

        {/* TAB: SALES INSIGHTS & CHARTS */}
        {activeTab === 'insights' && (
          <div className="space-y-6 bg-stone-900 border border-stone-850 p-6 rounded-lg shadow-lg">
            <div>
              <h3 className="text-sm font-mono font-bold text-stone-300 uppercase tracking-wider mb-2 border-b border-stone-850 pb-2">
                Sales Revenue by Category
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Analyze your earnings breakdown across various leather accessory categories like Bags, Shoes, Jackets, and Wallets. Use this data to restock popular segments.
              </p>
            </div>

            {insightsData.length === 0 ? (
              <div className="p-12 text-center text-stone-500 font-mono text-xs">
                No verified sales data is available to generate insights charts yet. Keep selling!
              </div>
            ) : (
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insightsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis dataKey="name" stroke="#8c8a87" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#8c8a87" fontSize={11} fontFamily="monospace" unit=" ETB" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', color: '#f5f5f4', fontFamily: 'monospace', fontSize: '12px' }}
                      labelClassName="font-bold text-stone-300"
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="sales" name="Earnings (ETB)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-stone-950/60 p-4 border border-stone-850 rounded text-xs space-y-2">
              <h4 className="font-mono font-bold text-[10px] text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Tannery Verification Badging
              </h4>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Your store has completed the tier-1 sandbox check. High volume sellers receive the **"Zema Master Tanners Guild"** badge which increases user checkout conversion rates by up to 25%. Maintain high response rates and strict authentic leather criteria to maintain badging status.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* PRODUCT ADD/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-300 p-1.5 rounded bg-stone-950/40 border border-stone-850/50 hover:bg-stone-800 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="p-6 border-b border-stone-850">
              <h3 className="text-base font-serif font-black text-stone-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span>{editingProduct ? (currentLang === 'en' ? 'Modify Product Listing' : 'ምርት አሻሽል') : (currentLang === 'en' ? 'Create Product Listing' : 'አዲስ ምርት መዝግብ')}</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Enter precise description details and tags. Keep the specifications authentic to leather work.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              
              {errorMsg && (
                <div className="p-3.5 bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-mono rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Localized Names Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    Product Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Classic Cognac Leather Messenger Bag"
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-100 font-sans focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    የምርት ስም (አማርኛ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAm}
                    onChange={(e) => setNameAm(e.target.value)}
                    placeholder="ምሳሌ፡ ክላሲክ ኮኛክ የቆዳ መላእክተኛ ቦርሳ"
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-100 font-sans focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Localized Descriptions Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    Description (English) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Authentic vegetable-tanned bovine leather sourced from Addis Ababa tanneries..."
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-100 font-sans focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    መግለጫ (አማርኛ) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={descAm}
                    onChange={(e) => setDescAm(e.target.value)}
                    placeholder="ከአዲስ አበባ እቃዎች የሚገኝ ጥራት ያለው የከብት ቆዳ የተዘጋጀ..."
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-100 font-sans focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Pricing, category and stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    Price (ETB) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={priceETB}
                    onChange={(e) => setPriceETB(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-100 font-mono focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="Leather Bags">Leather Bags</option>
                    <option value="Leather Shoes">Leather Shoes</option>
                    <option value="Leather Jackets">Leather Jackets</option>
                    <option value="Belts & Accessories">Belts & Accessories</option>
                    <option value="Wallets">Wallets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    Inventory Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={inventory}
                    onChange={(e) => setInventory(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-100 font-mono focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Image Manager */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                  Product Image URLs
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste high-res image URL here..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-grow bg-stone-950 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-200 font-mono focus:outline-none focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrlInput) {
                        setImages([...images, imageUrlInput]);
                        setImageUrlInput('');
                      }
                    }}
                    className="bg-stone-950 hover:bg-stone-800 border border-stone-800 px-4 py-2 text-xs text-stone-300 font-bold rounded cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Add URL
                  </button>
                </div>

                {/* Pre-populated Image Chips */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {images.map((url, idx) => (
                      <div key={idx} className="bg-stone-950 border border-stone-850 pl-2 pr-1 py-1 rounded flex items-center space-x-1 text-[10px] text-stone-400">
                        <span className="truncate max-w-[150px] font-mono">{url}</span>
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-400 p-0.5 rounded cursor-pointer hover:bg-stone-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shoe Sizes & Color attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sizes chip creator */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                    Available Sizes (Optional)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. 41, M, Large"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="flex-grow bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-purple-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSize) {
                          setSizes([...sizes, newSize]);
                          setSizeInventory({ ...sizeInventory, [newSize]: 0 });
                          setNewSize('');
                        }
                      }}
                      className="bg-stone-950 border border-stone-800 hover:bg-stone-800 px-3 py-1.5 text-xs text-stone-300 rounded cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sizes.map((s, idx) => (
                        <span key={idx} className="bg-stone-950 border border-stone-850 px-2 py-0.5 rounded font-mono text-[10px] text-stone-300 flex items-center gap-1">
                          {s}
                          <button
                            type="button"
                            onClick={() => {
                              const szToRemove = s;
                              setSizes(sizes.filter((_, i) => i !== idx));
                              const updatedSizeInv = { ...sizeInventory };
                              delete updatedSizeInv[szToRemove];
                              setSizeInventory(updatedSizeInv);
                              const sum = Object.values(updatedSizeInv).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
                              setInventory(sum);
                            }}
                            className="text-red-500 text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {sizes.length > 0 && (
                    <div className="mt-2.5 bg-stone-950/40 border border-stone-850 p-3 rounded-lg space-y-2">
                      <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                        {currentLang === 'en' ? 'Inventory per Size' : 'የእቃዎች ብዛት በእያንዳንዱ መጠን'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sizes.map((s) => (
                          <div key={s} className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-stone-500">{currentLang === 'en' ? `Size ${s}` : `መጠን ${s}`}</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={sizeInventory[s] ?? 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...sizeInventory, [s]: val };
                                setSizeInventory(updated);
                                const sum = Object.values(updated).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
                                setInventory(sum);
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-200 font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-stone-500 italic mt-1">
                        {currentLang === 'en' 
                          ? '* This automatically calculates and updates the total Stock Inventory.' 
                          : '* ይህ በራስ-ሰር አጠቃላይ ክምችትን ያሰላል እንዲሁም ያሻሽላል::'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Colors chip creator */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                    Color attributes (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Color (En) e.g. Black"
                      value={newColorEn}
                      onChange={(e) => setNewColorEn(e.target.value)}
                      className="bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-purple-500 transition-all"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="ቀለም (አማርኛ) ምሳሌ፡ ጥቁር"
                        value={newColorAm}
                        onChange={(e) => setNewColorAm(e.target.value)}
                        className="flex-grow bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-purple-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newColorEn && newColorAm) {
                            setColorsEn([...colorsEn, newColorEn]);
                            setColorsAm([...colorsAm, newColorAm]);
                            setNewColorEn('');
                            setNewColorAm('');
                          }
                        }}
                        className="bg-stone-950 border border-stone-800 hover:bg-stone-800 px-3 py-1.5 text-xs text-stone-300 rounded cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {colorsEn.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {colorsEn.map((c, idx) => (
                        <span key={idx} className="bg-stone-950 border border-stone-850 px-2 py-0.5 rounded font-mono text-[10px] text-stone-300 flex items-center gap-1">
                          {c} ({colorsAm[idx] || ''})
                          <button type="button" onClick={() => {
                            setColorsEn(colorsEn.filter((_, i) => i !== idx));
                            setColorsAm(colorsAm.filter((_, i) => i !== idx));
                          }} className="text-red-500 text-[10px]">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 border-t border-stone-850 pt-5">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-stone-950 hover:bg-stone-850 border border-stone-850 text-stone-400 hover:text-stone-250 px-4 py-2.5 rounded text-xs font-mono font-bold tracking-wider uppercase cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Catalog Listing</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
