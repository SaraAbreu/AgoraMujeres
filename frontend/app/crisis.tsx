import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  forest: '#4A664D', forestDim: '#3A5140', forestDeep: '#2C3D2E',
  moss: '#6B8F6E', sage: '#A8C5A0',
  mint: '#D4E8D0', mintSoft: '#EAF4E8', cream: '#F8F7F2', parchment: '#F0EDE4',
  warm: '#E8E2D8', muted: '#9A958E', charcoal: '#3D3A35', white: '#FFFFFF',
  rose: '#C0614A', roseSoft: '#FEF2F2',
  gold: '#C9A84C', goldSoft: '#FDF8EE',
  blue: '#4A7FA5', blueSoft: '#EEF4FA',
};

const PHONES = [
  { number: '061', label: 'Emergencias m\u00e9dicas', desc: 'Atenci\u00f3n sanitaria urgente', icon: 'medkit-outline', color: C.rose, bg: C.roseSoft },
  { number: '112', label: 'Emergencias generales', desc: 'Polic\u00eda, bomberos, ambulancia', icon: 'shield-outline', color: C.blue, bg: C.blueSoft },
];

const ARTICLES = [
  { title: 'Fibromialgia: gu\u00eda completa para pacientes', source: 'ACAF \u2014 Asociaci\u00f3n Espa\u00f1ola', url: 'https://www.acaf.es/fibromialgia/', icon: 'document-text-outline' },
  { title: 'Vivir con dolor cr\u00f3nico: estrategias psicol\u00f3gicas', source: 'Psicolog\u00eda y Mente', url: 'https://psicologiaymente.com/clinica/dolor-cronico', icon: 'document-text-outline' },
  { title: 'Endometriosis: todo lo que necesitas saber', source: 'EndoStar Espa\u00f1a', url: 'https://www.endostar.es', icon: 'document-text-outline' },
  { title: 'Migraña cr\u00f3nica: tratamientos actuales', source: 'Fundaci\u00f3n Espa\u00f1ola de C\u00e9fala', url: 'https://www.fecma.eu', icon: 'document-text-outline' },
  { title: 'S\u00edndrome de fatiga cr\u00f3nica: gu\u00eda para el d\u00eda a d\u00eda', source: 'SFC Espa\u00f1a', url: 'https://www.ligasfc.org', icon: 'document-text-outline' },
];

const VIDEOS = [
  { title: 'Ejercicios suaves para fibromialgia y dolor cr\u00f3nico', channel: 'Fisioterapia Noemí', duration: '14 min', url: 'https://www.youtube.com/results?search_query=ejercicios+suaves+fibromialgia+espa%C3%B1ol', icon: 'play-circle-outline' },
  { title: 'T\u00e9cnicas de respiraci\u00f3n para calmar el dolor', channel: 'Mindfulness en Espa\u00f1ol', duration: '10 min', url: 'https://www.youtube.com/results?search_query=respiracion+dolor+cronico+espa%C3%B1ol', icon: 'play-circle-outline' },
  { title: 'Yin yoga terapéutico para articulaciones', channel: 'Yoga Terapia ES', duration: '22 min', url: 'https://www.youtube.com/results?search_query=yin+yoga+articulaciones+espa%C3%B1ol', icon: 'play-circle-outline' },
  { title: 'Meditaci\u00f3n guiada para el dolor y el insomnio', channel: 'Calma Interior', duration: '18 min', url: 'https://www.youtube.com/results?search_query=meditacion+guiada+dolor+insomnio+espa%C3%B1ol', icon: 'play-circle-outline' },
];

const RECIPES = [
  {
    title: 'Crema de c\u00farcuma y jengibre',
    tags: ['antiinflamatorio', 'f\u00e1cil', '15 min'],
    ingredients: ['1 cucharadita de c\u00farcuma', '1 cm de jengibre fresco', '400ml de leche de coco', '1 zanahoria', 'pimienta negra', 'sal'],
    steps: 'Sofr\u00ede la zanahoria troceada 5 minutos. A\u00f1ade la c\u00farcuma, el jengibre rallado y la leche de coco. Cocina 10 minutos a fuego suave. Tritura, sazona con pimienta negra (activa la c\u00farcuma) y sirve caliente.',
    note: 'La pimienta negra aumenta hasta 2000% la absorci\u00f3n de curcumina.',
  },
  {
    title: 'Bol de salm\u00f3n con aguacate y semillas',
    tags: ['omega-3', 'sin gluten', '10 min'],
    ingredients: ['150g salm\u00f3n ahumado', '1 aguacate', 'lechuga romana', 'semillas de c\u00e1\u00f1amo', 'aceite de oliva virgen', 'lim\u00f3n', 'sal'],
    steps: 'Coloca la lechuga de base. A\u00f1ade el salm\u00f3n en trozos y el aguacate en l\u00e1minas. Espolvorea semillas de c\u00e1\u00f1amo. Aliña con aceite de oliva y lim\u00f3n.',
    note: 'El omega-3 del salm\u00f3n reduce marcadores inflamatorios asociados a la fibromialgia.',
  },
  {
    title: 'Porridge antiinflamatorio de avena',
    tags: ['desayuno', 'f\u00e1cil', '10 min'],
    ingredients: ['60g avena', '250ml bebida de almendras', '1 cucharadita de canela', 'ar\u00e1ndanos frescos', 'nueces', 'miel de mano\u00fa (opcional)'],
    steps: 'Cocina la avena con la bebida de almendras a fuego medio removiendo. A\u00f1ade la canela. Sirve con ar\u00e1ndanos (antioxidantes) y nueces (omega-3). Endulza con miel si lo deseas.',
    note: 'La canela inhibe citoquinas proinflamatorias. Los ar\u00e1ndanos protegen el sistema nervioso.',
  },
  {
    title: 'Sopa de lentejas rojas con esp\u00e9culo',
    tags: ['proteína', 'c\u00e1lido', '25 min'],
    ingredients: ['200g lentejas rojas', '1 cebolla', '2 dientes de ajo', '1 cucharadita de c\u00famino', 'esp\u00e1rragos trigueros', 'caldo de verduras', 'aceite de oliva'],
    steps: 'Sofr\u00ede cebolla y ajo. A\u00f1ade lentejas, c\u00famino y caldo. Cocina 20 minutos. Los \u00faltimos 5 minutos a\u00f1ade los esp\u00e1rragos troceados. Sirve con un chorrito de aceite de oliva crudo.',
    note: 'Las lentejas son ricas en magnesio, mineral frecuentemente bajo en personas con fibromialgia.',
  },
];

function RecipeCard({ recipe }: { recipe: typeof RECIPES[0] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={s.recipeCard} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
      <View style={s.recipeHeader}>
        <View style={s.recipeIconBox}>
          <Ionicons name="restaurant-outline" size={16} color={C.forest} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.recipeTitle}>{recipe.title}</Text>
          <View style={s.recipeTags}>
            {recipe.tags.map((t, i) => (
              <View key={i} style={s.recipeTag}>
                <Text style={s.recipeTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.moss} />
      </View>
      {expanded && (
        <View style={s.recipeBody}>
          <Text style={s.recipeSubLabel}>Ingredientes</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={s.recipeIngRow}>
              <View style={s.recipeIngDot} />
              <Text style={s.recipeIngText}>{ing}</Text>
            </View>
          ))}
          <Text style={s.recipeSubLabel}>Preparaci\u00f3n</Text>
          <Text style={s.recipeSteps}>{recipe.steps}</Text>
          <View style={s.recipeNote}>
            <Ionicons name="leaf-outline" size={13} color={C.forest} />
            <Text style={s.recipeNoteText}>{recipe.note}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CrisisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <LinearGradient
        colors={[C.forestDeep, C.forest]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 14 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.mint} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerEyebrow}>Mi Refugio</Text>
          <Text style={s.headerTitle}>Mis Recursos</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        <View style={s.hero}>
          <View style={s.heartCircle}>
            <Ionicons name="heart" size={28} color={C.rose} />
          </View>
          <Text style={s.heroTitle}>Estamos contigo</Text>
          <Text style={s.heroSub}>{'T\u00f3mate un momento para respirar.\nNo est\u00e1s sola.'}</Text>
        </View>

        <Text style={s.sectionLabel}>Ayuda inmediata</Text>
        {PHONES.map((p, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${p.number}`)} activeOpacity={0.88}>
            <View style={s.phoneCard}>
              <View style={[s.phoneIconBox, { backgroundColor: p.bg }]}>
                <Ionicons name={p.icon as any} size={22} color={p.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.phoneLabel}>{p.label}</Text>
                <Text style={[s.phoneNumber, { color: p.color }]}>{p.number}</Text>
                <Text style={s.phoneDesc}>{p.desc}</Text>
              </View>
              <View style={[s.callBtn, { backgroundColor: p.color }]}>
                <Ionicons name="call" size={15} color={C.white} />
                <Text style={s.callBtnText}>Llamar</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={s.sectionLabel}>Art\u00edculos recomendados</Text>
        <View style={s.card}>
          {ARTICLES.map((a, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(a.url)}
              style={[s.resourceRow, i < ARTICLES.length - 1 && s.resourceRowBorder]}
              activeOpacity={0.75}
            >
              <View style={s.resourceIconBox}>
                <Ionicons name={a.icon as any} size={15} color={C.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resourceTitle}>{a.title}</Text>
                <Text style={s.resourceSub}>{a.source}</Text>
              </View>
              <Ionicons name="open-outline" size={14} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>V\u00eddeos para el cuerpo y la mente</Text>
        <View style={s.card}>
          {VIDEOS.map((v, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(v.url)}
              style={[s.resourceRow, i < VIDEOS.length - 1 && s.resourceRowBorder]}
              activeOpacity={0.75}
            >
              <View style={[s.resourceIconBox, { backgroundColor: C.goldSoft }]}>
                <Ionicons name={v.icon as any} size={15} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resourceTitle}>{v.title}</Text>
                <View style={s.videoMeta}>
                  <Text style={s.resourceSub}>{v.channel}</Text>
                  <View style={s.videoDot} />
                  <Text style={s.resourceSub}>{v.duration}</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={14} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>Cocina antiinflamatoria</Text>
        <View style={{ gap: 8 }}>
          {RECIPES.map((r, i) => <RecipeCard key={i} recipe={r} />)}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.google.com/search?q=recetas+antiinflamatorias+dolor+cronico+espa%C3%B1ol')}
            activeOpacity={0.85}
            style={s.moreRecipesBtn}
          >
            <Ionicons name="search-outline" size={16} color={C.forest} />
            <Text style={s.moreRecipesBtnText}>Ver más recetas antiinflamatorias</Text>
            <Ionicons name="open-outline" size={14} color={C.moss} />
          </TouchableOpacity>
        </View>


        <Text style={s.disclaimer}>
          Esta herramienta es un apoyo, no sustituye a un profesional sanitario o de emergencias.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerEyebrow: {
    color: C.sage, fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 4, opacity: 0.8,
  },
  headerTitle: {
    color: C.white, fontSize: 26, fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  scroll: { paddingHorizontal: 18, paddingTop: 20, gap: 12 },
  hero: {
    backgroundColor: C.roseSoft, borderRadius: 24, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#FEE2E2',
  },
  heartCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.rose, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 3,
  },
  heroTitle: {
    fontSize: 22, fontWeight: '300', color: C.charcoal, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8,
  },
  heroSub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 2.5, marginTop: 4,
  },
  phoneCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  phoneIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  phoneLabel: { fontSize: 11, color: C.muted, marginBottom: 2 },
  phoneNumber: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
  phoneDesc: { fontSize: 11, color: C.muted },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100,
  },
  callBtnText: { color: C.white, fontWeight: '600', fontSize: 13 },
  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 4,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 14,
  },
  resourceRowBorder: { borderBottomWidth: 1, borderBottomColor: C.warm },
  resourceIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  resourceTitle: { fontSize: 13, color: C.charcoal, fontWeight: '500', marginBottom: 3, lineHeight: 18 },
  resourceSub: { fontSize: 11, color: C.muted },
  videoMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  videoDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.muted },
  recipeCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: C.mint, borderLeftWidth: 4, borderLeftColor: C.forest,
    shadowColor: C.forestDeep, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipeIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: C.charcoal, marginBottom: 5 },
  recipeTags: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  recipeTag: {
    backgroundColor: C.mintSoft, borderRadius: 100,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  recipeTagText: { fontSize: 10, color: C.forest, fontWeight: '600' },
  recipeBody: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.mint },
  recipeSubLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 4,
  },
  recipeIngRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  recipeIngDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.sage },
  recipeIngText: { fontSize: 13, color: C.charcoal },
  recipeSteps: { fontSize: 13, color: C.charcoal, lineHeight: 20, marginBottom: 12 },
  recipeNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: C.mintSoft, borderRadius: 10, padding: 10,
  },
  recipeNoteText: { flex: 1, fontSize: 12, color: C.forestDeep, lineHeight: 18, fontStyle: 'italic' },
  chatBtn: {
    borderRadius: 18, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: C.forest, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  chatBtnText: { color: C.white, fontWeight: '600', fontSize: 16 },
  moreRecipesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.mintSoft, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: C.mint, borderStyle: 'dashed',
  },
  moreRecipesBtnText: { fontSize: 13, color: C.forest, fontWeight: '600' },
  disclaimer: {
    fontSize: 11, color: C.muted, textAlign: 'center',
    lineHeight: 18, fontStyle: 'italic', marginTop: 8,
  },
});
