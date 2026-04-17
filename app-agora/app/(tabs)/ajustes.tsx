import React from 'react';
import { useUserStore } from '../../store/userStore';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { removeToken } from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AjustesScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clearSession = useUserStore((state) => state.clearSession);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás segura de que quieres cerrar sesión? Se eliminarán todos los datos locales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            // Borra todo SecureStore (token y posibles datos futuros)
            await SecureStore.deleteItemAsync('session_token');
            await removeToken();
            await clearSession();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>MIS DATOS</Text>

        {/* PERFIL RESUMEN */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#8B5A2B" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Nombre no disponible'}</Text>
          <Text style={styles.userType}>{user?.plan ? `Plan ${user.plan}` : 'Sin plan activo'}</Text>
        </View>

        {/* SECCIONES DE AJUSTES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>
          
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="finger-print-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Identificación y Biometría</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="medkit-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Historial Clínico</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SANTUARIO</Text>
          
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Recordatorios de Salud</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/politica-privacidad')}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Política de Privacidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 100 },
  headerTitle: { fontSize: 18, fontWeight: '200', letterSpacing: 5, color: '#8B5A2B', textAlign: 'center', marginBottom: 30 },
  
  profileCard: { alignItems: 'center', marginBottom: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'white' },
  userName: { fontSize: 20, fontWeight: '300', color: '#8B5A2B' },
  userType: { fontSize: 12, color: '#C5A059', fontWeight: 'bold', letterSpacing: 1, marginTop: 5 },

  section: { marginBottom: 30 },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#8B5A2B', opacity: 0.5, letterSpacing: 2, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', padding: 18, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: 'white' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 15, color: '#8B5A2B', fontWeight: '300' },

  logoutBtn: { marginTop: 20, alignItems: 'center', padding: 20 },
  logoutText: { color: '#8B5A2B', opacity: 0.5, fontSize: 14, fontWeight: '300', textDecorationLine: 'underline' }
});