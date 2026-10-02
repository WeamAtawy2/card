import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const invitation = {
  bride: 'Maya',
  guest: new URLSearchParams(window.location.search).get('guest') || 'Sarah',
  date: 'Thursday, July 30, 2026',
  time: '6:00 in the evening',
  location: 'At our home',
  dressCode: 'Soft pastels & florals',
  rsvpEmail: 'maya@example.com',
};

// Swap these demo photos and words for Maya's own memories in one place.
const memories = [
  {
    image: 'https://images.unsplash.com/photo-1629046133174-b5c0d944640b?auto=format&fit=crop&w=900&q=85',
    alt: 'Sample photograph of friends in floral dresses holding bouquets',
    label: 'THE BEGINNING',
    caption: 'Always together',
    note: 'A little reminder of all the lovely things still ahead.',
  },
  {
    image: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=85',
    alt: 'Sample photograph of friends sharing a moment at sunset',
    label: 'GOLDEN HOUR',
    caption: 'One of our favorite memories',
    note: 'The sort of afternoon that makes you wish time would slow down.',
  },
  {
    image: 'https://girlboss.com/cdn/shop/articles/Girlboss_Guide_to_Summer-6_2_0410a95b-e505-4fb9-85ce-856467402fe9_1024x625.png?v=1751556905',
    alt: 'Sample photograph of friends enjoying a summer picnic',
    label: 'JUST BECAUSE',
    caption: 'From then to forever',
    note: 'For every spontaneous plan that turned into a story.',
  },
];

const harmony = [
  { pad: [48, 55, 60, 64], melody: [72, 67, 64, 67] },
  { pad: [43, 50, 55, 59], melody: [71, 67, 62, 67] },
  { pad: [45, 52, 57, 60], melody: [72, 69, 64, 69] },
  { pad: [41, 48, 53, 57], melody: [69, 65, 60, 65] },
];

function createAmbientScore() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const delay = context.createDelay(1);
  const feedback = context.createGain();
  master.gain.setValueAtTime(0, context.currentTime);
  master.gain.linearRampToValueAtTime(.48, context.currentTime + 2.4);
  compressor.threshold.value = -18;
  compressor.ratio.value = 3;
  delay.delayTime.value = .38;
  feedback.gain.value = .14;
  master.connect(compressor);
  compressor.connect(context.destination);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);

  const frequency = (midi) => 440 * (2 ** ((midi - 69) / 12));
  const playPad = (midi, start) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.linearRampToValueAtTime(.012, start + 1.3);
    envelope.gain.setValueAtTime(.012, start + 3.2);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + 4.5);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 4.6);
  };
  const playNote = (midi, start) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(.027, start + .08);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + 1.7);
    oscillator.connect(envelope);
    envelope.connect(master);
    envelope.connect(delay);
    oscillator.start(start);
    oscillator.stop(start + 1.8);
  };

  let chordIndex = 0;
  const playChord = () => {
    const start = context.currentTime + .05;
    harmony[chordIndex].pad.forEach((midi) => playPad(midi, start));
    chordIndex = (chordIndex + 1) % harmony.length;
  };
  let noteIndex = 0;
  const playMelody = () => {
    const start = context.currentTime + .04;
    const notes = harmony[(chordIndex + harmony.length - 1) % harmony.length].melody;
    playNote(notes[noteIndex % notes.length], start);
    noteIndex += 1;
  };
  playChord();
  const chordTimer = window.setInterval(playChord, 4300);
  const melodyTimer = window.setInterval(playMelody, 1150);

  return {
    context,
    stop() {
      window.clearInterval(chordTimer);
      window.clearInterval(melodyTimer);
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(.0001, now, .28);
      window.setTimeout(() => context.close(), 1500);
    },
  };
}

function MusicToggle() {
  const [playing, setPlaying] = useState(false);
  const scoreRef = useRef(null);

  useEffect(() => () => scoreRef.current?.stop(), []);

  const toggleMusic = async () => {
    if (scoreRef.current) {
      scoreRef.current.stop();
      scoreRef.current = null;
      setPlaying(false);
      return;
    }
    const score = createAmbientScore();
    if (!score) return;
    scoreRef.current = score;
    await score.context.resume();
    setPlaying(true);
  };

  return (
    <button className={`music-toggle${playing ? ' is-playing' : ''}`} onClick={toggleMusic} aria-pressed={playing} aria-label={playing ? 'Turn music off' : 'Turn music on'}>
      <span className="music-note" aria-hidden="true">♫</span><span>{playing ? 'Music on' : 'Music off'}</span>
      <span className="music-bars" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
}

function MemoryCard({ memory, index }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`memory-card memory-card-${index + 1}`} data-memory-card>
      <button className="polaroid" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${memory.caption}. ${open ? 'Hide' : 'Read'} memory note`}>
        <span className="photo-wrap">
          <img src={memory.image} alt={memory.alt} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement.classList.add('photo-unavailable'); }} />
          <span className="photo-glint" aria-hidden="true" />
        </span>
        <span className="polaroid-caption"><span className="memory-label">{memory.label}</span><span className="memory-title">{memory.caption}</span><span className={`memory-note${open ? ' note-open' : ''}`}>{memory.note}</span></span>
      </button>
      <span className="tape" aria-hidden="true" />
    </article>
  );
}

function MemoriesSection() {
  useEffect(() => {
    const cards = document.querySelectorAll('[data-memory-card]');
    if (!('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .18 });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="memories" aria-labelledby="memories-title">
      <div className="memory-heading"><span className="section-label">The people in every chapter</span><h2 id="memories-title">Little moments,<br /><em>all my favorite people.</em></h2><p>Every lovely story has the friends who made it feel like home.</p></div>
      <div className="memory-scrapbook">{memories.map((memory, index) => <MemoryCard memory={memory} index={index} key={memory.label} />)}</div>
      <div className="memory-footer"><span>kept close, always</span><i aria-hidden="true">✳</i><span>more memories to come</span></div>
    </section>
  );
}

function VeilArtwork() {
  return (
    <div className="veil" aria-hidden="true">
      <svg viewBox="0 0 1440 1100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="silk" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#fffefa" stopOpacity=".96" /><stop offset=".24" stopColor="#e8dce0" stopOpacity=".85" />
            <stop offset=".52" stopColor="#fffdf8" stopOpacity=".91" /><stop offset=".76" stopColor="#d8c6cd" stopOpacity=".8" />
            <stop offset="1" stopColor="#fffefa" stopOpacity=".95" />
          </linearGradient>
          <linearGradient id="edge" x1="0" x2="1"><stop stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".8" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        </defs>
        <path className="veil-shadow" d="M-80 250 Q340 20 650 230 T1530 180 L1510 1120 Q1040 850 740 1120 T-100 940Z" />
        <path className="fabric" d="M-80 215 Q340 -30 660 215 T1520 160 L1490 1100 Q1150 900 900 1040 Q670 1150 430 1010 Q180 860 -80 960Z" />
        <path className="fold" d="M40 200 Q410 230 535 1020M220 130 Q410 410 430 1000M530 150 Q620 390 680 1100M810 160 Q780 470 930 1000M1040 170 Q950 420 1160 980M1310 150 Q1140 410 1400 900" />
        <path d="M-40 930 Q190 820 430 1010 Q670 1150 900 1040 Q1150 900 1490 1100" fill="none" stroke="url(#edge)" strokeWidth="6" />
      </svg>
    </div>
  );
}

function PetalField() {
  const petals = Array.from({ length: 11 }, (_, index) => ({
    left: `${(index * 43 + 8) % 100}%`,
    delay: `${-((index * 2.7) % 19)}s`,
    duration: `${17 + (index % 6) * 3}s`,
    drift: `${((index % 2 ? 1 : -1) * (28 + (index % 4) * 15))}px`,
    turn: `${(index % 2 ? 1 : -1) * (100 + index * 23)}deg`,
    midTurn: `${(index % 2 ? 1 : -1) * (50 + index * 11.5)}deg`,
    size: `${8 + (index % 3) * 3}px`,
  }));

  return (
    <div className="petal-field" aria-hidden="true">
      {petals.map((petal, index) => <i className="falling-petal" key={index} style={{ ...petal, '--delay': petal.delay, '--duration': petal.duration, '--drift': petal.drift, '--turn': petal.turn, '--mid-turn': petal.midTurn, '--size': petal.size }} />)}
    </div>
  );
}

function InvitationCard({ guest }) {
  return (
    <article className="invite-card" aria-label={`${invitation.bride}'s bridal shower invitation`}>
      <span className="eyebrow">A little celebration of love</span><div className="card-rule" />
      <p className="script">Dear {guest},</p><p className="invite-line">You are warmly invited to celebrate</p>
      <h2>{invitation.bride}</h2><p className="names">at her bridal shower</p><div className="card-rule" />
      <p className="date">Thursday · July 30, 2026</p><p className="invite-line">Six o’clock in the evening</p>
      <h3>At our home</h3><p className="invite-line">Soft pastels &amp; florals</p><p className="script">With love, Maya</p>
    </article>
  );
}

function RSVPDialog({ open, onClose }) {
  useEffect(() => {
    const dialog = document.querySelector('#rsvp-dialog');
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog id="rsvp-dialog" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <button className="close" aria-label="Close RSVP" onClick={onClose}>×</button>
      <span className="section-label">A little note back</span><h2>Will you join us?</h2>
      <p>We’d love to celebrate together.<br />Reply to Maya and let her know.</p>
      <a className="rsvp" href={`mailto:${invitation.rsvpEmail}?subject=Bridal%20Shower%20RSVP`}>Reply to Maya</a>
    </dialog>
  );
}

function App() {
  const [progress, setProgress] = useState(0);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [sealOpened, setSealOpened] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const guest = invitation.guest;

  const openWithSeal = () => {
    if (sealOpened) return;
    setSealOpened(true);
    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 1300);
    const section = document.querySelector('.experience');
    const bounds = section.getBoundingClientRect();
    const revealPoint = window.scrollY + bounds.top + (bounds.height - window.innerHeight) * .47;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: revealPoint, behavior });
  };

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = document.querySelector('.experience');
        const bounds = section.getBoundingClientRect();
        setProgress(Math.min(1, Math.max(0, -bounds.top / (bounds.height - window.innerHeight))));
      });
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  const revealStyle = { '--progress': progress };

  return (
    <>
      <MusicToggle />
      <main>
        <section className="experience" aria-label="Invitation reveal">
          <div className="stage" style={revealStyle}>
            <PetalField />
            <div className="sparkles" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i className="spark" key={index} style={{ left: `${(index * 37 + 11) % 100}%`, top: `${(index * 61 + 13) % 100}%`, '--delay': `${(index % 7) * 0.43}s` }} />)}</div>
            <div className="contents" style={{ opacity: Math.max(0, Math.min(1, (progress - .27) * 3.1)), transform: `translateY(${(1 - progress) * 45}px)` }}><InvitationCard guest={guest} /></div>
            <div className="stage-copy" style={{ opacity: Math.max(0, 1 - progress * 2.2) }}>
              <p className="stage-greeting">Dear {guest},</p><h1>Something beautiful<br /><em>is waiting for you</em></h1><p>An invitation, wrapped in a little moment just for you.</p>
            </div>
            <div className="scroll-cue seal-cue" style={{ opacity: Math.max(0, 1 - progress * 5) }}>
              <button className={`wax-seal${sealOpened ? ' is-open' : ''}`} onClick={openWithSeal} aria-label={sealOpened ? 'The invitation is unsealed' : 'Touch the wax seal to open your invitation'} disabled={sealOpened}>
                <span>{invitation.bride[0]}</span>
              </button>
              {showBurst && <div className="seal-burst" aria-hidden="true">{[[0,-70],[48,-48],[70,0],[48,48],[0,70],[-48,48],[-70,0],[-48,-48],[25,-58],[-25,58],[58,25],[-58,-25]].map(([x,y], index) => <i key={index} style={{ '--x': `${x}px`, '--y': `${y}px`, '--delay': `${index * 24}ms` }} />)}</div>}
              <span>{sealOpened ? 'Opened with love' : 'Touch the seal · or scroll'}</span><i />
            </div>
            <VeilArtwork />
          </div>
        </section>
        <section className="below">
          <MemoriesSection />
          <section className="details" aria-labelledby="details-title">
            <span className="section-label">The day, in detail</span><h2 id="details-title">A day to celebrate</h2>
            <div className="detail-grid">
              <div className="detail"><span className="icon">✳</span><h3>Date</h3><p>Thursday, July 30<small>Two thousand twenty-six</small></p></div>
              <div className="detail"><span className="icon">◷</span><h3>Time</h3><p>6:00 in the evening<small>Please arrive a little early</small></p></div>
              <div className="detail"><span className="icon">⌂</span><h3>Location</h3><p>At our home<small>Address to follow with RSVP</small></p></div>
              <div className="detail"><span className="icon">❀</span><h3>Dress</h3><p>Soft pastels<small>Florals are always welcome</small></p></div>
            </div>
            <p className="note">I hope you can be there ♡</p><button className="rsvp" onClick={() => setRsvpOpen(true)}>Kindly RSVP</button>
          </section>
          <section className="closing"><span className="section-label">Until then</span><h2>Can’t wait to celebrate<br />with you.</h2><p>With love,</p><span className="signature">Maya</span></section>
          <div className="footer">Made with love · July 2026</div>
        </section>
      </main>
      <RSVPDialog open={rsvpOpen} onClose={() => setRsvpOpen(false)} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
