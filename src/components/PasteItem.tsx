'use client';

import { formatDistanceToNow } from 'date-fns';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Paste } from '@/types';

interface PasteItemProps {
  paste: Paste;
  onCopy: (content: string) => Promise<void>;
}

export function PasteItem({ paste, onCopy }: PasteItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeAgo = formatDistanceToNow(new Date(paste.created_at), {
    addSuffix: true,
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm whitespace-pre-wrap break-words">
              {paste.content}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {timeAgo}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="shrink-0 h-10 w-10"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
