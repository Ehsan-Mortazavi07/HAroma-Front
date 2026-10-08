'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState } from 'react';
import Image from 'next/image';
import {
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus } from 'lucide-react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@heroui/react';
import { adminApi } from '@/common/api/admin';
import { toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { resolveMediaUrl } from '@/common/constants/URL';

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
      <div className="flex flex-col items-start gap-2 pb-3 border-b border-brand-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-brand-bronze" />
          <h3 className="font-black text-base text-brand-text">
            {isPersian ? 'گالری تصاویر محصول (اختیاری)' : 'Product Images (Optional)'}
          </h3>
        </div>

        <Button
          size="sm"
          variant="light"
          color="warning"
          onPress={() => setIsUrlModalOpen(true)}
          startContent={<LinkIcon className="w-3.5 h-3.5" />}
          className="text-xs font-bold text-brand-bronze dark:text-brand-gold"
        >
          {isPersian ? '+ افزودن لینک اینترنتی تصویر' : '+ Add Image URL'}
        </Button>
      </div>
      <p className="text-xs leading-5 text-brand-text-muted">
        {isPersian
          ? 'افزودن تصویر اختیاری است؛ در صورت خالی بودن، تصویر پیش‌فرض محصول نمایش داده می‌شود.'
          : 'Images are optional. Products without an image use the default product image.'}
      </p>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {images.map((img, idx) => {
          const displayUrl = resolveMediaUrl(img);
          return (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-brand-surface-elevated border border-brand-border shadow-xs"
            >
              <Image src={displayUrl} alt={`Product ${idx}`} fill className="object-cover" />
              {idx === 0 && (
                <div className="absolute top-1.5 right-1.5 z-10">
                  <Chip size="sm" variant="solid" className="bg-brand-gold text-[#141914] text-[10px] font-black h-5">
                    {isPersian ? 'تصویر کاور' : 'Cover'}
                  </Chip>
                </div>
              )}
              <Button
                isIconOnly
                size="sm"
                radius="full"
                color="danger"
                onPress={() => handleRemoveImage(idx)}
                className="absolute top-1.5 left-1.5 w-7 h-7 min-w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                aria-label={isPersian ? 'حذف تصویر' : 'Delete image'}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}

        {/* Upload Button Tile */}
        {images.length < maxImages && (
          <label className="aspect-square rounded-2xl border-2 border-dashed border-brand-border hover:border-brand-gold flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-brand-surface-elevated/50">
            <Upload className="w-6 h-6 text-brand-bronze mb-1" />
            <span className="text-[11px] font-bold text-brand-text">
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
      <Modal
        isOpen={isUrlModalOpen}
        onOpenChange={setIsUrlModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: 'bg-brand-surface text-brand-text rounded-3xl border border-brand-border shadow-2xl mx-4',
          header: 'border-b border-brand-border pb-2',
          body: 'py-4',
          footer: 'border-t border-brand-border pt-3',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h4 className="font-black text-sm">
                  {isPersian ? 'افزودن مستقیم تصویر با لینک URL' : 'Add Image by Direct URL'}
                </h4>
              </ModalHeader>

              <ModalBody>
                <Input
                  type="url"
                  value={urlInput}
                  onValueChange={setUrlInput}
                  placeholder="https://images.unsplash.com/photo-..."
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'bg-brand-surface-elevated border-brand-border hover:border-brand-gold',
                    input: 'text-sm font-mono',
                  }}
                />
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="font-bold text-xs"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  color="warning"
                  radius="full"
                  onPress={handleAddUrl}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs shadow-sm"
                >
                  {isPersian ? 'افزودن تصویر' : 'Add Image'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
