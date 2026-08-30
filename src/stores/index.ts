import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import cartReducer from './cart/cartSlice';
import uiReducer from './ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
