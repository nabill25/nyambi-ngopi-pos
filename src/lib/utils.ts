import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Product } from '../types';

// ── Tailwind class merger ─────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency formatter ────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Short format: 15.000 (without "Rp ")
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

// ── Date formatters ───────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: localeId });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: localeId });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: localeId });
}

// ── Date range calculator ─────────────────────────────────────
export function getDateRange(range: 'today' | 'week' | 'month') {
  const now = new Date();
  switch (range) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(subDays(now, 6), { weekStartsOn: 1 }), end: endOfDay(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

// ── Order number generator ────────────────────────────────────
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  const timeStr = format(now, 'HHmmss');
  return `NN-${dateStr}-${timeStr}`;
}

// ── Discount calculator ───────────────────────────────────────
export function calculateDiscount(price: number, discountPercent: number, discountAmount: number): number {
  if (discountPercent > 0) {
    return Math.round(price * (discountPercent / 100));
  }
  return discountAmount;
}

// ── Truncate text ─────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ── Payment method label ──────────────────────────────────────
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    transfer: 'Transfer Bank',
  };
  return labels[method] ?? method;
}

// ── Status label ──────────────────────────────────────────────
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Tertunda',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return labels[status] ?? status;
}

// ── Status color ──────────────────────────────────────────────
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-500',
    completed: 'text-green-500',
    cancelled: 'text-red-500',
  };
  return colors[status] ?? 'text-gray-500';
}

// ── Stock status ────────────────────────────────────────────────
export type StockStatus = 'ok' | 'low' | 'out';

export function getStockStatus(product: Pick<Product, 'track_stock' | 'stock_quantity' | 'low_stock_threshold'>): StockStatus {
  if (!product.track_stock || product.stock_quantity == null) return 'ok';
  if (product.stock_quantity <= 0) return 'out';
  if (product.stock_quantity <= product.low_stock_threshold) return 'low';
  return 'ok';
}

// ── Audio ───────────────────────────────────────────────────────
export function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Suara "Cha-ching" sederhana
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);
    
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio errors (e.g. autoplay blocked)
  }
}
