const ITEMS = [
  'KINETIC TRACKING',
  'AI FORM COACH',
  'MEAL VISION',
  'SMART PROGRAMMING',
  'PR WATCHER',
  'STREAK ENGINE',
  'MICRO LOGGING',
  'BIOMECHANICS',
  'ADAPTIVE LOAD',
];

export default function KineticTicker() {
  const all = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="kx-ticker" aria-hidden="true">
      <div className="kx-ticker__track">
        {all.map((t, i) => (
          <span key={i} className="kx-ticker__item">
            <span className="kx-ticker__dot" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
