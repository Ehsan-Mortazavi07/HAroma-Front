import axiosInstance from '../axiosInstance';
import { SERVER_BASE_API_URL } from '../constants/URL';
import { IProduct, ICategory, IBrand, IVipPlan, IPageSection } from '../interfaces';

// Server-side fetching helper
async function fetchServer<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_BASE_API_URL}${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Named exports for RSC and client fetchers
export const getProducts = async (params?: Record<string, any>) => {
  try {
    const res = await axiosInstance.get('/products', { params });
    return res.data;
  } catch {
    return { items: [], total: 0 };
  }
};

export const getProductBySlug = async (slug: string): Promise<IProduct | null> => {
  try {
    const res = await axiosInstance.get(`/products/${slug}`);
    return res.data;
  } catch {
    return null;
  }
};

export const getFeaturedProducts = async (limit = 16): Promise<IProduct[]> => {
  try {
    const res = await axiosInstance.get('/products/featured', { params: { limit } });
    return res.data || [];
  } catch {
    return [];
  }
};

export const getBestSellerProducts = async (limit = 8): Promise<IProduct[]> => {
  try {
    const res = await axiosInstance.get('/products/best-sellers', { params: { limit } });
    return res.data || [];
  } catch {
    return [];
  }
};

export const getBestSellers = getBestSellerProducts;

export const getVipExclusiveProducts = async (limit = 8): Promise<IProduct[]> => {
  try {
    const res = await axiosInstance.get('/products/vip-exclusive', { params: { limit } });
    return res.data || [];
  } catch {
    return [];
  }
};

export const getRelatedProducts = async (id: string, limit = 4): Promise<IProduct[]> => {
  try {
    const res = await axiosInstance.get(`/products/${id}/related`, { params: { limit } });
    return res.data || [];
  } catch {
    return [];
  }
};

export const getBrands = async (params?: Record<string, any>): Promise<IBrand[]> => {
  try {
    const res = await axiosInstance.get('/brands', { params });
    return res.data || [];
  } catch {
    return [];
  }
};

export const getBrandBySlug = async (slug: string): Promise<IBrand | null> => {
  try {
    const res = await axiosInstance.get(`/brands/${slug}`);
    return res.data;
  } catch {
    return null;
  }
};

export const getCategories = async (): Promise<ICategory[]> => {
  try {
    const res = await axiosInstance.get('/categories');
    return res.data || [];
  } catch {
    return [];
  }
};

export const getAttributes = async () => {
  try {
    const res = await axiosInstance.get('/attributes');
    return res.data || [];
  } catch {
    return [];
  }
};

export const getVipPlans = async (): Promise<IVipPlan[]> => {
  try {
    const res = await axiosInstance.get('/vip-plans');
    return res.data || [];
  } catch {
    return [];
  }
};

export const getPageSections = async (): Promise<IPageSection[]> => {
  try {
    const res = await axiosInstance.get('/page-sections');
    return res.data || [];
  } catch {
    return [];
  }
};

export const catalogApi = {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getBestSellers,
  getBestSellerProducts,
  getVipExclusiveProducts,
  getRelatedProducts,
  getCategories,
  getBrands,
  getBrandBySlug,
  getAttributes,
  getVipPlans,
  getPageSections,
  server: {
    getProducts: (params?: string) =>
      fetchServer<{ items: IProduct[]; total: number }>(`/products${params ? `?${params}` : ''}`),
    getProductBySlug: (slug: string) => fetchServer<IProduct>(`/products/${slug}`),
    getCategories: () => fetchServer<ICategory[]>('/categories'),
    getBrands: () => fetchServer<IBrand[]>('/brands'),
    getBrandBySlug: (slug: string) => fetchServer<IBrand>(`/brands/${slug}`),
    getVipPlans: () => fetchServer<IVipPlan[]>('/vip-plans'),
    getPageSections: () => fetchServer<IPageSection[]>('/page-sections'),
  },
};
