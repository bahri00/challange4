import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';

import PetCard from '@/components/PetCard';
import RenameModal from '@/components/RenameModal';
import MarketModal, { MarketItem } from '@/components/MarketModal';
import BathModal from '@/components/BathModal';
import FoodModal, { FoodItem } from '@/components/FoodModal';
import ProfileModal from '@/components/ProfileModal';

const STORAGE_KEY = '@tamagotchi_pro_state';

// Her 10 saniyede bir düşecek Değerler
const HUNGER_DECREASE = 4;
const HYGIENE_DECREASE = 3;
const HAPPINESS_DECREASE = 3;
const ENERGY_DECREASE = 2; // Enerji de yavaş yavaş düşsün
const TICK_INTERVAL_MS = 10000; // 10 saniye (Normal bekleme)
const SLEEP_TICK_INTERVAL_MS = 4000; // 4 saniye (Uykuda 2.5 kat daha hızlı)

interface PetState {
  petName: string;
  hunger: number;
  hygiene: number;
  happiness: number;
  energy: number;
  coins: number;
  xp: number;     // Now represents current XP within the level
  level: number;
  ownedItems: string[];
  equippedItem: string | null;
  selectedSkin: string | null;
  lastSeen: number;
  isSleeping: boolean;
}

const DEFAULT_STATE: PetState = {
  petName: 'Pou Pou',
  hunger: 80,
  hygiene: 100,
  happiness: 50,
  energy: 90,
  coins: 50,
  xp: 80,
  level: 1,
  ownedItems: [],
  equippedItem: null,
  selectedSkin: null,
  lastSeen: Date.now(),
  isSleeping: false,
};

// Yeni XP Formülü: Yeterince XP toplandıysa Level atlat ve XP'den gerekli miktarı düş
const applyXpGain = (currentXp: number, currentLevel: number, gainedXp: number) => {
  let newXp = currentXp + gainedXp;
  let newLevel = currentLevel;
  
  while (newXp >= newLevel * 100) {
    newXp -= newLevel * 100;
    newLevel++;
  }
  return { xp: newXp, level: newLevel };
};

export default function HomeScreen() {
  const router = useRouter();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [isMarketModalVisible, setMarketModalVisible] = useState(false);
  const [isBathModalVisible, setBathModalVisible] = useState(false);
  const [isFoodModalVisible, setFoodModalVisible] = useState(false);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [petState, setPetState] = useState<PetState>(DEFAULT_STATE);
  
  // Game loop interval timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeAppState = useRef<AppStateStatus>(AppState.currentState);

  // Veri yükleme fonksiyonunu dışarı alıyoruz ki useFocusEffect ile de kullanabilelim
  const loadState = useCallback(async () => {
    try {
      const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedStateStr) {
        const savedState: PetState = JSON.parse(savedStateStr);
        
        // Çevrimdışı İlerleme Hesaplama
        const now = Date.now();
        const msPassed = now - savedState.lastSeen;
        const ticksPassed = Math.floor(msPassed / TICK_INTERVAL_MS);

        let newHunger = savedState.hunger - (ticksPassed * HUNGER_DECREASE);
        let newHygiene = (savedState.hygiene ?? 100) - (ticksPassed * HYGIENE_DECREASE);
        let newHappiness = savedState.happiness - (ticksPassed * HAPPINESS_DECREASE);
        
        let newEnergy = savedState.energy || 100;
        let isSleeping = savedState.isSleeping || false;

        if (isSleeping) {
          newEnergy = Math.min(100, newEnergy + (ticksPassed * 25)); // Uykuda enerji 2.5 kat daha hızlı dolar
          if (newEnergy === 100) isSleeping = false; // Tamamen dolduysa uyan
        } else {
          newEnergy = Math.max(0, newEnergy - (ticksPassed * ENERGY_DECREASE));
        }

        setPetState({
          ...savedState,
          hunger: Math.max(0, newHunger),
          hygiene: Math.max(0, newHygiene),
          happiness: Math.max(0, newHappiness),
          energy: newEnergy,
          isSleeping,
          coins: savedState.coins || 50,
          ownedItems: savedState.ownedItems || [],
          equippedItem: savedState.equippedItem || null,
          selectedSkin: savedState.selectedSkin || null,
          level: savedState.level || 1,
          xp: savedState.xp || 0,
          lastSeen: now, 
        });
      }
    } catch (e) {
      console.error("Failed to load state", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // --- 1. Veri Yükleme ve Çevrimdışı İlerleme (Offline Progression) ---
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Sayfaya her geri dönüldüğünde skoru / enerjiyi yenilemek için
  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState])
  );

  // --- 2. Durum Değişikliklerini Kaydetme (Auto-Save) ---
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(petState));
    }
  }, [petState, isLoaded]);

  // --- 3. Aktif Oyun Döngüsü (The Game Loop) ---
  useEffect(() => {
    if (!isLoaded) return;

    const tick = () => {
      setPetState(prev => {
        let newEnergy = prev.energy;
        let isSleeping = prev.isSleeping;

        if (isSleeping) {
          newEnergy = Math.min(100, prev.energy + 25);
          if (newEnergy === 100) {
            isSleeping = false; // Uykusu doldu
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          newEnergy = Math.max(0, prev.energy - ENERGY_DECREASE);
        }

        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - HUNGER_DECREASE),
          hygiene: Math.max(0, (prev.hygiene ?? 100) - HYGIENE_DECREASE),
          happiness: Math.max(0, prev.happiness - HAPPINESS_DECREASE),
          energy: newEnergy,
          isSleeping,
          lastSeen: Date.now(),
        };
      });
    };

    // Dinamik Interval: Uyuyorsa 4 saniye, uyanıksa 10 saniye bekler.
    timerRef.current = setInterval(tick, petState.isSleeping ? SLEEP_TICK_INTERVAL_MS : TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoaded, petState.isSleeping]);

  // --- 4. Arka Plan Yönetimi (App State Change) ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (activeAppState.current === 'active' && nextAppState.match(/inactive|background/)) {
        setPetState(prev => {
          const newState = { ...prev, lastSeen: Date.now() };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)); 
          return newState;
        });
      }
      activeAppState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // --- 5. Oyun Aksiyonları ---
  const handleFeed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (petState.hunger >= 100) {
      alert("Tokluk seviyeniz %100! 🍕");
      return;
    }
    setFoodModalVisible(true);
  }, [petState.hunger]);

  const handleFoodSelect = useCallback((food: FoodItem) => {
    setFoodModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setPetState(prev => {
      if (prev.coins >= food.price) {
        const { xp, level } = applyXpGain(prev.xp, prev.level, 10);
        return {
          ...prev,
          hunger: Math.min(100, prev.hunger + food.satiety),
          coins: prev.coins - food.price,
          xp,
          level,
        };
      }
      alert("Yeterli altının yok! 🛒 Oynayarak kazan.");
      return prev;
    });
  }, []);

  const handlePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (petState.energy >= 15) {
      // Artık Oyun Merkezine (Game Hub) bağlanıyor
      router.push('/games' as any);
    } else {
      alert("Enerjin bitti! 🛏️ Uyutmalısın.");
    }
  }, [petState.energy, router]);

  const handleSleep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPetState(prev => ({
      ...prev,
      isSleeping: !prev.isSleeping, // Toggle sleep state
    }));
  }, []);

  const handleRename = useCallback((newName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPetState(prev => ({ ...prev, petName: newName }));
    setRenameModalVisible(false);
  }, []);

  const handleBuyItem = useCallback((item: MarketItem) => {
    setPetState(prev => {
      if (prev.coins >= item.price && !prev.ownedItems.includes(item.id)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return {
          ...prev,
          coins: prev.coins - item.price,
          ownedItems: [...prev.ownedItems, item.id]
        };
      }
      return prev;
    });
  }, []);

  const handleEquipItem = useCallback((itemId: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPetState(prev => ({ ...prev, equippedItem: itemId }));
  }, []);

  const handleSkinSelect = useCallback((skin: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPetState(prev => ({ ...prev, selectedSkin: skin }));
    setProfileModalVisible(false);
  }, []);

  const handleWashFinish = useCallback(() => {
    setBathModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPetState(prev => {
      const { xp, level } = applyXpGain(prev.xp, prev.level, 30);
      return {
        ...prev,
        hygiene: 100,
        happiness: Math.min(100, prev.happiness + 20),
        xp,
        level,
      };
    });
  }, []);

  const handlePet = useCallback(() => {
    setPetState(prev => {
      const { xp, level } = applyXpGain(prev.xp, prev.level, 5);
      return {
        ...prev,
        happiness: Math.min(100, prev.happiness + 2),
        xp,
        level,
      };
    });
  }, []);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Soft light background
  const backgroundColor = '#F1F5F9';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        
        <PetCard
          petName={petState.petName}
          level={petState.level}
          xp={petState.xp}
          hunger={petState.hunger}
          hygiene={petState.hygiene ?? 100}
          happiness={petState.happiness}
          energy={petState.energy}
          coins={petState.coins}
          equippedItem={petState.equippedItem}
          selectedSkin={petState.selectedSkin}
          isSleeping={petState.isSleeping}
          onFeed={handleFeed}
          onPlay={handlePlay}
          onSleep={handleSleep}
          onRequestRename={() => setRenameModalVisible(true)}
          onRequestMarket={() => setMarketModalVisible(true)}
          onRequestWash={() => setBathModalVisible(true)}
          onRequestProfile={() => setProfileModalVisible(true)}
          onPet={handlePet}
        />

        <RenameModal 
          visible={isRenameModalVisible} 
          currentName={petState.petName} 
          onClose={() => setRenameModalVisible(false)} 
          onSave={handleRename} 
        />

        <MarketModal 
          visible={isMarketModalVisible}
          coins={petState.coins}
          ownedItems={petState.ownedItems}
          equippedItem={petState.equippedItem}
          onClose={() => setMarketModalVisible(false)}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
        />

        <BathModal
          visible={isBathModalVisible}
          onClose={() => setBathModalVisible(false)}
          onComplete={handleWashFinish}
          level={petState.level}
          equippedItem={petState.equippedItem}
          selectedSkin={petState.selectedSkin}
        />

        <FoodModal 
          visible={isFoodModalVisible}
          onClose={() => setFoodModalVisible(false)}
          onSelect={handleFoodSelect}
          coins={petState.coins}
        />

        <ProfileModal 
          visible={isProfileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          onSelectSkin={handleSkinSelect}
          level={petState.level}
          selectedSkin={petState.selectedSkin}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, padding: 16, paddingTop: 40, backgroundColor: '#F1F5F9', alignItems: 'center' },
});
