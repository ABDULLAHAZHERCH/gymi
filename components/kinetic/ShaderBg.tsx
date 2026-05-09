'use client';

import { useEffect, useRef } from 'react';

type ShaderBgController = {
  destroy: () => void;
  setIntensity?: (v: number) => void;
  setColors?: (a: number[], b: number[]) => void;
};

declare global {
  interface Window {
    initShaderBg?: (
      canvas: HTMLCanvasElement,
      opts?: { colorA?: number[]; colorB?: number[]; intensity?: number }
    ) => ShaderBgController | null;
  }
}

type ShaderBgProps = {
  intensity?: number;
  className?: string;
  colorA?: [number, number, number];
  colorB?: [number, number, number];
};

export default function ShaderBg({
  intensity = 1,
  className,
  colorA = [0, 0.82, 1],
  colorB = [0.8, 1, 0],
}: ShaderBgProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let ctl: ShaderBgController | null | undefined;
    let cancelled = false;
    let attempts = 0;

    const tryInit = () => {
      if (cancelled || !ref.current) return;
      if (window.initShaderBg) {
        ctl = window.initShaderBg(ref.current, { colorA, colorB, intensity });
      } else if (attempts++ < 50) {
        setTimeout(tryInit, 100);
      }
    };

    tryInit();
    return () => {
      cancelled = true;
      ctl?.destroy();
    };
  }, [intensity, colorA, colorB]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
