import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExportPDF({ captain, players, onClose }) {
  const [period, setPeriod] = useState('weekly');
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreview();
  }, [period]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (period === 'weekly') {
      start.setDate(end.getDate() - 6);
    } else {
      start.setDate(1); // first of current month
    }
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const loadPreview = async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    try {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, session_date')
        .eq('gender', captain.gender)
        .gte('session_date', start)
        .lte('session_date', end)
        .order('session_date');

      const sessionIds = (sessions || []).map(s => s.id);

      const playerStats = await Promise.all(
        players.map(async (player) => {
          const { data: attData } = await supabase
            .from('attendance')
            .select('present, session_id')
            .eq('player_id', player.id)
            .in('session_id', sessionIds);

          const present = (attData || []).filter(a => a.present).length;
          const total = sessionIds.length;
          const pct = total ? Math.round((present / total) * 100) : 0;

          return { ...player, present, total, pct };
        })
      );

      setPreviewData({ sessions: sessions || [], players: playerStats, start, end });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!previewData) return;
    setGenerating(true);

    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(8, 12, 20);
      doc.rect(0, 0, pageW, 40, 'F');
      doc.setTextColor(147, 197, 253);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('HTU HANDBALL TEAM', pageW / 2, 16, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('ATTENDANCE REPORT', pageW / 2, 24, { align: 'center' });
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text(
        `${captain.gender.toUpperCase()} DIVISION  |  ${period === 'weekly' ? 'WEEKLY' : 'MONTHLY'} REPORT  |  ${previewData.start} to ${previewData.end}`,
        pageW / 2, 32, { align: 'center' }
      );

      // Summary boxes
      const totalSessions = previewData.sessions.length;
      const avgPct = previewData.players.length
        ? Math.round(previewData.players.reduce((s, p) => s + p.pct, 0) / previewData.players.length)
        : 0;
      const topPlayers = previewData.players.filter(p => p.pct >= 70).length;

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Total Sessions: ${totalSessions}`, 14, 50);
      doc.text(`Avg Attendance: ${avgPct}%`, 75, 50);
      doc.text(`Players ≥70%: ${topPlayers}`, 140, 50);

      // Table
      const tableData = [...previewData.players]
        .sort((a, b) => b.pct - a.pct)
        .map((p, i) => [
          i + 1,
          p.name,
          p.phone,
          `${p.present}`,
          `${p.total}`,
          `${p.pct}%`,
          p.pct >= 90 ? 'EXCELLENT' : p.pct >= 70 ? 'GOOD' : p.pct >= 50 ? 'FAIR' : 'POOR',
        ]);

      autoTable(doc, {
        startY: 58,
        head: [['#', 'Name', 'Phone', 'Present', 'Sessions', 'Rate', 'Status']],
        body: tableData,
        headStyles: { fillColor: [13, 18, 32], textColor: [96, 165, 250], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [226, 232, 240] },
        alternateRowStyles: { fillColor: [17, 24, 39] },
        styles: { fillColor: [8, 12, 20], lineColor: [30, 41, 59], lineWidth: 0.3 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', textColor: [96, 165, 250] },
          6: { halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.column.index === 6 && data.section === 'body') {
            const val = data.cell.raw;
            if (val === 'EXCELLENT') data.cell.styles.textColor = [16, 185, 129];
            else if (val === 'GOOD') data.cell.styles.textColor = [245, 158, 11];
            else if (val === 'POOR') data.cell.styles.textColor = [239, 68, 68];
          }
        }
      });

      // Footer
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  HTU Handball Attendance System`, pageW / 2, finalY, { align: 'center' });

      doc.save(`HTU_Handball_${captain.gender}_${period}_${previewData.end}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Make sure jspdf and jspdf-autotable are installed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(4,5,10,0.9)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="system-window" style={{ width: '100%', maxWidth: 560 }}>
        <div className="system-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="system-dot" />
            Export Attendance Report
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Period Toggle */}
          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Report Period</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 5, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: period === p ? 'rgba(59,130,246,0.15)' : 'var(--bg-deep)',
                    border: `1px solid ${period === p ? 'var(--blue-core)' : 'var(--border-subtle)'}`,
                    color: period === p ? 'var(--blue-bright)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p === 'weekly' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
              LOADING DATA...
            </div>
          ) : previewData && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Sessions', value: previewData.sessions.length },
                  { label: 'Players', value: previewData.players.length },
                  { label: 'Period', value: `${previewData.start} → ${previewData.end}` },
                ].map(s => (
                  <div key={s.label} className="panel" style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--blue-bright)', marginBottom: 2 }}>{s.value}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Top 5 preview */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--text-accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                Preview (Top 5)
              </div>
              {[...previewData.players].sort((a, b) => b.pct - a.pct).slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', width: 18 }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{p.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: p.pct >= 70 ? 'var(--success-green)' : 'var(--danger-red)' }}>{p.pct}%</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={generatePDF}
              disabled={generating || loading || !previewData}
              style={{ minWidth: 140 }}
            >
              {generating ? 'Generating...' : '↓ Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}