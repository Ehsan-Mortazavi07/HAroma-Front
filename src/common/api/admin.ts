import axiosInstance from '../axiosInstance';

export const adminApi = {
  // Products CRUD
  getProducts: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/products', { params });
    return res.data;
  },
  getProduct: async (id: string) => {
    const res = await axiosInstance.get(`/admin/products/${id}`);
    return res.data;
  },
  createProduct: async (data: any) => {
    const res = await axiosInstance.post('/admin/products', data);
    return res.data;
  },
  updateProduct: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Categories CRUD
  getCategories: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/categories', { params });
    return res.data;
  },
  getCategory: async (id: string) => {
    const res = await axiosInstance.get(`/admin/categories/${id}`);
    return res.data;
  },
  createCategory: async (data: any) => {
    const res = await axiosInstance.post('/admin/categories', data);
    return res.data;
  },
  updateCategory: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/categories/${id}`);
    return res.data;
  },

  // Attributes CRUD & Quick Create
  getAttributes: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/attributes', { params });
    return res.data;
  },
  createAttribute: async (data: any) => {
    const res = await axiosInstance.post('/admin/attributes', data);
    return res.data;
  },
  quickCreateAttribute: async (data: { name: string; value?: string; unit?: string }) => {
    const res = await axiosInstance.post('/admin/attributes/quick-create', data);
    return res.data;
  },
  updateAttribute: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/attributes/${id}`, data);
    return res.data;
  },
  deleteAttribute: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/attributes/${id}`);
    return res.data;
  },

  // Variant Templates (Standalone Volume/Size Presets)
  getVariantTemplates: async () => {
    const res = await axiosInstance.get('/admin/variant-templates');
    return res.data;
  },
  createVariantTemplate: async (data: any) => {
    const res = await axiosInstance.post('/admin/variant-templates', data);
    return res.data;
  },
  updateVariantTemplate: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/variant-templates/${id}`, data);
    return res.data;
  },
  deleteVariantTemplate: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/variant-templates/${id}`);
    return res.data;
  },

  // Users CRUD & Role/VIP Management
  getUsers: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/users', { params });
    return res.data;
  },
  getUser: async (id: string) => {
    const res = await axiosInstance.get(`/admin/users/${id}`);
    return res.data;
  },
  createUser: async (data: any) => {
    const res = await axiosInstance.post('/admin/users', data);
    return res.data;
  },
  updateUser: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/users/${id}`, data);
    return res.data;
  },
  setUserRole: async (id: string, role: string) => {
    const res = await axiosInstance.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },
  updateUserRole: async (id: string, role: string) => {
    const res = await axiosInstance.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },
  toggleUserVip: async (id: string, isVip: boolean, durationDays?: number) => {
    const res = await axiosInstance.patch(`/admin/users/${id}/vip`, { isVip, durationDays });
    return res.data;
  },
  updateUserVip: async (id: string, isVip: boolean, durationDays?: number) => {
    const res = await axiosInstance.patch(`/admin/users/${id}/vip`, { isVip, durationDays });
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/users/${id}`);
    return res.data;
  },

  // Orders CRUD
  getOrders: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/orders', { params });
    return res.data;
  },
  getOrder: async (id: string) => {
    const res = await axiosInstance.get(`/admin/orders/${id}`);
    return res.data;
  },
  getDashboardStats: async () => {
    const res = await axiosInstance.get('/admin/orders/dashboard-stats');
    return res.data;
  },
  updateOrderStatus: async (id: string, status: string, trackingCode?: string) => {
    const res = await axiosInstance.patch(`/admin/orders/${id}/status`, { status, trackingCode });
    return res.data;
  },

  // Coupons CRUD
  getCoupons: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/coupons', { params });
    return res.data;
  },
  createCoupon: async (data: any) => {
    const res = await axiosInstance.post('/admin/coupons', data);
    return res.data;
  },
  updateCoupon: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/coupons/${id}`, data);
    return res.data;
  },
  deleteCoupon: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/coupons/${id}`);
    return res.data;
  },

  // VIP Plans CRUD
  getVipPlans: async () => {
    const res = await axiosInstance.get('/admin/vip-plans');
    return res.data;
  },
  createVipPlan: async (data: any) => {
    const res = await axiosInstance.post('/admin/vip-plans', data);
    return res.data;
  },
  updateVipPlan: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/vip-plans/${id}`, data);
    return res.data;
  },
  deleteVipPlan: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/vip-plans/${id}`);
    return res.data;
  },

  // Page Sections CRUD
  getPageSections: async () => {
    const res = await axiosInstance.get('/admin/page-sections');
    return res.data;
  },
  updatePageSection: async (sectionKey: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/page-sections/${sectionKey}`, data);
    return res.data;
  },
  toggleSectionVip: async (sectionKey: string, isVipOnly: boolean) => {
    const res = await axiosInstance.patch(`/admin/page-sections/${sectionKey}/toggle-vip`, { isVipOnly });
    return res.data;
  },
  toggleSectionVisibility: async (sectionKey: string, isVisible: boolean) => {
    const res = await axiosInstance.patch(`/admin/page-sections/${sectionKey}/toggle-visibility`, { isVisible });
    return res.data;
  },

  // Image Upload
  uploadImage: async (file: File): Promise<{ path: string; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
