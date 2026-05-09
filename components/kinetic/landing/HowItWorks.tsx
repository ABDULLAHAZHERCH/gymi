const STEPS = [
  {
    n: '01',
    t: 'POSITION DEVICE',
    d: 'Prop your phone or laptop so your full body is in frame. Indoor lighting is fine — the model is robust to messy gym backdrops.',
  },
  {
    n: '02',
    t: 'ENGAGE COACH',
    d: 'Pick a lift. Pose engine spins up in <1 sec. Auto-rep counter starts the moment you do.',
  },
  {
    n: '03',
    t: 'GET FEEDBACK',
    d: 'See live form scores per joint. Cues highlight in cyan when good, lime when caution, red when correction is urgent.',
  },
];

export default function KineticHowItWorks() {
  return (
    <section className="kx-how" id="how">
      <div className="kx-how__bg" />
      <div className="kx-how__head">
        <div className="kx-eyebrow">[ §03 · WORKFLOW ]</div>
        <h2 className="kx-h2">
          THREE STEPS, <span style={{ color: '#CCFF00' }}>ZERO FRICTION</span>
        </h2>
      </div>
      <div className="kx-how__grid">
        {STEPS.map((s, i) => (
          <div className="kx-how__card" key={s.n} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="kx-how__n">{s.n}</div>
            <div className="kx-how__t">{s.t}</div>
            <div className="kx-how__d">{s.d}</div>
            <div className="kx-how__rule" />
            <div className="kx-how__seq">
              SEQUENCE / {String(i + 1).padStart(2, '0')} OF 03
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
