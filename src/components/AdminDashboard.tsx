/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, PromoCode, SalesReport, User } from '../types';
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle, Plus, Edit, Trash2,
  Check, X, RefreshCw, Calendar, Tag, ShieldCheck, BarChart3, Search, ShieldAlert,
  Sparkles, Mail, Upload, Image, Database, Send, Download, History, Save, HardDrive,
  CloudUpload
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend, ComposedChart
} from 'recharts';

interface AdminDashboardProps {
  currentLang: 'en' | 'am';
  onClose: () => void;
  allProducts: Product[];
  onRefreshProducts: () => void;
}

export default function AdminDashboard({
  currentLang,
  onClose,
  allProducts,
  onRefreshProducts,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'promos' | 'users' | 'alerts' | 'telegram' | 'backup'>('analytics');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Alerts and SMS notification configurations state
  const [alertSettings, setAlertSettings] = useState({
    enabled: true,
    threshold: 5,
    adminEmail: 'admin@ethiopianleather.com',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    smsEnabled: false,
    smsProvider: 'simulated' as 'twilio' | 'ethio_telecom' | 'simulated',
    twilioSid: '',
    twilioToken: '',
    twilioFrom: '',
    adminPhone: '',
    customerSmsEnabled: true,
  });
  const [emailAlerts, setEmailAlerts] = useState<any[]>([]);
  const [smsAlerts, setSmsAlerts] = useState<any[]>([]);
  const [loadingAlertSettings, setLoadingAlertSettings] = useState(false);
  const [savingAlertSettings, setSavingAlertSettings] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Product CRUD state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    nameEn: '', nameAm: '', descriptionEn: '', descriptionAm: '',
    priceETB: 0, category: 'Leather Bags', inventory: 10,
    featuresEn: [], featuresAm: [], sizes: [], colorsEn: [], colorsAm: [],
    images: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [newAdminSize, setNewAdminSize] = useState('');

  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportFormat, setBulkImportFormat] = useState<'json' | 'csv'>('json');
  const [bulkImportText, setBulkImportText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [bulkImportError, setBulkImportError] = useState('');
  const [bulkImportSuccess, setBulkImportSuccess] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Back in Stock Waitlist states
  const [waitlistSubs, setWaitlistSubs] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Backup Management States
  const [backups, setBackups] = useState<{ filename: string; size: number; createdAt: string; isAuto: boolean; label: string }[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [importingDirect, setImportingDirect] = useState(false);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/admin/backup/list');
      const data = await res.json();
      if (res.ok) {
        setBackups(data || []);
      } else {
        setBackupMessage({ text: data.error || 'Failed to fetch backup list.', isError: true });
      }
    } catch (err: any) {
      setBackupMessage({ text: err.message || 'Error fetching backups list.', isError: true });
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBackup(true);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: backupLabel, isAuto: false })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupLabel('');
        setBackupMessage({ text: `Success: System backup snapshot "${data.filename}" successfully compiled!`, isError: false });
        fetchBackups();
      } else {
        setBackupMessage({ text: data.error || 'Failed to compile snapshot.', isError: true });
      }
    } catch (err: any) {
      setBackupMessage({ text: err.message || 'Error compiling snapshot.', isError: true });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    setRestoringBackup(filename);
    setBackupMessage(null);
    setConfirmRestoreFile(null);
    try {
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupMessage({ text: `Database successfully restored to the state from "${filename}"! Refreshing inventory.`, isError: false });
        onRefreshProducts();
      } else {
        setBackupMessage({ text: data.error || 'Failed to restore.', isError: true });
      }
    } catch (err: any) {
      setBackupMessage({ text: err.message || 'Error restoring system.', isError: true });
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    setDeletingBackup(filename);
    setBackupMessage(null);
    setConfirmDeleteFile(null);
    try {
      const res = await fetch(`/api/admin/backup/${filename}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupMessage({ text: `Backup file "${filename}" was successfully deleted from disk.`, isError: false });
        fetchBackups();
      } else {
        setBackupMessage({ text: data.error || 'Failed to delete backup.', isError: true });
      }
    } catch (err: any) {
      setBackupMessage({ text: err.message || 'Error deleting backup.', isError: true });
    } finally {
      setDeletingBackup(null);
    }
  };

  const handleDirectExport = () => {
    window.location.href = '/api/admin/backup/export';
  };

  const handleDirectImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingDirect(true);
    setBackupMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        if (!backupData || !backupData.data) {
          throw new Error('Invalid file structure. Make sure this is a valid JSON export containing a "data" object.');
        }

        const res = await fetch('/api/admin/backup/import-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setBackupMessage({ text: 'System database successfully parsed, loaded, and initialized directly from uploaded file!', isError: false });
          onRefreshProducts();
        } else {
          setBackupMessage({ text: data.error || 'Failed to import backup.', isError: true });
        }
      } catch (err: any) {
        setBackupMessage({ text: `Import failed: ${err.message}`, isError: true });
      } finally {
        setImportingDirect(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleUploadAndSaveBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingBackups(true);
    setBackupMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        if (!backupData || !backupData.data) {
          throw new Error('Invalid file structure. Must contain a "data" object.');
        }

        const res = await fetch('/api/admin/backup/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData, filename: file.name })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setBackupMessage({ text: `Backup "${file.name}" uploaded and saved to server repository.`, isError: false });
          fetchBackups();
        } else {
          setBackupMessage({ text: data.error || 'Failed to save uploaded backup.', isError: true });
        }
      } catch (err: any) {
        setBackupMessage({ text: `Upload failed: ${err.message}`, isError: true });
      } finally {
        setLoadingBackups(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackups();
    }
  }, [activeTab]);

  const loadSubscriptions = () => {
    setLoadingSubs(true);
    fetch('/api/admin/back-in-stock/subscriptions')
      .then(res => res.json())
      .then(data => {
        setWaitlistSubs(data || []);
        setLoadingSubs(false);
      })
      .catch(err => {
        console.error('Error loading subscriptions:', err);
        setLoadingSubs(false);
      });
  };

  const handleClearSubscriptions = async () => {
    if (!window.confirm(currentLang === 'en' ? 'Are you sure you want to clear all waitlist subscriptions?' : 'ሁሉንም የምርት ማሳወቂያ ምዝገባዎችን ማጽዳት ይፈልጋሉ?')) return;
    try {
      const res = await fetch('/api/admin/back-in-stock/subscriptions/clear', { method: 'POST' });
      if (res.ok) {
        setWaitlistSubs([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (!allProducts || allProducts.length === 0) {
      alert(currentLang === 'en' ? 'No products available to export.' : 'ለመላክ ምንም ምርቶች የሉም።');
      return;
    }

    const headers = [
      'ID',
      'Name (EN)',
      'Name (AM)',
      'Category',
      'Price (ETB)',
      'Inventory',
      'Sizes',
      'Colors (EN)',
      'Colors (AM)',
      'Description (EN)',
      'Description (AM)',
      'Images'
    ];

    const rows = allProducts.map(p => {
      const escape = (val: any) => {
        if (val === undefined || val === null) return '""';
        let str = String(val);
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        escape(p.id),
        escape(p.nameEn),
        escape(p.nameAm),
        escape(p.category),
        p.priceETB,
        p.inventory,
        escape((p.sizes || []).join(', ')),
        escape((p.colorsEn || []).join(', ')),
        escape((p.colorsAm || []).join(', ')),
        escape(p.descriptionEn),
        escape(p.descriptionAm),
        escape((p.images || []).join(', '))
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n'); // prepending BOM for proper Amharic character display in Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leather_store_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Promo code state
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(10);
  const [newPromoDescEn, setNewPromoDescEn] = useState('');
  const [newPromoDescAm, setNewPromoDescAm] = useState('');

  // Telegram Integration State
  const [telegramSettings, setTelegramSettings] = useState({
    botToken: '',
    channelId: '',
    isEnabled: false,
    useSimulation: true,
  });
  const [loadingTelegramSettings, setLoadingTelegramSettings] = useState(false);
  const [savingTelegramSettings, setSavingTelegramSettings] = useState(false);
  const [telegramPostLoading, setTelegramPostLoading] = useState<string | null>(null);
  const [telegramCaption, setTelegramCaption] = useState<Record<string, string>>({});

  const loadTelegramSettings = () => {
    setLoadingTelegramSettings(true);
    fetch('/api/admin/telegram/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setTelegramSettings({
            botToken: data.botToken ?? '',
            channelId: data.channelId ?? '',
            isEnabled: data.isEnabled ?? false,
            useSimulation: data.useSimulation ?? true,
          });
        }
        setLoadingTelegramSettings(false);
      })
      .catch(err => {
        console.error('Error loading Telegram settings:', err);
        setLoadingTelegramSettings(false);
      });
  };

  // MongoDB Atlas Online Integration Status
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; dbName: string | null; provider: string } | null>(null);

  const loadDbStatus = () => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => console.error('Error fetching database status:', err));
  };

  const loadAlertSettings = () => {
    setLoadingAlertSettings(true);
    fetch('/api/admin/alert-settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAlertSettings({
            enabled: data.enabled ?? true,
            threshold: data.threshold ?? 5,
            adminEmail: data.adminEmail ?? 'admin@ethiopianleather.com',
            smtpHost: data.smtpHost ?? '',
            smtpPort: data.smtpPort ?? 587,
            smtpSecure: data.smtpSecure ?? false,
            smtpUser: data.smtpUser ?? '',
            smtpPass: data.smtpPass ?? '',
            smtpFrom: data.smtpFrom ?? '',
            smsEnabled: data.smsEnabled ?? false,
            smsProvider: data.smsProvider ?? 'simulated',
            twilioSid: data.twilioSid ?? '',
            twilioToken: data.twilioToken ?? '',
            twilioFrom: data.twilioFrom ?? '',
            adminPhone: data.adminPhone ?? '',
            customerSmsEnabled: data.customerSmsEnabled ?? true,
          });
        }
        setLoadingAlertSettings(false);
      })
      .catch(err => {
        console.error('Error loading alert settings:', err);
        setLoadingAlertSettings(false);
      });
  };

  const loadAlertLogs = () => {
    fetch('/api/admin/email-alerts')
      .then(res => res.json())
      .then(data => setEmailAlerts(data || []))
      .catch(err => console.error('Error loading email alerts:', err));

    fetch('/api/admin/sms-alerts')
      .then(res => res.json())
      .then(data => setSmsAlerts(data || []))
      .catch(err => console.error('Error loading SMS alerts:', err));
  };

  const loadStats = () => {
    setLoadingStats(true);
    loadDbStatus();
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoadingStats(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingStats(false);
      });
  };

  const loadOrders = () => {
    setLoadingOrders(true);
    fetch('/api/admin/orders')
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
  };

  const loadPromos = () => {
    fetch('/api/promos')
      .then(res => res.json())
      .then(data => setPromos(data))
      .catch(err => console.error(err));
  };

  const loadUsers = () => {
    setLoadingUsers(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoadingUsers(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingUsers(false);
      });
  };

  const handleUpdateUser = async (userId: string, role?: 'customer' | 'seller' | 'admin', status?: 'active' | 'suspended') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, status }),
      });
      if (res.ok) {
        loadUsers();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmMsg = currentLang === 'en'
      ? 'Are you sure you want to permanently delete this user account?'
      : 'ይህንን የተጠቃሚ መለያ በቋሚነት ለመሰረዝ እርግጠኛ ነዎት?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadUsers();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV line parser that respects quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const products: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const p: any = {};
      headers.forEach((header, index) => {
        const val = values[index];
        if (val === undefined) return;

        // Clean up quotes around the parsed value
        let cleanVal = val;
        if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
          cleanVal = cleanVal.slice(1, -1);
        }

        if (['priceETB', 'inventory', 'rating', 'reviewsCount'].includes(header)) {
          p[header] = Number(cleanVal) || 0;
        } else if (['isBestSeller', 'isNewArrival', 'isFeatured'].includes(header)) {
          p[header] = cleanVal.toLowerCase() === 'true' || cleanVal === '1';
        } else if (['images', 'featuresEn', 'featuresAm', 'sizes', 'colorsEn', 'colorsAm'].includes(header)) {
          // split by semicolon
          p[header] = cleanVal ? cleanVal.split(';').map(s => s.trim()).filter(Boolean) : [];
        } else {
          p[header] = cleanVal;
        }
      });
      products.push(p);
    }
    return products;
  };

  const handleParseAndPreview = (textToParse: string, format: 'json' | 'csv') => {
    try {
      setBulkImportError('');
      setBulkImportSuccess('');
      if (!textToParse.trim()) {
        throw new Error(currentLang === 'en' ? 'Please paste some data or upload a file first.' : 'እባክዎ መጀመሪያ ዳታ ይለጥፉ ወይም ፋይል ይስቀሉ።');
      }

      let parsed: any[] = [];
      if (format === 'json') {
        const obj = JSON.parse(textToParse);
        parsed = Array.isArray(obj) ? obj : [obj];
      } else {
        parsed = parseCSV(textToParse);
      }

      if (parsed.length === 0) {
        throw new Error(currentLang === 'en' ? 'No products found or parsed.' : 'ምንም ምርቶች አልተገኙም ወይም አልተተነተኑም።');
      }

      setParsedProducts(parsed);
    } catch (err: any) {
      setBulkImportError(err.message || String(err));
      setParsedProducts([]);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setBulkImportText(text);
        const format = file.name.endsWith('.csv') ? 'csv' : 'json';
        setBulkImportFormat(format);
        handleParseAndPreview(text, format);
      }
    };
    reader.onerror = () => {
      setBulkImportError(currentLang === 'en' ? 'Error reading file.' : 'ፋይል ለማንበብ ተስኖታል።');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsImporting(true);
    setBulkImportError('');
    setBulkImportSuccess('');

    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedProducts })
      });

      if (res.ok) {
        const data = await res.json();
        setBulkImportSuccess(
          currentLang === 'en'
            ? `Successfully imported and synced ${data.count} products with Firestore!`
            : `በተሳካ ሁኔታ ${data.count} ምርቶችን ወደ Firestore አስገብተዋል!`
        );
        setParsedProducts([]);
        setBulkImportText('');
        onRefreshProducts();
      } else {
        const err = await res.json();
        setBulkImportError(err.error || 'Import failed.');
      }
    } catch (err: any) {
      setBulkImportError(err.message || 'Connection error.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateAIDescriptions = async () => {
    if (!formData.nameEn) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/admin/generate-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.nameEn,
          category: formData.category || 'Leather Bags'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          nameAm: prev.nameAm || (formData.nameEn ? `ፕሪሚየም ${formData.nameEn}` : ''),
          descriptionEn: data.descriptionEn,
          descriptionAm: data.descriptionAm,
          featuresEn: data.featuresEn || prev.featuresEn,
          featuresAm: data.featuresAm || prev.featuresAm
        }));
      } else {
        console.error('Failed to generate product descriptions.');
      }
    } catch (error) {
      console.error('Error generating descriptions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadOrders();
    loadPromos();
    loadUsers();
    loadSubscriptions();
    loadAlertSettings();
    loadAlertLogs();
    loadTelegramSettings();
  }, [allProducts]);

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlertSettings();
      loadAlertLogs();
    }
    if (activeTab === 'telegram') {
      loadTelegramSettings();
    }
  }, [activeTab]);

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingProduct;
    const url = isEditing ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priceETB: Number(formData.priceETB),
          inventory: Number(formData.inventory)
        }),
      });

      if (res.ok) {
        onRefreshProducts();
        setShowProductForm(false);
        setEditingProduct(null);
        setFormData({
          nameEn: '', nameAm: '', descriptionEn: '', descriptionAm: '',
          priceETB: 0, category: 'Leather Bags', inventory: 10,
          featuresEn: [], featuresAm: [], sizes: [], colorsEn: [], colorsAm: [],
          images: []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (pId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${pId}`, { method: 'DELETE' });
      if (res.ok) {
        // Remove from selected list if present
        setSelectedProductIds(prev => prev.filter(id => id !== pId));
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProductIds.length === 0) return;
    
    const confirmMessage = currentLang === 'en' 
      ? `Are you sure you want to delete the ${selectedProductIds.length} selected products?` 
      : `የተመረጡትን ${selectedProductIds.length} ምርቶች ለማጥፋት እርግጠኛ ነዎት?`;

    if (!window.confirm(confirmMessage)) return;

    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProductIds }),
      });
      if (res.ok) {
        setSelectedProductIds([]);
        onRefreshProducts();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete products.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during bulk deletion.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleProductImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64Data
          })
        });
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => {
            const currentImages = prev.images || [];
            if (!currentImages.includes(data.url)) {
              return { ...prev, images: [...currentImages, data.url] };
            }
            return prev;
          });
        } else {
          const err = await res.json();
          alert(`Image upload failed: ${err.error || 'Server error'}`);
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      console.error('Error uploading image:', e);
      alert('Error uploading image: ' + e.message);
      setUploadingImage(false);
    }
  };

  const handleImageDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImageDragActive(true);
    } else if (e.type === "dragleave") {
      setImageDragActive(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProductImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddManualImageUrl = () => {
    if (!manualImageUrl.trim()) return;
    setFormData(prev => {
      const currentImages = prev.images || [];
      if (!currentImages.includes(manualImageUrl.trim())) {
        return { ...prev, images: [...currentImages, manualImageUrl.trim()] };
      }
      return prev;
    });
    setManualImageUrl('');
  };

  const handleRemoveImage = (imgUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(url => url !== imgUrl)
    }));
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: status }),
      });
      if (res.ok) {
        loadOrders();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) {
        loadOrders();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;

    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPromoCode.toUpperCase(),
          discountPercent: Number(newPromoDiscount),
          descriptionEn: newPromoDescEn,
          descriptionAm: newPromoDescAm,
        }),
      });

      if (res.ok) {
        loadPromos();
        setNewPromoCode('');
        setNewPromoDescEn('');
        setNewPromoDescAm('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const chartColors = ['#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

  const categoryChartData = report?.salesByCategory
    ? Object.keys(report.salesByCategory).map(key => ({
        name: key,
        revenue: report.salesByCategory[key]
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-stone-200">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-sans font-bold text-stone-100 flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            <span>Ethiopian Leather Store - Admin Dashboard</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-mono">Real-time inventory and sales operations console</p>
        </div>

        <button
          onClick={onClose}
          className="bg-stone-800 hover:bg-stone-750 text-stone-100 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
        >
          Customer Store View
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex space-x-2 border-b border-stone-800 pb-4 mb-8 overflow-x-auto">
        {[
          { id: 'analytics', label: currentLang === 'en' ? 'Analytics & Reports' : 'ትንታኔ እና ሪፖርቶች', icon: BarChart3 },
          { id: 'products', label: currentLang === 'en' ? 'Product & Inventory' : 'ምርት እና ክምችት', icon: Package },
          { id: 'orders', label: currentLang === 'en' ? 'Order Processing' : 'የትዕዛዝ ሂደት', icon: ShoppingCart },
          { id: 'promos', label: currentLang === 'en' ? 'Discount Campaigns' : 'የቅናሽ ዘመቻዎች', icon: Tag },
          { id: 'users', label: currentLang === 'en' ? 'User Accounts' : 'የተጠቃሚዎች አስተዳደር', icon: Users },
          { id: 'alerts', label: currentLang === 'en' ? 'Email & SMS Config' : 'ማሳወቂያዎች እና ኤስኤምኤስ', icon: Mail },
          { id: 'telegram', label: currentLang === 'en' ? 'Telegram Integration' : 'የቴሌግራም ውህደት', icon: Send },
          { id: 'backup', label: currentLang === 'en' ? 'Backup & Restore' : 'ምትኬ እና መልሶ ማግኛ', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'bg-amber-600 text-stone-950 font-bold' : 'hover:bg-stone-850 text-stone-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panel: Analytics */}
      {activeTab === 'analytics' && report && (
        <div className="space-y-8">
          
          {/* MongoDB Atlas Online Status Banner */}
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${dbStatus?.connected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Database className={`w-5 h-5 ${dbStatus?.connected ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-widest">
                  Database Engine: {dbStatus?.provider || 'MongoDB Atlas Online'}
                </h4>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  {dbStatus?.connected 
                    ? `Connected & Synced with database cluster: "${dbStatus.dbName}"`
                    : 'Running in Local Backup Mode (JSON storage fallback). Connect to MongoDB Atlas via MONGODB_URI.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
                {dbStatus?.connected ? 'Connected' : 'Local Fallback'}
              </span>
            </div>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-stone-900 border border-stone-800 p-5 rounded-lg">
              <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest mb-1">Total Revenue</p>
              <h3 className="text-2xl font-mono font-bold text-amber-500">{report.totalRevenue.toLocaleString()} ETB</h3>
              <p className="text-[10px] text-emerald-500 font-mono flex items-center mt-2 gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% vs last week</span>
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-5 rounded-lg">
              <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest mb-1">Orders Count</p>
              <h3 className="text-2xl font-mono font-bold text-stone-200">{report.totalOrders} Completed</h3>
              <p className="text-[10px] text-stone-500 font-mono mt-2">100% automated invoicing</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-5 rounded-lg">
              <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest mb-1">Customers Database</p>
              <h3 className="text-2xl font-mono font-bold text-stone-200">{report.totalCustomers} Accounts</h3>
              <p className="text-[10px] text-stone-500 font-mono mt-2">Durable cloud state saved</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-5 rounded-lg">
              <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest mb-1">Low Stock Alerts</p>
              <h3 className="text-2xl font-mono font-bold text-red-500">
                {allProducts.filter(p => p.inventory < 5).length} Items
              </h3>
              <p className="text-[10px] text-red-400 font-mono flex items-center mt-2 gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Needs restocking</span>
              </p>
            </div>
          </div>

          {/* Recharts Graphical Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Daily Revenue Area chart */}
            <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-lg p-5">
              <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-6">Daily Revenue Growth (ETB)</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.dailyRevenue}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#444', color: '#fff', fontSize: 11 }} />
                    <Area type="monotone" dataKey="sales" stroke="#d97706" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category bar chart */}
            <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-lg p-5">
              <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-6">Sales Revenue by Category</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#444', color: '#fff', fontSize: 11 }} />
                    <Bar dataKey="revenue" fill="#d97706">
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sales Analytics (Last 30 Days) Section */}
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-800 pb-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest">
                  {currentLang === 'en' ? 'Sales Analytics (Last 30 Days)' : 'የሽያጭ ትንታኔ (ያለፉት 30 ቀናት)'}
                </h4>
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                  {currentLang === 'en' ? 'Detailed revenue and product units tracking' : 'ዝርዝር የገቢ እና የምርት ሽያጭ ክትትል'}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="block text-[9px] font-mono text-stone-500 uppercase tracking-wider">{currentLang === 'en' ? '30-Day Revenue' : 'የ30 ቀን ገቢ'}</span>
                  <span className="text-xs font-mono font-bold text-amber-500">
                    {(report.last30DaysSales ? report.last30DaysSales.reduce((sum, d) => sum + d.revenue, 0) : 0).toLocaleString()} ETB
                  </span>
                </div>
                <div className="text-right border-l border-stone-800 pl-4">
                  <span className="block text-[9px] font-mono text-stone-500 uppercase tracking-wider">{currentLang === 'en' ? '30-Day Units Sold' : 'የ30 ቀን ሽያጭ ብዛት'}</span>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    {report.last30DaysSales ? report.last30DaysSales.reduce((sum, d) => sum + d.unitsSold, 0) : 0} {currentLang === 'en' ? 'items' : 'ምርቶች'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-950 p-4 rounded-lg border border-stone-850">
              {/* Card 1: Active Users */}
              <div className="flex items-start space-x-3.5">
                <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                    {currentLang === 'en' ? 'Active Users' : 'ንቁ ተጠቃሚዎች'}
                  </span>
                  <span className="text-base font-mono font-bold text-stone-200">
                    {users.filter(u => u.status !== 'suspended').length}
                  </span>
                  <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                    {currentLang === 'en' ? `Out of ${users.length} registered accounts` : `ከጠቅላላ ${users.length} ምዝገባዎች`}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Orders Today */}
              <div className="flex items-start space-x-3.5 border-t md:border-t-0 md:border-l border-stone-850 pt-3.5 md:pt-0 md:pl-6">
                <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400 mt-0.5">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                    {currentLang === 'en' ? "Today's Orders" : "የዛሬ ትዕዛዞች"}
                  </span>
                  <span className="text-base font-mono font-bold text-stone-200">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const ordersToday = orders.filter(o => new Date(o.createdAt) >= today);
                      return ordersToday.length;
                    })()}
                  </span>
                  <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const ordersToday = orders.filter(o => new Date(o.createdAt) >= today);
                      const revenueToday = ordersToday.reduce((sum, o) => sum + o.total, 0);
                      return currentLang === 'en' 
                        ? `${revenueToday.toLocaleString()} ETB processed` 
                        : `${revenueToday.toLocaleString()} ብር ተከፍሏል`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Card 3: Low-Stock Alerts */}
              <div className="flex items-start space-x-3.5 border-t md:border-t-0 md:border-l border-stone-850 pt-3.5 md:pt-0 md:pl-6">
                {(() => {
                  const lowStockCount = allProducts.filter(p => p.inventory < 5).length;
                  const hasLowStock = lowStockCount > 0;
                  return (
                    <>
                      <div className={`p-2 rounded border mt-0.5 ${hasLowStock ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                          {currentLang === 'en' ? 'Stock Alerts' : 'የክምችት ማንቂያዎች'}
                        </span>
                        <span className={`text-base font-mono font-bold ${hasLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                          {lowStockCount} {currentLang === 'en' ? 'Low Stock' : 'ዝቅተኛ ክምችት'}
                        </span>
                        <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                          {hasLowStock 
                            ? (currentLang === 'en' ? 'Restocking required immediately' : 'እባክዎ በአስቸኳይ ይተኩ')
                            : (currentLang === 'en' ? 'All products fully stocked' : 'ሁሉም ምርቶች በበቂ ሁኔታ አሉ')}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 30-Day Revenue Chart */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-mono font-semibold text-stone-400 uppercase tracking-wider">
                  {currentLang === 'en' ? '30-Day Revenue Trend (ETB)' : 'የ30 ቀን የገቢ ሁኔታ (ETB)'}
                </h5>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.last30DaysSales || []}>
                      <defs>
                        <linearGradient id="colorSales30" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888" 
                        fontSize={9} 
                        tickFormatter={(tick, index) => (index % 5 === 0 ? tick : '')} 
                      />
                      <YAxis stroke="#888" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#444', color: '#fff', fontSize: 11 }} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#d97706" 
                        fillOpacity={1} 
                        fill="url(#colorSales30)" 
                        strokeWidth={2} 
                        name={currentLang === 'en' ? 'Revenue' : 'ገቢ'} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 30-Day Units Sold Chart */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-mono font-semibold text-stone-400 uppercase tracking-wider">
                  {currentLang === 'en' ? '30-Day Units Sold (Items)' : 'የ30 ቀን የተሸጡ ምርቶች ብዛት'}
                </h5>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.last30DaysSales || []}>
                      <defs>
                        <linearGradient id="colorUnits30" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888" 
                        fontSize={9} 
                        tickFormatter={(tick, index) => (index % 5 === 0 ? tick : '')} 
                      />
                      <YAxis stroke="#888" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#444', color: '#fff', fontSize: 11 }} />
                      <Area 
                        type="monotone" 
                        dataKey="unitsSold" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorUnits30)" 
                        strokeWidth={2} 
                        name={currentLang === 'en' ? 'Units Sold' : 'የተሸጡ ምርቶች'} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Products KPI list */}
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-5">
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-4">Top Performing Products</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-400">
                <thead className="bg-stone-950 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Quantity Sold</th>
                    <th className="p-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {report.popularProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-900/50">
                      <td className="p-3 font-bold text-stone-200">{p.name}</td>
                      <td className="p-3">{p.quantity} items</td>
                      <td className="p-3 text-right text-amber-500 font-mono font-bold">{p.revenue.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Sales & Category Analytics Visual Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Revenue Trends */}
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest">
                    {currentLang === 'en' ? 'Monthly Revenue Trends' : 'የወርሃዊ ገቢ አዝማሚያዎች'}
                  </h4>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {currentLang === 'en' ? '6-Month chronological revenue overview' : 'የ6 ወር ተከታታይ የገቢ አጠቃላይ እይታ'}
                  </p>
                </div>
                <div className="bg-purple-500/10 text-purple-400 font-mono text-[10px] px-2.5 py-1 rounded border border-purple-500/20 uppercase font-bold tracking-wider">
                  {currentLang === 'en' ? '6-Month Trend' : 'የ6-ወር አዝማሚያ'}
                </div>
              </div>
              
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="colorMonthlyRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                    <XAxis dataKey="month" stroke="#888" fontSize={11} />
                    <YAxis 
                      stroke="#888" 
                      fontSize={11} 
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#444', color: '#fff', fontSize: 11 }}
                      formatter={(value: any) => [`${Number(value).toLocaleString()} ETB`, currentLang === 'en' ? 'Revenue' : 'ገቢ']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorMonthlyRev)" 
                      strokeWidth={2.5} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performing Product Categories */}
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest">
                    {currentLang === 'en' ? 'Category Revenue Distribution' : 'የምርት ዓይነቶች የገቢ ክፍፍል'}
                  </h4>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {currentLang === 'en' ? 'Revenue share across major leather categories' : 'በዋና ዋና የቆዳ ውጤቶች ላይ የተከፋፈለ የገቢ ድርሻ'}
                  </p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] px-2.5 py-1 rounded border border-emerald-500/20 uppercase font-bold tracking-wider">
                  {currentLang === 'en' ? 'Market Share' : 'የገበያ ድርሻ'}
                </div>
              </div>

              <div className="h-[280px] w-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="h-[200px] w-[200px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="revenue"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1917', borderColor: '#444', color: '#fff', fontSize: 11 }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} ETB`, currentLang === 'en' ? 'Revenue' : 'ገቢ']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">{currentLang === 'en' ? 'Total Sales' : 'ጠቅላላ ሽያጭ'}</span>
                    <span className="text-[11px] font-mono font-bold text-stone-200">
                      {(categoryChartData.reduce((sum, entry) => sum + entry.revenue, 0)).toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-col gap-2 max-w-xs text-xs font-sans w-full sm:w-auto">
                  {categoryChartData.map((entry, index) => {
                    const totalSales = categoryChartData.reduce((sum, item) => sum + item.revenue, 0) || 1;
                    const percent = ((entry.revenue / totalSales) * 100).toFixed(1);
                    return (
                      <div key={entry.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: chartColors[index % chartColors.length] }} 
                          />
                          <span className="font-semibold text-stone-300 truncate max-w-[100px]">{entry.name}</span>
                        </div>
                        <div className="font-mono text-[10px] text-stone-400 flex items-center space-x-2 shrink-0">
                          <span>{percent}%</span>
                          <span className="text-stone-700">|</span>
                          <span className="text-stone-500">{entry.revenue.toLocaleString()} ETB</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab Panel: Products and Inventory */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
            <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest">Product Catalog & Inventory Levels</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-emerald-700 hover:bg-emerald-600 text-stone-100 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 border border-emerald-800 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Export Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setParsedProducts([]);
                  setBulkImportText('');
                  setBulkImportError('');
                  setBulkImportSuccess('');
                  setShowBulkImport(!showBulkImport);
                  setShowProductForm(false);
                }}
                className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors ${
                  showBulkImport 
                    ? 'bg-amber-600 text-stone-950 font-bold' 
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Bulk Import</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    nameEn: '', nameAm: '', descriptionEn: '', descriptionAm: '',
                    priceETB: 0, category: 'Leather Bags', inventory: 10,
                    sizeInventory: {},
                    featuresEn: [], featuresAm: [], sizes: [], colorsEn: [], colorsAm: [],
                    images: []
                  });
                  setShowProductForm(true);
                  setShowBulkImport(false);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                + Create Product
              </button>
            </div>
          </div>

          {/* Bulk Import Section */}
          {showBulkImport && (
            <div className="bg-stone-950 p-6 rounded-lg border border-amber-500/10 space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-mono font-bold text-amber-500 uppercase flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <span>Bulk Product Importer</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Import a CSV or JSON file of product data to update the local memory and Firestore database collections in bulk.
                </p>
              </div>

              {/* Format tab selector */}
              <div className="flex space-x-2 border-b border-stone-800 pb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBulkImportFormat('json');
                    setParsedProducts([]);
                    setBulkImportError('');
                    setBulkImportSuccess('');
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                    bulkImportFormat === 'json' ? 'bg-amber-600/15 text-amber-500 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  JSON Format
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkImportFormat('csv');
                    setParsedProducts([]);
                    setBulkImportError('');
                    setBulkImportSuccess('');
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                    bulkImportFormat === 'csv' ? 'bg-amber-600/15 text-amber-500 border border-amber-500/30' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  CSV Format
                </button>
              </div>

              {/* Instructions and templates */}
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-mono font-bold text-stone-300 uppercase tracking-wider">
                    {bulkImportFormat === 'json' ? 'Required JSON Schema' : 'Required CSV Column Header Pattern'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleText = bulkImportFormat === 'json' 
                        ? `[\n  {\n    "nameEn": "Elite Leather Wallet",\n    "nameAm": "ጥራት ያለው የኪስ ቦርሳ",\n    "descriptionEn": "Genuine Ethiopian sheepskin leather wallet.",\n    "descriptionAm": "ከኢትዮጵያ በግ ቆዳ የተሰራ እውነተኛ የኪስ ቦርሳ።",\n    "priceETB": 1500,\n    "category": "Leather Bags",\n    "inventory": 50,\n    "images": ["https://picsum.photos/seed/wallet/800/600"],\n    "featuresEn": ["6 card slots", "Coin pocket"],\n    "featuresAm": ["6 የመታወቂያ ማስቀመጫዎች", "የሳንቲም ኪስ"]\n  }\n]`
                        : `nameEn,nameAm,descriptionEn,descriptionAm,priceETB,category,inventory,images,featuresEn,featuresAm\n"Elite Leather Wallet","ጥራት ያለው የኪስ ቦርሳ","Genuine Ethiopian sheepskin leather wallet.","ከኢትዮጵያ በግ ቆዳ የተሰራ እውነተኛ የኪስ ቦርሳ።",1500,"Leather Bags",50,"https://picsum.photos/seed/wallet/800/600","6 card slots;Coin pocket","6 የመታወቂያ ማስቀመጫዎች;የሳንቲም ኪስ"`;
                      navigator.clipboard.writeText(sampleText);
                      alert(currentLang === 'en' ? 'Template copied to clipboard!' : 'ምሳሌው ወደ ቅንጥብ ሰሌዳ ተገልብጧል!');
                    }}
                    className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-200 px-2 py-1 rounded cursor-pointer font-bold uppercase transition-colors"
                  >
                    Copy Example Template
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  {bulkImportFormat === 'json' 
                    ? 'Provide a valid JSON Array containing product objects. Optional arrays featuresEn, featuresAm, images can be included.'
                    : 'The first line must contain standard headers. Array fields like featuresEn, featuresAm, and images must be semicolon-separated (e.g. "feature 1;feature 2").'}
                </p>
                <pre className="text-[10px] font-mono text-stone-400 bg-stone-950 p-2.5 rounded border border-stone-850 overflow-x-auto whitespace-pre">
                  {bulkImportFormat === 'json' 
                    ? `[\n  {\n    "nameEn": "Elite Leather Wallet",\n    "nameAm": "ጥራት ያለው የኪስ ቦርሳ",\n    "priceETB": 1500,\n    "category": "Leather Bags",\n    "inventory": 50\n  }\n]`
                    : 'nameEn,nameAm,descriptionEn,descriptionAm,priceETB,category,inventory,images,featuresEn,featuresAm'}
                </pre>
              </div>

              {/* Upload Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('bulkFileSelect')?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900/20'
                }`}
              >
                <input
                  type="file"
                  id="bulkFileSelect"
                  accept={bulkImportFormat === 'json' ? '.json' : '.csv'}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <RefreshCw className={`w-8 h-8 text-stone-500 mb-2 ${dragActive ? 'text-amber-500 animate-spin-slow' : ''}`} />
                <p className="text-xs font-semibold text-stone-300">
                  {currentLang === 'en' ? 'Drag and drop file here, or click to browse' : 'ፋይሉን እዚህ ይጎትቱ እና ይጣሉ፣ ወይም ለመምረጥ እዚህ ይጫኑ'}
                </p>
                <p className="text-[10px] text-stone-500 mt-1 uppercase font-mono">
                  {bulkImportFormat === 'json' ? 'Accepts .json only' : 'Accepts .csv only'}
                </p>
              </div>

              {/* Direct Paste Text Area */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-stone-500 uppercase">Or Paste Raw Data Text Directly</label>
                <textarea
                  rows={6}
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder={
                    bulkImportFormat === 'json' 
                      ? '[\n  { "nameEn": "Premium Item", "nameAm": "ምርጥ ምርት", "priceETB": 2300, "category": "Leather Bags", "inventory": 12 }\n]' 
                      : 'nameEn,nameAm,priceETB,category,inventory\n"Premium Item","ምርጥ ምርት",2300,"Leather Bags",12'
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 font-mono focus:outline-none focus:border-amber-500/40"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleParseAndPreview(bulkImportText, bulkImportFormat)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 px-3 py-1.5 rounded text-xs font-bold uppercase cursor-pointer"
                  >
                    Parse & Preview
                  </button>
                </div>
              </div>

              {/* Success / Error Messages */}
              {bulkImportError && (
                <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{bulkImportError}</span>
                </div>
              )}

              {bulkImportSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 p-3 rounded text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{bulkImportSuccess}</span>
                </div>
              )}

              {/* Parsed Products Preview List */}
              {parsedProducts.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-stone-850">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                      Parsed Products Preview ({parsedProducts.length} items found)
                    </h4>
                    <span className="text-[10px] text-stone-500 italic">Verify accuracy before final Firestore import</span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-[11px] text-left text-stone-400">
                      <thead className="bg-stone-950 font-mono text-[9px] text-stone-500 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="p-2.5">Name (EN/AM)</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Price</th>
                          <th className="p-2.5">Inventory</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850">
                        {parsedProducts.map((p, index) => {
                          const isValid = p.nameEn && p.priceETB !== undefined && p.category;
                          return (
                            <tr key={index} className="hover:bg-stone-950/40">
                              <td className="p-2.5">
                                <div className="font-semibold text-stone-200">{p.nameEn || 'N/A'}</div>
                                <div className="text-[9px] text-stone-500">{p.nameAm || 'N/A'}</div>
                              </td>
                              <td className="p-2.5">{p.category || 'N/A'}</td>
                              <td className="p-2.5 font-mono text-stone-300">{(p.priceETB || 0).toLocaleString()} ETB</td>
                              <td className="p-2.5 font-mono text-stone-300">{p.inventory ?? 0} items</td>
                              <td className="p-2.5 text-center">
                                {isValid ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-emerald-600/15 border border-emerald-500/20 text-emerald-500 font-bold">
                                    <Check className="w-3 h-3" /> Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-red-600/15 border border-red-500/20 text-red-500 font-bold">
                                    <X className="w-3 h-3" /> Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions to complete import */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setParsedProducts([])}
                      className="border border-stone-800 hover:bg-stone-900 text-stone-400 hover:text-stone-200 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer"
                    >
                      Clear Preview
                    </button>
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={handleExecuteImport}
                      className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-stone-950 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin"></div>
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Firestore Import</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product form overlay / modal */}
          {showProductForm && (
            <form onSubmit={handleCreateOrUpdateProduct} className="bg-stone-950 p-6 rounded-lg border border-amber-500/10 space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap pb-2 border-b border-stone-850">
                <h3 className="text-sm font-mono font-bold text-amber-500 uppercase">
                  {editingProduct ? 'Edit Leather Product Details' : 'Add New Premium Leather Product'}
                </h3>
                <button
                  type="button"
                  disabled={isGeneratingAI || !formData.nameEn}
                  onClick={handleGenerateAIDescriptions}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:text-stone-400 text-stone-100 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-purple-500/10 border border-purple-500/20"
                  title={!formData.nameEn ? "Please enter a Product Name (EN) first" : "Generate luxury product copy instantly"}
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-2 border-stone-100 border-t-transparent animate-spin"></div>
                      <span>Drafting Descriptions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      <span>Generate with AI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Product Name (EN)</label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Product Name (AM)</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAm}
                    onChange={(e) => setFormData({ ...formData, nameAm: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Description (EN)</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Description (AM)</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.descriptionAm}
                    onChange={(e) => setFormData({ ...formData, descriptionAm: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 resize-none"
                  />
                </div>
              </div>

              {/* Features section (interactive semicolon-separated string input) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">
                    Features (EN) <span className="text-[9px] text-stone-600">(Semicolon separated)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.featuresEn ? formData.featuresEn.join('; ') : ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      featuresEn: e.target.value.split(';').map(f => f.trim()).filter(Boolean) 
                    })}
                    placeholder="e.g. 100% Genuine Ethiopian Leather; Durable premium hardware"
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">
                    Features (AM) <span className="text-[9px] text-stone-600">(Semicolon separated)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.featuresAm ? formData.featuresAm.join('; ') : ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      featuresAm: e.target.value.split(';').map(f => f.trim()).filter(Boolean) 
                    })}
                    placeholder="ይጻፉ: 100% እውነተኛ የኢትዮጵያ ቆዳ; ምቹ የውስጥ ክፍል"
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    required
                    value={formData.priceETB}
                    onChange={(e) => setFormData({ ...formData, priceETB: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Stock Inventory</label>
                  <input
                    type="number"
                    required
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  >
                    <option value="Leather Bags">Leather Bags</option>
                    <option value="Wallets">Wallets</option>
                    <option value="Belts">Belts</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Backpacks">Backpacks</option>
                    <option value="Travel Bags">Travel Bags</option>
                    <option value="Handmade Leather Accessories">Handmade Leather Accessories</option>
                  </select>
                </div>
              </div>

              {/* Product Sizes & Size Inventory */}
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest">
                    Product Sizes & Size-specific Stock
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Define sizes and set specific stock levels for each size.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">Add Size</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. S, M, L or 41, 42"
                        value={newAdminSize}
                        onChange={(e) => setNewAdminSize(e.target.value)}
                        className="flex-1 bg-stone-950 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAdminSize.trim()) {
                            const size = newAdminSize.trim();
                            const currentSizes = formData.sizes || [];
                            if (!currentSizes.includes(size)) {
                              const nextSizes = [...currentSizes, size];
                              const nextSizeInv = { ...(formData.sizeInventory || {}), [size]: 0 };
                              setFormData({
                                ...formData,
                                sizes: nextSizes,
                                sizeInventory: nextSizeInv
                              });
                            }
                            setNewAdminSize('');
                          }
                        }}
                        className="bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-300 px-4 py-1.5 text-xs rounded font-bold cursor-pointer transition-colors"
                      >
                        + Add
                      </button>
                    </div>

                    {formData.sizes && formData.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {formData.sizes.map((s, idx) => (
                          <span key={idx} className="bg-stone-950 border border-stone-800 px-2.5 py-0.5 rounded font-mono text-[10px] text-stone-300 flex items-center gap-1.5">
                            {s}
                            <button
                              type="button"
                              onClick={() => {
                                const currentSizes = formData.sizes || [];
                                const nextSizes = currentSizes.filter((_, i) => i !== idx);
                                const nextSizeInv = { ...(formData.sizeInventory || {}) };
                                delete nextSizeInv[s];
                                
                                const nextTotalStock = Object.values(nextSizeInv).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);

                                setFormData({
                                  ...formData,
                                  sizes: nextSizes,
                                  sizeInventory: nextSizeInv,
                                  inventory: nextSizes.length > 0 ? nextTotalStock : formData.inventory
                                });
                              }}
                              className="text-red-500 text-[10px] cursor-pointer hover:text-red-400 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    {formData.sizes && formData.sizes.length > 0 ? (
                      <div className="bg-stone-950/40 border border-stone-850 p-3 rounded space-y-2">
                        <p className="text-[10px] font-mono font-bold text-amber-500 uppercase">
                          Stock per Size
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {formData.sizes.map((s) => (
                            <div key={s} className="flex flex-col gap-1">
                              <span className="text-[10px] font-mono text-stone-500">Size {s}</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={(formData.sizeInventory && formData.sizeInventory[s]) ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const nextSizeInv = { ...(formData.sizeInventory || {}), [s]: val };
                                  const sum = Object.values(nextSizeInv).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
                                  setFormData({
                                    ...formData,
                                    sizeInventory: nextSizeInv,
                                    inventory: sum
                                  });
                                }}
                                className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-200 font-mono focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-stone-500 italic mt-1">
                          * Setting size stocks will automatically sum up and update the overall "Stock Inventory" input above.
                        </p>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center p-4 bg-stone-950/20 border border-stone-850/60 border-dashed rounded text-stone-500 text-[11px] text-center font-mono">
                        No sizes defined yet. Add some sizes on the left to configure size-specific stock.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Media Assets Section */}
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest">
                    Product Media & Images
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Upload high-quality images of your genuine leather goods or paste external reference URLs.
                  </p>
                </div>

                {/* Upload Zone */}
                <div
                  onDragEnter={handleImageDrag}
                  onDragOver={handleImageDrag}
                  onDragLeave={handleImageDrag}
                  onDrop={handleImageDrop}
                  onClick={() => document.getElementById('productImageSelect')?.click()}
                  className={`border border-dashed rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    imageDragActive ? 'border-amber-500 bg-amber-500/5' : 'border-stone-800 hover:border-stone-700 hover:bg-stone-950/40'
                  }`}
                >
                  <input
                    type="file"
                    id="productImageSelect"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProductImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center py-2">
                      <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-2"></div>
                      <p className="text-[11px] font-mono font-bold text-amber-500 uppercase">Uploading image file...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-stone-500 mb-1.5" />
                      <p className="text-xs font-semibold text-stone-300">
                        {currentLang === 'en' ? 'Drag and drop image here, or click to browse' : 'ምስሉን እዚህ ይጎትቱ እና ይጣሉ፣ ወይም ለመምረጥ እዚህ ይጫኑ'}
                      </p>
                      <p className="text-[9px] text-stone-500 mt-0.5 uppercase font-mono">
                        Supports PNG, JPG, JPEG, WEBP up to 10MB
                      </p>
                    </>
                  )}
                </div>

                {/* Or Paste Manual URL */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono text-stone-500 uppercase">Or Add Image via Public Web URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="https://example.com/leather-bag-image.jpg"
                      className="flex-1 bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImageUrl}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors animate-fadeIn"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Preview Gallery */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-mono text-stone-500 uppercase font-bold text-stone-400">Current Product Images ({formData.images?.length || 0})</label>
                  {formData.images && formData.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {formData.images.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded bg-stone-950 border border-stone-850 overflow-hidden shadow-sm">
                          <img
                            src={url}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="bg-red-600 hover:bg-red-500 text-white rounded p-1.5 transition-colors cursor-pointer"
                              title="Delete Image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {i === 0 && (
                            <span className="absolute bottom-1 right-1 bg-amber-500 text-stone-950 text-[8px] font-mono font-bold px-1 py-0.5 rounded uppercase">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-stone-850 rounded p-4 text-center bg-stone-950/20">
                      <Image className="w-5 h-5 text-stone-600 mx-auto mb-1" />
                      <p className="text-[11px] text-stone-500 italic">No images uploaded yet. A premium generic leather asset will represent this item.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                  className="border border-stone-800 hover:bg-stone-900 text-stone-400 px-5 py-2 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Bulk Selection Actions Bar */}
          {selectedProductIds.length > 0 && (
            <div className="bg-amber-600/10 border border-amber-500/20 rounded-lg p-3.5 flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-500">
                <Check className="w-4 h-4" />
                <span className="font-bold">
                  {currentLang === 'en' 
                    ? `${selectedProductIds.length} products selected` 
                    : `${selectedProductIds.length} ምርቶች ተመርጠዋል`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {currentLang === 'en' ? 'Deselect All' : 'ምርጫውን ሰርዝ'}
                </button>
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={handleBulkDeleteProducts}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isBulkDeleting 
                      ? (currentLang === 'en' ? 'Deleting...' : 'በማጥፋት ላይ...') 
                      : (currentLang === 'en' ? 'Delete Selected' : 'የተመረጡትን አጥፋ')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-400">
                <thead className="bg-stone-950 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={allProducts.length > 0 && selectedProductIds.length === allProducts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(allProducts.map(p => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Inventory Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {allProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <tr key={p.id} className={`hover:bg-stone-950/40 ${isSelected ? 'bg-amber-500/5' : ''}`}>
                        <td className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(prev => [...prev, p.id]);
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-stone-200">{p.nameEn}</td>
                        <td className="p-3">{p.category}</td>
                        <td className="p-3 font-mono text-amber-500">{p.priceETB.toLocaleString()} ETB</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center space-x-1.5 font-mono font-bold ${
                            p.inventory === 0 ? 'text-red-500' : p.inventory < 5 ? 'text-amber-500' : 'text-stone-300'
                          }`}>
                            <span>{p.inventory} units</span>
                            {p.inventory < 5 && <AlertTriangle className="w-3.5 h-3.5" />}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setFormData(p);
                              setShowProductForm(true);
                            }}
                            className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-500 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-red-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back in stock waitlist sub-panel */}
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 mt-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>Restock Notification Waitlist ({waitlistSubs.length})</span>
                </h3>
                <p className="text-[10px] text-stone-500 mt-1">Customers who registered to be notified when out-of-stock items return.</p>
              </div>
              {waitlistSubs.length > 0 && (
                <button
                  onClick={handleClearSubscriptions}
                  className="bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/40 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear Waitlist
                </button>
              )}
            </div>

            {loadingSubs ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-stone-800 border-t-amber-500 animate-spin"></div>
              </div>
            ) : waitlistSubs.length === 0 ? (
              <p className="text-[11px] text-stone-500 italic py-4">No active restock waitlist requests at this time.</p>
            ) : (
              <div className="overflow-x-auto border border-stone-800/60 rounded">
                <table className="w-full text-xs text-left text-stone-400">
                  <thead className="bg-stone-950 font-mono text-[9px] text-stone-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Email Recipient</th>
                      <th className="p-2.5">Requested Product</th>
                      <th className="p-2.5">Subscribed At</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {waitlistSubs.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-stone-950/20 text-[11px]">
                        <td className="p-2.5 text-stone-200 font-sans">{sub.email}</td>
                        <td className="p-2.5 font-sans">
                          <span className="text-stone-300 font-semibold">{sub.productNameEn}</span>
                          <span className="text-stone-500 text-[10px] block font-sans">{sub.productNameAm}</span>
                        </td>
                        <td className="p-2.5 text-stone-400 text-[10px]">
                          {new Date(sub.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          {sub.notified ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" title={`Notified at: ${new Date(sub.notifiedAt).toLocaleString()}`}>
                              NOTIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-900/40">
                              PENDING
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab Panel: Orders Processing */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-sm font-mono font-bold text-stone-400 uppercase tracking-widest mb-4">Customer Orders Queue</h2>

          {loadingOrders ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-amber-500 animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-6">No customer orders found in queue.</p>
          ) : (
            <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-stone-400">
                  <thead className="bg-stone-950 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Order ID / Customer</th>
                      <th className="p-3">Items Count</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Payment status</th>
                      <th className="p-3">Delivery status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-950/40">
                        <td className="p-3">
                          <p className="font-bold text-stone-200">{ord.userName}</p>
                          <p className="text-[10px] text-stone-500 font-mono">ID: {ord.id} | {ord.shippingAddress.phone}</p>
                        </td>
                        <td className="p-3">{ord.items.reduce((sum, i) => sum + i.quantity, 0)} items</td>
                        <td className="p-3 font-mono font-bold text-stone-300">{ord.total.toLocaleString()} ETB</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            ord.paymentStatus === 'completed' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-600/10 border-amber-500/20 text-amber-500'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-[10px] uppercase text-stone-300">
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {ord.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleUpdatePaymentStatus(ord.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Confirm Paid
                            </button>
                          )}
                          {ord.orderStatus === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Pack Items
                            </button>
                          )}
                          {ord.orderStatus === 'processing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                              className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Ship Order
                            </button>
                          )}
                          {ord.orderStatus === 'shipped' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Deliver Order
                            </button>
                          )}
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

      {/* Tab Panel: Promotions */}
      {activeTab === 'promos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create Promo coupon form */}
          <div className="lg:col-span-5 bg-stone-900 border border-stone-800 p-5 rounded-lg space-y-4">
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-2">Create New Campaign Code</h4>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200 uppercase"
                  placeholder="e.g. SHEGER20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={90}
                  value={newPromoDiscount}
                  onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Campaign Description (EN)</label>
                <input
                  type="text"
                  required
                  value={newPromoDescEn}
                  onChange={(e) => setNewPromoDescEn(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200"
                  placeholder="e.g. 20% Off summer jackets"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Campaign Description (AM)</label>
                <input
                  type="text"
                  required
                  value={newPromoDescAm}
                  onChange={(e) => setNewPromoDescAm(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-xs text-stone-200"
                  placeholder="e.g. የ20% የክረምት ቅናሽ በጃኬቶች"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-3 rounded font-sans font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Launch Campaign Code
              </button>
            </form>
          </div>

          {/* Active Promo codes list */}
          <div className="lg:col-span-7 bg-stone-900 border border-stone-800 p-5 rounded-lg">
            <h4 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-widest mb-4">Active Campaigns list</h4>
            <div className="space-y-3">
              {promos.map((pr) => (
                <div key={pr.code} className="bg-stone-950 border border-stone-850 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="bg-amber-600/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-bold px-2 py-1 rounded">
                      {pr.code}
                    </span>
                    <p className="text-xs text-stone-300 mt-2">{pr.descriptionEn}</p>
                    <p className="text-xs text-stone-500 italic mt-0.5">{pr.descriptionAm}</p>
                  </div>

                  <span className="text-lg font-mono font-bold text-emerald-500">
                    -{pr.discountPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab Panel: User Management */}
      {activeTab === 'users' && (() => {
        const userLangText = {
          title: currentLang === 'en' ? 'User Accounts' : 'የተጠቃሚዎች አስተዳደር',
          subtitle: currentLang === 'en' ? 'Manage user roles, account permissions, and active status.' : 'የተጠቃሚ ሚናዎችን፣ የልዩ መብቶችን እና የገባሪነት ሁኔታን ያስተዳድሩ።',
          searchPlaceholder: currentLang === 'en' ? 'Search user by name or email...' : 'ተጠቃሚን በስም ወይም በኢሜይል ይፈልጉ...',
          colUser: currentLang === 'en' ? 'User Info' : 'የተጠቃሚ መረጃ',
          colRole: currentLang === 'en' ? 'System Role' : 'የስርዓት ሚና',
          colStatus: currentLang === 'en' ? 'Account Status' : 'የመለያ ሁኔታ',
          colOrders: currentLang === 'en' ? 'Orders Count' : 'የትዕዛዞች ብዛት',
          colSpent: currentLang === 'en' ? 'Total Spent' : 'ጠቅላላ ወጪ',
          colActions: currentLang === 'en' ? 'Manage Actions' : 'ድርጊቶች አስተዳደር',
          badgeAdmin: currentLang === 'en' ? 'Administrator' : 'አስተዳዳሪ',
          badgeCustomer: currentLang === 'en' ? 'Customer' : 'ደንበኛ',
          statusActive: currentLang === 'en' ? 'Active' : 'ገባሪ',
          statusSuspended: currentLang === 'en' ? 'Suspended' : 'የታገደ',
          btnMakeAdmin: currentLang === 'en' ? 'Make Admin' : 'አስተዳዳሪ አድርግ',
          btnMakeCustomer: currentLang === 'en' ? 'Make Customer' : 'ደንበኛ አድርግ',
          btnSuspend: currentLang === 'en' ? 'Suspend' : 'አግድ',
          btnActivate: currentLang === 'en' ? 'Activate' : 'አግብር',
          noUsers: currentLang === 'en' ? 'No users matching your query.' : 'ምንም የተመዘገቡ ተጠቃሚዎች አልተገኙም።',
        };

        const filteredUsers = users.filter(user => {
          const q = userSearchQuery.toLowerCase();
          return (
            (user.name || '').toLowerCase().includes(q) ||
            (user.email || '').toLowerCase().includes(q)
          );
        });

        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-sans font-bold text-stone-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>{userLangText.title}</span>
                </h2>
                <p className="text-xs text-stone-400 mt-1">{userLangText.subtitle}</p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder={userLangText.searchPlaceholder}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 pl-9 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                />
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {loadingUsers ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-amber-500 animate-spin"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-6 text-center bg-stone-900/30 rounded-lg border border-stone-800">
                {userLangText.noUsers}
              </p>
            ) : (
              <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-stone-400">
                    <thead className="bg-stone-950 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">{userLangText.colUser}</th>
                        <th className="p-3.5">{userLangText.colRole}</th>
                        <th className="p-3.5">{userLangText.colStatus}</th>
                        <th className="p-3.5">{userLangText.colOrders}</th>
                        <th className="p-3.5">{userLangText.colSpent}</th>
                        <th className="p-3.5 text-right">{userLangText.colActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {filteredUsers.map((u) => {
                        const uOrders = (u as any).orderCount || 0;
                        const uSpent = (u as any).totalSpent || 0;
                        const uStatus = u.status || 'active';
                        return (
                          <tr key={u.id} className="hover:bg-stone-950/40 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-stone-200">{u.name}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{u.email}</div>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                u.role === 'admin' 
                                  ? 'bg-amber-600/10 border-amber-500/20 text-amber-500' 
                                  : u.role === 'seller'
                                    ? 'bg-purple-600/10 border-purple-500/20 text-purple-400'
                                    : 'bg-stone-800 border-stone-700 text-stone-400'
                              }`}>
                                {u.role === 'admin' ? (
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                ) : null}
                                <span>
                                  {u.role === 'admin' 
                                    ? userLangText.badgeAdmin 
                                    : u.role === 'seller' 
                                      ? (currentLang === 'en' ? 'Seller' : 'ሻጭ')
                                      : userLangText.badgeCustomer
                                  }
                                </span>
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1.5 font-semibold text-[10px] uppercase ${
                                uStatus === 'active' ? 'text-emerald-500' : 'text-red-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  uStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                                }`} />
                                <span>{uStatus === 'active' ? userLangText.statusActive : userLangText.statusSuspended}</span>
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-stone-300">
                              {uOrders} {currentLang === 'en' ? 'orders' : 'ትዕዛዞች'}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-stone-200">
                              {uSpent.toLocaleString()} ETB
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                              {/* Role management toggle buttons */}
                              <div className="inline-flex items-center gap-1 mr-2 border border-stone-850 bg-stone-950/60 p-0.5 rounded">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUser(u.id, 'customer', uStatus)}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                                    u.role === 'customer'
                                      ? 'bg-stone-850 text-stone-200'
                                      : 'text-stone-500 hover:text-stone-300'
                                  }`}
                                >
                                  Cust
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUser(u.id, 'seller', uStatus)}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                    u.role === 'seller'
                                      ? 'bg-purple-600/20 text-purple-400'
                                      : 'text-stone-500 hover:text-purple-400'
                                  }`}
                                >
                                  Sell
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUser(u.id, 'admin', uStatus)}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                    u.role === 'admin'
                                      ? 'bg-amber-600/20 text-amber-500'
                                      : 'text-stone-500 hover:text-amber-500'
                                  }`}
                                >
                                  Adm
                                </button>
                              </div>

                              {/* Account suspension/activation button */}
                              {uStatus === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUser(u.id, u.role, 'suspended')}
                                  className="bg-red-600/15 hover:bg-red-600 border border-red-500/25 hover:border-transparent text-red-400 hover:text-white px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer transition-all inline-block"
                                >
                                  {userLangText.btnSuspend}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUser(u.id, u.role, 'active')}
                                  className="bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/25 hover:border-transparent text-emerald-400 hover:text-white px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer transition-all inline-block"
                                >
                                  {userLangText.btnActivate}
                                </button>
                              )}

                              {/* Delete User Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="bg-red-600/15 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-400 hover:text-white p-1.5 rounded cursor-pointer transition-all inline-flex items-center justify-center ml-2 align-middle"
                                title={currentLang === 'en' ? 'Delete User' : 'ተጠቃሚ ሰርዝ'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'alerts' && (
        <div className="space-y-8">
          {/* Header section */}
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg">
            <h2 className="text-lg font-bold text-stone-200">
              {currentLang === 'en' ? 'Email & SMS Notifications' : 'የኢሜይል እና የኤስኤምኤስ ማሳወቂያዎች'}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {currentLang === 'en' 
                ? 'Configure automated SMTP and SMS integrations for critical inventory warnings and customer tracking.' 
                : 'አስቸኳይ የክምችት ማስጠንቀቂያዎችን እና የደንበኛ መከታተያዎችን በኢሜይል ወይም በኤስኤምኤስ ለመላክ እዚህ ያዋቅሩ።'}
            </p>
          </div>

          {/* Grid Layout for Configuration Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* General Alert Settings Card */}
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-6">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <span>{currentLang === 'en' ? 'General Settings' : 'አጠቃላይ ቅንብሮች'}</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block">
                      {currentLang === 'en' ? 'Low Stock Email Alerts' : 'የአነስተኛ ክምችት ማስጠንቀቂያዎች'}
                    </label>
                    <span className="text-[10px] text-stone-500">
                      {currentLang === 'en' ? 'Dispatch automated email to Admin on low-stock.' : 'ዕቃዎች ሲያልቁ ለአድሚን በኢሜይል ማሳወቂያ ይላክ።'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertSettings.enabled}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    {currentLang === 'en' ? 'Stock Warning Threshold' : 'የዝቅተኛ ክምችት ወሰን ቁጥር'}
                  </label>
                  <input
                    type="number"
                    value={alertSettings.threshold}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    {currentLang === 'en' ? 'Administrator Email Address' : 'የአድሚን ኢሜይል አድራሻ'}
                  </label>
                  <input
                    type="email"
                    value={alertSettings.adminEmail}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    placeholder="admin@ethiopianleather.com"
                  />
                </div>
              </div>
            </div>

            {/* Customer Tracking Preferences Card */}
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-6">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2 text-amber-500">
                <ShieldCheck className="w-4 h-4" />
                <span>{currentLang === 'en' ? 'SMS Notifications' : 'የኤስኤምኤስ ማሳወቂያዎች'}</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block">
                      {currentLang === 'en' ? 'Enable Admin SMS Warnings' : 'ለአድሚን የኤስኤምኤስ ማስጠንቀቂያ'}
                    </label>
                    <span className="text-[10px] text-stone-500">
                      {currentLang === 'en' ? 'Send low stock SMS alert to administrator handset.' : 'ክምችት ሲያልቅ ለአድሚን በኤስኤምኤስ ያሳውቁ።'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertSettings.smsEnabled}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block">
                      {currentLang === 'en' ? 'Enable Customer SMS Updates' : 'ለደንበኞች የኤስኤምኤስ ማሳወቂያ'}
                    </label>
                    <span className="text-[10px] text-stone-500">
                      {currentLang === 'en' ? 'Send SMS to customers on checkout & status updates.' : 'ደንበኞች ትዕዛዝ ሲያስገቡና ደረጃው ሲቀየር በኤስኤምኤስ ያሳውቁ።'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertSettings.customerSmsEnabled}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, customerSmsEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    {currentLang === 'en' ? 'Administrator Phone Number' : 'የአድሚን ስልክ ቁጥር'}
                  </label>
                  <input
                    type="text"
                    value={alertSettings.adminPhone}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, adminPhone: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="+251911223344"
                  />
                </div>
              </div>
            </div>

            {/* Custom SMTP Configuration */}
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-6">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2 text-purple-400">
                <Mail className="w-4 h-4" />
                <span>{currentLang === 'en' ? 'Custom SMTP Mailer Gateway' : 'የSMTP ማይለር መውጫ ቅንብሮች'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">
                    {currentLang === 'en' ? 'SMTP Outgoing Host Server' : 'SMTP አገልጋይ አድራሻ (Host)'}
                  </label>
                  <input
                    type="text"
                    value={alertSettings.smtpHost}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">
                    {currentLang === 'en' ? 'SMTP Server Port' : 'SMTP ወደብ ቁጥር (Port)'}
                  </label>
                  <input
                    type="number"
                    value={alertSettings.smtpPort}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="587"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={alertSettings.smtpSecure}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-purple-600 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="smtpSecure" className="text-xs font-bold text-stone-300 cursor-pointer">
                    {currentLang === 'en' ? 'Use SSL / TLS (Secure)' : 'SSL / TLS ጥበቃ ተጠቀም'}
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">
                    {currentLang === 'en' ? 'SMTP Authentication Username' : 'የSMTP ተጠቃሚ ስም (User)'}
                  </label>
                  <input
                    type="text"
                    value={alertSettings.smtpUser}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="alerts@ethiopianleather.com"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">
                    {currentLang === 'en' ? 'SMTP Authentication Password' : 'የSMTP ማለፊያ ቃል (Pass)'}
                  </label>
                  <input
                    type="password"
                    value={alertSettings.smtpPass}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="••••••••••••••••"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">
                    {currentLang === 'en' ? 'Sender Email Address (From)' : 'የላኪ ኢሜይል አድራሻ (From)'}
                  </label>
                  <input
                    type="text"
                    value={alertSettings.smtpFrom}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smtpFrom: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="alerts@ethiopianleather.com"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <p className="text-[10px] text-amber-500/90 bg-amber-500/5 p-3 rounded border border-amber-500/20 leading-relaxed font-mono">
                    💡 <strong>{currentLang === 'en' ? 'Gmail / Outlook Users' : 'ለጂሜይል / ለአውትሉክ ተጠቃሚዎች'}:</strong><br />
                    {currentLang === 'en'
                      ? 'Standard account passwords are NOT accepted by Google/Microsoft due to security policies. You MUST enable 2-Step Verification and generate a 16-character "App Password" to enter here.'
                      : 'ደህንነትን ለመጠበቅ ሲባል መደበኛ የኢሜይል ማለፊያ ቃል (Password) አይሰራም። በመሆኑም ባለ 2 ደረጃ ማረጋገጫ (2-Step Verification) በማብራት የ"መተግበሪያ ማለፊያ ቃል" (App Password) በማውጣት እዚህ ማስገባት ይኖርብዎታል።'}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom SMS API Configuration */}
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-6">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2 text-purple-400">
                <Database className="w-4 h-4" />
                <span>{currentLang === 'en' ? 'Custom SMS Gateway Integration' : 'የኤስኤምኤስ ጌትዌይ ቅንብሮች'}</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">
                    {currentLang === 'en' ? 'SMS Gateway Provider' : 'የኤስኤምኤስ አገልግሎት አቅራቢ'}
                  </label>
                  <select
                    value={alertSettings.smsProvider}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, smsProvider: e.target.value as any }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="simulated">{currentLang === 'en' ? 'Offline Sandbox / Simulator' : 'የሙከራ ሲሙሌተር'}</option>
                    <option value="twilio">Twilio SMS API Gateway</option>
                    <option value="ethio_telecom">Ethio Telecom SMS Portal (Simulated)</option>
                  </select>
                </div>

                {alertSettings.smsProvider === 'twilio' && (
                  <div className="space-y-4 pt-2 border-t border-stone-800/40 animate-fadeIn">
                    <div>
                      <label className="text-[11px] font-bold text-stone-400 block mb-1">
                        Twilio Account SID
                      </label>
                      <input
                        type="text"
                        value={alertSettings.twilioSid}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, twilioSid: e.target.value }))}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-400 block mb-1">
                        Twilio Auth Token
                      </label>
                      <input
                        type="password"
                        value={alertSettings.twilioToken}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, twilioToken: e.target.value }))}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                        placeholder="••••••••••••••••••••••••••••••••"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-400 block mb-1">
                        Twilio Registered Sender Phone Number / Sender ID
                      </label>
                      <input
                        type="text"
                        value={alertSettings.twilioFrom}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, twilioFrom: e.target.value }))}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 font-mono"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-stone-950 border border-stone-850 p-4 rounded-lg">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setSavingAlertSettings(true);
                  try {
                    const res = await fetch('/api/admin/alert-settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(alertSettings)
                    });
                    if (res.ok) {
                      alert(currentLang === 'en' ? 'Configurations saved successfully!' : 'ቅንብሮችዎ በተሳካ ሁኔታ ተቀምጠዋል!');
                      loadAlertSettings();
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setSavingAlertSettings(false);
                  }
                }}
                disabled={savingAlertSettings}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 px-5 py-2 rounded text-xs font-bold cursor-pointer transition-all uppercase tracking-wider"
              >
                {savingAlertSettings ? 'Saving...' : (currentLang === 'en' ? 'Save Configurations' : 'ቅንብሮችን አስቀምጥ')}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setTestEmailLoading(true);
                  try {
                    const res = await fetch('/api/admin/email-alerts/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                    const data = await res.json();
                    if (res.ok) {
                      alert(data.message || 'Test Low Stock warning triggered!');
                      loadAlertLogs();
                    } else {
                      alert(`❌ Error: ${data.error || 'Failed to dispatch test email.'}`);
                    }
                  } catch (err: any) {
                    console.error(err);
                    alert(`❌ Network/Server Error: ${err.message || String(err)}`);
                  } finally {
                    setTestEmailLoading(false);
                  }
                }}
                disabled={testEmailLoading}
                className="bg-stone-850 hover:bg-stone-800 disabled:opacity-50 text-stone-200 border border-stone-750 px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-all"
              >
                {testEmailLoading ? 'Testing...' : (currentLang === 'en' ? 'Test Low Stock Email' : 'የሙከራ ኢሜይል ላክ')}
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!alertSettings.adminPhone) {
                    alert(currentLang === 'en' ? 'Please set an Administrator phone number first.' : 'እባክዎ መጀመሪያ የአድሚን ስልክ ቁጥር ያስቀምጡ።');
                    return;
                  }
                  setTestSmsLoading(true);
                  try {
                    const res = await fetch('/api/admin/sms-alerts/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: alertSettings.adminPhone }) });
                    if (res.ok) {
                      const data = await res.json();
                      alert(data.message || 'Test SMS notification sent!');
                      loadAlertLogs();
                    } else {
                      const errData = await res.json();
                      alert(`Error: ${errData.error}`);
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setTestSmsLoading(false);
                  }
                }}
                disabled={testSmsLoading}
                className="bg-stone-850 hover:bg-stone-800 disabled:opacity-50 text-stone-200 border border-stone-750 px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-all"
              >
                {testSmsLoading ? 'Testing...' : (currentLang === 'en' ? 'Test SMS Dispatch' : 'የሙከራ ኤስኤምኤስ ላክ')}
              </button>
            </div>
          </div>

          {/* Historical Alert Logs Lists */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Email Alert Logs */}
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
                  {currentLang === 'en' ? 'Email Dispatch History' : 'የኢሜይል መዝገብ ታሪክ'}
                </h3>
                {emailAlerts.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm('Clear history?')) return;
                      await fetch('/api/admin/email-alerts/clear', { method: 'POST' });
                      setEmailAlerts([]);
                    }}
                    className="text-[10px] text-red-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Email Logs
                  </button>
                )}
              </div>

              {emailAlerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-600 font-mono italic">
                  No email alert delivery logs recorded.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-stone-800 pr-2">
                  {emailAlerts.map(log => (
                    <div key={log.id} className="py-3 text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-stone-200">{log.productNameEn}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        To: {log.recipient} | Threshold: {log.currentStock} Units
                      </div>
                      <div className="text-[9px] text-stone-600 font-mono">
                        {new Date(log.sentAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SMS Alert Logs */}
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
                  {currentLang === 'en' ? 'SMS Dispatch History' : 'የኤስኤምኤስ መዝገብ ታሪክ'}
                </h3>
                {smsAlerts.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm('Clear history?')) return;
                      await fetch('/api/admin/sms-alerts/clear', { method: 'POST' });
                      setSmsAlerts([]);
                    }}
                    className="text-[10px] text-red-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear SMS Logs
                  </button>
                )}
              </div>

              {smsAlerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-600 font-mono italic">
                  No SMS warning dispatch logs recorded.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-stone-800 pr-2">
                  {smsAlerts.map(log => (
                    <div key={log.id} className="py-3 text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-stone-200">{log.recipient}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-stone-400 text-[11px] leading-relaxed italic bg-stone-950/40 p-2 rounded border border-stone-850 my-1">
                        "{log.message}"
                      </p>
                      {log.gatewayResponse && (
                        <div className="text-[10px] text-stone-500 font-mono">
                          Response: {log.gatewayResponse}
                        </div>
                      )}
                      <div className="text-[9px] text-stone-600 font-mono">
                        {new Date(log.sentAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Waitlist Waiters Panel */}
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-stone-200">
                  {currentLang === 'en' ? 'Back-In-Stock Customer Waitlist' : 'በድጋሚ ሲመጣ እንዲያሳውቃቸው የፈለጉ ደንበኞች'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {currentLang === 'en' 
                    ? 'Customers subscribed to notifications when out-of-stock items return to inventory.' 
                    : 'ዕቃዎች አልቀው በድጋሚ ሲገቡ ማሳወቂያ እንዲደርሳቸው የተመዘገቡ ደንበኞች ስም ዝርዝር።'}
                </p>
              </div>
              {waitlistSubs.length > 0 && (
                <button
                  onClick={handleClearSubscriptions}
                  className="text-xs bg-red-650 hover:bg-red-600 text-stone-100 px-3 py-1.5 rounded font-semibold cursor-pointer"
                >
                  Clear Waitlist
                </button>
              )}
            </div>

            {loadingSubs ? (
              <div className="text-center py-6 text-xs text-stone-500 font-mono">Loading subscriptions...</div>
            ) : waitlistSubs.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-600 font-mono italic">
                No active waitlist subscriptions at this time.
              </div>
            ) : (
              <div className="bg-stone-950/40 border border-stone-850 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left text-stone-400">
                  <thead className="bg-stone-950 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Customer Email</th>
                      <th className="p-3">Subscribed Date</th>
                      <th className="p-3">Notification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {waitlistSubs.map(sub => (
                      <tr key={sub.id} className="hover:bg-stone-950/30">
                        <td className="p-3 font-semibold text-stone-200">
                          {currentLang === 'en' ? sub.productNameEn : sub.productNameAm}
                        </td>
                        <td className="p-3 font-mono">{sub.email}</td>
                        <td className="p-3 font-mono text-stone-500">
                          {new Date(sub.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {sub.notified ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold text-[10px]">
                              <Check className="w-3.5 h-3.5" />
                              <span>Notified on {new Date(sub.notifiedAt).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-stone-500 text-[10px]">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                              <span>Waiting for restock</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'telegram' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header section */}
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg">
            <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              <span>{currentLang === 'en' ? 'Telegram Channel Integration' : 'የቴሌግራም ቻናል ውህደት'}</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {currentLang === 'en' 
                ? 'Configure your Telegram Bot token and Channel ID to automatically post your premium leather products directly to your Telegram subscribers.' 
                : 'የቴሌግራም ቦት ቶክን እና የቻናል መለያ በማስገባት ምርቶችዎን በቀጥታ ወደ ቴሌግራም ቻናልዎ ላይ ይለጥፉ።'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Configuration Settings */}
            <div className="lg:col-span-5 bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-6">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2 text-amber-500">
                <span>{currentLang === 'en' ? 'Bot Credentials' : 'የቦት ምስጢራዊ መለያዎች'}</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block">
                      {currentLang === 'en' ? 'Enable Telegram Posting' : 'የቴሌግራም መለጠፍን አግብር'}
                    </label>
                    <span className="text-[10px] text-stone-500">
                      {currentLang === 'en' ? 'Enable features to publish items to Telegram.' : 'ምርቶችን ወደ ቴሌግራም የመለጠፍ ተግባር እንዲሰራ ያድርጉ።'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={telegramSettings.isEnabled}
                    onChange={(e) => setTelegramSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block">
                      {currentLang === 'en' ? 'Use Telegram Simulation' : 'የቴሌግራም አስመስሎ መስራት (Simulation)'}
                    </label>
                    <span className="text-[10px] text-stone-500">
                      {currentLang === 'en' ? 'Simulate API posting if you do not have a real bot.' : 'እውነተኛ ቦት ከሌለዎት የሙከራ ፖስቲንግን ይጠቀሙ።'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={telegramSettings.useSimulation}
                    onChange={(e) => setTelegramSettings(prev => ({ ...prev, useSimulation: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-800 bg-stone-950 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    {currentLang === 'en' ? 'Telegram Bot Token' : 'የቴሌግራም ቦት ቶክን (Bot Token)'}
                  </label>
                  <input
                    type="password"
                    value={telegramSettings.botToken}
                    onChange={(e) => setTelegramSettings(prev => ({ ...prev, botToken: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    {currentLang === 'en' 
                      ? 'Obtained from @BotFather on Telegram.' 
                      : 'በቴሌግራም ላይ ከ @BotFather የሚገኝ መለያ።'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    {currentLang === 'en' ? 'Telegram Channel ID' : 'የቴሌግራም ቻናል መለያ (Channel ID)'}
                  </label>
                  <input
                    type="text"
                    value={telegramSettings.channelId}
                    onChange={(e) => setTelegramSettings(prev => ({ ...prev, channelId: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="e.g. @your_channel_name or -100xxxxxxxxxx"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    {currentLang === 'en' 
                      ? 'Note: Your bot MUST be added as an Administrator in your channel with post permissions.' 
                      : 'ማሳሰቢያ፡ ቦቱ በቻናልዎ ላይ ፖስት የማድረግ መብት ያለው አድሚኒስትሬተር መሆን አለበት።'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingTelegramSettings}
                  onClick={async () => {
                    setSavingTelegramSettings(true);
                    try {
                      const res = await fetch('/api/admin/telegram/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(telegramSettings)
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setTelegramSettings(updated);
                        alert(currentLang === 'en' ? 'Telegram configurations saved successfully!' : 'የቴሌግራም ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል!');
                      } else {
                        alert('Failed to save settings.');
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setSavingTelegramSettings(false);
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold py-2 px-4 rounded text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingTelegramSettings 
                    ? (currentLang === 'en' ? 'Saving...' : 'በማስቀመጥ ላይ...') 
                    : (currentLang === 'en' ? 'Save Configurations' : 'ቅንብሮችን አስቀምጥ')}
                </button>
              </div>
            </div>

            {/* Right side: Product catalog posting area */}
            <div className="lg:col-span-7 bg-stone-900 border border-stone-800 p-6 rounded-lg space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-stone-800/80">
                <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2">
                  <span>{currentLang === 'en' ? 'Publish Products' : 'ምርቶችን መለጠፊያ ገጽ'}</span>
                </h3>
                <span className="text-[10px] font-mono text-stone-500 bg-stone-950 px-2 py-0.5 rounded">
                  {allProducts.length} {currentLang === 'en' ? 'products' : 'ምርቶች'}
                </span>
              </div>

              {!telegramSettings.isEnabled && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-xs text-amber-500 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{currentLang === 'en' ? 'Telegram Posting is Disabled' : 'የቴሌግራም መለጠፍ ጠፍቷል'}</span>
                    <p className="mt-1 leading-relaxed">
                      {currentLang === 'en' 
                        ? 'Please toggle "Enable Telegram Posting" on the left and save configuration to publish items.' 
                        : 'እባክዎን በግራ በኩል "የቴሌግራም መለጠፍን አግብር" የሚለውን በማብራት ሴቭ ያድርጉ።'}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
                {allProducts.map((p) => {
                  const defaultCaption = `🇪🇹 *${p.nameEn}* / *${p.nameAm}*\n\n` +
                    `💵 Price: *${p.priceETB.toLocaleString()} ETB*\n` +
                    `🏷️ Category: *${p.category}*\n` +
                    `📏 Available Sizes: *${(p.sizes || []).join(', ')}*\n\n` +
                    `📝 *Details:*\n${p.descriptionEn}\n\n` +
                    `🔗 Order on Website: ${window.location.origin}/?product=${p.id}`;

                  const currentCaption = telegramCaption[p.id] !== undefined ? telegramCaption[p.id] : defaultCaption;

                  return (
                    <div key={p.id} className="bg-stone-950/40 border border-stone-850 rounded-lg p-4 space-y-4 hover:border-stone-800 transition-colors">
                      <div className="flex gap-4">
                        <img 
                          src={p.images[0] || 'https://picsum.photos/seed/newleather/800/600'} 
                          alt={p.nameEn}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-cover rounded border border-stone-800 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-200 truncate">{currentLang === 'en' ? p.nameEn : p.nameAm}</h4>
                          <span className="text-[10px] font-mono text-amber-500 block mt-0.5">{p.priceETB.toLocaleString()} ETB</span>
                          <span className="text-[9px] text-stone-500 font-mono mt-1 block uppercase">Category: {p.category}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-stone-400 font-mono block">
                          {currentLang === 'en' ? 'Telegram Caption Template (Markdown format supported)' : 'የቴሌግራም ፖስት ጽሑፍ ቅንብር'}
                        </label>
                        <textarea
                          rows={4}
                          value={currentCaption}
                          onChange={(e) => {
                            setTelegramCaption(prev => ({
                              ...prev,
                              [p.id]: e.target.value
                            }));
                          }}
                          className="w-full bg-stone-950 border border-stone-850 rounded p-2 text-[11px] text-stone-300 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={!telegramSettings.isEnabled || telegramPostLoading === p.id}
                          onClick={async () => {
                            setTelegramPostLoading(p.id);
                            try {
                              const res = await fetch('/api/admin/telegram/post-product', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  productId: p.id,
                                  customCaption: currentCaption
                                })
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                alert(
                                  data.isSimulated 
                                    ? `[SIMULATION SUCCESS]\n\n${data.message}\n\nContent:\n${data.sentContent.caption.substring(0, 200)}...`
                                    : `[TELEGRAM SUCCESS]\n\nSuccessfully posted to Telegram!\nMessage ID: ${data.telegramMessageId}`
                                );
                              } else {
                                alert(`Failed to post: ${data.error || 'Unknown error'}`);
                              }
                            } catch (err: any) {
                              alert(`Error posting: ${err.message}`);
                            } finally {
                              setTelegramPostLoading(null);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            telegramSettings.isEnabled 
                              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold' 
                              : 'bg-stone-800 text-stone-500 border border-stone-850 cursor-not-allowed'
                          }`}
                        >
                          {telegramPostLoading === p.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>{currentLang === 'en' ? 'Posting...' : 'በመለጠፍ ላይ...'}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>{currentLang === 'en' ? 'Post to Telegram' : 'ወደ ቴሌግራም ፖስት አድርግ'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Panel: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <Database className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-sans font-bold text-stone-100">
                  {currentLang === 'en' ? 'System Backup & Disaster Recovery' : 'የስርዓት ምትኬ እና መረጃ መልሶ ማግኛ'}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  {currentLang === 'en' 
                    ? 'Manage automated server snapshots, download hard copies of system tables, or restore from historic checkpoints.' 
                    : 'አውቶማቲክ የአገልጋይ ምትኬዎችን ያስተዳድሩ፣ የስርዓት ፋይሎችን ያውርዱ፣ ወይም ቀደም ሲል ከተቀመጡ ምትኬዎች መረጃውን ይመልሱ።'}
                </p>
              </div>
            </div>

            {/* Cloud Status */}
            <div className="bg-stone-850 border border-stone-800 px-4 py-3 rounded-md flex items-center gap-3 self-stretch md:self-auto">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <div className="text-left">
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">{currentLang === 'en' ? 'Automated Engine' : 'አውቶማቲክ ኢንጂን'}</p>
                <p className="text-xs text-stone-300 font-bold">{currentLang === 'en' ? '12-Hour Cron Active' : 'የ12-ሰዓት ክሮን ገባሪ'}</p>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {backupMessage && (
            <div className={`p-4 rounded-lg flex items-center justify-between gap-3 ${
              backupMessage.isError ? 'bg-red-950/40 border border-red-900/50 text-red-200' : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-left">
                <span className="text-base">{backupMessage.isError ? '⚠️' : '✅'}</span>
                <span>{backupMessage.text}</span>
              </div>
              <button 
                onClick={() => setBackupMessage(null)} 
                className="text-stone-400 hover:text-stone-200 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Database Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: currentLang === 'en' ? 'Active Products' : 'ገባሪ ምርቶች', value: allProducts.length, desc: 'Products DB' },
              { label: currentLang === 'en' ? 'Orders Processed' : 'ጠቅላላ ትዕዛዞች', value: orders.length, desc: 'Sales Log' },
              { label: currentLang === 'en' ? 'Registered Users' : 'የተመዘገቡ ተጠቃሚዎች', value: users.length, desc: 'Auth Registry' },
              { label: currentLang === 'en' ? 'Sms Dispatched' : 'የተላኩ ኤስኤምኤሶች', value: smsAlerts.length, desc: 'SMS History' },
              { label: currentLang === 'en' ? 'Saved Backups' : 'የተቀመጡ ምትኬዎች', value: backups.length, desc: 'Local Repository' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-stone-900 border border-stone-850 p-4 rounded-lg text-left">
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">{stat.desc}</p>
                <p className="text-xl font-bold font-sans text-stone-100 mt-1">{stat.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main Action Panels: Dual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Panel 1: Direct File Operations (Local Exports / Imports) */}
            <div className="bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center gap-2.5 border-b border-stone-850 pb-3 mb-4">
                  <CloudUpload className="text-amber-500 w-5 h-5" />
                  <h3 className="font-sans font-bold text-stone-200 text-sm">
                    {currentLang === 'en' ? 'Direct Export & Import (Offline File)' : 'ቀጥታ መረጃ ወደ ውጪ መላክ እና ማስገባት'}
                  </h3>
                </div>
                
                <p className="text-xs text-stone-400 leading-relaxed mb-6">
                  {currentLang === 'en'
                    ? 'Export your entire store database into a single backup JSON file to keep offline, or upload an exported backup to overwrite current state instantly.'
                    : 'ሙሉውን የሱቅ መረጃ በአንድ የJSON ፋይል ወደ ኮምፒውተርዎ ያውርዱ፣ ወይም ቀደም ሲል ያወረዱትን ፋይል በመስቀል የስርዓቱን መረጃ ወዲያውኑ ይተኩ።'}
                </p>

                <div className="space-y-4">
                  {/* Export Button */}
                  <div>
                    <button
                      onClick={handleDirectExport}
                      className="w-full flex items-center justify-center gap-2 bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-800 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{currentLang === 'en' ? 'Download Full DB Export (.json)' : 'ሙሉ መረጃ በJSON ፋይል አውርድ'}</span>
                    </button>
                  </div>

                  {/* Import Button */}
                  <div>
                    <label className="block text-[11px] text-stone-500 font-mono uppercase mb-1.5">
                      {currentLang === 'en' ? 'Direct Import (Overwrites database)' : 'ቀጥታ አስገባ (የአሁኑን መረጃ ያጠፋል)'}
                    </label>
                    <div className="relative border border-dashed border-stone-800 hover:border-stone-750 bg-stone-950/50 rounded p-4 text-center cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleDirectImport}
                        disabled={importingDirect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Upload className="w-5 h-5 text-stone-500" />
                        <p className="text-xs text-stone-300 font-semibold">
                          {importingDirect ? (
                            <span className="flex items-center gap-1 justify-center mx-auto">
                              <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                              {currentLang === 'en' ? 'Importing...' : 'በማስገባት ላይ...'}
                            </span>
                          ) : (
                            <span>{currentLang === 'en' ? 'Choose Export File (.json)' : 'የJSON ፋይል ይምረጡ'}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {currentLang === 'en' ? 'Overwrites active system state instantly' : 'የአሁኑን መረጃ ወዲያውኑ ይተካል'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Build a Server Snapshot */}
            <div className="bg-stone-900 border border-stone-850 p-5 rounded-lg flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center gap-2.5 border-b border-stone-850 pb-3 mb-4">
                  <HardDrive className="text-amber-500 w-5 h-5" />
                  <h3 className="font-sans font-bold text-stone-200 text-sm">
                    {currentLang === 'en' ? 'Compile Live Server Snapshot' : 'አዲስ አገልጋይ-ተኮር ምትኬ ፍጠር'}
                  </h3>
                </div>

                <p className="text-xs text-stone-400 leading-relaxed mb-6">
                  {currentLang === 'en'
                    ? 'Compile a durable backup snapshot saved directly on the secure server storage. You can add a descriptive label to easily identify this recovery checkpoint later.'
                    : 'ደህንነቱ በተጠበቀው አገልጋይ ላይ የሚቀመጥ አዲስ የስርዓት ምትኬ ይፍጠሩ። በኋላ ላይ በቀላሉ ለመለየት የምትኬውን ዓላማ የሚገልጽ አጭር ማስታወሻ መጻፍ ይችላሉ።'}
                </p>

                <form onSubmit={handleCreateBackup} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-stone-500 font-mono uppercase mb-1.5">
                      {currentLang === 'en' ? 'Backup Description / Label' : 'የምትኬ መግለጫ / ማስታወሻ'}
                    </label>
                    <input
                      type="text"
                      placeholder={currentLang === 'en' ? 'e.g., Pre-Inventory Update Cleanup' : 'ለምሳሌ፡ ክምችት ማሻሻያ ከመደረጉ በፊት'}
                      value={backupLabel}
                      onChange={(e) => setBackupLabel(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 rounded p-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingBackup}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {creatingBackup ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                        <span>{currentLang === 'en' ? 'Compiling Snapshot...' : 'ምትኬ በመፍጠር ላይ...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-stone-950" />
                        <span>{currentLang === 'en' ? 'Compile Backup Snapshot' : 'ምትኬ snapshot ፍጠር'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Section 3: Server Backup Repository Explorer */}
          <div className="bg-stone-900 border border-stone-850 rounded-lg p-5 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-850 pb-4 mb-4">
              <div>
                <h3 className="font-sans font-bold text-stone-200 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500" />
                  <span>{currentLang === 'en' ? 'Server-Side Backups Repository' : 'የአገልጋይ-ተኮር ምትኬዎች ማከማቻ'}</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {currentLang === 'en' 
                    ? 'Historically compiled snapshots saved on Node.js container storage. Restores overwrite current system tables.' 
                    : 'ደህንነቱ በተጠበቀው አገልጋይ ላይ የተከማቹ የቆዩ ምትኬዎች ዝርዝር። መረጃን መመለስ የአሁኑን የሱቅ መረጃ ይተካል።'}
                </p>
              </div>

              {/* Upload to server repo */}
              <div className="relative self-stretch sm:self-auto">
                <input
                  type="file"
                  accept=".json"
                  id="repo-upload-btn"
                  onChange={handleUploadAndSaveBackup}
                  className="hidden"
                />
                <label
                  htmlFor="repo-upload-btn"
                  className="flex items-center justify-center gap-1.5 bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-800 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>{currentLang === 'en' ? 'Upload Backup to Server' : 'ምትኬ ፋይል ወደ አገልጋዩ ስቀል'}</span>
                </label>
              </div>
            </div>

            {loadingBackups ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                <p className="text-xs text-stone-500 mt-2 font-mono">{currentLang === 'en' ? 'Loading system backups...' : 'ምትኬዎችን በመጫን ላይ...'}</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-850 rounded-lg">
                <Database className="w-10 h-10 text-stone-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-400">{currentLang === 'en' ? 'No Server Backups Found' : 'ምንም የአገልጋይ ምትኬ አልተገኘም'}</p>
                <p className="text-xs text-stone-600 mt-1">
                  {currentLang === 'en' ? 'Compile a server snapshot above, or wait for the automatic background job to run.' : 'ከላይ አዲስ ምትኬ ይፍጠሩ፣ ወይም አውቶማቲክ ምትኬ እስኪሰራ ይጠብቁ።'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-stone-400">
                  <thead className="bg-stone-950 text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{currentLang === 'en' ? 'Backup Filename' : 'የምትኬ ፋይል ስም'}</th>
                      <th className="py-3 px-4">{currentLang === 'en' ? 'Created At' : 'የተፈጠረበት ቀን'}</th>
                      <th className="py-3 px-4">{currentLang === 'en' ? 'File Size' : 'የፋይል መጠን'}</th>
                      <th className="py-3 px-4">{currentLang === 'en' ? 'Context / Label' : 'ዓላማ / መግለጫ'}</th>
                      <th className="py-3 px-4 text-right">{currentLang === 'en' ? 'Disaster Recovery Operations' : 'የመልሶ ማግኛ ተግባራት'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-850">
                    {backups.map((f) => {
                      const sizeFormatted = (f.size / 1024).toFixed(1);
                      const isAuto = f.isAuto;
                      const dateStr = new Date(f.createdAt).toLocaleString(currentLang === 'en' ? 'en-US' : 'am-ET', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });

                      return (
                        <tr key={f.filename} className="hover:bg-stone-850/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-stone-300">
                            <span className="flex items-center gap-2">
                              {isAuto ? (
                                <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold">Auto</span>
                              ) : (
                                <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold font-semibold">Manual</span>
                              )}
                              <span>{f.filename}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-stone-400">{dateStr}</td>
                          <td className="py-3.5 px-4 font-mono text-stone-400">{sizeFormatted} KB</td>
                          <td className="py-3.5 px-4 text-stone-300 max-w-xs truncate" title={f.label || 'No label'}>
                            {f.label || <span className="text-stone-600 font-mono italic">No description</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {/* Confirmation Overlay for Restore */}
                            {confirmRestoreFile === f.filename ? (
                              <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-900/60 px-2.5 py-1 rounded">
                                <span className="text-[10px] text-red-200 font-semibold uppercase tracking-wider">{currentLang === 'en' ? 'Overwrites active DB! Confirm?' : 'ያጠፋል! እርግጠኛ ነዎት?'}</span>
                                <button
                                  onClick={() => handleRestoreBackup(f.filename)}
                                  disabled={restoringBackup === f.filename}
                                  className="bg-red-600 hover:bg-red-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer font-bold"
                                >
                                  {restoringBackup === f.filename ? '...' : (currentLang === 'en' ? 'Restore Now' : 'አሁን መልስ')}
                                </button>
                                <button
                                  onClick={() => setConfirmRestoreFile(null)}
                                  className="text-stone-400 hover:text-stone-200 text-[10px] font-medium px-1 cursor-pointer"
                                >
                                  {currentLang === 'en' ? 'Cancel' : 'ተው'}
                                </button>
                              </div>
                            ) : confirmDeleteFile === f.filename ? (
                              <div className="inline-flex items-center gap-2 bg-stone-950 px-2.5 py-1 rounded">
                                <span className="text-[10px] text-stone-400">{currentLang === 'en' ? 'Delete forever?' : 'ለዘላለም ይጥፋ?'}</span>
                                <button
                                  onClick={() => handleDeleteBackup(f.filename)}
                                  disabled={deletingBackup === f.filename}
                                  className="bg-red-600 hover:bg-red-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer font-bold"
                                >
                                  {deletingBackup === f.filename ? '...' : (currentLang === 'en' ? 'Delete' : 'አጥፋ')}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteFile(null)}
                                  className="text-stone-500 hover:text-stone-300 text-[10px] font-medium px-1 cursor-pointer"
                                >
                                  {currentLang === 'en' ? 'Cancel' : 'ተው'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2.5">
                                {/* Restore Trigger */}
                                <button
                                  onClick={() => {
                                    setConfirmRestoreFile(f.filename);
                                    setConfirmDeleteFile(null);
                                    setBackupMessage(null);
                                  }}
                                  className="flex items-center gap-1 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 px-2.5 py-1.5 rounded transition-all cursor-pointer font-medium"
                                >
                                  <History className="w-3.5 h-3.5" />
                                  <span>{currentLang === 'en' ? 'Restore' : 'መልስ'}</span>
                                </button>

                                {/* Download File */}
                                <a
                                  href={`/api/admin/backup/download/${f.filename}`}
                                  download={f.filename}
                                  className="flex items-center gap-1 bg-stone-800 hover:bg-stone-750 text-stone-300 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{currentLang === 'en' ? 'Download' : 'አውርድ'}</span>
                                </a>

                                {/* Delete Trigger */}
                                <button
                                  onClick={() => {
                                    setConfirmDeleteFile(f.filename);
                                    setConfirmRestoreFile(null);
                                    setBackupMessage(null);
                                  }}
                                  className="flex items-center justify-center bg-stone-800 hover:bg-red-950/80 text-stone-500 hover:text-red-400 p-1.5 rounded transition-colors cursor-pointer"
                                  title={currentLang === 'en' ? 'Delete Backup' : 'ምትኬ ፋይል አጥፋ'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
