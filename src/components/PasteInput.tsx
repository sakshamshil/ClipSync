'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PasteInputProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function PasteInput({ onSubmit, disabled }: PasteInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

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

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Paste or type text here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        className="min-h-[120px] resize-none"
      />
      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || disabled || isSubmitting}
        className="w-full h-12"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Sending...' : 'Send to Cloud'}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Press Ctrl+Enter to send quickly
      </p>
    </div>
  );
}
