'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, RefreshCw } from 'lucide-react';
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from '@heroui/react';
import { adminApi } from '@/common/api/admin';
import { toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { MEDIA_BASE_URL } from '@/common/constants/URL';

interface SingleImageUploaderProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  className?: string;
}

export function SingleImageUploader({
  value = '',
  onChange,
  label,
  description,
  aspectRatio = 'square',
  className = '',
}: SingleImageUploaderProps) {
  const { isPersian } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const displayUrl = value
    ? value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `${MEDIA_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
    : '';

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(
        isPersian ? 'لطفاً یک فایل تصویری معتبر انتخاب کنید.' : 'Please choose a valid image file.'
      );
      return;
    }

    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file);
      if (res?.path) {
        onChange(res.path);
        toast.success(
          isPersian ? 'تصویر با موفقیت آپلود شد.' : 'Image uploaded successfully.'
        );
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در آپلود تصویر.' : 'Failed to upload image.')
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
    // reset input value so re-selecting same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput('');
    setIsUrlModalOpen(false);
    toast.success(
      isPersian ? 'لینک تصویر با موفقیت ثبت شد.' : 'Image URL set successfully.'
    );
  };

  const handleRemove = () => {
    onChange('');
  };

  const aspectClass = {
    square: 'aspect-square max-w-[180px]',
    video: 'aspect-video max-w-[320px]',
    wide: 'aspect-[3/1] max-w-[400px]',
    auto: 'min-h-[140px] max-w-[240px]',
  }[aspectRatio];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and URL button */}
      <div className="flex items-center justify-between">
        {label ? (
          <label className="text-xs font-bold text-brand-text">
            {label}
          </label>
        ) : (
          <span />
        )}

        <Button
          size="sm"
          variant="light"
          onPress={() => {
            setUrlInput(value.startsWith('http') ? value : '');
            setIsUrlModalOpen(true);
          }}
          startContent={<LinkIcon className="w-3.5 h-3.5" />}
          className="text-xs font-bold text-brand-bronze dark:text-brand-gold h-7 px-2.5 rounded-full cursor-pointer hover:bg-brand-surface-elevated"
        >
          {isPersian ? 'ثبت لینک اینترنتی' : 'Image URL'}
        </Button>
      </div>

      {description && (
        <p className="text-[11px] text-brand-text-muted leading-relaxed">
          {description}
        </p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload / Preview Card */}
      {value ? (
        <div
          className={`relative ${aspectClass} w-full rounded-2xl overflow-hidden bg-brand-surface-elevated border border-brand-gold/40 shadow-sm group`}
        >
          {/* Preview Image */}
          <div className="relative w-full h-full p-2 flex items-center justify-center">
            <Image
              src={displayUrl}
              alt={label || 'Preview'}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-contain rounded-xl p-1"
              unoptimized
            />
          </div>

          {/* Action Overlay on Hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
            <Button
              size="sm"
              radius="full"
              variant="flat"
              onPress={() => fileInputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs h-8 px-3 rounded-full cursor-pointer"
              startContent={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {isPersian ? 'تعویض' : 'Replace'}
            </Button>
            <Button
              isIconOnly
              size="sm"
              radius="full"
              color="danger"
              onPress={handleRemove}
              className="w-8 h-8 min-w-8 cursor-pointer shadow-md"
              aria-label={isPersian ? 'حذف تصویر' : 'Remove image'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative ${aspectClass} w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center select-none ${
            isDragOver
              ? 'border-brand-gold bg-brand-gold/10 scale-[0.99]'
              : 'border-brand-border hover:border-brand-gold/70 bg-brand-surface-elevated/60 hover:bg-brand-surface-elevated'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner size="sm" color="warning" />
              <span className="text-xs font-bold text-brand-gold animate-pulse">
                {isPersian ? 'در حال آپلود و بهینه‌سازی...' : 'Uploading & optimizing...'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 pointer-events-none">
              <div className="w-10 h-10 rounded-2xl bg-brand-surface flex items-center justify-center border border-brand-border text-brand-bronze shadow-2xs mb-0.5">
                <Upload className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
              </div>
              <span className="text-xs font-black text-brand-text">
                {isPersian ? 'انتخاب یا رها کردن عکس' : 'Click or Drag to Upload'}
              </span>
              <span className="text-[10px] text-brand-text-muted font-medium">
                {isPersian ? 'فرمت‌های WebP، PNG، JPG یا SVG' : 'PNG, WebP, JPG, or SVG'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* URL Input Modal */}
      <Modal
        isOpen={isUrlModalOpen}
        onOpenChange={setIsUrlModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: 'bg-brand-surface text-brand-text rounded-3xl border border-brand-border shadow-2xl mx-4',
          header: 'border-b border-brand-border pb-3 px-6 pt-5',
          body: 'py-5 px-6',
          footer: 'border-t border-brand-border pt-3 px-6 pb-5',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-bronze dark:text-brand-gold" />
                  <h4 className="font-black text-sm text-brand-text">
                    {isPersian ? 'ثبت مستقیم لینک تصویر اینترنتی' : 'Add Image by Direct URL'}
                  </h4>
                </div>
              </ModalHeader>

              <ModalBody>
                <Input
                  type="url"
                  value={urlInput}
                  onValueChange={setUrlInput}
                  placeholder="https://..."
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper:
                      'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full font-mono text-xs',
                    input: 'text-xs font-mono',
                  }}
                  autoFocus
                />
                <p className="text-[11px] text-brand-text-muted mt-1">
                  {isPersian
                    ? 'می‌توانید لینک مستقیم فایل تصویر را از وب‌سایت‌های دیگر وارد کنید.'
                    : 'Enter the direct URL of an image hosted online.'}
                </p>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="font-bold text-xs bg-brand-surface-elevated border border-brand-border rounded-full"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  color="warning"
                  radius="full"
                  onPress={handleAddUrl}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-sm rounded-full"
                >
                  {isPersian ? 'ثبت تصویر' : 'Set Image'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
