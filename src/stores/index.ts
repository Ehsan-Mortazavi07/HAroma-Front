import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import cartReducer, { addToCart } from './cart/cartSlice';
import uiReducer from './ui/uiSlice';
import { trackEvent } from '@/common/analytics/tracker';

const analyticsListener = createListenerMiddleware();
analyticsListener.startListening({
  actionCreator: addToCart,
  effect: ({ payload }, api) => {
    // Count only units that actually entered the cart (stock limits can turn an add into a no-op).
    const lineQuantity = (state: unknown) =>
      (state as RootState).cart.items
        .filter((item) => item.product._id === payload.product._id && item.selectedVariant?.id === payload.selectedVariant?.id)
        .reduce((sum, item) => sum + item.quantity, 0);
    const quantity = lineQuantity(api.getState()) - lineQuantity(api.getOriginalState());
    if (quantity <= 0) return;
    const unitPrice = payload.selectedVariant
      ? payload.selectedVariant.discountPrice || payload.selectedVariant.price
      : payload.product.discountPrice || payload.product.price;
    trackEvent('add_to_cart', { productId: payload.product._id, quantity, value: (unitPrice || 0) * quantity });
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(analyticsListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
