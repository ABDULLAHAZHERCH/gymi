type SemicircleTargetCardProps = {
  label: string;
  current: number;
  target: number;
  unit?: string;
  colorClassName?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SemicircleTargetCard({
  label,
  current,
  target,
  unit = '',
  colorClassName = 'text-emerald-500',
}: SemicircleTargetCardProps) {
  const safeTarget = target > 0 ? target : 0;
  const percent = safeTarget > 0 ? clamp(Math.round((current / safeTarget) * 100), 0, 100) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">{label}</p>

      <div className="mt-2 flex items-center justify-center">
        <div className="relative h-[84px] w-[132px]">
          <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden="true">
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth="10"
              strokeLinecap="round"
              pathLength={100}
            />
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="currentColor"
              className={colorClassName}
              strokeWidth="10"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${percent} 100`}
            />
          </svg>

          <div className="absolute inset-x-0 bottom-2 text-center">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">{percent}%</p>
          </div>
        </div>
      </div>

      <p className="mt-1 text-center text-sm font-semibold text-[color:var(--foreground)]">
        {Math.round(current)} / {safeTarget}
        {unit}
      </p>
    </div>
  );
}
