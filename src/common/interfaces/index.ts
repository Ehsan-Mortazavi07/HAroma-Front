export type UserRole = 'admin' | 'editor' | 'user';

export type ConsultationConversationStatus = 'open' | 'closed';

export interface IConsultationConversation {
  id: string;
  guestName: string;
  status: ConsultationConversationStatus;
  lastMessageText: string;
  lastMessageAt: string;
  unreadForAdmin: number;
  unreadForGuest: number;
  closedAt: string | null;
  closedByAdminId: string | null;
  closedByAdminName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IConsultationMessage {
  id: string;
  conversationId: string;
  senderRole: 'customer' | 'admin';
  senderId: string | null;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface IUserAddress {
  _id: string;
  title: string;
  province: string;
  city: string;
  address: string;
  postalCode?: string;
  buildingNumber?: string;
  unit?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  addressNotes?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  isEmailVerified?: boolean;
  phone?: string;
  isPhoneVerified?: boolean;
  hasPassword?: boolean;
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
  addresses?: IUserAddress[];
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
  variantId?: string;
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
  buildingNumber?: string;
  unit?: string;
  addressDetail: string;
  description?: string;
}

export interface IOrderStatusHistoryEntry {
  status: IOrder['status'];
  changedAt: string;
  note?: string;
}

export interface IAdminOrderChangeNote {
  note: string;
  adminId: string;
  adminName: string;
  createdAt: string;
}

export interface IOrder {
  _id: string;
  __v?: number;
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
  shippingMethod?: string;
  shippingProvider?: string;
  trackingCode?: string;
  trackingUrl?: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  statusHistory?: IOrderStatusHistoryEntry[];
  notes?: string;
  adminChangeNotes?: IAdminOrderChangeNote[];
  createdAt: string;
  updatedAt?: string;
}

export type IAdminOrderUpdate = Pick<IOrder, 'deliveryAddress'> & {
  /** Version used to reject stale item indexes when an order changed elsewhere. */
  version: number;
  /** Indexes refer to the order's original item array; order items have no subdocument IDs. */
  removeItemIndexes: number[];
  itemQuantityUpdates: Array<{ index: number; quantity: number }>;
  addItems: Array<{ productId: string; quantity: number; variantId?: string }>;
  adminNote?: string;
};

export interface IPageSection {
  _id?: string;
  sectionKey: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  isVisible: boolean;
  isVipOnly: boolean;
  order: number;
  banners?: IPageSectionBanner[];
  config?: Record<string, any>;
}

export interface IPageSectionBanner {
  id?: string;
  imageUrl: string;
  link: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  badge?: string;
  badgeEn?: string;
  bgGradient?: string;
}

export interface IPageSectionPriority {
  sectionKey: string;
  order: number;
}

export interface ITrustFeatureContent {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  imageUrl?: string;
}

export interface ICartItem {
  product: IProduct;
  quantity: number;
  selectedVariant?: IProductVariant;
  selectedAttributes?: string;
}
