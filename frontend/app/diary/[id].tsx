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
};

function getPainColor(v: number) {
    return v <= 3 ? '#7BAF7E' : v <= 6 ? '#D4A96A' : '#C07A5A';
}

function getPainEmoji(v: number) {
    return v === 0 ? '😌' : v <= 2 ? '🌿' : v <= 4 ? '😐' : v <= 6 ? '😔' : v <= 8 ? '😣' : '💙';
}

function formatDateLong(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function TagGroup({ label, emoji, tags, accent }: { label: string; emoji: string; tags: string[]; accent: string }) {
    if (!tags || tags.length === 0) return null;
    return (
        <View style={styles.tagGroup}>
            <View style={styles.tagGroupHead}>
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
                <Text style={styles.tagGroupLabel}>{label}</Text>
            </View>
            <View style={styles.tagsRow}>
                {tags.map(tag => (
                    <View key={tag} style={[styles.tag, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                        <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function DiaryEntryDetail() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { entry: entryRaw } = useLocalSearchParams<{ entry: string }>();

    const entry = entryRaw ? JSON.parse(entryRaw) : null;

    if (!entry) {
        return (
            <View style={{ flex: 1, backgroundColor: T.cream, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: T.muted }}>No se pudo cargar la entrada.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: T.forest }}>← Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const painColor = getPainColor(entry.dolor);

    return (
        <View style={{ flex: 1, backgroundColor: T.cream }}>
            {/* Header */}
            <LinearGradient
                colors={[T.forestDim, T.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={T.mint} />
                    <Text style={styles.backText}>Mi Diario</Text>
                </TouchableOpacity>
                <Text style={styles.headerDate}>{formatDateLong(entry.created_at)}</Text>
                <Text style={styles.headerTime}>{formatTime(entry.created_at)}</Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Dolor */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Nivel de dolor</Text>
                    <View style={styles.painRow}>
                        <Text style={{ fontSize: 36 }}>{getPainEmoji(entry.dolor)}</Text>
                        <View style={[styles.painBadge, { backgroundColor: painColor + '18' }]}>
                            <Text style={[styles.painNumber, { color: painColor }]}>{entry.dolor}</Text>
                            <Text style={[styles.painOf, { color: painColor }]}>/10</Text>
                        </View>
                        <View style={styles.painBar}>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                                <View key={v} style={[
                                    styles.painBarDot,
                                    { backgroundColor: v <= entry.dolor ? painColor : T.warmGray }
                                ]} />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Tags por categoría */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Cómo lo viviste</Text>
                    <TagGroup label="Mi cuerpo sentía…" emoji="🌿" tags={entry.cuerpo || []} accent="#6B8F6E" />
                    <TagGroup label="Mi mente estaba…" emoji="🌫️" tags={entry.mente || []} accent="#8E9BAD" />
                    <TagGroup label="Mi alma sentía…" emoji="🕊️" tags={entry.alma || []} accent="#B09BB0" />
                    <TagGroup label="Solté…" emoji="🍃" tags={entry.suelto || []} accent="#A8B89A" />
                </View>

                {/* Texto libre */}
                {entry.texto ? (
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Lo que el cuerpo calló</Text>
                        <Text style={styles.entryText}>{entry.texto}</Text>
                    </View>
                ) : null}

                {/* Footer */}
                <Text style={styles.footer}>Registrado con amor 🌿</Text>
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
    cardLabel: { fontSize: 11, fontWeight: '700', color: T.muted, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 16 },

    painRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    painBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
    painNumber: { fontSize: 32, fontWeight: '800' },
    painOf: { fontSize: 14, fontWeight: '600' },
    painBar: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
    painBarDot: { width: 10, height: 10, borderRadius: 5 },

    tagGroup: { marginBottom: 16 },
    tagGroupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    tagGroupLabel: { fontSize: 13, fontWeight: '600', color: T.charcoal },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: { borderRadius: 100, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
    tagText: { fontSize: 12, fontWeight: '500' },

    entryText: { fontSize: 15, color: T.charcoal, lineHeight: 24, fontStyle: 'italic' },
    footer: { textAlign: 'center', color: T.warmGray, fontSize: 12, fontStyle: 'italic', marginTop: 8 },
});