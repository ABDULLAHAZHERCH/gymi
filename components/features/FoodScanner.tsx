'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, AlertTriangle, X } from 'lucide-react';

interface FoodScanResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface FoodScannerProps {
  onResult: (data: FoodScanResult) => void;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 2000; // 2 seconds
const AUTO_RETRY_MAX_WAIT_SECONDS = 10;

export default function FoodScanner({ onResult, disabled = false }: FoodScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanRef = useRef<{ base64: string; mimeType: string } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image too large. Maximum size is 4MB.');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);

      // Extract base64 and mime type from data URL
      const mimeType = file.type;
      const base64 = dataUrl.split(',')[1];

      lastScanRef.current = { base64, mimeType };
      await scanImage(base64, mimeType);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const scanImage = async (base64: string, mimeType: string, attempt = 0) => {
    setIsScanning(true);
    setError('');

    // Clear any running countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      setRetryCountdown(0);
    }

    try {
      const response = await fetch('/api/food-recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      // Handle 429 with automatic retry
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 0;
        // Use header value or exponential backoff, whichever is longer
        const backoffSeconds = Math.ceil(BASE_RETRY_DELAY_MS * Math.pow(2, attempt) / 1000);
        const waitSeconds = Math.max(retryAfterSeconds, backoffSeconds);

        // For long cooldown windows, avoid auto-retrying and let user retry manually.
        if (waitSeconds > AUTO_RETRY_MAX_WAIT_SECONDS) {
          throw new Error(`Rate limited by AI service. Please wait ${waitSeconds}s and tap Retry.`);
        }

        setError(`Rate limited. Retrying in ${waitSeconds}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);

        // Start countdown display
        setRetryCountdown(waitSeconds);
        countdownRef.current = setInterval(() => {
          setRetryCountdown(prev => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        return scanImage(base64, mimeType, attempt + 1);
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      onResult(data.data);

      // Show low confidence warning but still use the result
      if (data.data.confidence === 'low') {
        setError('Low confidence — estimates may be inaccurate. Please review the values.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(message);
    } finally {
      setIsScanning(false);
      setRetryCountdown(0);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setError('');
    lastScanRef.current = null;
  };

  const handleRetry = async () => {
    if (lastScanRef.current) {
      await scanImage(lastScanRef.current.base64, lastScanRef.current.mimeType);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isScanning}
      />

      {/* Scan button */}
      {!preview && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isScanning}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="h-4 w-4" />
          Scan Meal with AI
        </button>
      )}

      {/* Image preview + scanning state */}
      {preview && (
        <div className="relative rounded-lg border border-zinc-200 overflow-hidden dark:border-zinc-800">
          <img
            src={preview}
            alt="Meal preview"
            className="w-full h-32 object-cover"
          />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <p className="mt-2 text-xs font-medium text-white">
                {retryCountdown > 0
                  ? `Retrying in ${retryCountdown}s...`
                  : 'Analyzing meal...'}
              </p>
            </div>
          )}

          {/* Clear button (only when not scanning) */}
          {!isScanning && (
            <button
              type="button"
              onClick={clearPreview}
              className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Error / Warning message */}
      {error && (
        <div className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
          error.includes('Low confidence')
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
        }`}>
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          {!isScanning && !error.includes('Low confidence') && lastScanRef.current && (
            <button
              type="button"
              onClick={handleRetry}
              className="ml-auto flex-shrink-0 font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
