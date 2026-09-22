// ============================================================
// Nyambi Ngopi POS — TypeScript Types
// ============================================================

export type UserRole = 'owner' | 'admin' | 'cashier';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'delivered';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';

// ── Profiles ─────────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  pin?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Raw Materials (Bahan Baku) ────────────────────────────────
export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductRecipe {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity_required: number;
  created_at: string;
  // joined
  raw_material?: RawMaterial;
}

// ── Categories ───────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ── Products ─────────────────────────────────────────────────
export interface Product {
  id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  image_url?: string | null;
  sku?: string | null;
  is_active: boolean;
  track_stock: boolean;
  stock_quantity?: number | null;
  low_stock_threshold: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category;
  modifier_groups?: ModifierGroup[];
  recipes?: ProductRecipe[];
}

// ── Product modifiers (variants / add-ons) ────────────────────
export type ModifierSelectionType = 'single' | 'multiple';

export interface ModifierOption {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  sort_order: number;
}

export interface ModifierGroup {
  id: string;
  product_id: string;
  name: string;
  selection_type: ModifierSelectionType;
  is_required: boolean;
  sort_order: number;
  // joined
  options?: ModifierOption[];
}

export interface SelectedModifier {
  modifier_id: string;
  group_name: string;
  name: string;
  price_delta: number;
}

// ── Cart ─────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  notes?: string;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  selectedModifiers?: SelectedModifier[];
}

// ── Customers ─────────────────────────────────────────────────
export interface Customer {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  lastVisit: string | null;
}

// ── Promotions ────────────────────────────────────────────────
export type PromoDiscountType = 'percent' | 'amount';

export interface Promotion {
  id: string;
  name: string;
  code?: string | null;
  discount_type: PromoDiscountType;
  discount_value: number;
  min_purchase: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ── Orders ───────────────────────────────────────────────────
export interface Order {
  id: string;
  order_number: string;
  cashier_id?: string | null;
  cashier_name?: string;
  shift_id?: string | null;
  customer_id?: string | null;
  status: OrderStatus;
  kitchen_status: KitchenStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  promo_code?: string | null;
  promo_name?: string | null;
  points_earned?: number;
  points_redeemed?: number;
  points_discount_amount?: number;
  tax_amount: number;
  tax_percent: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  notes?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  // joined
  order_items?: OrderItem[];
  customer?: Customer;
  // client-only: false saat baru disimpan ke antrean offline, belum terkirim ke server
  synced?: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_price: number;
  product_cost?: number;
  quantity: number;
  discount_amount: number;
  discount_percent: number;
  subtotal: number;
  notes?: string;
  modifiers_snapshot?: SelectedModifier[] | null;
  created_at: string;
}

// ── Shifts (kas / cash drawer) ────────────────────────────────
export type ShiftStatus = 'open' | 'closed';

export interface Shift {
  id: string;
  cashier_id?: string;
  cashier_name?: string;
  status: ShiftStatus;
  opening_cash: number;
  closing_cash?: number | null;
  expected_cash?: number | null;
  cash_difference?: number | null;
  notes?: string | null;
  opened_at: string;
  closed_at?: string | null;
}

export interface ShiftCashFlow {
  id: string;
  shift_id: string;
  cashier_id: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
  created_at: string;
}

export interface ShiftSummary {
  totalOrders: number;
  cashTotal: number;
  qrisTotal: number;
  transferTotal: number;
  grandTotal: number;
  expectedCash: number;
}

// ── Settings ─────────────────────────────────────────────────
export interface Setting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_instagram: string;
  receipt_footer: string;
  tax_enabled: boolean;
  tax_percent: number;
  tax_label: string;
  currency: string;
  receipt_paper_size: '58mm' | '80mm';
  printer_name: string;
  loyalty_enabled: boolean;
  loyalty_earn_rate: number;
  loyalty_redeem_rate: number;
}

// ── Reports ─────────────────────────────────────────────────
export interface SalesReport {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_items_sold: number;
  total_cost: number;
  total_profit: number;
  profit_margin_percent: number;
}

export interface DailySales {
  date: string;
  total: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface PaymentBreakdown {
  payment_method: PaymentMethod;
  count: number;
  total: number;
}

export type DateRange = 'today' | 'week' | 'month' | 'custom';

export interface ReportFilters {
  range: DateRange;
  startDate?: string;
  endDate?: string;
}
