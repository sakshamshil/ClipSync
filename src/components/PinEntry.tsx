'use client';

import { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { APP_NAME, APP_TAGLINE, PIN_LENGTH } from '@/lib/constants';

interface PinEntryProps {
  onPinComplete: (pin: string) => void;
}

export function PinEntry({ onPinComplete }: PinEntryProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if PIN is complete (auto-enter on last digit)
    if (digit && index === PIN_LENGTH - 1) {
      const pin = newDigits.join('');
      if (pin.length === PIN_LENGTH) {
        onPinComplete(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);

    if (pastedData.length === PIN_LENGTH) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      onPinComplete(pastedData);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-muted-foreground">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {digits.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="h-14 w-12 text-center text-2xl font-mono"
              autoComplete="off"
            />
          ))}
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Enter any {PIN_LENGTH}-digit PIN to create or join a room
          </p>
          <p className="text-xs text-muted-foreground/70">
            Same PIN = Same clipboard
          </p>
        </div>
      </div>
    </div>
  );
}
