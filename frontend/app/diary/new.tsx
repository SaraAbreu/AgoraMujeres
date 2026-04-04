/**
 * diary/new.tsx — Registro de entrada en el diario de Ágora
 * FIXES:
 *  - Usa createDiaryEntry() de api.ts en lugar de fetch('/api/diary')
 *  - Campos correctos: dolor (no nivel_dolor), texto (no nota), device_id obligatorio
 *  - Maneja el token/auth correctamente desde el store
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Animated, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import { createDiaryEntry } from '../../src/services/api';

const { width } = Dimensions.get('window');

const C = {
  forest:'#4A664D', forestDim:'#3A5140', moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  warmGray:'#C8C3B8', charcoal:'#3D3A35', textMuted:'#7A7570', white:'#FFFFFF',
};

const OPTIONS = {
  cuerpo: ['Pinchazos','Ardor','Electricidad','Cuerpo de plomo','Rigidez','Latidos','Tensión','Adormecimiento'],
  mente:  ['Nublada','Saturada','En pausa','Modo supervivencia','Desconectada','Inquieta','Agotada','Presente'],
  alma:   ['Invisibilidad','Cansancio de ser fuerte','Pequeña','Un hilo de esperanza','Orgullo de seguir','Gratitud','Soledad'],
  suelto: ['La culpa','La exigencia','El miedo a fallar','La presión de estar bien','Las expectativas','El control'],
};

const META = {
  cuerpo: { label:'Mi cuerpo siente…', emoji:'🌿', accent:'#6B8F6E' },
  mente:  { label:'Mi mente está…',    emoji:'🌫️', accent:'#8E9BAD' },
  alma:   { label:'Mi alma siente…',   emoji:'🕊️', accent:'#B09BB0' },
  suelto: { label:'Hoy suelto…',       emoji:'🍃', accent:'#A8B89A' },
};

function Chip({ label, selected, onPress, accent }: any) {
  const sc = useRef(new Animated.Value(1)).current;
  const bg = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(bg, { toValue:selected?1:0, duration:160, useNativeDriver:false }).start();
  }, [selected]);
  return (
    <Animated.View style={{ transform:[{scale:sc}] }}>
      <TouchableOpacity
        onPress={() => {
          Animated.sequence([
            Animated.timing(sc,{toValue:0.92,duration:70,useNativeDriver:true}),
            Animated.spring(sc,{toValue:1,friction:4,useNativeDriver:true}),
          ]).start();
          onPress();
        }}
        activeOpacity={0.85}
      >
        <Animated.View style={[styles.chip, {
          borderColor: selected ? accent : C.warmGray,
          backgroundColor: bg.interpolate({inputRange:[0,1], outputRange:[C.cream, accent+'22']}) as any,
        }]}>
          <Text style={[styles.chipText, selected && {color:accent, fontWeight:'600'}]}>{label}</Text>
          {selected && <View style={[styles.chipDot, {backgroundColor:accent}]} />}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PainSelector({ value, onChange }: { value:number; onChange:(v:number)=>void }) {
  const getColor = (v:number) => v<=2?'#7BAF7E':v<=4?'#A8C07A':v<=6?'#D4A96A':v<=8?'#C07A5A':'#A85050';
  const getEmoji = (v:number) => v===0?'😌':v<=2?'🌿':v<=4?'😐':v<=6?'😔':v<=8?'😣':'💙';

  return (
    <View style={styles.painWrap}>
      <View style={styles.painTop}>
        <Text style={{fontSize:36}}>{getEmoji(value)}</Text>
        <View>
          <Text style={[styles.painBig, {color:getColor(value)}]}>{value}</Text>
          <Text style={styles.painOf}>/ 10</Text>
        </View>
      </View>
      <View style={styles.painNodes}>
        {[0,1,2,3,4,5,6,7,8,9,10].map(v => {
          const active = v <= value;
          const sel    = v === value;
          return (
            <TouchableOpacity key={v} onPress={() => onChange(v)} activeOpacity={0.7}>
              <View style={[
                styles.painNode,
                active && {backgroundColor:getColor(value), borderColor:getColor(value)},
                sel && styles.painNodeSel,
              ]}>
                <Text style={[styles.painNodeNum, active && {color:C.white}]}>{v}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between'}}>
        <Text style={styles.painScale}>Sin dolor</Text>
        <Text style={styles.painScale}>Muy intenso</Text>
      </View>
    </View>
  );
}

export default function NewDiaryEntry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId, incrementarContador } = useUserStore();

  const [dolor, setDolor]     = useState(5);
  const [sel, setSel]         = useState<Record<string,string[]>>({ cuerpo:[], mente:[], alma:[], suelto:[] });
  const [texto, setTexto]     = useState('');
  const [saving, setSaving]   = useState(false);

  const toggleTag = (key: string, tag: string) => {
    setSel(prev => ({
      ...prev,
      [key]: prev[key].includes(tag)
        ? prev[key].filter(t => t !== tag)
        : [...prev[key], tag],
    }));
  };

  const handleSave = async () => {
    if (!deviceId) {
      Alert.alert('Sin conexión', 'No se pudo identificar tu dispositivo. Intenta reiniciar la app.');
      return;
    }

    setSaving(true);
    try {
      // ✅ Payload exacto que espera el backend (models.py → DiaryEntryCreate)
      await createDiaryEntry({
        device_id: deviceId,
        texto:     texto.trim(),
        dolor,
        cuerpo:    sel.cuerpo,
        mente:     sel.mente,
        alma:      sel.alma,
        suelto:    sel.suelto,
      });

      incrementarContador();
      Alert.alert('💚 Guardado', 'Tu entrada ha sido registrada con cariño.', [
        { text: 'Volver al refugio', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Algo salió mal', err.message || 'Por favor, inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const totalSel = Object.values(sel).flat().length;

  return (
    <KeyboardAvoidingView
      style={{flex:1, backgroundColor:C.cream}}
      behavior={Platform.OS==='ios'?'padding':undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[C.forest,C.moss]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={[styles.header, {paddingTop: insets.top + 16}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.mint} />
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={styles.headerEye}>Mi Refugio</Text>
          <Text style={styles.headerTitle}>¿Cómo grita el dolor hoy?</Text>
          <Text style={styles.headerSub}>Respira. Aquí puedes ser tú.</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Pain selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nivel de dolor</Text>
          <PainSelector value={dolor} onChange={setDolor} />
        </View>

        {/* Tag sections */}
        {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map(key => (
          <View key={key} style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={{fontSize:20}}>{META[key].emoji}</Text>
              <Text style={styles.sectionTitle}>{META[key].label}</Text>
            </View>
            <View style={styles.chips}>
              {OPTIONS[key].map(tag => (
                <Chip
                  key={tag} label={tag}
                  selected={sel[key].includes(tag)}
                  accent={META[key].accent}
                  onPress={() => toggleTag(key, tag)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Free text */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={{fontSize:20}}>✍️</Text>
            <Text style={styles.sectionTitle}>Escribe lo que el cuerpo calla</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Suelta aquí tus pensamientos…"
            placeholderTextColor={C.warmGray}
            multiline numberOfLines={5}
            textAlignVertical="top"
            value={texto}
            onChangeText={setTexto}
          />
          <Text style={styles.charCount}>{texto.length} caracteres</Text>
        </View>

        {/* Summary pill */}
        {totalSel > 0 && (
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {totalSel} sensación{totalSel!==1?'es':''} reconocida{totalSel!==1?'s':''} 🌿
            </Text>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={saving ? [C.warmGray,C.warmGray] : [C.forest,C.forestDim]}
            start={{x:0,y:0}} end={{x:1,y:0}}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar en mi diario'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>Con amor, para ti 🌿</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal:24, paddingBottom:28 },
  backBtn: { marginBottom:12 },
  headerEye: { color:C.mint, fontSize:11, letterSpacing:2.5, textTransform:'uppercase', marginBottom:4, fontWeight:'500' },
  headerTitle: { color:C.white, fontSize:24, fontWeight:'700', lineHeight:30, marginBottom:4 },
  headerSub: { color:C.sage, fontSize:13, fontStyle:'italic' },

  scroll: { paddingHorizontal:16, paddingTop:20, paddingBottom:48, gap:14 },

  card: {
    backgroundColor:C.white, borderRadius:20, padding:18,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:2,
  },
  cardLabel: { fontSize:11, fontWeight:'700', color:C.textMuted, textTransform:'uppercase', letterSpacing:1.8, marginBottom:16 },

  // Pain selector
  painWrap: { gap:12 },
  painTop:  { flexDirection:'row', alignItems:'center', gap:12 },
  painBig:  { fontSize:40, fontWeight:'800', lineHeight:42 },
  painOf:   { fontSize:13, color:C.textMuted },
  painNodes: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
  },
  painNode: {
    width: (width - 32 - 36 - 10 * 4) / 11,
    height: (width - 32 - 36 - 10 * 4) / 11,
    borderRadius:100, borderWidth:1.5, borderColor:C.warmGray,
    backgroundColor:C.cream, alignItems:'center', justifyContent:'center',
  },
  painNodeSel: {
    transform:[{scale:1.22}],
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.18, shadowRadius:4, elevation:4,
  },
  painNodeNum: { fontSize:9, fontWeight:'600', color:C.textMuted },
  painScale: { fontSize:10, color:C.textMuted, fontStyle:'italic' },

  // Sections
  sectionHead: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 },
  sectionTitle: { fontSize:15, fontWeight:'600', color:C.charcoal, flex:1 },
  chips: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: {
    flexDirection:'row', alignItems:'center',
    paddingHorizontal:13, paddingVertical:7,
    borderRadius:100, borderWidth:1.5, gap:5,
  },
  chipText: { fontSize:13, color:C.textMuted },
  chipDot:  { width:6, height:6, borderRadius:3 },

  // Text area
  textArea: {
    backgroundColor:C.parchment, borderRadius:14, padding:14,
    fontSize:14, color:C.charcoal, lineHeight:22, minHeight:100,
    borderWidth:1, borderColor:C.mint,
  },
  charCount: { fontSize:10, color:C.warmGray, textAlign:'right', marginTop:4 },

  summaryPill: {
    backgroundColor:C.mintSoft, borderRadius:100,
    paddingVertical:10, paddingHorizontal:20, alignSelf:'center',
    borderWidth:1, borderColor:C.mint,
  },
  summaryText: { color:C.forestDim, fontSize:13, fontWeight:'600' },

  saveBtn: {
    borderRadius:18, paddingVertical:18, alignItems:'center',
    shadowColor:C.forest, shadowOffset:{width:0,height:5}, shadowOpacity:0.28, shadowRadius:12, elevation:5,
  },
  saveBtnText: { color:C.white, fontSize:16, fontWeight:'700', letterSpacing:0.3 },
  footer: { textAlign:'center', color:C.warmGray, fontSize:12, fontStyle:'italic', marginTop:4 },
});