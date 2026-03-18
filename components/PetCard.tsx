import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeOutUp,
  ZoomIn
} from 'react-native-reanimated';
import { AVAILABLE_ITEMS } from '@/components/MarketModal';
import * as Haptics from 'expo-haptics';

interface Heart {
  id: string;
  x: number;
  y: number;
}

interface PetCardProps {
  petName: string;
  level: number;
  xp: number;
  hunger: number;
  hygiene: number;
  happiness: number;
  energy: number;
  coins: number;
  equippedItem: string | null;
  selectedSkin: string | null;
  isSleeping: boolean;
  onFeed: () => void;
  onPlay: () => void;
  onSleep: () => void;
  onRequestRename: () => void;
  onRequestMarket: () => void;
  onRequestWash: () => void;
  onRequestProfile: () => void;
  onPet: () => void;
}

const getPetEvolution = (level: number) => {
  if (level >= 30) return '🐉';
  if (level >= 20) return '🦅';
  if (level >= 11) return '🐥';
  if (level >= 6) return '🐣';
  return '🥚';
};

const getAccessoryStyle = (level: number) => {
  if (level >= 30) { // Dragon
    return { fontSize: 80, top: -55, rotate: '0deg' };
  }
  if (level >= 20) { // Eagle
    return { fontSize: 75, top: -45, rotate: '0deg' };
  }
  if (level >= 11) { // Chick
    return { fontSize: 60, top: -25, rotate: '0deg' };
  }
  if (level >= 6) { // Hatching
    return { fontSize: 45, top: -15, rotate: '0deg' };
  }
  return { fontSize: 35, top: -10, rotate: '0deg' }; // Egg
};

const DirtOverlay = ({ hygiene }: { hygiene: number }) => {
  if (hygiene >= 75) return null;

  return (
    <View style={styles.dirtOverlay} pointerEvents="none">
      {hygiene < 75 && (
        <>
          <Text style={[styles.dirtEmoji, { top: 10, left: -20, fontSize: 30 }]}>🌫️</Text>
          <Text style={[styles.dirtEmoji, { bottom: 20, right: -15, fontSize: 25 }]}>🌫️</Text>
        </>
      )}
      {hygiene < 50 && (
        <>
          <Text style={[styles.dirtEmoji, { top: 40, right: -25, fontSize: 35 }]}>💩</Text>
          <Text style={[styles.dirtEmoji, { bottom: 0, left: -10, fontSize: 30 }]}>💩</Text>
        </>
      )}
      {hygiene < 25 && (
        <>
          <Text style={[styles.dirtEmoji, { top: -10, right: 30, fontSize: 25 }]}>🪰</Text>
          <Text style={[styles.dirtEmoji, { top: 60, left: 30, fontSize: 20 }]}>🪰</Text>
          <Text style={[styles.dirtEmoji, { bottom: 40, left: -30, fontSize: 22 }]}>🪰</Text>
        </>
      )}
    </View>
  );
};

const getNextLevelXp = (level: number) => level * 100;

const PetCard: React.FC<PetCardProps> = ({
  petName, level, xp, hunger, hygiene, happiness, energy, coins, equippedItem, selectedSkin, isSleeping,
  onFeed, onPlay, onSleep, onRequestRename, onRequestMarket, onRequestWash, onRequestProfile, onPet
}) => {

  // Floating & Jump animations
  const floatY = useSharedValue(0);
  const petScale = useSharedValue(1);
  const [hearts, setHearts] = React.useState<Heart[]>([]);

  useEffect(() => {
    // Sürekli aşağı yukarı dalgalanma efekti (Floating)
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite
      true // Reverse
    );
  }, []);

  const animatedPetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: petScale.value }
    ]
  }));

  const handlePet = () => {
    if (isSleeping) return;

    // 1. Jump & Haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    petScale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );

    // 2. Heart Particle
    const newHeart: Heart = {
      id: Math.random().toString(),
      x: Math.random() * 100 - 50, // Between -50 and 50
      y: -20,
    };
    setHearts(prev => [...prev, newHeart]);

    // Auto-remove heart after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);

    // 3. Trigger Reward
    onPet();
  };

  // Progress Bar Animations
  const xpProgress = Math.min(100, (xp / getNextLevelXp(level)) * 100);
  const animatedXpWidth = useAnimatedStyle(() => ({
    width: withSpring(`${xpProgress}%`, { damping: 15 })
  }));

  // Find equipped accessory emoji
  const accessory = equippedItem ? AVAILABLE_ITEMS.find(i => i.id === equippedItem)?.emoji : null;

  return (
    <View style={styles.cardContainer}>

      {/* 1. ÜST BAR (Header) - Avatar + Level + Cüzdan */}
      <View style={styles.topBar}>

        {/* Sol: Avatar / Profil */}
        <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.8} onPress={onRequestProfile}>
          <Text style={styles.avatarEmoji}>{selectedSkin || getPetEvolution(level)}</Text>
          <View style={styles.avatarLevelBadge}>
            <Text style={styles.avatarLevelText}>{level}</Text>
          </View>
        </TouchableOpacity>

        {/* Orta: Boş alan (isim aşağıya taşındı) */}
        <View style={styles.nameBadgeHeader} />

        {/* Sağ: Cüzdan */}
        <TouchableOpacity style={styles.walletBtn} activeOpacity={0.8} onPress={onRequestMarket}>
          <Text style={styles.walletIcon}>👛</Text>
          <View>
            <Text style={styles.walletLabel}>Altın</Text>
            <Text style={styles.walletValue}>🪙 {coins}</Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* 2. KARAKTER SAHNESİ (The Stage) */}
      <View style={styles.stageWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePet}
          style={[styles.stageArea, isSleeping && styles.stageAreaSleeping]}
        >
          {/* Floating Hearts */}
          {hearts.map(heart => (
            <Animated.Text
              key={heart.id}
              entering={ZoomIn}
              exiting={FadeOutUp.duration(800)}
              style={[
                styles.heartEmoji,
                { left: '45%', marginLeft: heart.x, top: '40%' }
              ]}
            >
              ❤️
            </Animated.Text>
          ))}

          <Animated.View style={[styles.petWrapper, animatedPetStyle, isSleeping && { opacity: 0.6 }]}>
            <Text style={styles.petEmoji}>{selectedSkin || getPetEvolution(level)}</Text>

            {/* Dirt Overlay */}
            {!isSleeping && <DirtOverlay hygiene={hygiene} />}

            {/* Eşya Pet'in üzerinde mutlak pozisyonda render ediliyor */}
            {accessory && !isSleeping && (
              <Text style={[
                styles.accessoryEmoji,
                {
                  fontSize: getAccessoryStyle(level).fontSize,
                  top: getAccessoryStyle(level).top,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  transform: [{ rotate: getAccessoryStyle(level).rotate }]
                }
              ]}>
                {accessory}
              </Text>
            )}
            {isSleeping && (
              <Text style={styles.zzzEmoji}>💤</Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* 3. PET İSMİ */}
      <TouchableOpacity onPress={onRequestRename} activeOpacity={0.7} style={styles.petNameRow}>
        <Text style={styles.petNameBig}>{petName}</Text>
        <Text style={styles.petNameEdit}> ✏️</Text>
      </TouchableOpacity>

      {/* 4. XP ÇUBUĞU */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpTitleText}>Deneyim (XP)</Text>
          <Text style={styles.xpValueText}>{xp}/{getNextLevelXp(level)}</Text>
        </View>
        <View style={styles.xpTrack}>
          <Animated.View style={[styles.xpFill, animatedXpWidth]} />
        </View>
      </View>

      {/* 4. AKSİYON BUTONLARI */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.btnFeed, isSleeping && styles.disabledBtn]}
          onPress={onFeed}
          activeOpacity={0.8}
          disabled={isSleeping}
        >
          <Text style={styles.actionBtnText}>🍕 Besle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnWash, (isSleeping || hygiene >= 75) && styles.disabledBtn]}
          onPress={onRequestWash}
          activeOpacity={0.8}
          disabled={isSleeping || hygiene >= 75}
        >
          <Text style={styles.actionBtnText}>🧼 Yıka</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnPlay, isSleeping && styles.disabledBtn]}
          onPress={onPlay}
          activeOpacity={0.8}
          disabled={isSleeping}
        >
          <Text style={styles.actionBtnText}>🎾 Oyna</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, isSleeping ? styles.btnWake : styles.btnSleep]}
          onPress={onSleep}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>{isSleeping ? '☀️ Uyandır' : '🛏️ Uyut'}</Text>
        </TouchableOpacity>
      </View>

      {/* 5. İSTATİSTİK KARTLARI */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOKLUK</Text>
          <Text style={styles.statValue}>%{Math.round(hunger)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TEMİZLİK</Text>
          <Text style={styles.statValue}>%{Math.round(hygiene)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MUTLULUK</Text>
          <Text style={styles.statValue}>%{Math.round(happiness)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ENERJİ</Text>
          <Text style={styles.statValue}>%{Math.round(energy)}</Text>
        </View>
      </View>

    </View>
  );
};

export default memo(PetCard);

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FAFAFA',
    borderRadius: 36,
    padding: 20,
    justifyContent: 'flex-start',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
      web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.08)' }
    }),
  },

  // Header
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  // Avatar Button (Sol)
  avatarBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  avatarEmoji: { fontSize: 30 },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarLevelText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // Pet Name in Header
  nameBadgeHeader: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  petNameTextHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },

  // Wallet Button (Sağ)
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    gap: 8,
  },
  walletIcon: { fontSize: 22 },
  walletLabel: { color: '#92400E', fontSize: 10, fontWeight: '700' },
  walletValue: { color: '#92400E', fontSize: 13, fontWeight: '900' },

  // Eski badge stilleri kaldırıldı, ama bir yerde kullanılan varsa diye:
  headerBadgeBadgeLight: { backgroundColor: '#E0F2FE', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  headerBadgeBadgeGold: { backgroundColor: '#FDE047', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  headerBadgeBadgePurple: { backgroundColor: '#8B5CF6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  headerBadgeTextDark: { color: '#1E293B', fontWeight: '800', fontSize: 13 },
  headerBadgeTextLight: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Stage
  stageWrapper: { alignItems: 'center', marginBottom: 16 },
  petNameText: { fontSize: 26, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
  stageArea: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FBCFE8',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageAreaSleeping: {
    backgroundColor: '#1E293B', // Karanlık oda
  },
  petWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  petEmoji: { fontSize: 140 },
  accessoryEmoji: {
    position: 'absolute',
  },
  zzzEmoji: {
    fontSize: 50,
    position: 'absolute',
    top: -40,
    right: -20,
    opacity: 0.8,
  },
  heartEmoji: {
    position: 'absolute',
    fontSize: 35,
    zIndex: 10,
  },
  nameBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  dirtOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  dirtEmoji: {
    position: 'absolute',
  },

  // Pet Name Row (above XP bar)
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  petNameBig: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  petNameEdit: { fontSize: 18, color: '#94A3B8' },

  // XP
  xpSection: { marginBottom: 16, paddingHorizontal: 10 },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpTitleText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  xpValueText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  xpTrack: { height: 14, backgroundColor: '#E2E8F0', borderRadius: 7, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 7 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 0, gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.03)' }
    }),
  },
  statLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { color: '#0F172A', fontSize: 20, fontWeight: '900' },

  // Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  actionBtn: { paddingVertical: 18, borderRadius: 16, flexGrow: 1, minWidth: '45%', alignItems: 'center', justifyContent: 'center' },
  btnFeed: { backgroundColor: '#F59E0B' }, // Amber
  btnWash: { backgroundColor: '#3B82F6' }, // Blue
  btnPlay: { backgroundColor: '#10B981' }, // Teal
  btnSleep: { backgroundColor: '#312E81' }, // Deep Indigo
  btnWake: { backgroundColor: '#F59E0B' }, // Güneş rengi (Uyandır)
  disabledBtn: { opacity: 0.5 },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
