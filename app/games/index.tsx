import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = '@tamagotchi_pro_state';
const GAME_COST = 15;

export default function GameHubScreen() {
  const router = useRouter();
  const [energy, setEnergy] = useState<number>(0);

  useEffect(() => {
    const loadEnergy = async () => {
      try {
        const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStateStr) {
          const state = JSON.parse(savedStateStr);
          setEnergy(state.energy || 0);
        }
      } catch (e) {
        console.error("Hub load energy error", e);
      }
    };
    loadEnergy();
  }, []);

  const handlePlayGame = (gameRoute: '/games/bird' | '/games/racer' | '/games/piano', cost: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (energy >= cost) {
      router.push(gameRoute);
    } else {
      alert(`Oyun oynamak için ${cost} enerjiye ihtiyacın var! \nŞu anki Enerji: %${Math.round(energy)} 🛏️`);
    }
  };

  const hasEnoughEnergy = (cost: number) => energy >= cost;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>✕ Kapat</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Oyun Merkezi</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.energyBadge}>
          <Text style={styles.energyText}>🔋 Enerji: %{Math.round(energy)} / 100</Text>
        </View>

        {!hasEnoughEnergy(15) && (
          <Text style={styles.warningText}>Oynamak için enerji gerekli. Petini uyut!</Text>
        )}

        {/* 1. SKY BIRD */}
        <TouchableOpacity 
          style={[styles.gameCard, !hasEnoughEnergy(15) && styles.gameCardDisabled]} 
          activeOpacity={0.8}
          onPress={() => handlePlayGame('/games/bird', 15)}
          disabled={!hasEnoughEnergy(15)}
        >
          <View style={styles.gameIconContainer}>
            <Text style={styles.gameIcon}>🐥</Text>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Sky Bird</Text>
            <Text style={styles.gameDesc}>Boruların arasından süzül!</Text>
            <View style={styles.rewardsRow}>
              <Text style={styles.rewardText}>🎯 +3 Mutluluk & +5 Altın per Boru</Text>
              <Text style={styles.costText}>⚡ -{GAME_COST} Enerji</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. TURBO RACER */}
        <TouchableOpacity 
          style={[styles.gameCard, !hasEnoughEnergy(15) && styles.gameCardDisabled]} 
          activeOpacity={0.8}
          onPress={() => handlePlayGame('/games/racer', 15)}
          disabled={!hasEnoughEnergy(15)}
        >
          <View style={[styles.gameIconContainer, { backgroundColor: '#FDE047' }]}>
            <Text style={styles.gameIcon}>🏎️</Text>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Turbo Racer</Text>
            <Text style={styles.gameDesc}>Trafikte makas at!</Text>
            <View style={styles.rewardsRow}>
              <Text style={styles.rewardText}>🎯 +5 XP & +2 Mutluluk per Araç</Text>
              <Text style={styles.rewardText}>🪙 Yolda Altın Yakala!</Text>
              <Text style={styles.costText}>⚡ -{GAME_COST} Enerji</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 3. MAGIC PET PIANO */}
        <TouchableOpacity 
          style={[styles.gameCard, !hasEnoughEnergy(20) && styles.gameCardDisabled]} 
          activeOpacity={0.8}
          onPress={() => handlePlayGame('/games/piano', 20)}
          disabled={!hasEnoughEnergy(20)}
        >
          <View style={[styles.gameIconContainer, { backgroundColor: '#A78BFA' }]}>
            <Text style={styles.gameIcon}>🎹</Text>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Magic Pet Piano</Text>
            <Text style={styles.gameDesc}>Ritmik notalara dokun!</Text>
            <View style={styles.rewardsRow}>
              <Text style={styles.rewardText}>🎯 +1 Mutluluk/XP (Her Nota)</Text>
              <Text style={styles.rewardText}>🏆 Şarkıyı Bitir, Bonusu Kap!</Text>
              <Text style={styles.costText}>⚡ -20 Enerji</Text>
            </View>
          </View>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1E293B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F172A',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 20,
  },
  backBtnText: { color: '#F1F5F9', fontWeight: '800' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginLeft: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  energyBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  energyText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  warningText: { color: '#F87171', fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  gameCardDisabled: { opacity: 0.5 },
  gameIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#7DD3FC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gameIcon: { fontSize: 40 },
  gameInfo: { flex: 1 },
  gameTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  gameDesc: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  rewardsRow: { gap: 4 },
  rewardText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  costText: { fontSize: 13, fontWeight: '700', color: '#EF4444' }
});
