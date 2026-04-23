import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

export default function RecordatoriosSaludScreen() {
  const router = useRouter();
  const [recordatorios, setRecordatorios] = useState([]);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleAdd = () => {
    if (!nuevoTexto.trim()) return;
    setRecordatorios([
      ...recordatorios,
      { texto: nuevoTexto, fecha: nuevaFecha, id: Date.now() }
    ]);
    setNuevoTexto('');
    setNuevaFecha(new Date());
  };

  const handleDelete = (id) => {
    setRecordatorios(recordatorios.filter(r => r.id !== id));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInDown.duration(600)} style={styles.card}>
        <View style={styles.headerRow}>
          <Ionicons name="alarm-outline" size={32} color={colorAccent} />
          <Text style={styles.title}>Recordatorios de Salud</Text>
        </View>
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Nuevo recordatorio</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Qué quieres recordar?"
            placeholderTextColor="#BBAA8A"
            value={nuevoTexto}
            onChangeText={setNuevoTexto}
            maxLength={60}
          />
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color={colorAccent} />
            <Text style={styles.dateBtnText}>{nuevaFecha.toLocaleString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={nuevaFecha}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) setNuevaFecha(date);
              }}
              minimumDate={new Date()}
            />
          )}
          <TouchableOpacity
            style={[styles.addBtn, !nuevoTexto.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!nuevoTexto.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={colorAccent} />
            <Text style={styles.addBtnText}>Guardar recordatorio</Text>
          </TouchableOpacity>
        </View>
        {recordatorios.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-circle-outline" size={50} color={colorAccent} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No tienes recordatorios activos.</Text>
            <Text style={styles.emptySubText}>Cuando añadas recordatorios de salud, aparecerán aquí para ayudarte a cuidar de ti.</Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            {recordatorios.map(r => (
              <View key={r.id} style={styles.reminderRow}>
                <Ionicons name="alarm" size={20} color={colorAccent} style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderText}>{r.texto}</Text>
                  <Text style={styles.reminderDate}>{new Date(r.fecha).toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(r.id)} style={styles.deleteBtn} accessibilityLabel="Eliminar recordatorio">
                  <Ionicons name="trash-outline" size={18} color="#B71C1C" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
      <TouchableOpacity
        style={[styles.backBtn, pressed && styles.backBtnPressed]}
        onPress={() => router.replace('/ajustes')}
        accessibilityLabel="Volver a ajustes"
        activeOpacity={0.7}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <Ionicons name="arrow-back" size={22} color={colorText} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: width * 0.9,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: colorAccent,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  title: { fontSize: 18, fontWeight: 'bold', color: colorText, letterSpacing: 2 },
  emptyState: { alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 16, color: colorText, fontWeight: 'bold', marginBottom: 6 },
  emptySubText: { fontSize: 13, color: colorText, fontWeight: '300', textAlign: 'center', maxWidth: 260 },
  formSection: {
    width: '100%',
    marginBottom: 18,
    backgroundColor: 'rgba(245,240,232,0.45)',
    borderRadius: 16,
    padding: 14,
    shadowColor: colorAccent,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 15,
    color: colorAccent,
    fontWeight: 'bold',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E6D5B8',
    borderRadius: 10,
    padding: 8,
    fontSize: 15,
    color: colorText,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  dateBtnText: {
    color: colorText,
    fontSize: 14,
    marginLeft: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorAccent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 2,
  },
  addBtnDisabled: {
    backgroundColor: '#E6D5B8',
    opacity: 0.6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  listSection: {
    width: '100%',
    marginTop: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0E8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: colorAccent,
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  reminderText: {
    fontSize: 15,
    color: colorText,
    fontWeight: 'bold',
  },
  reminderDate: {
    fontSize: 12,
    color: '#BBAA8A',
    marginTop: 2,
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.13)',
    shadowColor: colorAccent,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  backBtnPressed: {
    backgroundColor: '#F5F0E8',
    borderColor: colorAccent,
    shadowOpacity: 0.18,
  },
  backText: { color: colorText, fontSize: 15, fontWeight: 'bold', marginLeft: 2 },
});