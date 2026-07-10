import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { useUserStore } from '../store/userStore';

interface Technique {
    key?: string;
    title: string;
    message: string;
    steps?: string[];
    mantras?: string[];
}

interface CrisisResponse {
    immediate: { title: string; message: string; options: string[] };
    technique: Technique;
    all_techniques: Technique[];
    emergency_contacts: Record<string, Record<string, string>>;
}

export default function CrisisScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ pain_level?: string; symptoms?: string }>();
    const token = useUserStore((state) => state.token);
    const user = useUserStore((state) => state.user);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [data, setData] = useState<CrisisResponse | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (!token || !user?.id) return;
        const fetchCrisisSupport = async () => {
            try {
                const painLevel = params.pain_level ? parseInt(params.pain_level, 10) : 5;
                const symptoms = params.symptoms ? params.symptoms.split(',').filter(Boolean) : [];
                const response = await api.post('/crisis', {
                    device_id: user.id,
                    language: 'es',
                    pain_level: painLevel,
                    symptoms,
                });
                setData(response.data);
            } catch (e) {
                console.error('Error al pedir apoyo de crisis:', e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchCrisisSupport();
    }, [token, user?.id]);

    // Guardia de rutas: <Redirect> en vez de router.replace() en useEffect,
    // igual que el resto de pantallas standalone (ver ciclo.tsx/glucosa.tsx/medical-report.tsx).
    if (!token) return <Redirect href="/login" />;

    const contactosEs = data?.emergency_contacts?.es;

    return (
        <View style={s.container}>
            <LinearGradient colors={['#FBF3F1', '#F2E4E0']} style={StyleSheet.absoluteFill} />

            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="arrow-back" size={24} color="#5C3A1E" />
                </TouchableOpacity>
                <Text style={s.title}>APOYO INMEDIATO</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#9B5A5A" />
                    <Text style={s.loadingText}>Estamos contigo, un momento…</Text>
                </View>
            ) : error || !data ? (
                <View style={s.center}>
                    <Text style={s.errorText}>No pudimos cargar la técnica ahora mismo, pero no estás sola.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.scroll}>
                    <View style={s.immediateCard}>
                        <Ionicons name="heart" size={22} color="#9B5A5A" style={{ marginBottom: 8 }} />
                        <Text style={s.immediateTitle}>{data.immediate.title}</Text>
                        <Text style={s.immediateMessage}>{data.immediate.message}</Text>
                    </View>

                    <View style={s.techniqueCard}>
                        <Text style={s.techniqueTitle}>{data.technique.title}</Text>
                        <Text style={s.techniqueMessage}>{data.technique.message}</Text>
                        {data.technique.steps?.map((step, i) => (
                            <View key={i} style={s.stepRow}>
                                <Text style={s.stepNumber}>{i + 1}</Text>
                                <Text style={s.stepText}>{step}</Text>
                            </View>
                        ))}
                        {data.technique.mantras?.map((mantra, i) => (
                            <Text key={i} style={s.mantra}>“{mantra}”</Text>
                        ))}
                    </View>

                    <TouchableOpacity style={s.toggleBtn} onPress={() => setShowAll(v => !v)} activeOpacity={0.8}>
                        <Text style={s.toggleBtnText}>{showAll ? 'Ocultar otras técnicas' : 'Ver otras técnicas'}</Text>
                        <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={14} color="#9B5A5A" />
                    </TouchableOpacity>

                    {showAll && data.all_techniques
                        .filter(t => t.title !== data.technique.title)
                        .map((t, idx) => (
                            <View key={idx} style={[s.techniqueCard, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                                <Text style={s.techniqueTitle}>{t.title}</Text>
                                <Text style={s.techniqueMessage}>{t.message}</Text>
                                {t.steps?.map((step, i) => (
                                    <View key={i} style={s.stepRow}>
                                        <Text style={s.stepNumber}>{i + 1}</Text>
                                        <Text style={s.stepText}>{step}</Text>
                                    </View>
                                ))}
                                {t.mantras?.map((mantra, i) => (
                                    <Text key={i} style={s.mantra}>“{mantra}”</Text>
                                ))}
                            </View>
                        ))}

                    {contactosEs && (
                        <View style={s.emergencyCard}>
                            <Text style={s.emergencyTitle}>Si necesitas ayuda profesional ahora</Text>
                            <TouchableOpacity
                                style={s.emergencyBtn}
                                onPress={() => Linking.openURL('tel:024')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="call" size={16} color="white" />
                                <Text style={s.emergencyBtnText}>{contactosEs.spain}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.emergencyBtn, { backgroundColor: '#5C3A1E' }]}
                                onPress={() => Linking.openURL('tel:112')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="alert-circle" size={16} color="white" />
                                <Text style={s.emergencyBtnText}>{contactosEs.general}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
    title: { fontSize: 14, fontWeight: '600', color: '#5C3A1E', letterSpacing: 2 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    loadingText: { marginTop: 14, color: '#8B5A2B', fontSize: 13 },
    errorText: { color: '#8B5A2B', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    scroll: { padding: 20, paddingBottom: 60 },
    immediateCard: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, padding: 20, marginBottom: 16, alignItems: 'center' },
    immediateTitle: { fontSize: 15, fontWeight: '700', color: '#9B5A5A', marginBottom: 8, textAlign: 'center' },
    immediateMessage: { fontSize: 13, color: '#5C3A1E', textAlign: 'center', lineHeight: 20 },
    techniqueCard: { backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    techniqueTitle: { fontSize: 14, fontWeight: '700', color: '#5C3A1E', marginBottom: 6 },
    techniqueMessage: { fontSize: 12, color: '#8B5A2B', marginBottom: 12, lineHeight: 18 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    stepNumber: { fontSize: 12, fontWeight: '700', color: '#9B5A5A', width: 20 },
    stepText: { fontSize: 13, color: '#5C3A1E', flex: 1, lineHeight: 19 },
    mantra: { fontSize: 13, fontStyle: 'italic', color: '#5C3A1E', marginBottom: 8, lineHeight: 19 },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginBottom: 8 },
    toggleBtnText: { fontSize: 12, fontWeight: '600', color: '#9B5A5A' },
    emergencyCard: { backgroundColor: 'rgba(155,90,90,0.08)', borderRadius: 16, padding: 18, marginTop: 8 },
    emergencyTitle: { fontSize: 12, fontWeight: '600', color: '#5C3A1E', marginBottom: 12, textAlign: 'center' },
    emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#9B5A5A', borderRadius: 12, paddingVertical: 12, marginBottom: 10 },
    emergencyBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
});
