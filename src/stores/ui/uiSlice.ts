import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';
export type LangMode = 'fa' | 'en';

interface UiState {
  theme: ThemeMode;
  lang: LangMode;
  isCartDrawerOpen: boolean;
  isSearchModalOpen: boolean;
}

const getSavedTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('hatefaroma_theme') as ThemeMode) || 'dark';
};

const getSavedLang = (): LangMode => {
  if (typeof window === 'undefined') return 'fa';
  return (localStorage.getItem('hatefaroma_lang') as LangMode) || 'fa';
};

const initialState: UiState = {
  theme: typeof window !== 'undefined' ? getSavedTheme() : 'dark',
  lang: typeof window !== 'undefined' ? getSavedLang() : 'fa',
  isCartDrawerOpen: false,
  isSearchModalOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
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

export const { setTheme, setLang, toggleCartDrawer, toggleSearchModal } = uiSlice.actions;
export default uiSlice.reducer;
