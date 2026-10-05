import axiosInstance from '../axiosInstance';
import type {
  IConsultationConversation,
  IConsultationMessage,
  IAdminOrderChangeNote,
  IAdminOrderUpdate,
  IPageSection,
  IPageSectionPriority,
  IUserAddress,
} from '../interfaces';

export const adminApi = {
  // Customer consultation chat
  getConsultationConversations: async (status: 'open' | 'closed' | 'all' = 'open') => {
    const res = await axiosInstance.get<IConsultationConversation[]>(
      '/admin/consultation-chat/conversations',
      { params: { status } },
    );
    return res.data;
  },
  getConsultationMessages: async (conversationId: string, afterId?: string) => {
    const res = await axiosInstance.get<IConsultationMessage[]>(
      `/admin/consultation-chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      { params: afterId ? { afterId } : undefined },
    );
    return res.data;
  },
  sendConsultationMessage: async (conversationId: string, body: string) => {
    const res = await axiosInstance.post<IConsultationMessage>(
      `/admin/consultation-chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      { body },
    );
    return res.data;
  },
  setConsultationConversationStatus: async (conversationId: string, status: 'open' | 'closed') => {
    const res = await axiosInstance.patch<IConsultationConversation>(
      `/admin/consultation-chat/conversations/${encodeURIComponent(conversationId)}/status`,
      { status },
    );
    return res.data;
  },

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
  bulkUpdateProductsStatus: async (ids: string[], isPublished: boolean) => {
    const res = await axiosInstance.patch('/admin/products/bulk/status', { ids, isPublished });
    return res.data;
  },
  bulkDeleteProducts: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/products/bulk/delete', { ids });
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
  bulkUpdateCategoriesStatus: async (ids: string[], isActive: boolean) => {
    const res = await axiosInstance.patch('/admin/categories/bulk/status', { ids, isActive });
    return res.data;
  },
  bulkDeleteCategories: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/categories/bulk/delete', { ids });
    return res.data;
  },

  // Brands CRUD
  getBrands: async (params?: Record<string, any>) => {
    const res = await axiosInstance.get('/admin/brands', { params });
    return res.data;
  },
  getBrand: async (id: string) => {
    const res = await axiosInstance.get(`/admin/brands/${id}`);
    return res.data;
  },
  createBrand: async (data: any) => {
    const res = await axiosInstance.post('/admin/brands', data);
    return res.data;
  },
  updateBrand: async (id: string, data: any) => {
    const res = await axiosInstance.patch(`/admin/brands/${id}`, data);
    return res.data;
  },
  deleteBrand: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/brands/${id}`);
    return res.data;
  },
  bulkUpdateBrandsStatus: async (ids: string[], isActive: boolean) => {
    const res = await axiosInstance.patch('/admin/brands/bulk/status', { ids, isActive });
    return res.data;
  },
  bulkDeleteBrands: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/brands/bulk/delete', { ids });
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
  bulkDeleteAttributes: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/attributes/bulk/delete', { ids });
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
  bulkDeleteVariantTemplates: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/variant-templates/bulk/delete', { ids });
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
  getUserAddresses: async (id: string): Promise<IUserAddress[]> => {
    const res = await axiosInstance.get(`/admin/users/${id}/addresses`);
    return res.data;
  },
  createUserAddress: async (userId: string, data: Partial<IUserAddress>) => {
    const res = await axiosInstance.post(`/admin/users/${userId}/addresses`, data);
    return res.data;
  },
  updateUserAddress: async (userId: string, addressId: string, data: Partial<IUserAddress>) => {
    const res = await axiosInstance.patch(`/admin/users/${userId}/addresses/${addressId}`, data);
    return res.data;
  },
  deleteUserAddress: async (userId: string, addressId: string) => {
    const res = await axiosInstance.delete(`/admin/users/${userId}/addresses/${addressId}`);
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
  bulkUpdateUsersVip: async (ids: string[], isVip: boolean, durationDays?: number) => {
    const res = await axiosInstance.patch('/admin/users/bulk/vip', { ids, isVip, durationDays });
    return res.data;
  },
  getUserOrders: async (userId: string, params?: Record<string, any>) => {
    const res = await axiosInstance.get(`/admin/users/${encodeURIComponent(userId)}/orders`, { params });
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/users/${id}`);
    return res.data;
  },
  bulkDeleteUsers: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/users/bulk/delete', { ids });
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
  getOrderAdminChangeNotes: async (id: string): Promise<IAdminOrderChangeNote[]> => {
    const res = await axiosInstance.get(`/admin/orders/${id}/admin-notes`);
    return res.data;
  },
  updateOrder: async (id: string, data: IAdminOrderUpdate) => {
    const res = await axiosInstance.patch(`/admin/orders/${id}`, data);
    return res.data;
  },
  getDashboardStats: async () => {
    const res = await axiosInstance.get('/admin/orders/dashboard-stats');
    return res.data;
  },
  updateOrderStatus: async (
    id: string,
    updates: {
      status: string;
      trackingCode?: string;
      shippingProvider?: string;
      trackingUrl?: string;
    },
  ) => {
    const res = await axiosInstance.patch(`/admin/orders/${id}/status`, updates);
    return res.data;
  },
  bulkUpdateOrdersStatus: async (ids: string[], status: string) => {
    const res = await axiosInstance.patch('/admin/orders/bulk/status', { ids, status });
    return res.data;
  },
  bulkDeleteOrders: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/orders/bulk/delete', { ids });
    return res.data;
  },
  deleteOrder: async (id: string) => {
    const res = await axiosInstance.delete(`/admin/orders/${id}`);
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
  bulkUpdateCouponsStatus: async (ids: string[], isActive: boolean) => {
    const res = await axiosInstance.patch('/admin/coupons/bulk/status', { ids, isActive });
    return res.data;
  },
  bulkDeleteCoupons: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/coupons/bulk/delete', { ids });
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
  bulkUpdateVipPlansStatus: async (ids: string[], isActive: boolean) => {
    const res = await axiosInstance.patch('/admin/vip-plans/bulk/status', { ids, isActive });
    return res.data;
  },
  bulkDeleteVipPlans: async (ids: string[]) => {
    const res = await axiosInstance.post('/admin/vip-plans/bulk/delete', { ids });
    return res.data;
  },

  // Page Sections CRUD
  getPageSections: async () => {
    const res = await axiosInstance.get('/admin/page-sections');
    return res.data;
  },
  updatePageSection: async (
    sectionKey: string,
    data: Partial<IPageSection> & { priorityOrder?: IPageSectionPriority[] },
  ) => {
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
