import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import cartReducer, { addToCart } from './cart/cartSlice';
import uiReducer from './ui/uiSlice';
import { trackEvent } from '@/common/analytics/tracker';

const analyticsListener = createListenerMiddleware();
analyticsListener.startListening({
  actionCreator: addToCart,
  effect: ({ payload }) => {
    const quantity = payload.quantity ?? 1;
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
