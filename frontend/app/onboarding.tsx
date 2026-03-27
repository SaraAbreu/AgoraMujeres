import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { colors, textStyles, sp, radius, fonts } from '../src/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    icon: '🌿',
    titleKey: 'onboardingTitle1',
    descKey:  'onboardingDesc1',
    gradient: ['#E8EDE5', '#F8EDE4'] as const,
  },
  {
    key: '2',
    icon: '💜',
    titleKey: 'onboardingTitle2',
    descKey:  'onboardingDesc2',
    gradient: ['#F3EDE4', '#E8EDE5'] as const,
  },
  {
    key: '3',
    icon: '✨',
    titleKey: 'onboardingTitle3',
    descKey:  'onboardingDesc3',
    gradient: ['#F8EDE4', '#F3EDE4'] as const,
  },
  {
    key: '0',
    logo: true,
    titleKey: 'onboardingWelcomeTitle',
    descKey: 'onboardingWelcomeDesc',
    gradient: ['#F8EDE4', '#E8EDE5'] as const,
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markOnboardingAsShown } = useOnboarding();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const finish = async () => {
    await markOnboardingAsShown();
    router.replace('/(tabs)');
  };

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finish();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => (
          <LinearGradient colors={item.gradient as [string, string]} style={styles.slide}>
            <View style={styles.slideContent}>
              {item.logo ? (
                <>
                  <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                  <Text style={styles.title}>{t(item.titleKey)}</Text>
                  <Text style={styles.desc}>{t(item.descKey)}</Text>
                </>
              ) : (
                <>
                  {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
                  <Text style={styles.title}>{t(item.titleKey)}</Text>
                  <Text style={styles.desc}>{t(item.descKey)}</Text>
                </>
              )}
            </View>
          </LinearGradient>
        )}
      />

      {/* Dots + botones */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.nextBtn}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex === slides.length - 1 ? t('getStarted') : t('next')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  slide:     { width, height, justifyContent: 'center', alignItems: 'center' },
  slideContent: {
    alignItems:       'center',
    paddingHorizontal: sp.xl,
    marginTop:         -80,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: sp.lg,
  },
  icon:  { fontSize: 64, marginBottom: sp.lg },
  title: {
    ...textStyles.h1,
    color:     colors.textPrimary,
    textAlign: 'center',
    marginBottom: sp.md,
  },
  desc: {
    ...textStyles.bodyMd,
    color:     colors.textSecondary,
    textAlign: 'center',
    maxWidth:  320,
    lineHeight: 26,
  },
  footer: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    alignItems:      'center',
    paddingHorizontal: sp.screenX,
  },
  dots: {
    flexDirection: 'row',
    marginBottom:  sp.lg,
    gap:           sp.sm,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    radius.full,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width:           24,
    backgroundColor: colors.primary,
  },
  nextBtn: { width: '100%', marginBottom: sp.md },
  nextBtnGradient: {
    paddingVertical: 18,
    borderRadius:    radius.xl,
    alignItems:      'center',
  },
  nextBtnText: {
    ...textStyles.button,
    color: colors.textOnPrimary,
    fontSize: 17,
  },
  skipBtn: { paddingVertical: sp.sm },
  skipText: {
    ...textStyles.label,
    color: colors.textMuted,
  },
});
