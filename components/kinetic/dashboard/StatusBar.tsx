'use client';

import { LiveClock } from '@/components/kinetic/primitives';

export default function KineticStatusBar({ session = '047' }: { session?: string }) {
  return (
    <div className="kx-status-bar">
      <div className="kx-status-bar__group">
        <span className="kx-status-bar__dot kx-status-bar__dot--lime" />
        <span>ENGINE ONLINE</span>
        <span className="kx-status-bar__sep">/</span>
        <span style={{ color: '#CCFF00' }}>SYNC OK</span>
      </div>
      <div className="kx-status-bar__group">
        <span>SESSION {session}</span>
        <span className="kx-status-bar__sep">/</span>
        <LiveClock />
      </div>
    </div>
  );
}
