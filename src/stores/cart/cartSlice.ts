import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICartItem, IProduct, IProductVariant } from '@/common/interfaces';
import { CART_KEY, toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';

import { getCartItemRules, getPurchaseRules } from './purchaseLimits';

export { getAvailableStock, getCartItemRules, getPurchaseRules } from './purchaseLimits';

const sameLine = (item: ICartItem, productId: string, variantId?: string) =>
  item.product._id === productId && (variantId !== undefined ? item.selectedVariant?.id === variantId : true);

interface CartState {
  items: ICartItem[];
}

export const loadCartFromStorage = (): ICartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && item.product && typeof item.product === 'object' && (item.product._id || item.product.title),
    );
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: ICartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
};

const initialState: CartState = {
  // Keep server and browser initial state identical; storage is restored after hydration.
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<ICartItem[]>) => {
      state.items = action.payload;
    },
    addToCart: (
      state,
      action: PayloadAction<{
        product: IProduct;
        quantity?: number;
        selectedVariant?: IProductVariant;
        selectedAttributes?: string;
      }>,
    ) => {
      const { product, quantity = 1, selectedVariant, selectedAttributes } = action.payload;
      const variantId = selectedVariant?.id;

      const existing = state.items.find(
        (item) =>
          item.product._id === product._id &&
          ((!item.selectedVariant && !variantId) || item.selectedVariant?.id === variantId),
      );
      const freshVariant = variantId ? product.variants?.find((variant) => variant.id === variantId) || selectedVariant : undefined;
      const rules = getPurchaseRules(product, freshVariant);

      // The cart never holds more than stock/maximum allow, nor fewer than the minimum order.
      if (!rules.canBuy) return;
      const wanted = existing ? existing.quantity + quantity : Math.max(quantity, rules.min);
      const nextQuantity = Math.min(wanted, rules.max);
      if (nextQuantity < rules.min) return;
      if (existing) {
        existing.quantity = nextQuantity;
        existing.product = product;
        if (freshVariant) existing.selectedVariant = freshVariant;
        if (selectedAttributes) existing.selectedAttributes = selectedAttributes;
      } else {
        state.items.push({
          product,
          quantity: nextQuantity,
          selectedVariant: freshVariant,
          selectedAttributes: selectedAttributes || freshVariant?.title,
        });
      }
      saveCartToStorage(state.items);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>,
    ) => {
      const { productId, variantId, quantity } = action.payload;
      const index = state.items.findIndex((item) => sameLine(item, productId, variantId));

      if (index !== -1) {
        const rules = getCartItemRules(state.items[index]);
        // Going below the minimum order removes the line instead of leaving an invalid quantity.
        if (!rules.canBuy || quantity < rules.min) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = Math.min(quantity, rules.max);
        }
      }
      saveCartToStorage(state.items);
    },

    /** Replaces stored product snapshots with fresh server data and trims quantities to stock. */
    syncCartStock: (state, action: PayloadAction<{ products: IProduct[]; missingIds: string[] }>) => {
      const fresh = new Map(action.payload.products.map((product) => [product._id, product]));
      const missing = new Set(action.payload.missingIds);
      state.items = state.items.flatMap((item) => {
        if (missing.has(item.product._id)) return [];
        const product = fresh.get(item.product._id);
        if (!product) return [item];
        const variant = item.selectedVariant
          ? product.variants?.find((candidate) => candidate.id === item.selectedVariant!.id)
          : undefined;
        if (item.selectedVariant && !variant) return [];
        const next = { ...item, product, selectedVariant: variant || item.selectedVariant };
        const rules = getCartItemRules(next);
        return rules.canBuy ? [{ ...next, quantity: Math.min(Math.max(item.quantity, rules.min), rules.max) }] : [];
      });
      saveCartToStorage(state.items);
    },

    removeFromCart: (
      state,
      action: PayloadAction<{ productId: string; variantId?: string } | string>,
    ) => {
      if (typeof action.payload === 'string') {
        const id = action.payload;
        state.items = state.items.filter((item) => item.product._id !== id);
      } else {
        const { productId, variantId } = action.payload;
        state.items = state.items.filter(
          (item) =>
            !(
              item.product._id === productId &&
              (variantId !== undefined
                ? item.selectedVariant?.id === variantId
                : true)
            ),
        );
      }
      saveCartToStorage(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      saveCartToStorage([]);
    },
  },
});

export const { hydrateCart, addToCart, updateQuantity, removeFromCart, clearCart, syncCartStock } = cartSlice.actions;

/**
 * Re-reads stock for everything in the cart (it may have been added days ago)
 * and tells the shopper about any line that had to shrink or be removed.
 */
// App start, the cart page and the cart panel can all ask at once; one refresh is enough.
let stockRefreshInFlight = false;

export const refreshCartStock = createAsyncThunk('cart/refreshStock', async (_, { getState, dispatch }) => {
  stockRefreshInFlight = true;
  try {
    await refreshCartStockOnce(getState, dispatch);
  } finally {
    stockRefreshInFlight = false;
  }
}, { condition: () => !stockRefreshInFlight });

async function refreshCartStockOnce(getState: () => unknown, dispatch: (action: unknown) => unknown) {
  const state = getState() as { cart: CartState; ui: { lang: string } };
  const items = state.cart.items;
  if (!items.length) return;
  const isPersian = state.ui.lang !== 'en';
  const slugs = [...new Map(items.map((item) => [item.product._id, item.product.slug || item.product._id])).entries()];

  const results = await Promise.allSettled(
    slugs.map(([, slug]) => axiosInstance.get<IProduct>(`/products/${encodeURIComponent(slug)}`).then((res) => res.data)),
  );
  const products: IProduct[] = [];
  const missingIds: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value?._id) products.push(result.value);
    else if (result.status === 'rejected' && (result.reason as any)?.response?.status === 404) missingIds.push(slugs[index][0]);
  });
  if (!products.length && !missingIds.length) return;

  const before = new Map(items.map((item) => [`${item.product._id}:${item.selectedVariant?.id || ''}`, item]));
  dispatch(syncCartStock({ products, missingIds }));
  const after = new Map(
    (getState() as { cart: CartState }).cart.items.map((item) => [`${item.product._id}:${item.selectedVariant?.id || ''}`, item]),
  );

  for (const [key, item] of before) {
    const title = isPersian ? item.product.title : item.product.titleEn || item.product.title;
    const updated = after.get(key);
    if (!updated) {
      toast.error(isPersian ? `«${title}» دیگر موجود نیست و از سبد خرید حذف شد.` : `"${title}" is no longer available and was removed from your bag.`);
    } else if (updated.quantity > item.quantity) {
      toast.info(
        isPersian
          ? `حداقل خرید «${title}» ${updated.quantity.toLocaleString('fa-IR')} عدد است؛ تعداد در سبد خرید اصلاح شد.`
          : `"${title}" has a minimum order of ${updated.quantity}; your bag was updated.`,
      );
    } else if (updated.quantity < item.quantity) {
      toast.info(
        isPersian
          ? `از «${title}» فقط ${updated.quantity.toLocaleString('fa-IR')} عدد موجود است؛ تعداد در سبد خرید اصلاح شد.`
          : `Only ${updated.quantity} of "${title}" left; your bag was updated.`,
      );
    }
  }
}

export default cartSlice.reducer;
