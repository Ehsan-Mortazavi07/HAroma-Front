import Cookies from 'js-cookie';

export const TOKEN_KEY = 'hatefaroma_token';
export const USER_KEY = 'hatefaroma_user';
export const CART_KEY = 'hatefaroma_cart';

export const storage = {
  getToken: () => Cookies.get(TOKEN_KEY) || null,
  setToken: (token: string) => Cookies.set(TOKEN_KEY, token, { expires: 7 }),
  removeToken: () => Cookies.remove(TOKEN_KEY),

  getUser: () => {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
};

export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

export function toEnglishDigits(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return str
    .toString()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function formatToman(amount: number | undefined | null, isPersian: boolean = true): string {
  if (amount === undefined || amount === null) return isPersian ? '۰ تومان' : '0 Toman';
  if (!isPersian) {
    return `${amount.toLocaleString('en-US')} Toman`;
  }
  return `${toPersianDigits(amount.toLocaleString('fa-IR'))} تومان`;
}

export function formatPrice(amount: number | undefined | null, isPersian = true): string {
  if (amount === undefined || amount === null) return isPersian ? '۰ تومان' : '0 Toman';
  if (isPersian) {
    return `${toPersianDigits(amount.toLocaleString('fa-IR'))} تومان`;
  }
  return `${amount.toLocaleString('en-US')} Toman`;
}

export function numberToPersianWords(num: number | undefined | null): string {
  if (!num || isNaN(num) || num <= 0) return '';

  const billions = Math.floor(num / 1_000_000_000);
  const remainderAfterBillions = num % 1_000_000_000;

  const millions = Math.floor(remainderAfterBillions / 1_000_000);
  const remainderAfterMillions = remainderAfterBillions % 1_000_000;

  const thousands = Math.floor(remainderAfterMillions / 1_000);
  const remainderAfterThousands = remainderAfterMillions % 1_000;

  const parts: string[] = [];
  if (billions > 0) parts.push(`${toPersianDigits(billions.toLocaleString('en-US'))} میلیارد`);
  if (millions > 0) parts.push(`${toPersianDigits(millions.toLocaleString('en-US'))} میلیون`);
  if (thousands > 0) parts.push(`${toPersianDigits(thousands.toLocaleString('en-US'))} هزار`);
  if (remainderAfterThousands > 0) parts.push(toPersianDigits(remainderAfterThousands.toLocaleString('en-US')));

  if (parts.length === 0) return '';
  return parts.join(' و ') + ' تومان';
}


export function getLocalizedVariantTitle(title?: string, isPersian = true): string {
  if (!title) return '';
  if (isPersian) return title;

  const map: Record<string, string> = {
    'حجم ۵۰ میلی‌لیتر': '50 ml Bottle',
    'حجم ۱۰۰ میلی‌لیتر (استاندارد)': '100 ml (Standard)',
    'حجم ۲۰۰ میلی‌لیتر (جامبو)': '200 ml (Jumbo)',
    'دستریز اورجینال ۱۰ میل': '10 ml Original Decant',
    'تستر اورجینال': 'Original Tester',
    'حجم ۳۰ میل': '30 ml Bottle',
    'حجم ۵۰ میل': '50 ml Bottle',
    'حجم ۱۰۰ میل': '100 ml Standard',
    'حجم ۲۰۰ میل': '200 ml Jumbo',
    'حجم ۲۵۰ میل': '250 ml Bottle',
    'دستریز ۱۰ میل': '10 ml Decant',
  };

  if (map[title]) return map[title];

  let en = title;
  en = en.replace(/حجم\s*([0-9۰-۹]+)\s*(میلی‌لیتر|میل)/gi, '$1 ml');
  en = en.replace(/\(استاندارد\)/g, '(Standard)');
  en = en.replace(/\(جامبو\)/g, '(Jumbo)');
  en = en.replace(/دستریز\s*(اورجینال)?\s*([0-9۰-۹]+)\s*میل/gi, '$2 ml Decant');
  en = en.replace(/تستر\s*(اورجینال)?/gi, 'Original Tester');
  en = en.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  return en.trim();
}

export function translateAttributeValue(val?: string, isPersian = true): string {
  if (!val) return '';
  if (isPersian) return val;

  const directMap: Record<string, string> = {
    // Scent characteristics
    'خنک': 'Cool / Fresh',
    'گرم': 'Warm',
    'معتدل': 'Moderate',
    'شیرین': 'Sweet',
    'تلخ': 'Bitter',
    'ترش': 'Tart / Sour',
    'تند': 'Spicy',
    'چرمی': 'Leather',
    'گلی': 'Floral',
    'شرقی': 'Oriental',
    'چوبی': 'Woody',
    'مرکباتی': 'Citrus',
    'میوه‌ای': 'Fruity',
    'ادویه‌ای': 'Spicy',
    'معطر': 'Aromatic',
    'سرخسی': 'Fougère',
    'چایپر': 'Chypre',
    'پودری': 'Powdery',
    'دودی': 'Smoky',
    'آکواتیک / خنک': 'Aquatic / Fresh',

    // Compound Scent Families
    'شرقی گلی': 'Oriental Floral',
    'چایپر میوه‌ای': 'Fruity Chypre',
    'شرقی سرخسی': 'Oriental Fougère',
    'معطر سرخسی': 'Aromatic Fougère',
    'چوبی معطر': 'Woody Aromatic',
    'مرکباتی معطر': 'Citrus Aromatic',
    'چوبی گلی': 'Woody Floral',
    'چایپر گلی': 'Chypre Floral',

    // Longevity
    'بسیار طولانی (بیش از ۲۴ ساعت)': 'Very Long Lasting (24h+)',
    'طولانی (۱۲ تا ۲۴ ساعت)': 'Long Lasting (12–24h)',
    'متوسط (۶ تا ۱۲ ساعت)': 'Moderate (6–12h)',
    'ملایم (۳ تا ۶ ساعت)': 'Light (3–6h)',

    // Sillage
    'بسیار قوی (رد بوی فوق‌العاده)': 'Very Strong (Enormous Trail)',
    'قوی و محسوس': 'Strong & Noticeable',
    'متوسط و استاندارد': 'Moderate & Standard',
    'ملایم و صمیمی': 'Intimate & Soft',

    // Volumes & Units
    '۳۰ میل': '30 ml',
    '۵۰ میل': '50 ml',
    '۱۰۰ میل': '100 ml',
    '۲۰۰ میل': '200 ml',
    '۲۵۰ میل': '250 ml',
    'میل': 'ml',
    'گرم (واحد)': 'g',

    // Countries
    'فرانسه': 'France',
    'ایتالیا': 'Italy',
    'انگلستان': 'United Kingdom',
    'آمریکا': 'United States',
    'عمان': 'Oman',
    'سوئیس': 'Switzerland',
    'امارات': 'United Arab Emirates',
    'امارات متحده عربی': 'UAE',

    // Genders & Seasons
    'مردانه': 'Men',
    'زنانه': 'Women',
    'اسپرت / مشترک': 'Unisex / Shared',
    'یونیسکس': 'Unisex',
    'چهارفصل': 'All Seasons',
    'بهار': 'Spring',
    'تابستان': 'Summer',
    'پاییز': 'Autumn',
    'زمستان': 'Winter',
    'پاییز و زمستان': 'Autumn & Winter',
    'بهار و تابستان': 'Spring & Summer',
  };

  if (directMap[val]) return directMap[val];

  let res = val;
  for (const [fa, en] of Object.entries(directMap)) {
    if (res.includes(fa)) {
      res = res.replace(new RegExp(fa, 'g'), en);
    }
  }
  return res;
}

export function getApiErrorMessage(error: any, isPersian = true): string {
  const msg = error?.response?.data?.message;
  if (!msg) {
    return isPersian
      ? 'خطایی رخ داده است. لطفاً مجدداً تلاش کنید.'
      : 'An unexpected error occurred. Please try again.';
  }

  if (Array.isArray(msg)) {
    return isPersian ? msg[0] : 'Validation error. Please check your inputs.';
  }

  if (!isPersian && typeof msg === 'string') {
    if (msg.includes('فعلی') && (msg.includes('نادرست') || msg.includes('اشتباه'))) {
      return 'Current password is incorrect.';
    }
    if (msg.includes('نام کاربری') && (msg.includes('انتخاب شده') || msg.includes('تکراری') || msg.includes('وجود دارد'))) {
      return 'This username is already taken. Please choose another.';
    }
    if (msg.includes('ایمیل') && (msg.includes('ثبت شده') || msg.includes('تکراری') || msg.includes('وجود دارد'))) {
      return 'This email address is already registered.';
    }
    if (msg.includes('کد تایید') && msg.includes('نامعتبر')) {
      return 'Invalid verification code.';
    }
    if (msg.includes('رمز عبور') || msg.includes('کاربری') || msg.includes('اطلاعات') || msg.includes('اشتباه')) {
      return 'Invalid username/email or password.';
    }
    if (msg.includes('یافت نشد')) {
      return 'Requested account or item not found.';
    }
  }

  return msg;
}

export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { type: 'success', message },
        }),
      );
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { type: 'error', message },
        }),
      );
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { type: 'info', message },
        }),
      );
    }
  },
};
