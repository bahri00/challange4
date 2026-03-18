import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

interface DeveloperCardProps {
  ad: string;
  uzmanlik: string;
  seviye: string;
  xp: number;
  energy: number;
  isCoding: boolean;
  badges: string[];
  onToggleCoding: () => void;
  onYemekYe: () => void;
  onWorkAction: () => void;
}

const BADGE_MAP: Record<string, { icon: string; label: string }> = {
  first_pizza: { icon: '🍕', label: 'İlk Pizza' }
};

const DeveloperCard: React.FC<DeveloperCardProps> = ({ 
  ad, 
  uzmanlik, 
  seviye, 
  xp,
  energy,
  isCoding, 
  badges,
  onToggleCoding, 
  onYemekYe,
  onWorkAction
}) => {
  const cardBorderColor = isCoding ? '#10B981' : '#3B82F6';
  const statusText = isCoding ? '💻 Kod Yazılıyor (XP Kazanılıyor...)' : '⏸️ Mola Verildi (Boşta)';

  // Animations
  const xpWidth = useSharedValue(0);
  const energyWidth = useSharedValue(100);

  useEffect(() => {
    // Basic level calculation to find current level progress (max 1000 for Lead)
    let maxXp = 200;
    if (xp > 200) maxXp = 500;
    if (xp > 500) maxXp = 1000;
    if (xp > 1000) maxXp = xp; // Maxed out
    
    xpWidth.value = withSpring((xp / maxXp) * 100, { damping: 12 });
  }, [xp]);

  useEffect(() => {
    energyWidth.value = withTiming(energy, { duration: 300 });
  }, [energy]);

  const animatedXpStyle = useAnimatedStyle(() => ({
    width: `${xpWidth.value}%`
  }));

  const animatedEnergyStyle = useAnimatedStyle(() => ({
    width: `${energyWidth.value}%`
  }));

  return (
    <View style={[styles.cardContainer, { borderColor: cardBorderColor }]}>
      
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{ad.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nameText}>{ad}</Text>
          <Text style={styles.roleText}>{uzmanlik} • {seviye}</Text>
        </View>
      </View>

      {/* Gamification Stats */}
      <View style={styles.statsContainer}>
        {/* XP Bar */}
        <View style={styles.barWrapper}>
          <View style={styles.labelRow}>
            <Text style={styles.barLabel}>XP (Deneyim)</Text>
            <Text style={styles.barValue}>{xp} XP</Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, styles.xpFill, animatedXpStyle]} />
          </View>
        </View>

        {/* Energy Bar */}
        <View style={styles.barWrapper}>
          <View style={styles.labelRow}>
            <Text style={styles.barLabel}>Enerji (Odak)</Text>
            <Text style={styles.barValue}>{energy}%</Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, styles.energyFill, animatedEnergyStyle]} />
          </View>
        </View>
      </View>

      {/* Badges */}
      {badges.length > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeTitle}>Başarımlar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            {badges.map((bId) => (
              <View key={bId} style={styles.badge}>
                <Text style={styles.badgeIcon}>{BADGE_MAP[bId]?.icon}</Text>
                <Text style={styles.badgeText}>{BADGE_MAP[bId]?.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Status & Actions */}
      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.button, isCoding ? styles.stopCodingBtn : styles.startCodingBtn]} 
          onPress={onToggleCoding}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{isCoding ? 'Molaya Çık' : 'Kodlamaya Başla'}</Text>
        </TouchableOpacity>
        
        {isCoding ? (
          <TouchableOpacity 
            style={[styles.button, styles.workBtn, energy <= 0 && styles.disabledBtn]} 
            onPress={onWorkAction}
            disabled={energy <= 0}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>+ Kod Yaz</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.feedBtn, energy === 100 && styles.disabledBtn]} 
            onPress={onYemekYe}
            disabled={energy === 100}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Pizza Ismarla 🍕</Text>
          </TouchableOpacity>
        )}
      </View>
      
    </View>
  );
};

export default memo(DeveloperCard);

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B', // Darker blue-gray for vibe
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 12 },
      web: { boxShadow: '0px 12px 24px rgba(0,0,0,0.3)' }
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatarPlaceholder: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  nameText: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  roleText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', letterSpacing: 0.5 },
  
  statsContainer: { marginBottom: 20, gap: 12 },
  barWrapper: { width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  barValue: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  track: { height: 12, backgroundColor: '#334155', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  xpFill: { backgroundColor: '#8B5CF6' }, // Purple for XP
  energyFill: { backgroundColor: '#10B981' }, // Green for Energy

  badgeContainer: { marginBottom: 24 },
  badgeTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  badgeScroll: { gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeIcon: { fontSize: 16, marginRight: 6 },
  badgeText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },

  statusIndicator: { backgroundColor: '#0F172A', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  statusText: { fontSize: 14, fontWeight: '700', color: '#E2E8F0' },
  
  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  startCodingBtn: { backgroundColor: '#3B82F6' },
  stopCodingBtn: { backgroundColor: '#EF4444' },
  workBtn: { backgroundColor: '#8B5CF6' },
  feedBtn: { backgroundColor: '#F59E0B' },
  disabledBtn: { backgroundColor: '#475569', opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
