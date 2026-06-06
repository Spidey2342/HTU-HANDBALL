import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CaptainLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ gender: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLogin = async () => {
    if (!form.gender || !form.password) {
      setError('Select your division and enter your password.');
      return;
    }
    setLoading(true);
    try {
      const { data: rows } = await supabase
        .from('captains').select('*').eq('gender', form.gender);

      const data = rows?.[0];
      if (!data) { setError('No captain found for this division.'); setLoading(false); return; }
      if (data.password_hash !== form.password) { setError('Incorrect password. Access denied.'); setLoading(false); return; }

      login({ id: data.id, name: data.name, gender: data.gender });
      navigate('/captain/dashboard');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="bg-grid" /><div className="bg-radial" />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
          ← Back
        </button>

        <div className="system-window">
          <div className="system-header" style={{ borderBottomColor: 'rgba(245,158,11,0.2)', color: 'var(--gold-rank)' }}>
            <div className="system-dot" style={{ background: 'var(--gold-rank)', boxShadow: '0 0 6px var(--gold-rank)' }} />
            Captain Authentication
          </div>
          <div style={{ padding: '28px 20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 5vw, 1.4rem)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>
              Captain Login
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
              Access restricted to authorized captains only.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="input-label">Gender Division</label>
                <select className="select-field" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select your division</option>
                  <option value="male">⚔ Male Division</option>
                  <option value="female">⚔ Female Division</option>
                </select>
              </div>
              <div>
                <label className="input-label">Captain Password</label>
                <input
                  className="input-field" type="password" name="password"
                  placeholder="Enter captain password"
                  value={form.password} onChange={handleChange}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', color: 'var(--danger-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={handleLogin} disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 6, border: 'none',
                  background: 'linear-gradient(135deg, var(--gold-rank), #b45309)',
                  color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.75rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                  minHeight: 48, opacity: loading ? 0.7 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}