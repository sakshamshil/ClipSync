'use client';

import { formatDistanceToNow } from 'date-fns';
import { Copy, Check, Trash2, ExternalLink, Link as LinkIcon, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Paste } from '@/types';

interface PasteItemProps {
  paste: Paste;
  onCopy: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PasteItem({ paste, onCopy, onDelete }: PasteItemProps) {
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = async () => {
    await onCopy(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async (label: string) => {
    try {
      await navigator.clipboard.writeText(paste.content);
      setUrlCopied(true);
      toast.success(`${label} link copied!`);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // The HTML `download` attribute is ignored for cross-origin links (all
  // Supabase Storage URLs), so force it server-side via Supabase's own
  // download query param instead of relying on the attribute alone.
  const getDownloadHref = (url: string, fileName?: string | null) => {
    const separator = url.includes('?') ? '&' : '?';
    const suffix = fileName ? `download=${encodeURIComponent(fileName)}` : 'download';
    return `${url}${separator}${suffix}`;
  };

  const handleCopyImage = async () => {
    try {
      const response = await fetch(paste.content);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setImageCopied(true);
      toast.success('Image copied! You can paste it directly into other apps.');
      setTimeout(() => setImageCopied(false), 2000);
    } catch {
      toast.error('Failed to copy image. Try copying the URL instead.');
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
  const isDocument = paste.type === 'document';

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
            ) : isDocument ? (
              <a
                href={paste.content}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted transition-colors"
              >
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {paste.file_name || 'Document'}
                  </p>
                  {paste.file_size ? (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(paste.file_size)}
                    </p>
                  ) : null}
                </div>
              </a>
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
                  onClick={handleCopyImage}
                  className="h-9 w-9"
                  title="Copy image (paste into apps)"
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
                  onClick={() => handleCopyLink('Image')}
                  className="h-9 w-9"
                  title="Copy image URL"
                >
                  {urlCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
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
            ) : isDocument ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9"
                  title="Download"
                >
                  <a
                    href={getDownloadHref(paste.content, paste.file_name)}
                    download={paste.file_name || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyLink('Document')}
                  className="h-9 w-9"
                  title="Copy document link"
                >
                  {urlCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
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
