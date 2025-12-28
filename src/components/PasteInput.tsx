'use client';

import { useState } from 'react';
import { Send, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MAX_CHARS = 10000;

interface PasteInputProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function PasteInput({ onSubmit, disabled }: PasteInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting || isOverLimit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
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
          disabled={disabled || isSubmitting}
          className="min-h-[120px] resize-none pr-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handlePasteFromClipboard}
          disabled={disabled || isSubmitting}
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Paste from clipboard"
        >
          <ClipboardPaste className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Ctrl+Enter to send</span>
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
