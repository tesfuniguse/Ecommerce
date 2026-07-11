/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Order, Address, SystemNotification } from '../types';
import { alertSystem } from '../lib/alerts';
import { ShoppingBag, MapPin, User as UserIcon, Bell, Settings, LogOut, CheckCircle, Clock, Truck, FileText, TrendingUp, Printer, ShieldCheck, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CustomerDashboardProps {
  user: User;
  currentLang: 'en' | 'am';
  onLogout: () => void;
  onClose: () => void;
  onTrackOrder: (order: Order) => void;
  onOpenSellerPortal?: () => void;
  onUserUpdated?: (user: User) => void;
}

export default function CustomerDashboard({
  user,
  currentLang,
  onLogout,
  onClose,
  onTrackOrder,
  onOpenSellerPortal,
  onUserUpdated,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile' | 'notifications' | 'seller_apply'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Profile update state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // New Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [subCity, setSubCity] = useState('');
  const [woreda, setWoreda] = useState('');
  const [phone, setPhone] = useState('');

  // Seller Apply state
  const [storeNameApply, setStoreNameApply] = useState('');
  const [storePhoneApply, setStorePhoneApply] = useState('');
  const [storeDescApply, setStoreDescApply] = useState('');
  const [submittingSeller, setSubmittingSeller] = useState(false);
  const [sellerSuccess, setSellerSuccess] = useState(false);
  const [sellerError, setSellerError] = useState('');

  useEffect(() => {
    // Load User Orders
    setLoadingOrders(true);
    fetch(`/api/orders/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        const uniqueOrders = Array.isArray(data) ? Array.from(new Map(data.map((o: any) => [o.id, o])).values()) : [];
        setOrders(uniqueOrders);
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingOrders(false);
      });

    // Load Notifications
    fetch(`/api/notifications/${user.id}`)
      .then(res => res.json())
      .then(data => {
        const uniqueNotifs = Array.isArray(data) ? Array.from(new Map(data.map((n: any) => [n.id, n])).values()) : [];
        setNotifications(uniqueNotifs);
      })
      .catch(err => console.error(err));
  }, [user]);

  // Real-time custom event listener to receive WebSocket notifications instantly in the dashboard
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<SystemNotification>;
      const notif = customEvent.detail;

      // 1. Prepend the new notification to the list in state
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });

      // 2. If the notification is related to an order, instantly refresh the orders list
      if (notif.type === 'order') {
        fetch(`/api/orders/user/${user.id}`)
          .then((res) => res.json())
          .then((data) => {
            const uniqueOrders = Array.isArray(data) ? Array.from(new Map(data.map((o: any) => [o.id, o])).values()) : [];
            setOrders(uniqueOrders);
          })
          .catch((err) => console.error('Error refreshing live orders:', err));
      }
    };

    window.addEventListener('new-notification', handleNewNotification);
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, [user.id]);

  const handlePrintInvoice = (ord: Order) => {
    // Create an iframe element
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Format date
    const orderDate = new Date(ord.createdAt).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'am-ET', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate items HTML
    const itemsHtml = ord.items.map((item, index) => {
      const productName = currentLang === 'en' ? item.product.nameEn : item.product.nameAm;
      const sizeStr = item.selectedSize ? `${currentLang === 'en' ? 'Size' : 'ልኬት'}: ${item.selectedSize}` : '';
      const colorStr = item.selectedColor ? `${currentLang === 'en' ? 'Color' : 'ቀለም'}: ${item.selectedColor}` : '';
      const details = [sizeStr, colorStr].filter(Boolean).join(', ');
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">
            <div style="font-weight: bold; color: #111;">${productName}</div>
            ${details ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${details}</div>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace;">${item.product.priceETB.toLocaleString()} ETB</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; font-family: monospace;">${(item.product.priceETB * item.quantity).toLocaleString()} ETB</td>
        </tr>
      `;
    }).join('');

    // Payment details
    const methodMapEn: { [key: string]: string } = {
      et_switch: 'ET-Switch Unified Payment',
      cod: 'Cash on Delivery (COD)'
    };
    const methodMapAm: { [key: string]: string } = {
      et_switch: 'በኢቲ-ስዊች የተቀናጀ ክፍያ',
      cod: 'በእጅ ሲረከቡ የሚከፈል (COD)'
    };
    const paymentMethodStr = currentLang === 'en' 
      ? (methodMapEn[ord.paymentMethod] || ord.paymentMethod.toUpperCase())
      : (methodMapAm[ord.paymentMethod] || ord.paymentMethod);

    // HTML content of the printable invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${ord.id}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #333;
              margin: 0;
              padding: 40px;
              font-size: 13px;
              line-height: 1.5;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #111;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 1px;
              color: #111;
              text-transform: uppercase;
            }
            .logo-sub {
              font-size: 10px;
              font-weight: 500;
              color: #d97706; /* amber-600 */
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              text-align: right;
              margin: 0;
              color: #111;
            }
            .invoice-id {
              font-family: monospace;
              font-size: 12px;
              color: #666;
              margin-top: 5px;
              text-align: right;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #d97706;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .info-block p {
              margin: 4px 0;
            }
            .status-badge {
              display: inline-block;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              padding: 3px 8px;
              border-radius: 4px;
              margin-top: 5px;
              border: 1px solid #ccc;
            }
            .status-completed {
              background-color: #ecfdf5;
              color: #047857;
              border-color: #a7f3d0;
            }
            .status-pending {
              background-color: #fffbeb;
              color: #b45309;
              border-color: #fde68a;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th {
              background-color: #f8f8f8;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 10px;
              border-bottom: 1px solid #111;
            }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }
            .totals-table {
              width: 300px;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 8px 10px;
              border-bottom: 1px solid #eee;
            }
            .totals-table tr.grand-total td {
              border-top: 1px solid #111;
              border-bottom: 2px double #111;
              font-weight: bold;
              font-size: 15px;
              color: #111;
            }
            .footer {
              border-top: 1px dashed #ccc;
              padding-top: 20px;
              text-align: center;
              font-size: 11px;
              color: #777;
            }
            .footer-logo {
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              color: #111;
              margin-bottom: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">Kabana Leather</div>
                <div class="logo-sub">Artisanal Masterpieces</div>
                <div style="font-size: 11px; color: #555; margin-top: 10px;">
                  Bole Subcity, Woreda 03<br>
                  Addis Ababa, Ethiopia<br>
                  support@kabanaleather.com
                </div>
              </div>
              <div>
                <h1 class="title">${currentLang === 'en' ? 'INVOICE' : 'ደረሰኝ'}</h1>
                <div class="invoice-id">INV-${ord.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}</div>
                <div style="text-align: right; font-size: 11px; color: #555; margin-top: 10px;">
                  <strong>${currentLang === 'en' ? 'Date' : 'ቀን'}:</strong> ${orderDate}<br>
                  <strong>${currentLang === 'en' ? 'Tracking' : 'የመከታተያ ቁጥር'}:</strong> ${ord.trackingNumber}
                </div>
              </div>
            </div>

            <div class="details-grid">
              <div class="info-block">
                <div class="section-title">${currentLang === 'en' ? 'Client Billing & Shipping' : 'የደንበኛ አድራሻ እና ማድረሻ'}</div>
                <p><strong>${currentLang === 'en' ? 'Name' : 'ስም'}:</strong> ${ord.shippingAddress.fullName}</p>
                <p><strong>${currentLang === 'en' ? 'Phone' : 'ስልክ'}:</strong> ${ord.shippingAddress.phone}</p>
                <p><strong>${currentLang === 'en' ? 'Address' : 'አድራሻ'}:</strong> ${ord.shippingAddress.woreda ? `Woreda ${ord.shippingAddress.woreda}, ` : ''}${ord.shippingAddress.subCity ? `${ord.shippingAddress.subCity} Sub-City, ` : ''}${ord.shippingAddress.city}, Ethiopia</p>
                <p><strong>${currentLang === 'en' ? 'Email' : 'ኢሜይል'}:</strong> ${ord.userEmail}</p>
              </div>
              
              <div class="info-block" style="text-align: right;">
                <div class="section-title" style="text-align: right;">${currentLang === 'en' ? 'Payment & Order Status' : 'የክፍያ እና ትዕዛዝ ደረጃ'}</div>
                <p><strong>${currentLang === 'en' ? 'Payment Method' : 'የክፍያ አማራጭ'}:</strong> ${paymentMethodStr}</p>
                ${ord.paymentReference ? `<p><strong>${currentLang === 'en' ? 'Reference' : 'የማጣቀሻ ቁጥር'}:</strong> <span style="font-family: monospace; font-size:11px;">${ord.paymentReference}</span></p>` : ''}
                
                <div style="margin-top: 10px;">
                  <span class="status-badge ${ord.paymentStatus === 'completed' ? 'status-completed' : 'status-pending'}">
                    ${currentLang === 'en' ? 'Payment' : 'ክፍያ'}: ${ord.paymentStatus}
                  </span>
                  <span class="status-badge" style="background-color: #f1f5f9; color: #475569; border-color: #cbd5e1; margin-left: 5px;">
                    ${currentLang === 'en' ? 'Order' : 'ትዕዛዝ'}: ${ord.orderStatus}
                  </span>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: left;">#</th>
                  <th style="width: 50%; text-align: left;">${currentLang === 'en' ? 'Artisanal Product' : 'የእጅ ሥራ ምርት'}</th>
                  <th style="width: 15%; text-align: right;">${currentLang === 'en' ? 'Unit Price' : 'ነጠላ ዋጋ'}</th>
                  <th style="width: 10%; text-align: center;">${currentLang === 'en' ? 'Qty' : 'ብዛት'}</th>
                  <th style="width: 20%; text-align: right;">${currentLang === 'en' ? 'Total' : 'ጠቅላላ'}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td style="text-align: left; color: #666;">${currentLang === 'en' ? 'Subtotal' : 'ንዑስ ድምር'}</td>
                  <td style="text-align: right; font-family: monospace;">${ord.subtotal.toLocaleString()} ETB</td>
                </tr>
                ${ord.discount > 0 ? `
                <tr>
                  <td style="text-align: left; color: #666;">${currentLang === 'en' ? 'Discount' : 'ቅናሽ'} ${ord.promoCode ? `(${ord.promoCode})` : ''}</td>
                  <td style="text-align: right; color: #b91c1c; font-family: monospace;">-${ord.discount.toLocaleString()} ETB</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="text-align: left; color: #666;">${currentLang === 'en' ? 'Shipping & Delivery' : 'ማድረሻ እና ስርጭት'}</td>
                  <td style="text-align: right; font-family: monospace;">${ord.shipping === 0 ? (currentLang === 'en' ? 'FREE' : 'ነፃ') : `${ord.shipping.toLocaleString()} ETB`}</td>
                </tr>
                <tr class="grand-total">
                  <td style="text-align: left;">${currentLang === 'en' ? 'Grand Total' : 'ጠቅላላ ሂሳብ'}</td>
                  <td style="text-align: right; font-family: monospace;">${ord.total.toLocaleString()} ETB</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <div class="footer-logo">Kabana Leather Artisans</div>
              <p>${currentLang === 'en' ? 'Thank you for supporting hand-crafted Ethiopian leather masterworks.' : 'በእጅ የተሰሩ ምርጥ የኢትዮጵያ የቆዳ ውጤቶችን በመደገፍዎ እናመሰግናለን።'}</p>
              <p style="font-size: 10px; color: #aaa; margin-top: 15px;">
                ${currentLang === 'en' ? 'This is a computer-generated official commercial document. Certified genuine top-grain quality leather.' : 'ይህ በኮምፒውተር የተዘጋጀ ህጋዊ ደረሰኝ ነው። ትክክለኛ ጥራት ያለው የቆዳ ምርት መሆኑ የተረጋገጠ።'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Write content to the iframe document and print
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  // Get monthly spending data for Recharts
  const getMonthlySpendingData = () => {
    const data = [];
    const now = new Date(2026, 5, 24); // Reference time is June 2026 based on local time "2026-06-24"
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNameEn = d.toLocaleString('en-US', { month: 'short' });
      const monthNameAm = d.toLocaleString('am-ET', { month: 'short' }) || monthNameEn;
      
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      
      const monthOrders = orders.filter(ord => {
        const ordDate = new Date(ord.createdAt);
        return ordDate >= monthStart && ordDate <= monthEnd && ord.orderStatus !== 'cancelled';
      });
      
      const totalSpent = monthOrders.reduce((sum, ord) => sum + ord.total, 0);
      
      data.push({
        monthEn: monthNameEn,
        monthAm: monthNameAm,
        name: currentLang === 'en' ? monthNameEn : (monthNameAm !== monthNameEn ? monthNameAm : monthNameEn),
        amount: totalSpent,
      });
    }
    return data;
  };

  const chartData = getMonthlySpendingData();
  const totalSpending6Months = chartData.reduce((sum, item) => sum + item.amount, 0);
  const averageSpending = Math.round(totalSpending6Months / 6);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, email }),
      });

      if (res.ok) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmMsg = currentLang === 'en'
      ? 'WARNING: Are you absolutely sure you want to permanently delete your account? This action cannot be undone.'
      : 'ማስጠንቀቂያ፡ መለያዎን በቋሚነት ለመሰረዝ እርግጠኛ ነዎት? ይህ ድርጊት ወደኋላ ሊመለስ አይችልም።';
    alertSystem.showConfirm(
      confirmMsg,
      async () => {
        try {
          const res = await fetch(`/api/auth/profile?userId=${user.id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            onLogout();
            onClose();
          } else {
            const data = await res.json();
            alertSystem.showAlert(data.error || 'Failed to delete account.', { type: 'error' });
          }
        } catch (err) {
          console.error(err);
          alertSystem.showAlert('Error occurred while deleting account.', { type: 'error' });
        }
      },
      undefined,
      { type: 'danger' }
    );
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      fullName,
      city,
      subCity,
      woreda,
      phone,
      isDefault: user.savedAddresses?.length === 0,
    };

    try {
      const res = await fetch('/api/auth/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, address: newAddress }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        user.savedAddresses = updatedUser.user.savedAddresses;
        setShowAddressForm(false);
        setFullName('');
        setSubCity('');
        setWoreda('');
        setPhone('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplySeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeNameApply) {
      setSellerError(currentLang === 'en' ? 'Store name is required' : 'የሱቅ ስም ያስፈልጋል');
      return;
    }
    setSubmittingSeller(true);
    setSellerError('');
    try {
      const res = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          storeName: storeNameApply
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSellerSuccess(true);
        if (onUserUpdated) {
          onUserUpdated(data.user);
        }
      } else {
        const err = await res.json();
        setSellerError(err.error || 'Failed to submit seller application');
      }
    } catch (err: any) {
      setSellerError(err.message || 'An error occurred');
    } finally {
      setSubmittingSeller(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'processing': return <Settings className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-emerald-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Clock className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-stone-200">
      
      {/* Upper Brand panel details */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-sans font-bold text-stone-100">{user.name}</h1>
            <p className="text-xs text-stone-400 font-mono">{user.email} | Member since 2026</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onLogout}
            className="border border-stone-750 bg-stone-950/40 hover:bg-stone-800 text-stone-300 px-4 py-2.5 rounded text-xs font-mono flex items-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'Sign Out' : 'ውጣ'}</span>
          </button>
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2.5 rounded text-xs font-sans font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            {currentLang === 'en' ? 'Back to Shop' : 'ወደ ገበያ ይመለሱ'}
          </button>
        </div>
      </div>

      {/* Main dashboard splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column sidebar navigation */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-3 lg:pb-0 scrollbar-none [&::-webkit-scrollbar]:hidden w-full">
          <button
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap lg:w-full text-left px-4 py-3 rounded-md text-xs font-semibold flex items-center space-x-3 transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'orders' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'Order History & Status' : 'የትዕዛዝ ታሪክ እና ሁኔታ'}</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`whitespace-nowrap lg:w-full text-left px-4 py-3 rounded-md text-xs font-semibold flex items-center space-x-3 transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'addresses' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'Saved Delivery Addresses' : 'የማድረሻ አድራሻዎች'}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap lg:w-full text-left px-4 py-3 rounded-md text-xs font-semibold flex items-center space-x-3 transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'profile' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'Profile Management' : 'የመለያ ቅንብሮች'}</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`whitespace-nowrap lg:w-full text-left px-4 py-3 rounded-md text-xs font-semibold flex items-center space-x-3 transition-all cursor-pointer flex-shrink-0 relative ${
              activeTab === 'notifications' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'Notifications' : 'ማሳወቂያዎች'}</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="lg:absolute lg:right-4 lg:top-3.5 bg-red-600 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>

          {user.role === 'seller' ? (
            <button
              type="button"
              onClick={onOpenSellerPortal}
              className="whitespace-nowrap lg:w-full text-left px-4 py-3 rounded-md text-xs font-bold flex items-center space-x-3 transition-all cursor-pointer flex-shrink-0 bg-purple-950/20 hover:bg-purple-900/30 text-purple-400 border border-purple-900/30 shadow-sm shadow-purple-600/5"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>{currentLang === 'en' ? 'Open Seller Portal' : 'የሻጭ ፖርታል ክፈት'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('seller_apply')}
              className={`whitespace-nowrap lg:w-full text-left px-4 py-3 rounded-md text-xs font-semibold flex items-center space-x-3 transition-all cursor-pointer flex-shrink-0 ${
                activeTab === 'seller_apply' 
                  ? 'bg-purple-600 text-stone-950 font-bold' 
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{currentLang === 'en' ? 'Become a Seller' : 'ሻጭ ይሁኑ'}</span>
            </button>
          )}
        </div>

        {/* Right column detailed panels */}
        <div className="lg:col-span-9 bg-stone-900 border border-stone-800 rounded-lg p-6 min-h-[400px]">
          
          {/* Tab: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest mb-4">
                {currentLang === 'en' ? 'Your Placed Orders' : 'የተመዘገቡ ትዕዛዞች'}
              </h2>

              {/* Spending Overview Chart */}
              {!loadingOrders && orders.length > 0 && (
                <div className="bg-stone-950 border border-stone-850 p-5 rounded-lg shadow-xl mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-900 pb-4 mb-4 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 text-amber-500">
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest">
                          {currentLang === 'en' ? 'Spending Overview (Last 6 Months)' : 'የወጪዎች ማጠቃለያ (ያለፉት 6 ወራት)'}
                        </h3>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                        {currentLang === 'en' ? 'Visualizing your luxurious leather goods investment trend.' : 'የቆዳ ውጤቶች ግዢዎትን የገንዘብ እንቅስቃሴ ፍሰት ማሳያ።'}
                      </p>
                    </div>

                    <div className="flex gap-6 font-mono">
                      <div>
                        <p className="text-[9px] text-stone-500 uppercase">{currentLang === 'en' ? 'Total Spent' : 'ጠቅላላ ወጪ'}</p>
                        <p className="text-xs font-bold text-amber-500">{totalSpending6Months.toLocaleString()} ETB</p>
                      </div>
                      <div className="border-l border-stone-850 pl-6">
                        <p className="text-[9px] text-stone-500 uppercase">{currentLang === 'en' ? 'Monthly Avg' : 'ወርሃዊ አማካኝ'}</p>
                        <p className="text-xs font-bold text-stone-200">{averageSpending.toLocaleString()} ETB</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[220px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#78716c" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="#78716c" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(val) => `${val.toLocaleString()} ETB`}
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: '#0c0a09', 
                            borderColor: '#292524',
                            borderRadius: '4px',
                            color: '#e7e5e4',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }}
                          itemStyle={{ color: '#f59e0b' }}
                          formatter={(value: any) => [`${Number(value).toLocaleString()} ETB`, currentLang === 'en' ? 'Spent' : 'ወጪ']}
                          labelFormatter={(label) => `${currentLang === 'en' ? 'Month:' : 'ወር:'} ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#d97706" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorSpend)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {loadingOrders ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-amber-500 animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <p className="text-xs mb-4">{currentLang === 'en' ? 'You have not placed any orders yet.' : 'እስካሁን ምንም ትዕዛዝ አላስገቡም።'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="bg-stone-950 border border-stone-850 rounded-lg p-5">
                      {/* Order top bar info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-900 gap-2 mb-4">
                        <div>
                          <p className="text-xs font-bold text-stone-200">Order ID: {ord.id}</p>
                          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                            {new Date(ord.createdAt).toLocaleDateString()} | Tracking: <span className="text-amber-500">{ord.trackingNumber}</span>
                          </p>
                        </div>

                        {/* Status badges */}
                        <div className="flex gap-2">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-[10px] font-mono font-bold text-stone-300">
                            {getStatusIcon(ord.orderStatus)}
                            <span className="uppercase">{ord.orderStatus}</span>
                          </span>
                          <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border uppercase ${
                            ord.paymentStatus === 'completed' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-600/10 border-amber-500/20 text-amber-500'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Order Items brief */}
                      <div className="space-y-2 mb-4">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-stone-400">
                            <span>{currentLang === 'en' ? item.product.nameEn : item.product.nameAm} (x{item.quantity})</span>
                            <span className="font-mono text-stone-300">{(item.product.priceETB * item.quantity).toLocaleString()} ETB</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer summary */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-stone-900 gap-2 font-mono text-xs">
                        <span className="text-stone-500">Method: {ord.paymentMethod.toUpperCase()}</span>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handlePrintInvoice(ord)}
                            className="inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 hover:border-stone-700 px-3 py-1.5 rounded text-[10px] uppercase font-mono font-bold transition-all cursor-pointer whitespace-nowrap text-center"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" />
                            {currentLang === 'en' ? 'Print Invoice' : 'ደረሰኝ አትም'}
                          </button>
                          <button
                            onClick={() => onTrackOrder(ord)}
                            className="bg-amber-600/10 hover:bg-amber-600/25 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded text-[10px] uppercase font-mono font-bold transition-all cursor-pointer whitespace-nowrap text-center"
                          >
                            {currentLang === 'en' ? 'Track Live Progress' : 'ደረጃውን ተከታተል'}
                          </button>
                          <span className="text-stone-200 font-bold whitespace-nowrap text-right">
                            {currentLang === 'en' ? 'Total Paid: ' : 'ጠቅላላ ሂሳብ፡ '}
                            <span className="text-amber-500">{ord.total.toLocaleString()} ETB</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest">
                  {currentLang === 'en' ? 'Saved Delivery Addresses' : 'የማድረሻ አድራሻዎች'}
                </h2>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                  >
                    {currentLang === 'en' ? '+ Add New' : '+ አዲስ አድራሻ'}
                  </button>
                )}
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="bg-stone-950 p-5 rounded-lg border border-stone-850 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest">
                    {currentLang === 'en' ? 'Add Delivery Address' : 'አዲስ አድራሻ ማስገቢያ'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                      >
                        <option value="Addis Ababa">Addis Ababa</option>
                        <option value="Adama">Adama</option>
                        <option value="Hawassa">Hawassa</option>
                        <option value="Bahir Dar">Bahir Dar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Subcity</label>
                      <input
                        type="text"
                        value={subCity}
                        onChange={(e) => setSubCity(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Woreda / Block</label>
                      <input
                        type="text"
                        value={woreda}
                        onChange={(e) => setWoreda(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
                    >
                      {currentLang === 'en' ? 'Save Address' : 'አድራሻ አስቀምጥ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="border border-stone-800 hover:bg-stone-900 text-stone-400 px-4 py-2 rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : user.savedAddresses?.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-6">{currentLang === 'en' ? 'No addresses saved yet.' : 'እስካሁን ምንም አድራሻ አላስቀመጡም።'}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.savedAddresses?.map((addr) => (
                    <div key={addr.id} className="bg-stone-950 border border-stone-850 p-4 rounded-lg relative">
                      <p className="text-xs font-bold text-stone-200">{addr.fullName}</p>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {addr.city}, {addr.subCity}, Woreda {addr.woreda} <br />
                        Phone: {addr.phone}
                      </p>
                      {addr.isDefault && (
                        <span className="absolute top-4 right-4 bg-amber-600/10 border border-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest mb-4">
                {currentLang === 'en' ? 'Manage Personal Profile' : 'የመለያ መገለጫ ማስተካከያ'}
              </h2>

              <form onSubmit={handleUpdateProfile} className="max-w-md bg-stone-950 p-5 rounded-lg border border-stone-850 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>

                {profileSuccess && (
                  <p className="text-xs font-mono text-emerald-500">Profile updated successfully!</p>
                )}

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2.5 rounded text-xs font-semibold cursor-pointer"
                >
                  {updatingProfile ? 'Saving...' : 'Update Details'}
                </button>
              </form>

              <div className="max-w-md bg-stone-950 p-5 rounded-lg border border-red-900/30 space-y-4">
                <h3 className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
                  {currentLang === 'en' ? 'Danger Zone' : 'አደገኛ ቅንብር'}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {currentLang === 'en' 
                    ? 'Permanently delete your account and all associated data. This action cannot be undone.'
                    : 'የእርስዎን መለያ እና ሁሉንም ተያያዥ መረጃዎችን በቋሚነት ያጥፉ። ይህ ድርጊት ወደኋላ ሊመለስ አይችልም።'}
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="bg-red-600/10 hover:bg-red-600 border border-red-500/25 hover:border-transparent text-red-400 hover:text-white px-4 py-2.5 rounded text-xs font-semibold cursor-pointer transition-all w-full text-center"
                >
                  {currentLang === 'en' ? 'Delete My Account' : 'መለያዬን ሰርዝ'}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest mb-4">
                {currentLang === 'en' ? 'Notifications' : 'ማሳወቂያዎች'}
              </h2>

              {notifications.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-6">{currentLang === 'en' ? 'You have no notifications.' : 'ምንም ማሳወቂያ የለዎትም።'}</p>
              ) : (
                <div className="divide-y divide-stone-800/60 space-y-3">
                  {Array.from(new Map<string, SystemNotification>(notifications.map(n => [n.id, n])).values()).map((notif: SystemNotification) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkNotificationRead(notif.id)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer flex justify-between items-start ${
                        notif.isRead ? 'bg-stone-950/20 border-stone-850/50 opacity-60' : 'bg-stone-950 border-stone-850'
                      }`}
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-stone-200">
                          {currentLang === 'en' ? notif.titleEn : notif.titleAm}
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          {currentLang === 'en' ? notif.messageEn : notif.messageAm}
                        </p>
                        <p className="font-mono text-[9px] text-stone-500">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Become a Seller */}
          {activeTab === 'seller_apply' && (
            <div className="space-y-6">
              <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest mb-4">
                {currentLang === 'en' ? 'Register As A Seller' : 'የሻጭነት መመዝገቢያ ፎርም'}
              </h2>

              {sellerSuccess ? (
                <div className="bg-purple-950/20 border border-purple-500/20 p-6 rounded-lg text-center space-y-4">
                  <div className="inline-flex p-3 bg-purple-500/10 rounded-full text-purple-400">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-bold text-stone-100">
                      {currentLang === 'en' ? 'Store Registration Successful!' : 'የሱቅ ምዝገባ በተሳካ ሁኔታ ተጠናቋል!'}
                    </h3>
                    <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                      {currentLang === 'en' 
                        ? `Congratulations! Your store "${storeNameApply}" is now approved for sandbox operations. You can now list products and manage orders.` 
                        : `እንኳን ደስ አለዎት! ሱቅዎ "${storeNameApply}" በተሳካ ሁኔታ ጸድቋል። አሁን ምርቶችን መዘርዘር እና ማስተዳደር ይችላሉ።`}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={onOpenSellerPortal}
                      className="bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{currentLang === 'en' ? 'Open Seller Portal' : 'የሻጭ ፖርታል ክፈት'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl bg-stone-950 p-6 rounded-lg border border-stone-850 space-y-6">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider mb-2">
                      Zema Leather Seller Program Guidelines
                    </h3>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      To safeguard the reputation of authentic Ethiopian leathercraft, Zema Leather enforces strict product guidelines. All items listed must consist of 100% genuine local hides. List items honestly, fulfill orders within 48 hours, and preserve our premium standards of craftsmanship.
                    </p>
                  </div>

                  {sellerError && (
                    <div className="p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-xs font-mono rounded flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{sellerError}</span>
                    </div>
                  )}

                  <form onSubmit={handleApplySeller} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-stone-400 mb-1.5 uppercase">Store / Tannery Name *</label>
                      <input
                        type="text"
                        required
                        value={storeNameApply}
                        onChange={(e) => setStoreNameApply(e.target.value)}
                        placeholder="e.g. Abyssinia Legacy Leathercraft"
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-200 font-sans focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-stone-400 mb-1.5 uppercase">Contact Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={storePhoneApply}
                        onChange={(e) => setStorePhoneApply(e.target.value)}
                        placeholder="e.g. +251 911 223 344"
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-200 font-sans focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-stone-400 mb-1.5 uppercase">Store Bio & Leather Sourcing *</label>
                      <textarea
                        required
                        rows={3}
                        value={storeDescApply}
                        onChange={(e) => setStoreDescApply(e.target.value)}
                        placeholder="Describe your tanning history, workshop location in Ethiopia, and raw leather sourcing..."
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3.5 py-2 text-xs text-stone-200 font-sans focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex items-start gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        required
                        id="agree-guidelines"
                        className="mt-0.5 border-stone-800 bg-stone-900 text-purple-600 focus:ring-0 rounded"
                      />
                      <label htmlFor="agree-guidelines" className="text-[10px] text-stone-400 leading-relaxed select-none cursor-pointer">
                        I hereby pledge that all products listed on my store are crafted exclusively using authentic local bovine, sheep, or goat leather. I agree to abide by the 48-hour delivery SLA.
                      </label>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingSeller}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-sans font-bold text-xs uppercase tracking-wider py-3 px-6 rounded transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-purple-600/15"
                      >
                        {submittingSeller ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Setting up Shop...</span>
                          </>
                        ) : (
                          <span>Submit Application</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
