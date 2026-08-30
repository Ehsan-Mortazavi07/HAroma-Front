import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '@/common/interfaces';
import { storage } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialToken = typeof window !== 'undefined' ? storage.getToken() : null;
const initialUser = typeof window !== 'undefined' ? storage.getUser() : null;

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/users/profile');
    storage.setUser(res.data);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message || 'خطا در دریافت اطلاعات کاربر');
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: IUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      storage.setToken(action.payload.token);
      storage.setUser(action.payload.user);
    },
    updateUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      storage.removeToken();
      storage.removeUser();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state) => {
        // if token invalid, cleanup
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        storage.removeToken();
        storage.removeUser();
      });
  },
});

export const { setAuth, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
