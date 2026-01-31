'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, ClipboardPaste, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadImage } from '@/lib/supabase';

const MAX_CHARS = 10000;

interface PasteInputProps {
  onSubmit: (content: string, type: 'text' | 'image') => Promise<void>;
  disabled?: boolean;
  roomCode: string;
}

export function PasteInput({ onSubmit, disabled, roomCode }: PasteInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting || isOverLimit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), 'text');
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        toast.success('Image uploaded!');
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, roomCode]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
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
          handleImageUpload(file);
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Ctrl+Enter to send · Paste image with Ctrl+V</span>
        <span className={isOverLimit ? 'text-destructive font-medium' : ''}>
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || disabled || isSubmitting || isOverLimit}
        className="w-full h-12"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Sending...' : 'Send to Cloud'}
      </Button>
    </div>
  );
}
