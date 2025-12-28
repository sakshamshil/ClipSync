'use client';

import { useState, useEffect } from 'react';
import { PinEntry } from '@/components/PinEntry';
import { ClipboardView } from '@/components/ClipboardView';
import { STORAGE_KEY, PIN_LENGTH } from '@/lib/constants';

export default function Home() {
  const [pin, setPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const storedPin = localStorage.getItem(STORAGE_KEY);
    if (storedPin && storedPin.length === PIN_LENGTH) {
      setPin(storedPin);
    }
    setIsLoading(false);
  }, []);

  const handlePinComplete = (newPin: string) => {
    localStorage.setItem(STORAGE_KEY, newPin);
    setPin(newPin);
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPin(null);
  };

  // Show nothing while checking localStorage (prevents flash)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show PIN entry or clipboard view
  if (!pin) {
    return <PinEntry onPinComplete={handlePinComplete} />;
  }

  return <ClipboardView pin={pin} onLeaveRoom={handleLeaveRoom} />;
}
