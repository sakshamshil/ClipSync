'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PasteItem } from './PasteItem';
import type { Paste } from '@/types';

interface PasteListProps {
  pastes: Paste[];
  loading: boolean;
  onCopy: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const INITIAL_SHOW = 5;
const LOAD_MORE_COUNT = 5;

export function PasteList({ pastes, loading, onCopy, onDelete }: PasteListProps) {
  const [showCount, setShowCount] = useState(INITIAL_SHOW);

  const visiblePastes = pastes.slice(0, showCount);
  const hasMore = pastes.length > showCount;
  const remainingCount = pastes.length - showCount;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (pastes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No pastes yet. Add something above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visiblePastes.map((paste) => (
        <PasteItem key={paste.id} paste={paste} onCopy={onCopy} onDelete={onDelete} />
      ))}

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowCount((prev) => prev + LOAD_MORE_COUNT)}
        >
          Show more ({remainingCount} remaining)
        </Button>
      )}
    </div>
  );
}
