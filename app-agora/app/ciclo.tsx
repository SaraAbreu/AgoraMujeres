import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, 
  Switch, ScrollView, ActivityIndicator, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useUserStore } from '../store/userStore';
import { useRouter, Redirect } from 'expo-router';
import api from '../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Configuración de idioma para el calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const colorText = '#5C3A1E';
const colorAccent = '#C5A059';
const colorSoft = '#8B5A2B';
const colorMuted = 'rgba(92,58,30,0.4)';

export default function CicloScreen() {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const { setLastCiclo, setHasCicloData } = useUserStore();

  // ESTADOS
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [duracion, setDuracion] = useState('28');
  const [flujo, setFlujo] = useState('Medio');
  const [menopausia, setMenopausia] = useState(false);
  const [loading, setLoading] = useState(false);

  // Guardia de rutas: sin sesión iniciada no se puede ver esta pantalla.
  // <Redirect> en vez de router.replace() en useEffect: en cargas directas
  // (deep link / refresh) el Root Layout aún no ha montado y router.replace()
  // falla silenciosamente ("Attempted to navigate before mounting...").
  if (!token) return <Redirect href="/login" />;

  const goHome = () => router.replace('/(tabs)/home');

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ciclo', {
        inicio: menopausia ? null : new Date(selectedDate).toISOString(),
        duracion: menopausia ? 0 : parseInt(duracion),
        flujo: menopausia ? 'Ninguno' : flujo,
        menopausia: menopausia,
      });

      if (response.data.status === 'success') {
        const statsRes = await api.get('/user/stats');
        if (statsRes.data) {
          setLastCiclo(statsRes.data.ciclo);
          setHasCicloData(true); 
        }
        Alert.alert('Éxito', 'Datos guardados correctamente', [{ text: 'OK', onPress: goHome }]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo sincronizar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FBF8F4', '#F2EBE0', '#E8D9C4']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goHome} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colorSoft} />
          </TouchableOpacity>
          <Text style={styles.title}>TU ESTADO HORMONAL</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.glassCard}>
          
          {/* BOTÓN MENOPAUSIA */}
          <View style={styles.menopausiaRow}>
            <View>
              <Text style={styles.switchLabel}>¿Estás en la menopausia?</Text>
              <Text style={styles.switchSub}>Desactiva el seguimiento de ciclo</Text>
            </View>
            <Switch 
              value={menopausia} 
              onValueChange={setMenopausia}
              trackColor={{ false: '#D1C4B1', true: colorAccent }}
              thumbColor="white"
            />
          </View>

          {!menopausia && (
            <View>
              {/* CALENDARIO */}
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="calendar-heart" size={18} color={colorAccent} />
                <Text style={styles.label}>Inicio del último periodo</Text>
              </View>
              <View style={styles.calendarWrapper}>
                <Calendar
                  current={selectedDate}
                  onDayPress={(day: { dateString: React.SetStateAction<string>; }) => setSelectedDate(day.dateString)}
                  maxDate={new Date().toISOString().split('T')[0]}
                  markedDates={{ [selectedDate]: { selected: true, selectedColor: colorAccent } }}
                  theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: colorSoft,
                    selectedDayBackgroundColor: colorAccent,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colorAccent,
                    dayTextColor: colorText,
                  }}
                />
              </View>

              {/* FLUJO */}
              <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                <MaterialCommunityIcons name="water" size={18} color={colorAccent} />
                <Text style={styles.label}>Intensidad del flujo</Text>
              </View>
              <View style={styles.flujoContainer}>
                {['Leve', 'Medio', 'Fuerte'].map((f) => (
                  <TouchableOpacity 
                    key={f}
                    style={[styles.flujoChip, flujo === f && styles.flujoChipActive]}
                    onPress={() => setFlujo(f)}
                  >
                    <Text style={[styles.flujoText, flujo === f && styles.flujoTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={[colorSoft, colorAccent]} style={styles.saveBtnInner}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>GUARDAR Y VOLVER</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 11, fontWeight: '700', color: colorText, letterSpacing: 2 },
  
  glassCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: 'white' },
  
  menopausiaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 20, 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(0,0,0,0.05)' 
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: colorText },
  switchSub: { fontSize: 11, color: colorMuted },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 10, fontWeight: '800', color: colorMuted, textTransform: 'uppercase' },
  
  calendarWrapper: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 20, overflow: 'hidden' },

  flujoContainer: { flexDirection: 'row', gap: 10 },
  flujoChip: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 15, backgroundColor: 'white', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  flujoChipActive: { backgroundColor: colorAccent, borderColor: colorAccent },
  flujoText: { fontSize: 11, color: colorSoft, fontWeight: '600' },
  flujoTextActive: { color: 'white' },

  saveBtn: { marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  saveBtnInner: { paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
});