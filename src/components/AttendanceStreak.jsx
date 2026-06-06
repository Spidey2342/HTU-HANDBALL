import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Generates the last N days as date strings
function getLastNDays(n = 30) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function AttendanceStreak({ playerId, mini = false }) {
  const [streakData, setStreakData] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    loadStreak();
  }, [playerId]);

  const loadStreak = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('attendance')
        .select('present, sessions(session_date)')
        .eq('player_id', playerId)
        .order('sessions(session_date)', { ascending: false });

      const map = {};
      let streak = 0;
      let streakBroken = false;

      (data || []).forEach(row => {
        const date = row.sessions?.session_date;
        if (date) {
          map[date] = row.present;
          if (!streakBroken) {
            if (row.present) streak++;
            else streakBroken = true;
          }
        }
      });

      setStreakData(map);
      setCurrentStreak(streak);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const days = getLastNDays(mini ? 14 : 30);

  if (mini) {
    // Compact version for roster list
    return (
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {days.map(date => {
          const status = streakData[date];
          return (
            <div
              key={date}
              title={date}
              style={{
                width: 8, height: 8, borderRadius: 2,
                background: status === true
                  ? 'var(--blue-core)'
                  : status === false
                  ? 'var(--bg-elevated)'
                  : 'var(--bg-deep)',
                boxShadow: status === true ? '0 0 4px rgba(59,130,246,0.5)' : 'none',
              }}
            />
          );
        })}
        {currentStreak > 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--blue-bright)', marginLeft: 4 }}>
            🔥{currentStreak}
          </span>
        )}
      </div>
    );
  }

  // Full version for player dashboard
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      {/* Streak header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-accent)', textTransform: 'uppercase', marginBottom: 4 }}>
            ◆ 30-Day Attendance Streak
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: currentStreak > 0 ? 'var(--blue-bright)' : 'var(--text-muted)' }}>
              {currentStreak}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>day streak</span>
          </div>
        </div>
        <div style={{ fontSize: '2rem', opacity: currentStreak >= 7 ? 1 : 0.3 }}>
          {currentStreak >= 20 ? '🔥' : currentStreak >= 10 ? '⚡' : currentStreak >= 5 ? '✦' : '○'}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', gap: 4 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {week.map(date => {
              const status = streakData[date];
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={date}
                  title={`${date}: ${status === true ? 'Present' : status === false ? 'Absent' : 'No session'}`}
                  style={{
                    width: 16, height: 16, borderRadius: 3,
                    background: status === true
                      ? 'var(--blue-core)'
                      : status === false
                      ? 'var(--bg-elevated)'
                      : 'var(--bg-deep)',
                    boxShadow: status === true
                      ? '0 0 6px rgba(59,130,246,0.6)'
                      : 'none',
                    outline: isToday ? '2px solid var(--blue-core)' : 'none',
                    outlineOffset: 1,
                    transition: 'all 0.15s',
                    cursor: 'default',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center' }}>
        {[
          { color: 'var(--blue-core)', label: 'Present', glow: true },
          { color: 'var(--bg-elevated)', label: 'Absent', glow: false },
          { color: 'var(--bg-deep)', label: 'No session', glow: false },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, boxShadow: l.glow ? '0 0 4px rgba(59,130,246,0.5)' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}