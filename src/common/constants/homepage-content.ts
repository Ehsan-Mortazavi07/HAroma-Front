import type { IPageSectionBanner, ITrustFeatureContent } from '@/common/interfaces';

export const DEFAULT_HERO_BANNER: IPageSectionBanner = {
  id: 'hero',
  imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
  link: '/products',
  title: 'شکوه و اصالت رایحه را با هاتف آروما تجربه کنید',
  titleEn: 'Experience the Art of Olfaction with Hatef Aroma',
  subtitle: 'مجموعه‌ای بی‌نظیر از شاهکارهای عطرشناسی جهان، برندهای نیش فرانسوی و ایتالیایی، همراه با ضمانت اصالت ۱۰۰٪ و ارسال سریع.',
  subtitleEn: 'An exquisite curation of world-renowned French & Italian niche perfumery masterpieces, backed by 100% guaranteed authenticity and express delivery.',
  badge: 'کالکشن شاهکارهای عطرشناسی ۲۰۲۶',
  badgeEn: 'Autumn & Winter 2026 Niche Collection',
};

export const DEFAULT_CAMPAIGN_BANNERS: IPageSectionBanner[] = [
  {
    id: 'gift', imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f55b9ab0128?q=80&w=900&auto=format&fit=crop', link: '/products?category=gift-sets',
    title: 'پک‌های کادویی لوکس', titleEn: 'Luxury Gift Sets', subtitle: 'بهترین هدیه برای عزیزان با امکان انتخاب از تمام محصولات', subtitleEn: 'Present a gift card and let them choose their favorite scent', badge: 'هدیه ویژه', badgeEn: 'Gift Sets',
  },
  {
    id: 'vip', imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=900&auto=format&fit=crop', link: '/vip',
    title: 'باشگاه مشتریان طلایی', titleEn: 'VIP Gold Club', subtitle: 'تخفیف‌های دائمی، ارسال رایگان و دسترسی به عطرهای نیش', subtitleEn: 'Enjoy exclusive discounts on luxury and niche fragrances', badge: 'تخفیف ویژه VIP', badgeEn: 'VIP 30% Off',
  },
  {
    id: 'consultation', imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=900&auto=format&fit=crop', link: '/consultation',
    title: 'انتخاب رایحه امضا', titleEn: 'Find Your Signature Scent', subtitle: 'طراحی امضای بویایی اختصاصی بر اساس تیپ شخصیتی شما', subtitleEn: 'Get expert guidance to discover a fragrance that feels like you', badge: 'مشاوره بویایی', badgeEn: 'Expert Advice',
  },
  {
    id: 'shipping', imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900&auto=format&fit=crop', link: '/products',
    title: 'ارسال سریع و ایمن', titleEn: 'Fast, Secure Delivery', subtitle: 'برای سفارش‌های بالای ۱ میلیون تومان در سراسر ایران', subtitleEn: 'Free delivery on orders over the qualifying amount', badge: 'ارسال رایگان', badgeEn: 'Free Shipping',
  },
];

export const DEFAULT_VIP_BANNER: IPageSectionBanner = {
  id: 'vip-club',
  imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop',
  link: '/vip',
  title: 'عضو VIP شوید و از تخفیف‌های دائمی و هدایای ارزشمند لذت ببرید',
  titleEn: 'Join VIP Club for permanent discounts & complimentary niche samples',
  subtitle: 'شروع پلن‌ها از فقط ۲۹۰,۰۰۰ تومان',
  subtitleEn: 'Membership tiers starting from only 290,000 Toman',
};

export const DEFAULT_VIP_PERKS = {
  fa: [
    'تا ۱۵٪ تخفیف خودکار روی تمامی خریدهای جاری',
    'تحویل فوری سفارشات بدون هزینه ارسال در سراسر کشور',
    'دریافت نمونه‌های عطرهای نیش و کمیاب با هر خرید',
    'طراحی امضای بویایی شخصی با کارشناس ارشد عطرشناسی',
  ],
  en: [
    'Up to 15% automatic discount on all catalog items',
    'Free doorstep priority shipping on all orders',
    'Complimentary 2ml niche perfume discovery vials',
    'Personalized scent signature curation with experts',
  ],
};

export const resolveHomepageLink = (path: string | undefined, fallback: string): string =>
  path?.startsWith('/') && !path.startsWith('//') ? path : fallback;

export const DEFAULT_TRUST_FEATURES: ITrustFeatureContent[] = [
  { id: 'guarantee', title: 'ضمانت اصالت ۱۰۰٪ فیزیکی', titleEn: '100% Genuine Authenticity', description: 'سنجش بارکد رسمی و ضمانت سلامت کالا', descriptionEn: 'Official batch code & original perfume verification', imageUrl: '' },
  { id: 'delivery', title: 'ارسال سریع و ایمن', titleEn: 'Fast & Insured Delivery', description: 'بسته‌بندی ضربه‌گیر ویژه در سراسر کشور', descriptionEn: 'Protective luxury packaging across the country', imageUrl: '' },
  { id: 'installment', title: 'پرداخت اقساطی ۴ ماهه', titleEn: '4x Interest-Free Installments', description: 'خرید بدون ضامن و کارمزد با اسنپ‌پی', descriptionEn: 'Split your payment in 4 installments with SnapPay', imageUrl: '' },
  { id: 'consultation', title: 'مشاوره تخصصی بویایی', titleEn: 'Expert Scent Concierge', description: 'راهنمای انتخاب رایحه امضا متناسب با سلیقه شما', descriptionEn: 'Discover your signature scent with certified perfumers', imageUrl: '' },
];
