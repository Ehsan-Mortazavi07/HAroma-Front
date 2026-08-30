'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { adminApi } from '@/common/api/admin';
import { IProduct } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { isPersian } = useTranslation();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      adminApi
        .getProduct(id)
        .then((res) => setProduct(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#73695c] dark:text-[#a69c8e]">
        {isPersian ? 'در حال دریافت اطلاعات محصول...' : 'Loading product details...'}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-rose-500 font-bold">
        {isPersian ? 'محصول یافت نشد.' : 'Product not found.'}
      </div>
    );
  }

  return <ProductForm initialProduct={product} isEditing />;
}
