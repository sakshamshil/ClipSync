'use client';

import { useEffect, useState, useCallback } from 'react';
import { LogOut, Trash2, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PasteInput } from './PasteInput';
import { PasteList } from './PasteList';
import { supabase, deleteImage, deleteRoomImages } from '@/lib/supabase';
import { APP_NAME } from '@/lib/constants';
import type { Paste } from '@/types';

interface ClipboardViewProps {
  pin: string;
  onLeaveRoom: () => void;
}

export function ClipboardView({ pin, onLeaveRoom }: ClipboardViewProps) {
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (content: string, showToast = true) => {
    try {
      await navigator.clipboard.writeText(content);
      if (showToast) {
        toast.success('Copied to clipboard!');
      }
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  // Fetch pastes
  const fetchPastes = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pastes')
        .select('*')
        .eq('room_code', pin)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPastes(data || []);
    } catch (err) {
      setError('Failed to load pastes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pin, copyToClipboard]);

  // Add new paste
  const addPaste = async (content: string, type: 'text' | 'image') => {
    try {
      const { error: insertError } = await supabase
        .from('pastes')
        .insert({ room_code: pin, content, type });

      if (insertError) throw insertError;

      toast.success(type === 'image' ? 'Image uploaded!' : 'Paste added!');
    } catch {
      toast.error(type === 'image' ? 'Failed to upload image' : 'Failed to add paste');
    }
  };

  // Delete single paste
  const deletePaste = async (id: string) => {
    try {
      // Find the paste to check if it's an image
      const paste = pastes.find((p) => p.id === id);
      if (paste?.type === 'image') {
        // Delete image from storage
        const { error: storageError } = await deleteImage(paste.content);
        if (storageError) {
          console.error('Failed to delete image from storage:', storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from('pastes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPastes((prev) => prev.filter((p) => p.id !== id)); // Update UI immediately
      toast.success('Paste deleted');
    } catch {
      toast.error('Failed to delete paste');
    }
  };

  // Clear all pastes
  const clearAll = async () => {
    try {
      // Delete all images from storage first
      const imagePastes = pastes.filter((p) => p.type === 'image');
      if (imagePastes.length > 0) {
        const { error: storageError } = await deleteRoomImages(pin);
        if (storageError) {
          console.error('Failed to delete some images from storage:', storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from('pastes')
        .delete()
        .eq('room_code', pin);

      if (deleteError) throw deleteError;

      setPastes([]); // Update UI immediately
      toast.success('All pastes cleared!');
    } catch {
      toast.error('Failed to clear pastes');
    }
  };

  // Export pastes
  const exportPastes = (format: 'json' | 'txt', order: 'newest' | 'oldest') => {
    const sorted = order === 'oldest' ? [...pastes].reverse() : pastes;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(
        sorted.map((p) => ({ 
          content: p.content, 
          type: p.type,
          created_at: p.created_at 
        })),
        null,
        2
      );
      filename = `clypsync-${pin}.json`;
      mimeType = 'application/json';
    } else {
      // Text export - only include text pastes, skip images
      const textPastes = sorted.filter((p) => p.type === 'text');
      content = textPastes.map((p) => p.content).join('\n\n===\n\n');
      filename = `clypsync-${pin}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${filename}`);
  };

  // Setup real-time subscription
  useEffect(() => {
    fetchPastes();

    const channel = supabase
      .channel(`room:${pin}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pastes',
          filter: `room_code=eq.${pin}`,
        },
        (payload) => {
          setPastes((prev) => [payload.new as Paste, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pastes',
          filter: `room_code=eq.${pin}`,
        },
        () => {
          // Refetch on delete since we might have deleted multiple
          fetchPastes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pin, fetchPastes]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">
              Room: <span className="font-mono">{pin}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={pastes.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>JSON</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportPastes('json', 'newest')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportPastes('json', 'oldest')}>
                      Oldest First
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Text</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportPastes('txt', 'newest')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportPastes('txt', 'oldest')}>
                      Oldest First
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={pastes.length === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all pastes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all pastes in this room. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="ghost" size="icon" onClick={onLeaveRoom}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        <PasteInput onSubmit={addPaste} roomCode={pin} />

        <div className="border-t pt-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Recent Pastes
          </h2>
          <PasteList pastes={pastes} loading={loading} onCopy={copyToClipboard} onDelete={deletePaste} />
        </div>
      </main>
    </div>
  );
}
