export interface AdminMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  note: string;
}

export interface AdminOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: number;
  payment: 'Paid' | 'Partial' | 'Failed';
}

export interface AdminProduct {
  id: string;
  name: string;
  category: 'Furniture' | 'Curtains' | 'Accessories';
  stock: number;
  price: number;
  status: 'Active' | 'Draft' | 'Archived';
  sku: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orders: number;
  segment: 'VIP' | 'Repeat' | 'New';
  lastOrder: string;
}

export interface AdminContentBlock {
  id: string;
  title: string;
  route: string;
  status: 'Published' | 'Scheduled' | 'Draft';
  updatedAt: string;
}

export const adminMetrics: AdminMetric[] = [
  {
    label: 'Gross Revenue',
    value: 'R 1,284,200',
    change: '+12.4%',
    trend: 'up',
    note: 'vs last 30 days',
  },
  {
    label: 'Orders',
    value: '328',
    change: '+7.1%',
    trend: 'up',
    note: 'avg 10.9/day',
  },
  {
    label: 'Conversion Rate',
    value: '3.42%',
    change: '+0.6%',
    trend: 'up',
    note: 'checkout completion',
  },
  {
    label: 'Refund Rate',
    value: '1.08%',
    change: '-0.3%',
    trend: 'down',
    note: 'healthy range',
  },
];

export const revenueByWeek = [
  { week: 'W1', value: 58 },
  { week: 'W2', value: 64 },
  { week: 'W3', value: 71 },
  { week: 'W4', value: 67 },
  { week: 'W5', value: 75 },
  { week: 'W6', value: 82 },
  { week: 'W7', value: 79 },
  { week: 'W8', value: 88 },
];

export const adminOrders: AdminOrder[] = [
  { id: 'ZE-2026-1203', customer: 'Nokuthula M.', date: '2026-04-03', total: 18450, status: 'Processing', items: 3, payment: 'Paid' },
  { id: 'ZE-2026-1202', customer: 'Jason K.', date: '2026-04-03', total: 7200, status: 'Pending', items: 2, payment: 'Partial' },
  { id: 'ZE-2026-1201', customer: 'Ayaan P.', date: '2026-04-02', total: 31400, status: 'Shipped', items: 4, payment: 'Paid' },
  { id: 'ZE-2026-1199', customer: 'Lerato D.', date: '2026-04-01', total: 9950, status: 'Delivered', items: 1, payment: 'Paid' },
  { id: 'ZE-2026-1197', customer: 'Mia S.', date: '2026-03-31', total: 5200, status: 'Cancelled', items: 1, payment: 'Failed' },
];

export const adminProducts: AdminProduct[] = [
  { id: 'P-001', name: 'Oslo Sectional Sofa', category: 'Furniture', stock: 14, price: 24999, status: 'Active', sku: 'ZH-FUR-OSL-01' },
  { id: 'P-002', name: 'Nordic Dining Table', category: 'Furniture', stock: 6, price: 18500, status: 'Active', sku: 'ZH-FUR-NDT-02' },
  { id: 'P-003', name: 'Sahara Eyelet Curtains', category: 'Curtains', stock: 28, price: 3200, status: 'Active', sku: 'ZH-CUR-SEY-03' },
  { id: 'P-004', name: 'Wave Sheer Panels', category: 'Curtains', stock: 32, price: 1800, status: 'Draft', sku: 'ZH-CUR-WSP-04' },
  { id: 'P-005', name: 'Arco Arc Floor Lamp', category: 'Accessories', stock: 9, price: 4200, status: 'Active', sku: 'ZH-ACC-AFL-05' },
  { id: 'P-006', name: 'Atlas Coffee Table', category: 'Furniture', stock: 0, price: 8900, status: 'Archived', sku: 'ZH-FUR-ACT-06' },
];

export const adminCustomers: AdminCustomer[] = [
  { id: 'C-1001', name: 'Nokuthula Maseko', email: 'nokuthula@example.com', totalSpent: 68400, orders: 8, segment: 'VIP', lastOrder: '2026-04-03' },
  { id: 'C-1002', name: 'Jason Kriel', email: 'jason@example.com', totalSpent: 23300, orders: 3, segment: 'Repeat', lastOrder: '2026-04-03' },
  { id: 'C-1003', name: 'Ayaan Patel', email: 'ayaan@example.com', totalSpent: 31400, orders: 1, segment: 'New', lastOrder: '2026-04-02' },
  { id: 'C-1004', name: 'Lerato Dlamini', email: 'lerato@example.com', totalSpent: 102200, orders: 11, segment: 'VIP', lastOrder: '2026-04-01' },
  { id: 'C-1005', name: 'Mia Stewart', email: 'mia@example.com', totalSpent: 5200, orders: 1, segment: 'New', lastOrder: '2026-03-31' },
];

export const adminContentBlocks: AdminContentBlock[] = [
  { id: 'B-001', title: 'Homepage Hero Campaign', route: '/', status: 'Published', updatedAt: '2026-04-02 12:40' },
  { id: 'B-002', title: 'Winter Curtain Promo', route: '/shop/curtains', status: 'Scheduled', updatedAt: '2026-04-05 08:00' },
  { id: 'B-003', title: 'Design Studio Feature Strip', route: '/design-studio', status: 'Published', updatedAt: '2026-03-30 16:15' },
  { id: 'B-004', title: 'Checkout Trust Notes', route: '/checkout', status: 'Draft', updatedAt: '2026-04-03 09:20' },
];

export const adminAlerts = [
  '7 orders are waiting for fulfillment assignment.',
  '3 products are out of stock and still marked active.',
  '2 content blocks are scheduled in the next 24 hours.',
  'Payment webhook retries are pending for 4 transactions.',
];

export function formatCurrency(value: number): string {
  return `R ${value.toLocaleString('en-ZA')}`;
}
