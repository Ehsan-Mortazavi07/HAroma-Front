'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Plus } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images = [], onChange, maxImages = 8 }: ImageUploaderProps) {
  const { isPersian } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await adminApi.uploadImage(file);
        if (res?.path) {
          uploadedUrls.push(res.path);
        }
      }
      onChange([...images, ...uploadedUrls]);
      toast.success(isPersian ? 'تصاویر با موفقیت آپلود شدند.' : 'Images uploaded successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در آپلود تصاویر.' : 'Failed to upload images.'));
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput('');
    setIsUrlModalOpen(false);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#9f815b]" />
          <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'گالری و تصاویر باکیفیت محصول' : 'Product Media & High-Res Gallery'}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsUrlModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>{isPersian ? '+ افزودن لینک اینترنتی تصویر' : '+ Add Image URL'}</span>
        </button>
      </div>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {images.map((img, idx) => {
          const displayUrl = img.startsWith('http') ? img : `http://127.0.0.1:7731${img}`;
          return (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs"
            >
              <Image src={displayUrl} alt={`Product ${idx}`} fill className="object-cover" />
              {idx === 0 && (
                <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-[#bfa27a] text-[#1d241d] text-[10px] font-black shadow-xs">
                  {isPersian ? 'تصویر کاور' : 'Cover'}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Upload Button Tile */}
        {images.length < maxImages && (
          <label className="aspect-square rounded-2xl border-2 border-dashed border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-[#f8f5f0]/50 dark:bg-[#242c24]/50">
            <Upload className="w-6 h-6 text-[#9f815b] mb-1" />
            <span className="text-[11px] font-bold text-[#1d241d] dark:text-[#f7f4ee]">
              {uploading ? (isPersian ? 'در حال آپلود...' : 'Uploading...') : (isPersian ? 'آپلود تصویر' : 'Upload Image')}
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* URL Input Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <h4 className="font-black text-sm">
                {isPersian ? 'افزودن مستقیم تصویر با لینک URL' : 'Add Image by Direct URL'}
              </h4>
              <button onClick={() => setIsUrlModalOpen(false)}>
                <X className="w-4 h-4 text-[#73695c]" />
              </button>
            </div>

            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-mono focus:ring-2 focus:ring-[#bfa27a]"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddUrl}
                className="flex-1 py-2.5 rounded-xl font-bold bg-[#bfa27a] text-[#1d241d] text-xs shadow-sm"
              >
                {isPersian ? 'افزودن تصویر' : 'Add Image'}
              </button>
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-xs font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
              >
                {isPersian ? 'انصراف' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
