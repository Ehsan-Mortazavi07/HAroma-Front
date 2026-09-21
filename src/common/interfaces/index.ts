export type UserRole = 'admin' | 'editor' | 'user';

export interface IUser {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isVip: boolean;
  vipExpiresAt?: string | null;
  avatar?: string;
  birthDate?: string | null;
  birthDateShamsi?: string | null;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  buildingNumber?: string;
  unit?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  addressNotes?: string;
  createdAt?: string;
}

export interface IBrand {
  _id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  logo?: string;
  image?: string;
  order?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface ICategory {
  _id: string;
  name: string;
  nameEn?: string;
  slug: string;
  parentId?: string | ICategory | null;
  description?: string;
  image?: string;
  icon?: string;
  order?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface IAttribute {
  _id: string;
  name: string;
  nameEn?: string;
  key: string;
  possibleValues: string[];
  unit?: string;
}

export interface IProductAttribute {
  attributeId?: string;
  key: string;
  name: string;
  value: string;
  values?: string[];
  unit?: string;
}

export interface IProductVariant {
  id: string;
  title: string; // e.g. "حجم ۵۰ میلی‌لیتر" or "100ml"
  titleEn?: string;
  price: number;
  discountPrice?: number | null;
  stockCount: number;
  inStock: boolean;
  isDefault?: boolean;
}

export interface IVariantTemplate {
  _id: string;
  title: string;
  titleEn?: string;
  defaultPrice: number;
  defaultDiscountPrice?: number | null;
  defaultStock: number;
  unit?: string;
  isPopular?: boolean;
  order?: number;
  createdAt?: string;
}

export interface IProduct {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  price: number;
  discountPrice?: number | null;
  images: string[];
  brand?: IBrand | null;
  brands?: IBrand[];
  categories: ICategory[];
  attributes: IProductAttribute[];
  variants?: IProductVariant[];
  stockCount: number;
  inStock: boolean;
  isVipOnly: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  isFeatured: boolean;
  isPublished?: boolean;
  createdAt?: string;
}

export interface IVipPlan {
  _id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  durationDays: number;
  discountPercent: number;
  perks: string[];
  perksEn?: string[];
  badgeColor?: string;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface ICoupon {
  _id: string;
  code: string;
  discountPercent: number;
  discountAmount: number;
  minPurchase: number;
  maxDiscount?: number | null;
  expiresAt?: string | null;
  usageLimit: number;
  usedCount: number;
  isActive?: boolean;
}

export interface IOrderItem {
  product: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  selectedVariant?: IProductVariant;
  selectedAttributes?: string;
}

export interface IDeliveryAddress {
  fullName: string;
  phone: string;
  email?: string;
  province: string;
  city: string;
  postalCode?: string;
  addressDetail: string;
  description?: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: IUser;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress;
  paymentMethod: 'online' | 'cod' | 'installment';
  subtotal: number;
  shippingFee: number;
  couponDiscount: number;
  vipDiscount: number;
  couponCode?: string;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingCode?: string;
  notes?: string;
  createdAt: string;
}

export interface IPageSection {
  _id?: string;
  sectionKey: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  isVisible: boolean;
  isVipOnly: boolean;
  order: number;
  banners?: Array<{
    imageUrl: string;
    link: string;
    title?: string;
    subtitle?: string;
    badge?: string;
    bgGradient?: string;
  }>;
  config?: Record<string, any>;
}

export interface ICartItem {
  product: IProduct;
  quantity: number;
  selectedVariant?: IProductVariant;
  selectedAttributes?: string;
}
