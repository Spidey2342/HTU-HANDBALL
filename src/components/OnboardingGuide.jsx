import React, { useState, useEffect } from 'react';

const PLAYER_STEPS = [
  {
    icon: '⚔',
    title: 'Welcome to HTU Handball',
    body: 'This app tracks your training attendance and helps captains select players for games. Takes less than a minute to get started.',
    color: 'var(--blue-core)',
  },
  {
    icon: '📝',
    title: 'Step 1 — Register Once',
    body: 'Tap PLAYER on the home screen, then "Not registered yet? Sign up". Enter your full name, WhatsApp number, and gender. You only do this once.',
    color: 'var(--blue-core)',
  },
  {
    icon: '⏳',
    title: 'Step 2 — Wait for Approval',
    body: 'Your captain will approve your registration. Once approved, you can view your attendance record anytime by entering your phone number.',
    color: 'var(--gold-rank)',
  },
  {
    icon: '📊',
    title: 'Step 3 — Check Your Record',
    body: 'Tap PLAYER and enter your WhatsApp number to see your attendance streak, stats, and your Hunter Rank based on how often you show up to training.',
    color: 'var(--purple-bright)',
  },
  {
    icon: '🏆',
    title: 'Hunter Ranks',
    body: 'S-Rank = 90%+ attendance\nA-Rank = 70–89% (game eligible)\nB-Rank = 50–69%\nC-Rank = below 50%\n\nReach A-Rank or above to be considered for games.',
    color: 'var(--gold-rank)',
  },
  {
    icon: '💬',
    title: 'WhatsApp Contact',
    body: 'Your captain may contact you via WhatsApp for training updates, game announcements, or if you miss a session. Make sure your number is correct.',
    color: 'var(--success-green)',
  },
];

const CAPTAIN_STEPS = [
  {
    icon: '👑',
    title: 'Captain Dashboard Guide',
    body: "You manage attendance, approve players, and select game squads. Here's a quick walkthrough of everything available to you.",
    color: 'var(--gold-rank)',
  },
  {
    icon: '🔐',
    title: 'Logging In',
    body: 'On the home screen tap CAPTAIN, select your division (Male or Female), and enter your password. You only see players in your division.',
    color: 'var(--gold-rank)',
  },
  {
    icon: '✅',
    title: 'Taking Attendance',
    body: 'Go to the ATTENDANCE tab. Every training day, tap PRESENT or ABSENT for each player. The system saves automatically — no submit button needed.',
    color: 'var(--success-green)',
  },
  {
    icon: '👥',
    title: 'Approving Players',
    body: 'Go to the ROSTER tab. New signups appear under Pending Approval. Tap Approve to add them to your roster or Reject to remove them.',
    color: 'var(--blue-bright)',
  },
  {
    icon: '🏅',
    title: 'Game Selection',
    body: 'Go to the GAME tab. Players with 70%+ attendance are automatically suggested. Tap New Squad, enter the game name and date, select players, and confirm.',
    color: 'var(--purple-bright)',
  },
  {
    icon: '📄',
    title: 'Exporting Reports',
    body: 'Tap the PDF button at the top of the dashboard. Choose Weekly or Monthly, preview the data, then download the report.',
    color: 'var(--blue-bright)',
  },
  {
    icon: '💬',
    title: 'WhatsApp Quick Contact',
    body: 'Each player row has a chat button. Tap it to open WhatsApp with that player directly — useful for chasing absences or game-day reminders.',
    color: 'var(--success-green)',
  },
];

export default function OnboardingGuide({ role, onFinish }) {
  const steps = role === 'captain' ? CAPTAIN_STEPS : PLAYER_STEPS;
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);

  const step = steps[current];
  const isLast = current === steps.length - 1;

  const next = () => { if (isLast) { finish(); return; } setCurrent(c => c + 1); };
  const prev = () => { if (current > 0) setCurrent(c => c - 1); };
  const finish = () => { setExiting(true); setTimeout(() => onFinish(), 300); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(4,5,10,0.96)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      opacity: exiting ? 0 : 1, transition: 'opacity 0.3s ease',
    }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            width: i === current ? 20 : 6, height: 6, borderRadius: 3,
            background: i === current ? step.color : i < current ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease', cursor: 'pointer',
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-panel)',
        border: `1px solid ${step.color}40`,
        borderRadius: 16, padding: '32px 24px',
        boxShadow: `0 0 40px ${step.color}20`,
        textAlign: 'center',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `${step.color}15`, border: `2px solid ${step.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 20px',
          boxShadow: `0 0 20px ${step.color}30`,
        }}>{step.icon}</div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: step.color, textTransform: 'uppercase', marginBottom: 10 }}>
          {current + 1} / {steps.length}
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 5vw, 1.2rem)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.3 }}>
          {step.title}
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
          {step.body}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, width: '100%', maxWidth: 420 }}>
        {current > 0 && (
          <button onClick={prev} style={{ flex: 1, padding: '13px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer', minHeight: 48, WebkitTapHighlightColor: 'transparent' }}>
            ← Back
          </button>
        )}
        <button onClick={next} style={{ flex: 2, padding: '13px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`, color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', minHeight: 48, WebkitTapHighlightColor: 'transparent', boxShadow: `0 0 20px ${step.color}40` }}>
          {isLast ? "LET'S GO →" : 'NEXT →'}
        </button>
      </div>

      {!isLast && (
        <button onClick={finish} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', marginTop: 16, WebkitTapHighlightColor: 'transparent' }}>
          SKIP GUIDE
        </button>
      )}
    </div>
  );
}

export function useOnboarding(key) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(key);
    if (!seen) setShow(true);
  }, [key]);

  const finish = () => { localStorage.setItem(key, 'true'); setShow(false); };
  const reset = () => { localStorage.removeItem(key); setShow(true); };

  return { show, finish, reset };
}