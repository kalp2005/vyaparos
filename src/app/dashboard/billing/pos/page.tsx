'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/i18n/context';
import { calculateGstInvoice, GstLineItemInput } from '@/lib/gst';
import { InvoicePrint } from '@/components/billing/InvoicePrint';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';

export default function PosBillingPage() {
  const router = useRouter();
  const { formatCurrency, t } = useLanguage();

  // Search & Products state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cart & Line Items
  const [cartItems, setCartItems] = useState<GstLineItemInput[]>([]);

  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Payment state
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CREDIT' | 'CARD'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoiceData, setCompletedInvoiceData] = useState<any | null>(null);
  const [businessData, setBusinessData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load initial store data, products, categories, customers
  useEffect(() => {
    // 1. Fetch Store Profile
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activeBusiness) {
          setBusinessData(data.activeBusiness);
        }
      });

    // 2. Fetch Products
    fetch('/api/products?isActive=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products || []);
        }
      })
      .finally(() => setIsLoadingProducts(false));

    // 3. Fetch Categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      });

    // 4. Fetch Customers
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.customers || []);
        }
      });
  }, []);

  // Global Keyboard Shortcuts (F2: Search, F4: Customer, F8: Pay, Esc: Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        const custSelect = document.getElementById('customer-select');
        custSelect?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0 && !isSubmitting) {
          handleCompleteSale();
        }
      } else if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isSubmitting, selectedCustomerId, paymentMode]);

  // Real-time GST Calculation for active Cart
  const invoiceCalculation = calculateGstInvoice(
    cartItems,
    'INTRA_STATE' // Default intra-state unless specified
  );

  // Add Product to Cart (from click or barcode scan)
  const handleAddToCart = (product: any) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            itemName: product.name,
            sku: product.sku || null,
            hsnCode: product.hsnCode || null,
            unit: product.unit || 'PCS',
            quantity: 1,
            unitPrice: product.sellingPrice,
            isTaxInclusive: product.isTaxInclusive,
            gstRate: product.gstRate || 0,
            cessRate: product.cessRate || 0,
            discountPercent: 0,
          },
        ];
      }
    });
  };

  // Barcode / Query search enter handler
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      e.preventDefault();
      const query = searchQuery.trim().toLowerCase();
      // Match exact barcode first, or first matching product
      const exactBarcodeMatch = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === query
      );
      const match = exactBarcodeMatch || products.find(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query))
      );

      if (match) {
        handleAddToCart(match);
        setSearchQuery('');
      }
    }
  };

  // Modify Quantity
  const handleUpdateQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one product to the bill.');
      return;
    }

    if (paymentMode === 'CREDIT' && !selectedCustomerId) {
      setErrorMessage('Please select a customer for Credit / Udhar sales.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          billingType: 'POS',
          items: cartItems,
          payments: [
            {
              paymentMode,
              amount: invoiceCalculation.grandTotal,
              paymentReference: paymentReference.trim() || null,
            },
          ],
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete sale');
      }

      // Fetch complete invoice data for print modal
      const invoiceRes = await fetch(`/api/invoices/${data.invoice.id}`);
      const invoiceDetail = await invoiceRes.json();

      setCompletedInvoiceData(invoiceDetail.invoice);
      // Clear Cart
      setCartItems([]);
      setSelectedCustomerId('');
      setPaymentReference('');
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing POS sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* ================= LEFT COLUMN: CATALOG & SEARCH ================= */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        {/* Top Header & Fast Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-vyapar-50 dark:bg-vyapar-950 text-vyapar-600 font-bold text-xs">
                POS COUNTER
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                [F2: Search | F4: Customer | F8: Complete Bill]
              </span>
            </div>
            <Link
              href="/dashboard/billing"
              className="text-xs font-bold text-vyapar-600 dark:text-vyapar-400 hover:underline"
            >
              Invoices History →
            </Link>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search product or scan barcode (Press Enter to add)..."
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-vyapar-500"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Barcode className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                F2
              </span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === null
                  ? 'bg-vyapar-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-vyapar-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-21rem)] pr-1">
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Add items to your catalog in Products menu</p>
              <Link href="/dashboard/products" className="inline-block mt-4">
                <Button size="sm" variant="outline">
                  + Add Product to Store
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddToCart(p)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-vyapar-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 font-mono truncate">
                        {p.sku || p.barcode || 'ITEM'}
                      </span>
                      {p.currentStock <= p.minimumStock && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                          Low: {p.currentStock}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-vyapar-600 transition-colors">
                      {p.name}
                    </p>
                  </div>

                  <div className="mt-3 flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                        ₹{p.sellingPrice.toFixed(2)}
                      </span>
                      {p.gstRate > 0 && (
                        <span className="text-[9px] text-slate-400 block">
                          GST {p.gstRate}% {p.isTaxInclusive ? '(Inc)' : '(Ex)'}
                        </span>
                      )}
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-vyapar-50 text-vyapar-600 dark:bg-vyapar-950 dark:text-vyapar-400 flex items-center justify-center text-xs font-bold group-hover:bg-vyapar-600 group-hover:text-white transition-colors">
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: ACTIVE BILL / CART ================= */}
      <div className="w-full lg:w-96 xl:w-[420px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          {/* Bill Party & Customer Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="customer-select" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-vyapar-600" />
                <span>Customer (Party)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                className="text-[11px] font-bold text-vyapar-600 hover:underline cursor-pointer"
              >
                + New Customer
              </button>
            </div>

            <select
              id="customer-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-vyapar-500 cursor-pointer"
            >
              <option value="">Walk-in Customer (Cash Bill)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phoneNumber}) — Due: ₹{c.outstandingBalance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Line Items Table */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1">
              <span>ITEMS ({cartItems.length})</span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Cart is empty. Click products or scan barcode.
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const lineCalc = invoiceCalculation.items[idx];
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.itemName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          ₹{item.unitPrice.toFixed(2)} / {item.unit}
                          {item.gstRate > 0 ? ` • GST ${item.gstRate}%` : ''}
                        </p>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[65px]">
                        <p className="font-black text-slate-900 dark:text-slate-100 font-mono">
                          ₹{lineCalc ? lineCalc.totalAmount.toFixed(2) : (item.quantity * item.unitPrice).toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'CASH', label: 'Cash', icon: Banknote },
                { key: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { key: 'CREDIT', label: 'Udhar', icon: User },
                { key: 'CARD', label: 'Card', icon: CreditCard },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMode === pm.key;
                return (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPaymentMode(pm.key as any)}
                    className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-vyapar-600 bg-vyapar-50 text-vyapar-700 dark:bg-vyapar-950 dark:text-vyapar-300 font-black shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= BILL TOTAL & ACTION FOOTER ================= */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick GST & Total Summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono">₹{invoiceCalculation.subtotal.toFixed(2)}</span>
            </div>
            {invoiceCalculation.totalTax > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Total Tax (GST):</span>
                <span className="font-mono">+₹{invoiceCalculation.totalTax.toFixed(2)}</span>
              </div>
            )}
            {invoiceCalculation.roundOff !== 0 && (
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Round Off:</span>
                <span className="font-mono">
                  {invoiceCalculation.roundOff > 0 ? `+${invoiceCalculation.roundOff.toFixed(2)}` : invoiceCalculation.roundOff.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                Grand Total:
              </span>
              <span className="text-2xl font-black text-vyapar-600 dark:text-vyapar-400 font-mono">
                {formatCurrency(invoiceCalculation.grandTotal)}
              </span>
            </div>
          </div>

          {/* Complete Bill Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleCompleteSale}
            isLoading={isSubmitting}
            disabled={cartItems.length === 0}
            className="w-full font-black py-4 shadow-lg shadow-vyapar-500/25 cursor-pointer"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            [F8] Complete Sale & Print
          </Button>
        </div>
      </div>

      {/* Printable Invoice Modal on Completion */}
      {completedInvoiceData && businessData && (
        <InvoicePrint
          invoice={completedInvoiceData}
          business={businessData}
          onClose={() => setCompletedInvoiceData(null)}
        />
      )}

      {/* Quick Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => {
          fetch('/api/customers')
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setCustomers(data.customers || []);
              }
            });
        }}
      />
    </div>
  );
}
