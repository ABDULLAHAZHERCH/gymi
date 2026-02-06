'use client';

import { FormFeedback, JointAngle } from '@/lib/services/poseDetection';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface FormFeedbackCardProps {
  feedback: FormFeedback | null;
  isLoading?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 85) return 'bg-green-500/10 border-green-500/20';
  if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
  if (score >= 50) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function AngleStatus({ angle }: { angle: JointAngle }) {
  const getStatusIcon = () => {
    switch (angle.status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-gray-300">{angle.name}</span>
      </div>
      <span className="font-mono text-sm font-medium text-white">{angle.angle.toFixed(1)}°</span>
    </div>
  );
}

export default function FormFeedbackCard({ feedback, isLoading = false, className = '' }: FormFeedbackCardProps) {
  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-zinc-700 bg-zinc-900 p-4 ${className}`}>
        <div className="space-y-3">
          <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className={`rounded-2xl border border-zinc-700 bg-zinc-900 p-4 ${className}`}>
        <p className="text-center text-sm text-gray-400">Position yourself to analyze form</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${getScoreBgColor(feedback.overallScore)} space-y-4 p-4 ${className}`}>
      {/* Score Display */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Form Analysis</h3>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-3xl font-bold ${getScoreColor(feedback.overallScore)}`}>
            {feedback.overallScore}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>

      {/* Posture Status */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
        <div className="flex items-start gap-3">
          {feedback.overallScore >= 70 ? (
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200">{feedback.posture}</p>
          </div>
        </div>
      </div>

      {/* Joint Angles */}
      {feedback.angles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Joint Angles</p>
          <div className="space-y-2">
            {feedback.angles.map((angle, idx) => (
              <AngleStatus key={idx} angle={angle} />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {feedback.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Suggestions</p>
          <ul className="space-y-2">
            {feedback.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ready Status */}
      {feedback.overallScore >= 70 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-green-300">Ready to perform the exercise</span>
        </div>
      )}
    </div>
  );
}
