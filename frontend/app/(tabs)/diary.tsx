import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';
import { getDiaryEntries, type DiaryEntry } from '../../src/services/api';

const C = {
  forest:'#4A664D', forestDim:'#3A5140', forestDeep:'#2C3D2E',
  moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  warm:'#E8E2D8', muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF', gold:'#C9A84C',
};

function getPainColor(v: number) {
  return v <= 3 ? '#7BAF7E' : v <= 6 ? '#D4A96A' : '#C07A5A';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function EntryCard({ entry, onPress }: { entry: DiaryEntry & any; onPress: () => void }) {
  const tags = [...(entry.cuerpo || []), ...(entry.mente || []), ...(entry.alma || [])].slice(0, 3);
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
        {entry.dolor > 0 && (
          <View style={[styles.painPill, { backgroundColor: getPainColor(entry.dolor) + '22' }]}>
            <View style={[styles.painDot, { backgroundColor: getPainColor(entry.dolor) }]} />
            <Text style={[styles.painPillText, { color: getPainColor(entry.dolor) }]}>
              {entry.dolor}/10
            </Text>
          </View>
        )}
      </View>
      {entry.texto ? (
        <Text style={styles.cardText} numberOfLines={3}>{entry.texto}</Text>
      ) : tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function DiaryList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId, userData } = useUserStore();
  const [exporting, setExporting] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const load = async (refresh = false) => {
    if (!deviceId) return;
    try {
      const data = await getDiaryEntries(deviceId, 30);
      setEntries(data);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { load(); }, [deviceId]);

  const exportPDF = async () => {
    if (Platform.OS !== 'web') return;
    setExporting(true);
    try {
      const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const name = userData?.name || '';

      const rows = entries.map((entry: any) => {
        const date = new Date(entry.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const tags = [...(entry.cuerpo || []), ...(entry.mente || []), ...(entry.alma || [])];
        const tagsHtml = tags.map((t: string) => `<span style="background:#EAF4E8;color:#4A664D;padding:2px 8px;border-radius:10px;font-size:11px;margin-right:4px">${t}</span>`).join('');
        const painColor = entry.dolor <= 3 ? '#7BAF7E' : entry.dolor <= 6 ? '#D4A96A' : '#C07A5A';
        return `<tr>
          <td style="padding:10px;color:#9A958E;font-size:12px;white-space:nowrap">${date}</td>
          <td style="padding:10px;text-align:center"><span style="background:${painColor}22;color:${painColor};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">${entry.dolor > 0 ? entry.dolor + '/10' : '—'}</span></td>
          <td style="padding:10px;font-size:12px;color:#3D3A35;font-style:italic">${entry.texto ? entry.texto.slice(0, 150) + (entry.texto.length > 150 ? '…' : '') : '—'}</td>
          <td style="padding:10px">${tagsHtml}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>Diario Ágora Mujeres</title>
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
          .no-print { display:block; }
          .footer { margin-top:40px; padding:16px 40px; border-top:1px solid #E8E2D8; font-size:10px; color:#C0C0C0; display:flex; justify-content:space-between; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
        </style>
      </head><body>
        <div class="header">
          <h1>Ágora Mujeres</h1>
          <p>Diario de bienestar y seguimiento del dolor</p>
          <div class="meta"><span>Generado el ${today}</span><span>${name}</span></div>
        </div>
        <div class="section">
          <h2>Entradas del diario</h2>
          ${entries.length === 0 ? '<p style="color:#9A958E;font-style:italic">Sin entradas.</p>' : `
          <table>
            <thead><tr><th>Fecha</th><th>Dolor</th><th>Nota</th><th>Etiquetas</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`}
        </div>
        <div class="no-print" style="text-align:center;padding:24px 0 8px">
          <button onclick="window.close()" style="background:#2C3D2E;color:white;border:none;padding:12px 32px;border-radius:24px;font-size:13px;letter-spacing:1px;cursor:pointer;font-family:Georgia,serif">← Volver</button>
        </div>
        <div class="footer"><span>Ágora Mujeres · Informe confidencial</span><span>${today}</span></div>
      </body></html>`;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => { win.print(); }, 800);
      }
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <LinearGradient
        colors={[C.forestDeep, C.forest]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.mint} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Mi Refugio</Text>
            <Text style={styles.headerTitle}>Diario de Alivio</Text>
          </View>
          <TouchableOpacity onPress={exportPDF} style={[styles.addBtn, { marginRight: 8 }]} disabled={exporting}>
            {exporting ? <ActivityIndicator size="small" color={C.white} /> : <Ionicons name="download-outline" size={20} color={C.white} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/diary/new')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={C.forest} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefresh(true); load(true); }}
              tintColor={C.forest}
            />
          }
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push(`/diary/${item.id}?entry=${encodeURIComponent(JSON.stringify(item))}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="book-outline" size={32} color={C.forest} />
              </View>
              <Text style={styles.emptyTitle}>Tu refugio espera</Text>
              <Text style={styles.emptyText}>Empieza registrando cómo te sientes hoy.</Text>
              <TouchableOpacity onPress={() => router.push('/diary/new')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Escribir ahora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  headerEyebrow: {
    color: C.sage, fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 4, opacity: 0.8,
  },
  headerTitle: {
    color: C.white, fontSize: 26, fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.3,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },

  list: { padding: 18, gap: 14 },

  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardDate: {
    fontSize: 12, color: C.moss, fontWeight: '600',
    textTransform: 'capitalize', flex: 1,
  },
  cardText: {
    fontSize: 14, color: C.charcoal, lineHeight: 24,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: C.mintSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  tagText: { fontSize: 12, color: C.moss, fontWeight: '500' },
  painPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  painDot: { width: 6, height: 6, borderRadius: 3 },
  painPillText: { fontSize: 11, fontWeight: '700' },

  empty: { marginTop: 80, alignItems: 'center', gap: 14, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '300', color: C.charcoal,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyText: { fontSize: 14, color: C.muted, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 4, backgroundColor: C.forest,
    borderRadius: 100, paddingVertical: 12, paddingHorizontal: 28,
  },
  emptyBtnText: { color: C.white, fontWeight: '600', fontSize: 14 },
});
