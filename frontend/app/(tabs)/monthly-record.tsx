import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getMonthlyRecord, saveMonthlyRecord } from '../../src/services/api';

interface PainRecord {
  date: string;
  intensity: number;
  notes?: string;
}

const DAYS_IN_CYCLE = 28;
const screenWidth = Dimensions.get('window').width;

const createThemeColors = (isDark: boolean) => ({
  mossGreen: isDark ? '#6B8476' : '#7A9B82',
  mossGreenDark: isDark ? '#4A5E54' : '#5A7A63',
  mossGreenLight: isDark ? '#8FA799' : '#A3B8AB',
  cream: isDark ? '#2A2A2A' : '#FDFBF9',
  text: isDark ? '#E8E8E8' : '#3D3D3D',
  lightText: isDark ? '#A8A8A8' : '#8B8B8B',
  accentWarm: isDark ? '#C99563' : '#D4A574',
  accentSoft: isDark ? '#3E3B38' : '#E8D5C4',
  background: isDark ? '#1A1A1A' : '#F5F3F0',
  border: isDark ? '#3D3D3D' : '#E0DCD8',
});

export default function MonthlyRecordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = createThemeColors(isDark);
  const router = useRouter();

  const { deviceId, language } = useStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PainRecord[]>([]);
  const [cycleStartDate, setCycleStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDayIntensity, setSelectedDayIntensity] = useState<number | null>(null);
  const [selectedDayNotes, setSelectedDayNotes] = useState<string>('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  useEffect(() => {
    loadMonthlyRecord();
  }, [deviceId]);

  const loadMonthlyRecord = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const record = await getMonthlyRecord(deviceId);
      
      if (record) {
        setRecords(record.records);
        setCycleStartDate(record.cycle_start_date);
      } else {
        // Initialize empty records for the cycle
        setRecords(initializeRecords());
      }
    } catch (error) {
      console.error('Error loading monthly record:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo cargar el registro mensal'
          : 'Failed to load monthly record'
      );
    } finally {
      setLoading(false);
    }
  };

  const initializeRecords = (): PainRecord[] => {
    const today = new Date();
    const records: PainRecord[] = [];
    
    for (let i = 0; i < DAYS_IN_CYCLE; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (today.getDate() - 1 - i));
      records.push({
        date: date.toISOString().split('T')[0],
        intensity: 0,
      });
    }
    
    return records;
  };

  const handleDayPress = (index: number) => {
    setSelectedDayIndex(index);
    const record = records[index];
    setSelectedDayIntensity(record.intensity);
    setSelectedDayNotes(record.notes || '');
  };

  const handleIntensityChange = (intensity: number) => {
    setSelectedDayIntensity(intensity);
  };

  const saveDayRecord = async () => {
    if (selectedDayIndex === null || !deviceId) return;

    const newRecords = [...records];
    newRecords[selectedDayIndex] = {
      ...newRecords[selectedDayIndex],
      intensity: selectedDayIntensity || 0,
      notes: selectedDayNotes || undefined,
    };

    setRecords(newRecords);

    try {
      await saveMonthlyRecord(deviceId, {
        records: newRecords,
        cycle_start_date: cycleStartDate,
      });

      Alert.alert(
        language === 'es' ? '✓ Guardado' : '✓ Saved',
        language === 'es'
          ? 'Registro guardado correctamente'
          : 'Record saved successfully'
      );

      setSelectedDayIndex(null);
      setSelectedDayIntensity(null);
      setSelectedDayNotes('');
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo guardar el registro'
          : 'Failed to save record'
      );
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return themeColors.border;
    if (intensity <= 3) return '#90EE90'; // Light green
    if (intensity <= 6) return '#FFD700'; // Gold
    return '#FF6B6B'; // Red
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.mossGreen} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {language === 'es' ? '📅 Registro Mensual' : '📅 Monthly Record'}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.lightText }]}>
          {language === 'es'
            ? 'Intensidad de dolor durante el ciclo'
            : 'Pain intensity during cycle'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {records.map((record, index) => {
            const dayDate = new Date(record.date);
            const dayOfWeek = dayDate.toLocaleDateString('es', { weekday: 'short' });
            const dayOfMonth = dayDate.getDate();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: getIntensityColor(record.intensity),
                    borderColor: selectedDayIndex === index ? themeColors.mossGreen : themeColors.border,
                    borderWidth: selectedDayIndex === index ? 2 : 1,
                  },
                ]}
                onPress={() => handleDayPress(index)}
              >
                <Text style={[styles.dayNumber, { color: themeColors.text }]}>
                  {dayOfMonth}
                </Text>
                <Text style={[styles.dayLabel, { color: themeColors.lightText }]}>
                  {dayOfWeek}
                </Text>
                {record.intensity > 0 && (
                  <Text style={[styles.intensity, { color: themeColors.text }]}>
                    {record.intensity}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Details */}
        {selectedDayIndex !== null && (
          <View style={[styles.detailsCard, { backgroundColor: themeColors.cream, borderColor: themeColors.border }]}>
            <Text style={[styles.detailsTitle, { color: themeColors.text }]}>
              {language === 'es' ? 'Detalles del Día' : 'Day Details'}
            </Text>

            {/* Intensity Slider */}
            <View style={styles.intensitySection}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                {language === 'es' ? 'Intensidad del Dolor' : 'Pain Intensity'}
              </Text>
              <View style={styles.intensitySlider}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.intensityButton,
                      {
                        backgroundColor:
                          selectedDayIntensity === num
                            ? themeColors.mossGreen
                            : themeColors.border,
                      },
                    ]}
                    onPress={() => handleIntensityChange(num)}
                  >
                    <Text
                      style={[
                        styles.intensityButtonText,
                        {
                          color:
                            selectedDayIntensity === num
                              ? themeColors.cream
                              : themeColors.text,
                        },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                {language === 'es' ? 'Notas (opcional)' : 'Notes (optional)'}
              </Text>
              {/* Simple text display - notes would require TextInput component in production */}
              <Text style={[styles.noteText, { color: themeColors.lightText }]}>
                {selectedDayNotes || (language === 'es' ? 'Sin notas aún' : 'No notes yet')}
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: themeColors.mossGreen }]}
              onPress={saveDayRecord}
            >
              <Text style={[styles.saveButtonText, { color: themeColors.cream }]}>
                {language === 'es' ? 'Guardar' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={[styles.legendTitle, { color: themeColors.text }]}>
            {language === 'es' ? 'Escala' : 'Scale'}
          </Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: themeColors.border }]} />
              <Text style={[styles.legendText, { color: themeColors.text }]}>
                {language === 'es' ? 'Sin registro' : 'No record'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#90EE90' }]} />
              <Text style={[styles.legendText, { color: themeColors.text }]}>
                {language === 'es' ? 'Leve (1-3)' : 'Mild (1-3)'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FFD700' }]} />
              <Text style={[styles.legendText, { color: themeColors.text }]}>
                {language === 'es' ? 'Moderado (4-6)' : 'Moderate (4-6)'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
              <Text style={[styles.legendText, { color: themeColors.text }]}>
                {language === 'es' ? 'Severo (7-10)' : 'Severe (7-10)'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
  },
  content: {
    padding: spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dayCell: {
    width: (screenWidth - spacing.md * 2 - spacing.sm * 6) / 7,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  intensity: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  detailsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  intensitySection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  intensitySlider: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  intensityButton: {
    width: (screenWidth - spacing.md * 2 - spacing.xs * 10) / 11,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonText: {
    fontWeight: '600',
    fontSize: typography.sizes.sm,
  },
  notesSection: {
    marginBottom: spacing.lg,
  },
  noteText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: typography.sizes.md,
  },
  legend: {
    marginBottom: spacing.lg,
  },
  legendTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  legendItems: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
  },
  legendText: {
    fontSize: typography.sizes.sm,
  },
});
