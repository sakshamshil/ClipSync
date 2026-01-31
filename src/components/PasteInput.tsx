'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, ClipboardPaste, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadImage, validateImageFile } from '@/lib/supabase';

const MAX_CHARS = 10000;

interface PasteInputProps {
  onSubmit: (content: string, type: 'text' | 'image') => Promise<void>;
  disabled?: boolean;
  roomCode: string;
}

export function PasteInput({ onSubmit, disabled, roomCode }: PasteInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Keep ref in sync with state
  previewUrlRef.current = previewUrl;

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  }, []);

  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsSubmitting(true);
      try {
        const { url, error } = await uploadImage(file, roomCode);
        if (error) {
          toast.error(error);
          return;
        }
        await onSubmit(url, 'image');
        clearPreview();
        toast.success('Image uploaded!');
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, roomCode, clearPreview]
  );

  const handleSubmit = async () => {
    // Handle image upload if there's a preview
    if (previewFile) {
      await handleImageUpload(previewFile);
      return;
    }

    if (!content.trim() || isSubmitting || isOverLimit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), 'text');
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      // Show preview
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClipboardPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const validation = validateImageFile(file);
          if (!validation.valid) {
            toast.error(validation.error);
            return;
          }
          // Show preview instead of uploading immediately
          setPreviewFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          toast.success('Image pasted! Click "Send to Cloud" to upload.');
        }
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
        toast.success('Pasted from clipboard');
      } else {
        toast.error('Clipboard is empty');
      }
    } catch {
      toast.error('Could not access clipboard');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder="Paste or type text here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handleClipboardPaste}
          disabled={disabled || isSubmitting}
          className="min-h-[120px] resize-none pr-20"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSubmitting}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Upload image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePasteFromClipboard}
            disabled={disabled || isSubmitting}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative rounded-md overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[200px] w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={clearPreview}
            disabled={isSubmitting}
            className="absolute top-2 right-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-1">
            {previewFile?.name} ({(previewFile!.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {previewFile
            ? 'Click "Send to Cloud" to upload image'
            : 'Press Ctrl+Enter to send · Paste image with Ctrl+V'}
        </span>
        {!previewFile && (
          <span className={isOverLimit ? 'text-destructive font-medium' : ''}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={
          disabled ||
          isSubmitting ||
          (!previewFile && (!content.trim() || isOverLimit))
        }
        className="w-full h-12"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : previewFile ? (
          <>
            <ImageIcon className="h-4 w-4 mr-2" />
            Send to Cloud
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send to Cloud
          </>
        )}
      </Button>
    </div>
  );
}
