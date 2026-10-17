import axiosInstance from '../axiosInstance';

export type Granularity = 'day' | 'month' | 'year';

export interface ReportRangeParams {
  from: string;
  to: string;
  granularity?: Granularity;
}

export interface Comparable {
  value: number;
  previous: number;
}

export interface SeriesPoint {
  key: string;
  label: string;
  [field: string]: number | string;
}

export interface NamedCount {
  name: string;
  sessions: number;
  avgDuration: number;
}

export interface LiveSnapshot {
  visitors: number;
  loggedIn: number;
  mobile: number;
  pages: { path: string; visitors: number }[];
}

export interface PeriodSummary {
  key: string;
  from: string;
  to: string;
  orders: number;
  net: number;
  subscriptionRevenue: number;
  income: number;
  discounts: number;
  aov: number;
}

export interface OverviewReport {
  live: LiveSnapshot;
  kpis: Record<string, Comparable | null>;
  series: SeriesPoint[];
  periods: PeriodSummary[] | null;
  recentOrders: {
    _id: string;
    orderNumber: string;
    customer: string;
    total: number | null;
    status: string;
    paymentMethod: string;
    items: number;
    createdAt: string;
  }[];
}

export interface FinanceReport {
  summary: Record<string, any>;
  previous: Record<string, number>;
  periods: PeriodSummary[];
  series: SeriesPoint[];
  byStatus: { status: string; orders: number; amount: number }[];
  byPayment: { method: string; orders: number; amount: number }[];
  byShipping: { method: string; orders: number; fees: number }[];
  byProvince: { province: string; orders: number; amount: number }[];
  coupons: { code: string; uses: number; discount: number; amount: number }[];
  segments: { segment: 'vip' | 'regular'; orders: number; amount: number }[];
  topProducts: { productId: string; title: string; image: string; quantity: number; amount: number; orders: number }[];
  topCustomers: { _id: string; fullName?: string; username?: string; phone?: string; isVip?: boolean; orders: number; amount: number; lastOrderAt: string }[];
  byCategory: { categoryId: string; name: string; nameEn: string; quantity: number; amount: number }[];
  vipPlans: { planId: string; title: string; count: number; amount: number }[];
  inventory: {
    products: number;
    units: number;
    retailValue: number;
    outOfStock: number;
    lowStock: { productId: string; title: string; slug: string; stock: number }[];
  };
}

export interface TrafficReport {
  summary: Record<string, number>;
  previous: Record<string, number>;
  live: LiveSnapshot;
  series: SeriesPoint[];
  referrers: NamedCount[];
  utmSources: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  os: NamedCount[];
  landingPages: NamedCount[];
  exitPages: NamedCount[];
  heatmap: number[][];
  durationBuckets: { bucket: string; sessions: number }[];
  depthBuckets: { bucket: string; sessions: number }[];
  topPages: { path: string; pageType: string; title: string; views: number; visitors: number; avgTime: number; avgScroll: number }[];
  pageTypes: { type: string; views: number; avgTime: number }[];
  searches: { term: string; count: number; visitors: number }[];
  funnel: { sessions: number; viewedProduct: number; addedToCart: number; beganCheckout: number; purchased: number };
}

export interface ProductReportRow {
  productId: string;
  title: string;
  titleEn: string;
  slug: string;
  image: string;
  price: number;
  stock: number;
  isPublished: boolean;
  isVipOnly: boolean;
  views: number;
  visitors: number;
  totalTime: number;
  avgTime: number;
  avgScroll: number;
  addToCart: number;
  cartRate: number;
  quantity: number;
  amount: number | null;
  orders: number;
  conversion: number;
}

export interface ProductsReport {
  totals: { views: number; addToCart: number; quantity: number; amount: number | null; neverViewed: number; neverSold: number };
  items: ProductReportRow[];
}

export interface ProductDetailReport {
  product: { _id: string; title: string; titleEn?: string; slug: string; images?: string[] };
  series: SeriesPoint[];
  referrers: { name: string; views: number }[];
}

export interface VisitorRow {
  key: string;
  user: { _id: string; fullName?: string; username?: string; phone?: string; email?: string; isVip?: boolean; role?: string; avatar?: string } | null;
  sessions: number;
  duration: number;
  avgSessionDuration: number;
  pageViews: number;
  firstSeenAt: string;
  lastSeenAt: string;
  devices: string[];
  referrers: string[];
  landingPath: string;
  orders: number;
  spent: number | null;
}

export interface VisitorsReport {
  type: 'users' | 'guests';
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: VisitorRow[];
}

export interface VisitorDetailReport {
  key: string;
  isUser: boolean;
  user: Record<string, any> | null;
  lifetime: Record<string, any>;
  addToCart: number;
  series: SeriesPoint[];
  pageTypes: { type: string; views: number; duration: number }[];
  products: { productId: string; title: string; slug: string; image: string; views: number; duration: number; lastViewedAt: string }[];
  sessions: {
    sessionId: string;
    startedAt: string;
    lastSeenAt: string;
    duration: number;
    pageViews: number;
    device: string;
    browser: string;
    os: string;
    referrer: string;
    landingPath: string;
    exitPath: string;
    pages: { path: string; pageType: string; title: string; duration: number; scrollDepth: number; enteredAt: string }[];
  }[];
  orders: { _id: string; orderNumber: string; total: number | null; status: string; paymentMethod: string; createdAt: string; items: { title: string; quantity: number }[] }[];
}

export const reportsApi = {
  overview: async (params: ReportRangeParams) =>
    (await axiosInstance.get<OverviewReport>('/admin/reports/overview', { params })).data,
  finance: async (params: ReportRangeParams) =>
    (await axiosInstance.get<FinanceReport>('/admin/reports/finance', { params, timeout: 30000 })).data,
  traffic: async (params: ReportRangeParams) =>
    (await axiosInstance.get<TrafficReport>('/admin/reports/traffic', { params, timeout: 30000 })).data,
  products: async (params: ReportRangeParams & { sortBy?: string }) =>
    (await axiosInstance.get<ProductsReport>('/admin/reports/products', { params, timeout: 30000 })).data,
  productDetail: async (id: string, params: ReportRangeParams) =>
    (await axiosInstance.get<ProductDetailReport>(`/admin/reports/products/${encodeURIComponent(id)}`, { params })).data,
  visitors: async (params: ReportRangeParams & { type: 'users' | 'guests'; sortBy?: string; q?: string; page?: number; pageSize?: number }) =>
    (await axiosInstance.get<VisitorsReport>('/admin/reports/visitors', { params })).data,
  visitorDetail: async (key: string, params: ReportRangeParams) =>
    (await axiosInstance.get<VisitorDetailReport>(`/admin/reports/visitors/${encodeURIComponent(key)}`, { params })).data,
};
