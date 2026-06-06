import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingGuide, { useOnboarding } from '../components/OnboardingGuide';



// in the JSX, before the closing div:


export default function LandingPage() {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

const { show, finish } = useOnboarding('htu_player_guide');
  return (
    <>
    {show && <OnboardingGuide role="player" onFinish={finish} />}
    
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="bg-grid" />
      <div className="bg-radial" />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'var(--text-accent)', textTransform: 'uppercase', marginBottom: 14, opacity: 0.85 }}>
            ◆ SYSTEM INITIALIZED ◆
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 8vw, 2.8rem)',
            fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1.1,
            background: 'linear-gradient(135deg, #fff 0%, var(--blue-bright) 50%, var(--purple-bright) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 8,
          }}>
            HTU HANDBALL
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Attendance & Roster System
          </div>
          <div style={{ width: 70, height: 2, background: 'linear-gradient(90deg,transparent,var(--blue-core),transparent)', margin: '18px auto 0' }} />
        </div>

        {/* Role label */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>
          [ SELECT ROLE ]
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <RoleCard
            icon="⚔" title="PLAYER"
            subtitle="Register or view your attendance record"
            color="var(--blue-core)" colorFaint="rgba(59,130,246,0.08)"
            tag="NEW RECRUIT" tagColor="var(--blue-bright)"
            onClick={() => navigate('/player')}
          />
          <RoleCard
            icon="👑" title="CAPTAIN"
            subtitle="Take attendance, manage roster & select game squad"
            color="var(--gold-rank)" colorFaint="rgba(245,158,11,0.08)"
            tag="AUTHORIZED ONLY" tagColor="var(--gold-rank)"
            onClick={() => navigate('/captain/login')}
          />
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Ho Technical University · Handball Team
        </div>
      </div>
    </div>
    </>
  );
}

function RoleCard({ icon, title, subtitle, color, colorFaint, tag, tagColor, onClick }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setPressed(true)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: pressed ? colorFaint : 'var(--bg-panel)',
        border: `1px solid ${pressed ? color : 'var(--border-subtle)'}`,
        borderRadius: 10, padding: '20px 18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: pressed ? `0 0 28px ${color}33` : 'none',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'all 0.18s ease',
        position: 'relative', overflow: 'hidden',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: pressed ? 0.8 : 0.3, transition: 'opacity 0.2s' }} />

      <div style={{ width: 48, height: 48, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', color: pressed ? color : 'var(--text-primary)', transition: 'color 0.2s' }}>
            {title}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', color: tagColor, background: `${tagColor}18`, border: `1px solid ${tagColor}40`, padding: '2px 7px', borderRadius: 3 }}>
            {tag}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      </div>

      <div style={{ color, fontSize: '1.1rem', opacity: pressed ? 1 : 0.3, flexShrink: 0, transition: 'opacity 0.2s' }}>›</div>
    </div>
  );
}