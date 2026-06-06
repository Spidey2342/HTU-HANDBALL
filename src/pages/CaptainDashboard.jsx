import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AttendanceStreak from '../components/AttendanceStreak';
import ExportPDF from '../components/ExportPDF';
import OnboardingGuide, { useOnboarding } from '../components/OnboardingGuide';

// inside the component:


// in the JSX:


const TABS = ['ATTENDANCE', 'ROSTER', 'GAME'];

export default function CaptainDashboard() {
  const { captain, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const [players, setPlayers] = useState([]);
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [gameModal, setGameModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [selectedForGame, setSelectedForGame] = useState([]);
  const today = new Date().toISOString().split('T')[0];
  const { show, finish } = useOnboarding('htu_captain_guide');

  const loadData = useCallback(async () => {
    if (!captain) return;
    setLoading(true);
    try {
      const { data: approvedData } = await supabase
        .from('players')
        .select('*')
        .eq('gender', captain.gender)
        .eq('approved', true)
        .order('name');

      const { data: pendingData } = await supabase
        .from('players')
        .select('*')
        .eq('gender', captain.gender)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      setPlayers(approvedData || []);
      setPendingPlayers(pendingData || []);

      let { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_date', today)
        .eq('gender', captain.gender)
        .single();

      if (!session) {
        const { data: newSession } = await supabase
          .from('sessions')
          .insert([{ session_date: today, gender: captain.gender, created_by: captain.id }])
          .select()
          .single();
        session = newSession;
      }

      setSessionId(session?.id);

      if (session?.id && approvedData?.length) {
        const { data: attData } = await supabase
          .from('attendance')
          .select('*')
          .eq('session_id', session.id);

        const attMap = {};
        (attData || []).forEach(a => { attMap[a.player_id] = a.present; });
        setAttendance(attMap);
      }

      const { data: summaryData } = await supabase
        .from('player_attendance_summary')
        .select('*')
        .eq('gender', captain.gender)
        .gte('attendance_percentage', 70)
        .order('attendance_percentage', { ascending: false });

      setSuggestedPlayers(summaryData || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [captain, today]);

  useEffect(() => {
    if (!captain) { navigate('/captain/login'); return; }
    loadData();
  }, [captain, navigate, loadData]);

  const toggleAttendance = async (playerId, markPresent) => {
    if (!sessionId) return;
    const current = attendance[playerId] ?? false;
    if (current === markPresent) return;
    setAttendance(prev => ({ ...prev, [playerId]: markPresent }));
    setSavingId(playerId);
    try {
      await supabase
        .from('attendance')
        .upsert([{ session_id: sessionId, player_id: playerId, present: markPresent }],
          { onConflict: 'session_id,player_id' });
    } catch {
      setAttendance(prev => ({ ...prev, [playerId]: current }));
    } finally {
      setSavingId(null);
    }
  };

  const approvePlayer = async (playerId) => {
    await supabase.from('players').update({ approved: true }).eq('id', playerId);
    await loadData();
  };

  const removePlayer = async (playerId) => {
    if (!window.confirm('Remove this player from the roster?')) return;
    await supabase.from('players').delete().eq('id', playerId);
    await loadData();
  };

  const saveGameSelection = async () => {
    if (!gameName || !gameDate || selectedForGame.length === 0) return;
    const rows = selectedForGame.map(pid => ({
      game_name: gameName,
      game_date: gameDate,
      gender: captain.gender,
      player_id: pid,
      confirmed_by: captain.id,
    }));
    await supabase.from('game_selections').insert(rows);
    setGameModal(false);
    setGameName(''); setGameDate(''); setSelectedForGame([]);
    alert(`Squad saved! ${rows.length} players selected.`);
  };

  const openWhatsApp = (phone) => {
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('0') ? '233' + clean.slice(1) : clean;
    window.open(`https://wa.me/${num}`, '_blank');
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = players.length - presentCount;
  const rate = players.length ? Math.round((presentCount / players.length) * 100) : 0;

  if (!captain) return null;

  return (
    <>
    {show && <OnboardingGuide role="captain" onFinish={finish} />}
   
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      {/* Background */}
      <div className="bg-grid" />
      <div className="bg-radial" />

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,12,20,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, gap: 8,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--blue-bright)', flexShrink: 0 }}>
          HTU HANDBALL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em',
            padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase',
            background: 'rgba(245,158,11,0.15)', color: 'var(--gold-rank)',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            {captain.gender === 'male' ? '♂' : '♀'} {captain.gender}
          </span>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              background: 'none', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4, color: 'var(--danger-red)',
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.08em', padding: '4px 10px',
              cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ padding: '16px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* STAT CARDS — 2x2 on mobile, 4 across on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: 'Present', value: presentCount, color: 'var(--success-green)' },
            { label: 'Absent', value: absentCount, color: 'var(--danger-red)' },
            { label: 'Players', value: players.length, color: 'var(--blue-bright)' },
            { label: 'Rate', value: `${rate}%`, color: rate >= 70 ? 'var(--success-green)' : rate >= 50 ? 'var(--gold-rank)' : 'var(--danger-red)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '14px 12px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 16, overflowX: 'auto',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '10px 16px', whiteSpace: 'nowrap',
                color: activeTab === tab ? 'var(--blue-bright)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--blue-core)' : '2px solid transparent',
                transition: 'all 0.2s', position: 'relative',
              }}
            >
              {tab}
              {tab === 'ROSTER' && pendingPlayers.length > 0 && (
                <span style={{
                  marginLeft: 5, background: 'var(--danger-red)', color: '#fff',
                  borderRadius: '50%', width: 15, height: 15,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem',
                }}>
                  {pendingPlayers.length}
                </span>
              )}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingBottom: 8, paddingRight: 4 }}>
            <button
              onClick={() => setShowExport(true)}
              style={{
                background: 'transparent', border: '1px solid var(--border-active)',
                borderRadius: 4, color: 'var(--blue-bright)',
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                letterSpacing: '0.08em', padding: '5px 10px',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ↓ PDF
            </button>
          </div>
        </div>

        {/* ── ATTENDANCE TAB ── */}
        {activeTab === 'ATTENDANCE' && (
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.15em', color: 'var(--text-accent)',
              textTransform: 'uppercase', marginBottom: 14,
            }}>
              ◆ Roll Call — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>

            {loading ? <LoadingState /> : players.length === 0 ? (
              <EmptyState message="No approved players yet. Check the Roster tab." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {players.map(player => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    present={attendance[player.id] ?? false}
                    saving={savingId === player.id}
                    onPresent={() => toggleAttendance(player.id, true)}
                    onAbsent={() => toggleAttendance(player.id, false)}
                    onWhatsApp={() => openWhatsApp(player.phone)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ROSTER TAB ── */}
        {activeTab === 'ROSTER' && (
          <div>
            {pendingPlayers.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  letterSpacing: '0.15em', color: 'var(--gold-rank)',
                  textTransform: 'uppercase', marginBottom: 12,
                }}>
                  ◆ Pending Approval ({pendingPlayers.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingPlayers.map(p => (
                    <div key={p.id} style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 8, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <PlayerAvatar name={p.name} color="var(--gold-rank)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.phone}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => approvePlayer(p.id)}
                          style={{
                            flex: 1, padding: '9px', borderRadius: 5, cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                            background: 'rgba(16,185,129,0.15)', color: 'var(--success-green)',
                            border: '1px solid rgba(16,185,129,0.3)',
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => removePlayer(p.id)}
                          style={{
                            flex: 1, padding: '9px', borderRadius: 5, cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                            background: 'rgba(239,68,68,0.12)', color: 'var(--danger-red)',
                            border: '1px solid rgba(239,68,68,0.3)',
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,var(--border-active),transparent)', margin: '20px 0' }} />
              </div>
            )}

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-accent)', textTransform: 'uppercase', marginBottom: 12 }}>
              ◆ Active Roster ({players.length})
            </div>
            {players.length === 0 ? <EmptyState message="No approved players yet." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {players.map(player => (
                  <div key={player.id} style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <PlayerAvatar name={player.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{player.phone}</div>
                    </div>
                    <button
                      onClick={() => openWhatsApp(player.phone)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', flexShrink: 0 }}
                    >💬</button>
                    <button
                      onClick={() => removePlayer(player.id)}
                      style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 4, color: 'var(--danger-red)',
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                        padding: '5px 10px', cursor: 'pointer', flexShrink: 0,
                      }}
                    >Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── GAME TAB ── */}
        {activeTab === 'GAME' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                  ◆ Game Squad Selection
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Players with 70%+ attendance. Tap to select your squad.
                </div>
              </div>
              <button
                onClick={() => setGameModal(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--blue-core), var(--purple-core))',
                  border: 'none', borderRadius: 5, color: '#fff',
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  letterSpacing: '0.08em', padding: '10px 16px',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                + New Squad
              </button>
            </div>

            {suggestedPlayers.length === 0 ? (
              <EmptyState message="No players with 70%+ attendance yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestedPlayers.map((p, i) => (
                  <div key={p.player_id} style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700,
                      color: i === 0 ? 'var(--gold-rank)' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)',
                      width: 24, textAlign: 'center', flexShrink: 0,
                    }}>#{i + 1}</div>
                    <PlayerAvatar name={p.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {p.total_present}/{p.total_sessions} sessions
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
                      color: p.attendance_percentage >= 90 ? 'var(--success-green)' : 'var(--gold-rank)',
                      flexShrink: 0,
                    }}>
                      {p.attendance_percentage}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EXPORT MODAL */}
      {showExport && <ExportPDF captain={captain} players={players} onClose={() => setShowExport(false)} />}

      {/* GAME SELECTION MODAL */}
      {gameModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(4,5,10,0.9)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end',
          padding: 0,
        }}>
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-active)',
            borderRadius: '16px 16px 0 0',
            width: '100%', maxHeight: '90vh',
            overflowY: 'auto', padding: '24px 20px',
          }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: 'var(--border-active)', borderRadius: 2, margin: '0 auto 20px' }} />

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 20 }}>
              Select Game Squad
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">Game / Tournament Name</label>
                <input className="input-field" placeholder="e.g. Regional Championship" value={gameName} onChange={e => setGameName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Game Date</label>
                <input className="input-field" type="date" value={gameDate} onChange={e => setGameDate(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Select Players</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestedPlayers.map(p => {
                    const selected = selectedForGame.includes(p.player_id);
                    return (
                      <div
                        key={p.player_id}
                        onClick={() => setSelectedForGame(prev =>
                          selected ? prev.filter(id => id !== p.player_id) : [...prev, p.player_id]
                        )}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                          background: selected ? 'rgba(59,130,246,0.12)' : 'var(--bg-deep)',
                          border: `1px solid ${selected ? 'var(--blue-core)' : 'var(--border-subtle)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${selected ? 'var(--blue-core)' : 'var(--text-muted)'}`,
                          background: selected ? 'var(--blue-core)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>}
                        </div>
                        <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--success-green)' }}>{p.attendance_percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  onClick={() => setGameModal(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 5, cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                  }}
                >Cancel</button>
                <button
                  onClick={saveGameSelection}
                  disabled={!gameName || !gameDate || selectedForGame.length === 0}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 5, cursor: 'pointer',
                    background: 'linear-gradient(135deg, var(--blue-core), var(--purple-core))',
                    border: 'none', color: '#fff',
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    opacity: (!gameName || !gameDate || selectedForGame.length === 0) ? 0.5 : 1,
                  }}
                >
                  Confirm Squad ({selectedForGame.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
     </>
  );
}

// ── PLAYER ROW ── Two clear buttons
function PlayerRow({ player, present, saving, onPresent, onAbsent, onWhatsApp }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: `1px solid ${present ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 8,
      padding: '12px 14px',
      transition: 'border-color 0.2s',
    }}>
      {/* Top row: avatar + name + whatsapp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <PlayerAvatar name={player.name} color={present ? 'var(--success-green)' : 'var(--blue-core)'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {player.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {player.phone}
          </div>
        </div>
        <button
          onClick={onWhatsApp}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', flexShrink: 0 }}
        >💬</button>
      </div>

      {/* Bottom row: two full-width buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          onClick={onPresent}
          disabled={saving}
          style={{
            padding: '10px 0', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            border: `1px solid ${present ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.25)'}`,
            background: present ? 'rgba(16,185,129,0.2)' : 'transparent',
            color: present ? 'var(--success-green)' : 'var(--text-muted)',
            fontWeight: present ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          ✓ Present
        </button>
        <button
          onClick={onAbsent}
          disabled={saving}
          style={{
            padding: '10px 0', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            border: `1px solid ${!present ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.25)'}`,
            background: !present ? 'rgba(239,68,68,0.18)' : 'transparent',
            color: !present ? 'var(--danger-red)' : 'var(--text-muted)',
            fontWeight: !present ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          ✗ Absent
        </button>
      </div>
    </div>
  );
}

function PlayerAvatar({ name, color = 'var(--blue-core)' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: '0.75rem', color,
    }}>
      {initials}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
      LOADING ROSTER...
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', lineHeight: 1.8 }}>
      {message}
    </div>
  );
}