import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { useUserStore } from '../store/userStore';

export default function MedicalReportScreen() {
    const router = useRouter();
    const token = useUserStore((state) => state.token);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        const fetchReport = async () => {
            try {
                const response = await api.get('/user/medical-report');
                setReportData(response.data);
            } catch (error) {
                console.error("Error cargando reporte:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    // Guardia de rutas: sin sesión iniciada no se puede ver esta pantalla.
    // <Redirect> en vez de router.replace() en useEffect: en cargas directas
    // (deep link / refresh) el Root Layout aún no ha montado y router.replace()
    // falla silenciosamente ("Attempted to navigate before mounting...").
    if (!token) return <Redirect href="/login" />;

    return (
        <View style={s.container}>
            <LinearGradient colors={['#FBF8F4', '#F2EBE0']} style={StyleSheet.absoluteFill} />
            
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#5C3A1E" />
                </TouchableOpacity>
                <Text style={s.title}>REPORTE MÉDICO</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#C5A059" style={{ flex: 1 }} />
            ) : (
                <ScrollView contentContainerStyle={s.scroll}>
                    {reportData.map((item, index) => (
                        <View key={index} style={s.card}>
                            <View style={s.cardHeader}>
                                <Text style={s.type}>{item.tipo}</Text>
                                <Text style={s.date}>{new Date(item.fecha).toLocaleDateString()}</Text>
                            </View>
                            <Text style={s.value}>{item.valor}</Text>
                            <Text style={s.info}>{item.info}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 16, fontWeight: '600', color: '#5C3A1E', letterSpacing: 2 },
    scroll: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    type: { fontWeight: '700', color: '#C5A059', fontSize: 12 },
    date: { color: '#8B5A2B', fontSize: 11 },
    value: { fontSize: 18, fontWeight: '300', color: '#5C3A1E', marginBottom: 5 },
    info: { fontSize: 12, color: '#8B5A2B', opacity: 0.7 }
});