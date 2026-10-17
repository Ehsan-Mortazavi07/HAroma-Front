import type { ICartItem, IProduct, IProductVariant } from '@/common/interfaces';
import { toPersianDigits } from '@/common/utils';

/** Everything that decides how many units of one cart line a shopper may hold. */
export interface PurchaseRules {
  /** Units in stock; Infinity when stock is not tracked. */
  stock: number;
  /** Smallest order quantity the admin allows (>= 1). */
  min: number;
  /** Admin cap per order, or null. */
  maxPerOrder: number | null;
  /** Effective ceiling: the smaller of stock and the admin cap. */
  max: number;
  /** False when the product is out of stock or stock is below the required minimum. */
  canBuy: boolean;
}

export function getAvailableStock(product: IProduct, variant?: IProductVariant | null): number {
  const source = variant || product;
  if (!source || source.inStock === false) return 0;
  const count = Number(source.stockCount);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : Infinity;
}

export function getPurchaseRules(product: IProduct, variant?: IProductVariant | null): PurchaseRules {
  const stock = getAvailableStock(product, variant);
  const min = Math.max(1, Math.floor(Number(product.minPurchaseQuantity) || 1));
  const rawMax = Number(product.maxPurchaseQuantity);
  const maxPerOrder = Number.isFinite(rawMax) && rawMax >= 1 ? Math.floor(rawMax) : null;
  const max = Math.min(stock, maxPerOrder ?? Infinity);
  return { stock, min, maxPerOrder, max, canBuy: stock > 0 && max >= min };
}

/** Rules for a cart line, preferring the product's current variant data over the stored snapshot. */
export function getCartItemRules(item: Pick<ICartItem, 'product' | 'selectedVariant'>): PurchaseRules {
  const variant = item.selectedVariant
    ? item.product.variants?.find((candidate) => candidate.id === item.selectedVariant!.id) || item.selectedVariant
    : undefined;
  return getPurchaseRules(item.product, variant);
}

const num = (value: number, isPersian: boolean) => (isPersian ? toPersianDigits(value) : String(value));

/** Why nothing can be added to an empty line (out of stock, or stock below the minimum). */
export function cannotBuyMessage(rules: PurchaseRules, title: string, isPersian: boolean): string {
  if (rules.stock <= 0) {
    return isPersian ? `«${title}» در حال حاضر موجود نیست.` : `"${title}" is currently out of stock.`;
  }
  return isPersian
    ? `حداقل خرید «${title}» ${num(rules.min, true)} عدد است اما فقط ${num(rules.stock, true)} عدد موجود است.`
    : `"${title}" must be bought in quantities of at least ${rules.min}, but only ${rules.stock} are in stock.`;
}

/** Why the shopper cannot add one more unit to a line that is already at its ceiling. */
export function maxReachedMessage(rules: PurchaseRules, title: string, isPersian: boolean): string {
  const ruleBinds = rules.maxPerOrder !== null && rules.maxPerOrder <= rules.stock;
  if (ruleBinds) {
    return isPersian
      ? `حداکثر تعداد خرید «${title}» در هر سفارش ${num(rules.maxPerOrder!, true)} عدد است؛ نمی‌توانید بیشتر انتخاب کنید.`
      : `You can order at most ${rules.maxPerOrder} of "${title}" per order.`;
  }
  return isPersian
    ? `نمی‌توانید بیشتر از موجودی انتخاب کنید؛ از «${title}» فقط ${num(rules.stock, true)} عدد موجود است.`
    : `You can't add more than the stock; only ${rules.stock} of "${title}" available.`;
}

/** Short hint shown next to a line, e.g. «حداقل خرید: ۲ عدد · حداکثر: ۵ عدد». Null when nothing is unusual. */
export function purchaseHint(rules: PurchaseRules, quantity: number, isPersian: boolean): string | null {
  const parts: string[] = [];
  if (rules.min > 1) parts.push(isPersian ? `حداقل خرید: ${num(rules.min, true)} عدد` : `Minimum order: ${rules.min}`);
  if (Number.isFinite(rules.max) && quantity >= rules.max) {
    parts.push(isPersian ? `حداکثر: ${num(rules.max, true)} عدد` : `Maximum: ${rules.max}`);
  } else if (rules.maxPerOrder !== null && rules.maxPerOrder <= rules.stock) {
    parts.push(isPersian ? `حداکثر در هر سفارش: ${num(rules.maxPerOrder, true)} عدد` : `Max per order: ${rules.maxPerOrder}`);
  }
  return parts.length ? parts.join(isPersian ? ' · ' : ' · ') : null;
}
