import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICartItem, IProduct, IProductVariant } from '@/common/interfaces';
import { CART_KEY } from '@/common/utils';

interface CartState {
  items: ICartItem[];
}

const loadCartFromStorage = (): ICartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
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
  items: typeof window !== 'undefined' ? loadCartFromStorage() : [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
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

      if (existing) {
        existing.quantity += quantity;
        if (selectedVariant) existing.selectedVariant = selectedVariant;
        if (selectedAttributes) existing.selectedAttributes = selectedAttributes;
      } else {
        state.items.push({
          product,
          quantity,
          selectedVariant,
          selectedAttributes: selectedAttributes || selectedVariant?.title,
        });
      }
      saveCartToStorage(state.items);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>,
    ) => {
      const { productId, variantId, quantity } = action.payload;
      const index = state.items.findIndex(
        (item) =>
          item.product._id === productId &&
          ((!item.selectedVariant && !variantId) || item.selectedVariant?.id === variantId),
      );

      if (index !== -1) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
        }
      }
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
              ((!item.selectedVariant && !variantId) || item.selectedVariant?.id === variantId)
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

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
