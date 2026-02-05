import { useEffect, useRef } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isRefreshing = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pullDistance = 0;
    const threshold = 80;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing.current) return;

      const currentY = e.touches[0].clientY;
      pullDistance = currentY - startY.current;

      if (pullDistance > 0) {
        e.preventDefault();
        container.style.transform = `translateY(${Math.min(pullDistance / 2, threshold)}px)`;
        container.style.transition = 'none';
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing.current) return;

      isPulling.current = false;

      if (pullDistance > threshold) {
        isRefreshing.current = true;
        container.style.transition = 'transform 0.3s ease';
        container.style.transform = `translateY(${threshold}px)`;

        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            container.style.transform = 'translateY(0)';
            isRefreshing.current = false;
            pullDistance = 0;
          }, 300);
        }
      } else {
        container.style.transition = 'transform 0.3s ease';
        container.style.transform = 'translateY(0)';
        pullDistance = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh]);

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  );
}
