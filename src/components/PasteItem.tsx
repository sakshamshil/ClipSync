'use client';

import { formatDistanceToNow } from 'date-fns';
import { Copy, Check, Trash2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Paste } from '@/types';

interface PasteItemProps {
  paste: Paste;
  onCopy: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PasteItem({ paste, onCopy, onDelete }: PasteItemProps) {
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = async () => {
    await onCopy(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyImageUrl = async () => {
    try {
      await navigator.clipboard.writeText(paste.content);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(paste.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Ensure UTC parsing - append 'Z' if no timezone indicator present
  const timestamp = paste.created_at.endsWith('Z') || paste.created_at.includes('+')
    ? paste.created_at
    : paste.created_at + 'Z';

  const timeAgo = formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });

  const isImage = paste.type === 'image';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isImage ? (
              imageError ? (
                <div className="max-h-[200px] w-full bg-muted rounded-md flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <ExternalLink className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Image failed to load</p>
                  <p className="text-xs mt-1">It may have been deleted from storage</p>
                </div>
              ) : (
                <a
                  href={paste.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paste.content}
                    alt="Uploaded image"
                    className="max-h-[200px] w-auto object-cover rounded-md"
                    loading="lazy"
                    onError={() => setImageError(true)}
                  />
                </a>
              )
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {paste.content}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {timeAgo}
            </p>
          </div>
          <div className="flex shrink-0">
            {isImage ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyImageUrl}
                  className="h-9 w-9"
                  title="Copy image URL"
                >
                  {imageCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(paste.content, '_blank')}
                  className="h-9 w-9"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-9 w-9"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
