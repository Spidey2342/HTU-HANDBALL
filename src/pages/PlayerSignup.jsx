import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PlayerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', gender: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.gender) { setError('All fields are required.'); return; }
    if (!/^\d{9,15}$/.test(form.phone.replace(/\s/g, ''))) { setError('Enter a valid phone number (digits only).'); return; }
    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('players').insert([{ name: form.name.trim(), phone: form.phone.trim(), gender: form.gender, approved: false }]);
      if (dbError) { setError(dbError.code === '23505' ? 'This phone number is already registered.' : 'Registration failed. Please try again.'); return; }
      setSuccess(true);
    } catch { setError('Something went wrong. Check your connection.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="bg-grid" /><div className="bg-radial" />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div className="system-window" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✦</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--success-green)', marginBottom: 12 }}>REGISTRATION SUBMITTED</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>Pending captain approval. You'll be added to the roster once confirmed.</p>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid var(--border-active)', borderRadius: 6, color: 'var(--blue-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '12px 24px', cursor: 'pointer', width: '100%', minHeight: 44 }}>
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="bg-grid" /><div className="bg-radial" />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/player')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase', padding: 0 }}>
          ← Back
        </button>
        <div className="system-window">
          <div className="system-header"><div className="system-dot" />Player Registration</div>
          <div style={{ padding: '28px 20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 5vw, 1.4rem)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>Join the Roster</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>Register your details. Your captain will approve your entry.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" name="name" placeholder="e.g. Kwame Asante" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="input-label">WhatsApp Number</label>
                <input className="input-field" name="phone" placeholder="e.g. 0241234567" value={form.phone} onChange={handleChange} inputMode="numeric" />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 5 }}>Used by captain to contact you via WhatsApp</div>
              </div>
              <div>
                <label className="input-label">Gender</label>
                <select className="select-field" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '10px 14px', color: 'var(--danger-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>⚠ {error}</div>
              )}

              <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, var(--blue-core), var(--purple-core))', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', minHeight: 48, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'REGISTERING...' : 'REGISTER'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}