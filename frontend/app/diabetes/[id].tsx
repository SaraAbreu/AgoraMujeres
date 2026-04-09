import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const T = {
    forest: '#4A664D', forestDim: '#3A5140', moss: '#6B8F6E', sage: '#A8C5A0',
    mint: '#D4E8D0', mintSoft: '#EAF4E8', cream: '#F8F7F2', parchment: '#F0EDE4',
    muted: '#9A958E', charcoal: '#3D3A35', white: '#FFFFFF', warmGray: '#C8C3B8',
    gold: '#C9A84C',
};

const MOMENT_LABELS: Record<string, string> = {
    fasting: 'Ayunas',
    before_meal: 'Antes de comer',
    after_meal: 'Después de comer',
    night: 'Noche',
    other: 'Otro momento',
};

function getGlucoseColor(v: number) {
    if (v < 70) return '#C07A5A';
    if (v <= 100) return '#7BAF7E';
    if (v <= 140) return '#D4A96A';
    return '#C07A5A';
}

function getGlucoseLabel(v: number) {
    if (v < 70) return 'Hipoglucemia';
    if (v <= 100) return 'Normal';
    if (v <= 140) return 'Elevada';
    return 'Alta';
}

function formatDateLong(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function DiabetesEntryDetail() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { entry: entryRaw } = useLocalSearchParams<{ entry: string }>();

    const entry = entryRaw ? JSON.parse(entryRaw) : null;

    const handleDownload = async () => {
        if (typeof window === 'undefined') return;
        try {
            const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            const payload = {
                name: '',
                today,
                entries: [{
                    date: new Date(entry.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    glucose: entry.glucose,
                    moment: MOMENT_LABELS[entry.moment] || entry.moment,
                    medication: entry.medication || '',
                    symptoms: entry.symptoms || [],
                    notes: entry.notes || '',
                }],
            };
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/export/diabetes-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Error');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'agora-diabetes.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            window.alert('Error generando el PDF.');
        }
    };

    if (!entry) {
        return (
            <View style={{ flex: 1, backgroundColor: T.cream, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: T.muted }}>No se pudo cargar el registro.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: T.forest }}>← Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const glucoseColor = getGlucoseColor(entry.glucose);
    const glucoseLabel = getGlucoseLabel(entry.glucose);

    return (
        <View style={{ flex: 1, backgroundColor: T.cream }}>
            <LinearGradient
                colors={[T.forestDim, T.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={T.mint} />
                        <Text style={styles.backText}>Glucosa y Diabetes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDownload} style={styles.downloadBtn}>
                        <Ionicons name="download-outline" size={20} color={T.mint} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerDate}>{formatDateLong(entry.created_at)}</Text>
                <Text style={styles.headerTime}>{formatTime(entry.created_at)}</Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Glucosa */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Nivel de glucosa</Text>
                    <View style={styles.glucoseRow}>
                        <View style={[styles.glucoseBadge, { backgroundColor: glucoseColor + '18' }]}>
                            <Text style={[styles.glucoseNumber, { color: glucoseColor }]}>{entry.glucose}</Text>
                            <Text style={[styles.glucoseUnit, { color: glucoseColor }]}>mg/dL</Text>
                        </View>
                        <View style={[styles.glucoseLabelBox, { backgroundColor: glucoseColor + '18', borderColor: glucoseColor + '40' }]}>
                            <View style={[styles.glucoseDot, { backgroundColor: glucoseColor }]} />
                            <Text style={[styles.glucoseLabelText, { color: glucoseColor }]}>{glucoseLabel}</Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={14} color={T.muted} />
                        <Text style={styles.metaText}>{MOMENT_LABELS[entry.moment] || entry.moment}</Text>
                    </View>
                </View>

                {/* Medicación */}
                {entry.medication ? (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Medicación</Text>
                        <View style={styles.medicationRow}>
                            <Ionicons name="medical-outline" size={18} color="#5B8DB8" />
                            <Text style={styles.medicationText}>{entry.medication}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Síntomas */}
                {entry.symptoms?.length > 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Síntomas</Text>
                        <View style={styles.tagsRow}>
                            {entry.symptoms.map((s: string) => (
                                <View key={s} style={[styles.tag, { backgroundColor: '#C07A5A22', borderColor: '#C07A5A44' }]}>
                                    <Text style={[styles.tagText, { color: '#C07A5A' }]}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Notas */}
                {entry.notes ? (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Notas</Text>
                        <Text style={styles.notesText}>{entry.notes}</Text>
                    </View>
                ) : null}

                <Text style={styles.footer}>Registrado con cuidado 🌿</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: 24, paddingBottom: 28 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    backText: { color: T.mint, fontSize: 14, fontWeight: '500' },
    headerDate: { color: T.white, fontSize: 20, fontWeight: '700', textTransform: 'capitalize', marginBottom: 4 },
    headerTime: { color: T.sage, fontSize: 13, fontStyle: 'italic' },

    scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },

    card: {
        backgroundColor: T.white, borderRadius: 20, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    cardLabel: { fontSize: 11, fontWeight: '700', color: T.muted, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 14 },

    glucoseRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    glucoseBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
    glucoseNumber: { fontSize: 40, fontWeight: '300' },
    glucoseUnit: { fontSize: 14, fontWeight: '500', marginTop: 8 },
    glucoseLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    glucoseDot: { width: 7, height: 7, borderRadius: 4 },
    glucoseLabelText: { fontSize: 14, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: T.muted },

    medicationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    medicationText: { fontSize: 15, color: T.charcoal, fontWeight: '500' },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: { borderRadius: 100, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
    tagText: { fontSize: 12, fontWeight: '500' },

    notesText: { fontSize: 15, color: T.charcoal, lineHeight: 24, fontStyle: 'italic',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    footer: { textAlign: 'center', color: T.warmGray, fontSize: 12, fontStyle: 'italic', marginTop: 8 },
    downloadBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
});
