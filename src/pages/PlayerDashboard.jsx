import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AttendanceStreak from '../components/AttendanceStreak';

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState('lookup');
  const [phone, setPhone] = useState('');
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupPlayer = async () => {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: dbErr } = await supabase.from('players').select('*').eq('phone', phone.trim()).single();
      if (dbErr || !data) { setError('No player found with that number. Please register first.'); return; }
      if (!data.approved) { setError('Your registration is pending captain approval.'); return; }

      const { data: attData } = await supabase.from('attendance').select('present, sessions(session_date)').eq('player_id', data.id);
      const total = attData?.length || 0;
      const present = attData?.filter(a => a.present).length || 0;
      setPlayer(data);
      setStats({ total, present, absent: total - present, pct: total ? Math.round((present / total) * 100) : 0 });
      setView('dashboard');
    } catch { setError('Something went wrong. Check your connection.'); }
    finally { setLoading(false); }
  };

  const rank = stats?.pct >= 90 ? { label: 'S-Rank Player', icon: '🏆', color: 'var(--gold-rank)' }
    : stats?.pct >= 70 ? { label: 'A-Rank Player', icon: '⚔', color: 'var(--blue-bright)' }
    : stats?.pct >= 50 ? { label: 'B-Rank Player', icon: '🛡', color: 'var(--purple-bright)' }
    : { label: 'C-Rank Player', icon: '📋', color: 'var(--text-secondary)' };

  if (view === 'lookup') return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="bg-grid" /><div className="bg-radial" />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase', padding: 0 }}>
          ← Back
        </button>
        <div className="system-window">
          <div className="system-header"><div className="system-dot" />Player Portal</div>
          <div style={{ padding: '28px 20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem,5vw,1.4rem)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>Player Access</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>Enter your WhatsApp number to view your attendance record.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Your WhatsApp Number</label>
                <input className="input-field" placeholder="e.g. 0241234567" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && lookupPlayer()} inputMode="numeric" />
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', color: 'var(--danger-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>⚠ {error}</div>}
              <button onClick={lookupPlayer} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,var(--blue-core),var(--purple-core))', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', minHeight: 48, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'SEARCHING...' : 'VIEW MY RECORD'}
              </button>
              <div className="divider" />
              <button onClick={() => navigate('/player/signup')} style={{ width: '100%', padding: '12px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', cursor: 'pointer', minHeight: 44 }}>
                Not registered yet? Sign up →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-void)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      <div className="bg-grid" /><div className="bg-radial" />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--blue-bright)' }}>HTU HANDBALL</div>
        <button onClick={() => setView('lookup')} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', padding: '5px 10px', cursor: 'pointer' }}>
          Switch
        </button>
      </nav>

      <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Welcome back, Hunter</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,6vw,1.8rem)', fontWeight: 700, background: 'linear-gradient(135deg,#fff,var(--blue-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {player?.name}
          </h1>
        </div>

        {/* Stats — 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Present', value: stats?.present, color: 'var(--success-green)' },
            { label: 'Absent', value: stats?.absent, color: 'var(--danger-red)' },
            { label: 'Total Sessions', value: stats?.total, color: 'var(--blue-bright)' },
            { label: 'Rate', value: `${stats?.pct}%`, color: stats?.pct >= 70 ? 'var(--success-green)' : stats?.pct >= 50 ? 'var(--gold-rank)' : 'var(--danger-red)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Streak */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '20px 16px', marginBottom: 12 }}>
          <AttendanceStreak playerId={player?.id} />
        </div>

        {/* Rank */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: '2rem', flexShrink: 0 }}>{rank.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Training Rank</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.9rem,4vw,1.1rem)', fontWeight: 700, color: rank.color, marginBottom: 3 }}>{rank.label}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {stats?.pct >= 70 ? '✓ Eligible for game selection' : `Need ${70 - stats?.pct}% more attendance for game eligibility`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}