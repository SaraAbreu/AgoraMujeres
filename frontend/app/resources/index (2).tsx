/**
 * app/resources/index.tsx
 *
 * Pantalla de recursos: artículos y vídeos sobre fibromialgia.
 * Accesible desde la acción rápida "Recursos" de la home.
 *
 * Secciones:
 *   1. Filtro por categoría (chips horizontales)
 *   2. Recursos destacados (is_featured = true)
 *   3. Todos los recursos de la categoría seleccionada
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import {
  getResources,
  getResourceCategories,
  Resource,
  ResourceCategory,
} from '../../src/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const BG = '#80704f';

// Iconos Ionicons para cada categoría (fallback si el backend no manda icon)
const CATEGORY_ICONS: Record<string, string> = {
  breathing:    'leaf-outline',
  stretching:   'body-outline',
  nutrition:    'nutrition-outline',
  sleep:        'moon-outline',
  mindfulness:  'flower-outline',
  professional: 'medkit-outline',
};

// Colores por categoría
const CATEGORY_COLORS: Record<string, string> = {
  breathing:    '#9CAF88',
  stretching:   '#C4A484',
  nutrition:    '#D4B896',
  sleep:        '#B8AFA7',
  mindfulness:  '#C9A59A',
  professional: '#8A8C6C',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

/** Chip de categoría */
function CategoryChip({
  category,
  selected,
  onPress,
  language,
}: {
  category: ResourceCategory | { id: string; name: string; icon: string; count: number };
  selected: boolean;
  onPress:  () => void;
  language: string;
}) {
  const icon  = CATEGORY_ICONS[category.id] ?? 'document-outline';
  const color = CATEGORY_COLORS[category.id] ?? colors.warmBrown;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        chipStyles.chip,
        selected && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Ionicons
        name={icon as any}
        size={14}
        color={selected ? '#fff' : colors.textSecondary}
      />
      <Text style={[chipStyles.label, selected && chipStyles.labelSelected]}>
        {category.name}
      </Text>
      {category.count > 0 && (
        <View style={[chipStyles.badge, selected && chipStyles.badgeSelected]}>
          <Text style={[chipStyles.badgeText, selected && chipStyles.badgeTextSelected]}>
            {category.count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Tarjeta de recurso */
function ResourceCard({
  resource,
  language,
  onPress,
}: {
  resource: Resource;
  language: string;
  onPress:  () => void;
}) {
  const isVideo = resource.type === 'video';
  const accent  = CATEGORY_COLORS[resource.category] ?? colors.warmBrown;

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Franja de color por categoría */}
      <View style={[cardStyles.accent, { backgroundColor: accent }]} />

      <View style={cardStyles.body}>
        {/* Tipo + duración */}
        <View style={cardStyles.meta}>
          <View style={[cardStyles.typeBadge, { backgroundColor: accent + '22' }]}>
            <Ionicons
              name={isVideo ? 'play-circle-outline' : 'document-text-outline'}
              size={12}
              color={accent}
            />
            <Text style={[cardStyles.typeText, { color: accent }]}>
              {isVideo
                ? (language === 'es' ? 'Vídeo' : 'Video')
                : (language === 'es' ? 'Artículo' : 'Article')}
            </Text>
          </View>

          {(resource.duration || resource.read_time) && (
            <Text style={cardStyles.duration}>
              {resource.duration ?? resource.read_time}
            </Text>
          )}

          {resource.is_featured && (
            <View style={cardStyles.featuredBadge}>
              <Ionicons name="star" size={10} color={colors.warmBrown} />
              <Text style={cardStyles.featuredText}>
                {language === 'es' ? 'Destacado' : 'Featured'}
              </Text>
            </View>
          )}
        </View>

        {/* Título */}
        <Text style={cardStyles.title} numberOfLines={2}>
          {resource.title}
        </Text>

        {/* Descripción */}
        <Text style={cardStyles.description} numberOfLines={3}>
          {resource.description}
        </Text>

        {/* Autor */}
        {resource.author && (
          <View style={cardStyles.authorRow}>
            <Ionicons name="person-outline" size={12} color={colors.textLight} />
            <Text style={cardStyles.author} numberOfLines={1}>
              {resource.author}
              {resource.author_credentials ? ` · ${resource.author_credentials}` : ''}
            </Text>
          </View>
        )}

        {/* CTA */}
        <View style={cardStyles.cta}>
          <Text style={[cardStyles.ctaText, { color: accent }]}>
            {isVideo
              ? (language === 'es' ? 'Ver vídeo' : 'Watch video')
              : (language === 'es' ? 'Leer artículo' : 'Read article')}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ResourcesScreen() {
  const router = useRouter();
  const { language } = useStore();
  const isEs = language === 'es';

  const [categories,        setCategories]        = useState<ResourceCategory[]>([]);
  const [resources,         setResources]          = useState<Resource[]>([]);
  const [selectedCategory,  setSelectedCategory]  = useState<string | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [refreshing,        setRefreshing]        = useState(false);
  const [catLoading,        setCatLoading]        = useState(true);

  // ── Carga categorías al montar ──────────────────────────────────────────────
  useEffect(() => {
    const loadCats = async () => {
      setCatLoading(true);
      try {
        const cats = await getResourceCategories(language);
        setCategories(cats);
      } catch (e) {
        console.warn('[Resources] Categories error:', e);
        // Fallback local
        setCategories(FALLBACK_CATEGORIES(isEs));
      } finally {
        setCatLoading(false);
      }
    };
    loadCats();
  }, [language]);

  // ── Carga recursos cuando cambia categoría ──────────────────────────────────
  const loadResources = useCallback(async (cat?: string | null) => {
    setLoading(true);
    try {
      const data = await getResources(cat ?? undefined, language);
      setResources(data);
    } catch (e) {
      console.warn('[Resources] Load error:', e);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadResources(selectedCategory);
  }, [selectedCategory, loadResources]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources(selectedCategory);
    setRefreshing(false);
  };

  // ── Abrir recurso ────────────────────────────────────────────────────────────
  const handleOpenResource = async (resource: Resource) => {
    if (resource.type === 'video' && resource.video_url) {
      try {
        const supported = await Linking.canOpenURL(resource.video_url);
        if (supported) {
          await Linking.openURL(resource.video_url);
        } else {
          Alert.alert(
            isEs ? 'No se pudo abrir' : 'Could not open',
            isEs ? 'No hay app disponible para abrir este enlace.' : 'No app available to open this link.'
          );
        }
      } catch {
        Alert.alert(isEs ? 'Error' : 'Error', resource.video_url);
      }
      return;
    }

    // Artículo: navegar a pantalla de detalle (si existe) o mostrar Alert básico
    if (resource.content) {
      Alert.alert(resource.title, resource.content.slice(0, 400) + (resource.content.length > 400 ? '...' : ''));
    }
  };

  // ── Separar destacados del resto ─────────────────────────────────────────────
  const featured = resources.filter(r => r.is_featured);
  const rest     = resources.filter(r => !r.is_featured);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.softWhite} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            {isEs ? 'Recursos' : 'Resources'}
          </Text>
          <Text style={styles.headerSub}>
            {isEs
              ? 'Artículos y vídeos sobre fibromialgia'
              : 'Articles and videos about fibromyalgia'}
          </Text>
        </View>
      </View>

      {/* Categorías */}
      <View style={styles.catsWrapper}>
        {catLoading ? (
          <ActivityIndicator size="small" color={colors.softWhite} style={{ margin: spacing.md }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catsScroll}
          >
            {/* "Todas" */}
            <CategoryChip
              category={{ id: 'all', name: isEs ? 'Todas' : 'All', icon: 'apps', count: 0 }}
              selected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
              language={language}
            />
            {categories.map(cat => (
              <CategoryChip
                key={cat.id}
                category={cat}
                selected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                language={language}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.softWhite} />
          <Text style={styles.loaderText}>
            {isEs ? 'Cargando recursos...' : 'Loading resources...'}
          </Text>
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="library-outline" size={48} color={colors.softWhite} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>
            {isEs ? 'Sin recursos disponibles' : 'No resources available'}
          </Text>
          <Text style={styles.emptySub}>
            {isEs
              ? 'Prueba seleccionando otra categoría o recarga.'
              : 'Try selecting another category or refresh.'}
          </Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={() => loadResources(selectedCategory)}>
            <Text style={styles.reloadBtnText}>{isEs ? 'Recargar' : 'Reload'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.softWhite}
              colors={[colors.warmBrown]}
            />
          }
        >
          {/* Destacados */}
          {featured.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={14} color={colors.warmBrownLight} />
                <Text style={styles.sectionTitle}>
                  {isEs ? 'Destacados' : 'Featured'}
                </Text>
              </View>
              {featured.map(r => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  language={language}
                  onPress={() => handleOpenResource(r)}
                />
              ))}
            </>
          )}

          {/* Resto */}
          {rest.length > 0 && (
            <>
              {featured.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Ionicons name="apps-outline" size={14} color={colors.softWhite} style={{ opacity: 0.8 }} />
                  <Text style={styles.sectionTitle}>
                    {isEs ? 'Más recursos' : 'More resources'}
                  </Text>
                </View>
              )}
              {rest.map(r => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  language={language}
                  onPress={() => handleOpenResource(r)}
                />
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback de categorías si el backend no responde
// ─────────────────────────────────────────────────────────────────────────────

function FALLBACK_CATEGORIES(isEs: boolean): ResourceCategory[] {
  return [
    { id: 'breathing',    name: isEs ? 'Respiración'   : 'Breathing',    icon: 'leaf',       count: 0 },
    { id: 'stretching',   name: isEs ? 'Estiramientos' : 'Stretching',   icon: 'body',       count: 0 },
    { id: 'nutrition',    name: isEs ? 'Nutrición'     : 'Nutrition',    icon: 'nutrition',  count: 0 },
    { id: 'sleep',        name: isEs ? 'Sueño'         : 'Sleep',        icon: 'moon',       count: 0 },
    { id: 'mindfulness',  name: isEs ? 'Mindfulness'   : 'Mindfulness',  icon: 'flower',     count: 0 },
    { id: 'professional', name: isEs ? 'Profesional'   : 'Professional', icon: 'medkit',     count: 0 },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos chips
// ─────────────────────────────────────────────────────────────────────────────

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderRadius:      borderRadius.full,
    backgroundColor:   'rgba(255,255,255,0.12)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.15)',
    gap:               spacing.xs,
    marginRight:       spacing.sm,
  },
  label: {
    fontSize:    typography.sizes.sm,
    fontFamily:  'Nunito_500Medium',
    color:       colors.softWhite,
  },
  labelSelected: {
    color:      '#fff',
    fontFamily: 'Nunito_700Bold',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius:    99,
    paddingHorizontal: 5,
    paddingVertical:   1,
  },
  badgeSelected: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  badgeText: {
    fontSize:   9,
    fontFamily: 'Nunito_700Bold',
    color:      colors.softWhite,
  },
  badgeTextSelected: {
    color: '#fff',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Estilos tarjeta
// ─────────────────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    marginBottom:    spacing.md,
    flexDirection:   'row',
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    6,
    elevation:       2,
  },
  accent: {
    width:  4,
    alignSelf: 'stretch',
  },
  body: {
    flex:    1,
    padding: spacing.md,
  },
  meta: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    marginBottom:   spacing.sm,
    flexWrap:       'wrap',
  },
  typeBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderRadius:      borderRadius.full,
    gap:               3,
  },
  typeText: {
    fontSize:   10,
    fontFamily: 'Nunito_600SemiBold',
  },
  duration: {
    fontSize:   10,
    fontFamily: 'Nunito_400Regular',
    color:      colors.textLight,
  },
  featuredBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              2,
    backgroundColor:  colors.warmBrown + '15',
    paddingHorizontal: 5,
    paddingVertical:   2,
    borderRadius:      borderRadius.full,
  },
  featuredText: {
    fontSize:   9,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.warmBrown,
  },
  title: {
    fontSize:     typography.sizes.md,
    fontFamily:   'Cormorant_600SemiBold',
    color:        colors.text,
    marginBottom: spacing.xs,
    lineHeight:   22,
  },
  description: {
    fontSize:     typography.sizes.sm,
    fontFamily:   'Nunito_400Regular',
    color:        colors.textSecondary,
    lineHeight:   20,
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginBottom:  spacing.sm,
  },
  author: {
    fontSize:   11,
    fontFamily: 'Nunito_400Regular',
    color:      colors.textLight,
    flex:       1,
  },
  cta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  ctaText: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Estilos pantalla
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    gap:               spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize:   typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color:      colors.softWhite,
  },
  headerSub: {
    fontSize:   typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.7)',
    marginTop:  1,
  },

  // Categorías
  catsWrapper: {
    marginBottom: spacing.sm,
  },
  catsScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.xs,
  },

  // Estados
  loader: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    gap:            spacing.md,
  },
  loaderText: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.7)',
  },
  empty: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    paddingHorizontal: spacing.xl,
    gap:             spacing.md,
  },
  emptyTitle: {
    fontSize:   typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color:      colors.softWhite,
    textAlign:  'center',
  },
  emptySub: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.7)',
    textAlign:  'center',
    lineHeight: 20,
  },
  reloadBtn: {
    backgroundColor: colors.warmBrownDark,
    paddingHorizontal: spacing.xl,
    paddingVertical:   spacing.md,
    borderRadius:      borderRadius.full,
    marginTop:         spacing.sm,
  },
  reloadBtnText: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_700Bold',
    color:      colors.softWhite,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    marginBottom:  spacing.md,
    marginTop:     spacing.sm,
  },
  sectionTitle: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.softWhite,
    opacity:    0.9,
  },
});
