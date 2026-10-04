import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';
export type LangMode = 'fa' | 'en';

interface UiState {
  theme: ThemeMode;
  lang: LangMode;
  isCartDrawerOpen: boolean;
  isSearchModalOpen: boolean;
}

const initialState: UiState = {
  // Keep the first render identical on the server and browser. Preferences are
  // restored by ThemeProvider after hydration.
  theme: 'dark',
  lang: 'fa',
  isCartDrawerOpen: false,
  isSearchModalOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydratePreferences: (state, action: PayloadAction<{ theme: ThemeMode; lang: LangMode }>) => {
      state.theme = action.payload.theme;
      state.lang = action.payload.lang;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hatefaroma_theme', action.payload);
      }
    },
    setLang: (state, action: PayloadAction<LangMode>) => {
      state.lang = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hatefaroma_lang', action.payload);
      }
    },
    toggleCartDrawer: (state, action?: PayloadAction<boolean>) => {
      state.isCartDrawerOpen =
        action?.payload !== undefined ? action.payload : !state.isCartDrawerOpen;
    },
    toggleSearchModal: (state, action?: PayloadAction<boolean>) => {
      state.isSearchModalOpen =
        action?.payload !== undefined ? action.payload : !state.isSearchModalOpen;
    },
  },
});

export const { hydratePreferences, setTheme, setLang, toggleCartDrawer, toggleSearchModal } = uiSlice.actions;
export default uiSlice.reducer;
