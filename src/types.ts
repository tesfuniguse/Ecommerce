/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  priceETB: number;
  category: string;
  images: string[];
  featuresEn: string[];
  featuresAm: string[];
  rating: number;
  reviewsCount: number;
  inventory: number;
  sizeInventory?: { [size: string]: number };
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  sizes?: string[]; // relevant for shoes/jackets
  colorsEn?: string[];
  colorsAm?: string[];
  sellerId?: string;
  sellerName?: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  savedAddresses: Address[];
  token?: string;
  status?: 'active' | 'suspended';
  avatar?: string;
}

export interface Address {
  id: string;
  fullName: string;
  city: string; // e.g. Addis Ababa, Hawassa, etc.
  subCity?: string; // e.g. Bole, Kirkos, Yeka
  woreda?: string;
  phone: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode?: string;
  shippingAddress: Address;
  paymentMethod: 'et_switch' | 'cod';
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentReference?: string; // e.g. ET-Switch transaction ID
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  trackingNumber: string;
  digitalInvoiceUrl?: string;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  descriptionEn: string;
  descriptionAm: string;
  isActive: boolean;
}

export interface SystemNotification {
  id: string;
  titleEn: string;
  titleAm: string;
  messageEn: string;
  messageAm: string;
  type: 'order' | 'promo' | 'system';
  createdAt: string;
  isRead: boolean;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  salesByCategory: { [category: string]: number };
  dailyRevenue: { date: string; sales: number }[];
  popularProducts: { id: string; name: string; quantity: number; revenue: number }[];
  last30DaysSales?: { date: string; revenue: number; unitsSold: number }[];
  monthlyRevenue?: { month: string; revenue: number }[];
}
