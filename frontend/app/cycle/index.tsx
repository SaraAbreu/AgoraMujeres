import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

const C = {
  forestDeep: '#2C3D2E', forest: '#4A664D', moss: '#6B8F6E',
  sage: '#A8C5A0', mint: '#D4E8D0', mintSoft: '#EAF4E8',
  cream: '#F8F7F2', parchment: '#F0EDE4', warm: '#E8E2D8',
  muted: '#9A958E', charcoal: '#3D3A35', white: '#FFFFFF', gold: '#C9A84C',
};

const PHASES: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  menstruation:  { label: 'Regla o Período',     color: '#C0614A', bg: '#FEF2F2', icon: 'water-outline' },
  follicular:    { label: 'Después de la regla', color: '#4A7FA5', bg: '#EEF4FA', icon: 'sunny-outline' },
  ovulation:     { label: 'Mitad del ciclo',      color: C.forest,  bg: C.mintSoft, icon: 'flower-outline' },
  luteal:        { label: 'Antes de la regla',    color: C.gold,    bg: '#FDF8EE', icon: 'moon-outline' },
  perimenopause: { label: 'Perimenopausia',       color: '#7B5EA7', bg: '#F3EEF8', icon: 'contrast-outline' },
  menopause:     { label: 'Menopausia',           color: '#A0522D', bg: '#FDF4EE', icon: 'infinite-outline' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CycleScreen() {
  const router = useRouter();
  const { deviceId, userData } = useUserStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = deviceId || 'guest';
    fetch(`${API_BASE}/cycle/${id}`)
      .then(r => r.json())
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const exportPDF = async () => {
    if (Platform.OS !== 'web') return;
    setExporting(true);
    try {
      const id = deviceId || 'guest';
      let diaryEntries: any[] = [];
      try {
        const r = await fetch(`${API_BASE}/diary/${id}?limit=50`);
        const d = await r.json();
        diaryEntries = Array.isArray(d) ? d : (d.entries || []);
      } catch {}

      const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const name = userData?.name || '';

      const cycleRows = entries.map(entry => {
        const phase = PHASES[entry.phase] || PHASES.menstruation;
        const syms = entry.symptoms?.length > 0 ? `<div style="margin-top:4px">${entry.symptoms.map((s:string) => `<span style="background:#EAF4E8;color:#4A664D;padding:2px 8px;border-radius:10px;font-size:11px;margin-right:4px">${s}</span>`).join('')}</div>` : '';
        return `<tr>
          <td style="padding:8px 10px;color:#9A958E;font-size:12px">${formatDateShort(entry.start_date)}</td>
          <td style="padding:8px 10px;color:${phase.color};font-weight:500">${phase.label}</td>
          <td style="padding:8px 10px;text-align:center;color:#3D3A35">${entry.pain}/5</td>
          <td style="padding:8px 10px;color:#3D3A35">${entry.mood || '—'}</td>
          <td style="padding:8px 10px">${syms}</td>
        </tr>`;
      }).join('');

      const diaryRows = diaryEntries.slice(0, 20).map((entry: any) => {
        const dateStr = entry.created_at ? formatDateShort(entry.created_at) : '';
        const content = entry.content ? `<div style="font-size:11px;color:#3D3A35;margin-top:4px">${entry.content.slice(0, 200)}${entry.content.length > 200 ? '…' : ''}</div>` : '';
        return `<tr>
          <td style="padding:8px 10px;color:#9A958E;font-size:12px;white-space:nowrap">${dateStr}</td>
          <td style="padding:8px 10px;color:#4A664D">${entry.mood || '—'}</td>
          <td style="padding:8px 10px;color:#C0614A;text-align:center">${entry.pain !== undefined ? entry.pain + '/10' : '—'}</td>
          <td style="padding:8px 10px">${content}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>Informe Ágora Mujeres</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Georgia, serif; background: #fff; color: #3D3A35; }
          .header { background: #2C3D2E; color: white; padding: 32px 40px 24px; }
          .header h1 { font-size: 24px; font-weight: 300; letter-spacing: 3px; margin-bottom: 6px; }
          .header p { font-size: 13px; color: #A8C5A0; }
          .header .meta { display:flex; justify-content:space-between; margin-top: 12px; font-size:12px; color:#D4E8D0; }
          .section { padding: 32px 40px 0; }
          .section h2 { font-size: 15px; font-weight: 400; letter-spacing: 2px; color: #2C3D2E; text-transform: uppercase; border-bottom: 1px solid #4A664D; padding-bottom: 8px; margin-bottom: 16px; }
          table { width:100%; border-collapse:collapse; margin-bottom: 32px; }
          th { background:#F0EDE4; color:#2C3D2E; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; padding:8px 10px; text-align:left; }
          tr:nth-child(even) td { background: #FAFAF8; }
          td { border-bottom: 1px solid #F0EDE4; vertical-align:top; }
          .footer { margin-top:40px; padding:16px 40px; border-top:1px solid #E8E2D8; font-size:10px; color:#C0C0C0; display:flex; justify-content:space-between; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
        </style>
      </head><body>
        <div class="header">
          <h1>Ágora Mujeres</h1>
          <p>Informe de seguimiento del ciclo y bienestar</p>
          <div class="meta"><span>Generado el ${today}</span><span>${name}</span></div>
        </div>
        <div class="section">
          <h2>Registros del ciclo</h2>
          ${entries.length === 0 ? '<p style="color:#9A958E;font-style:italic">Sin registros de ciclo.</p>' : `
          <table>
            <thead><tr><th>Fecha</th><th>Fase</th><th>Dolor</th><th>Estado</th><th>Síntomas</th></tr></thead>
            <tbody>${cycleRows}</tbody>
          </table>`}
        </div>
        <div class="section">
          <h2>Entradas del diario</h2>
          ${diaryEntries.length === 0 ? '<p style="color:#9A958E;font-style:italic">Sin entradas de diario.</p>' : `
          <table>
            <thead><tr><th>Fecha</th><th>Estado</th><th>Dolor</th><th>Nota</th></tr></thead>
            <tbody>${diaryRows}</tbody>
          </table>`}
        </div>
        <div class="no-print" style="text-align:center;padding:24px 0 8px">
          <button onclick="window.close()" style="background:#2C3D2E;color:white;border:none;padding:12px 32px;border-radius:24px;font-size:13px;letter-spacing:1px;cursor:pointer;font-family:Georgia,serif">← Volver</button>
        </div>
        <div class="footer"><span>Ágora Mujeres · Informe confidencial</span><span>${today}</span></div>
      </body></html>`;

      const payload = {
        name,
        today,
        cycle_entries: entries.map((entry: any) => ({
          date: formatDateShort(entry.start_date),
          phase: PHASES[entry.phase]?.label || entry.phase,
          pain: entry.pain,
          mood: entry.mood || '-',
          symptoms: entry.symptoms || [],
        })),
        diary_entries: diaryEntries.slice(0, 20).map((entry: any) => ({
          date: entry.created_at ? formatDateShort(entry.created_at) : '',
          dolor: entry.dolor || entry.pain || 0,
          texto: entry.texto || entry.content || '',
          tags: [...(entry.cuerpo || []), ...(entry.mente || []), ...(entry.alma || [])],
        })),
      };

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/export/cycle-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error generando PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agora-ciclo.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mi ciclo</Text>
        <TouchableOpacity onPress={exportPDF} style={s.headerBtn} disabled={exporting}>
          {exporting
            ? <ActivityIndicator size="small" color={C.white} />
            : <Ionicons name="download-outline" size={22} color={C.white} />
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={C.forest} size="large" style={{ marginTop: 60 }} />
        ) : entries.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="leaf-outline" size={48} color={C.sage} />
            <Text style={s.emptyText}>Aún no tienes registros</Text>
            <Text style={s.emptySubtext}>Empieza a registrar tu ciclo desde la pantalla principal</Text>
          </View>
        ) : (
          entries.map((entry, i) => {
            const phase = PHASES[entry.phase] || PHASES.menstruation;
            return (
              <View key={entry.id || i} style={s.card}>
                <View style={[s.cardLeft, { backgroundColor: phase.bg }]}>
                  <Ionicons name={phase.icon} size={22} color={phase.color} />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardDate}>{formatDate(entry.start_date)}</Text>
                  <Text style={[s.cardPhase, { color: phase.color }]}>{phase.label}</Text>
                  <View style={s.cardRow}>
                    <Ionicons name="pulse-outline" size={14} color={C.muted} />
                    <Text style={s.cardMeta}>Dolor: {entry.pain}/5</Text>
                    {entry.mood ? (
                      <>
                        <Text style={s.cardDot}>·</Text>
                        <Text style={s.cardMeta}>{entry.mood}</Text>
                      </>
                    ) : null}
                  </View>
                  {entry.symptoms?.length > 0 && (
                    <View style={s.chips}>
                      {entry.symptoms.map((sym: string) => (
                        <View key={sym} style={s.chip}>
                          <Text style={s.chipText}>{sym}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.forestDeep, paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: '300', letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 60 },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 18, color: C.charcoal, fontWeight: '300' },
  emptySubtext: { fontSize: 13, color: C.muted, textAlign: 'center', maxWidth: 260 },
  card: {
    flexDirection: 'row', backgroundColor: C.white, borderRadius: 16,
    marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { width: 56, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  cardDate: { fontSize: 12, color: C.muted },
  cardPhase: { fontSize: 15, fontWeight: '500' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardMeta: { fontSize: 12, color: C.muted },
  cardDot: { color: C.muted, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { backgroundColor: C.mintSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11, color: C.forest },
});
