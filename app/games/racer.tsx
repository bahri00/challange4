import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, Modal, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { AVAILABLE_ITEMS } from '@/components/MarketModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- OYUN FİZİK AYARLARI ---
let ROAD_SPEED = 7; // Akan yolun hızı (kolay ayarlayabilmek için const değil let)
const LANE_WIDTH = SCREEN_WIDTH / 3;
const CAR_SIZE = 70;
const OBSTACLE_SIZE = 60;
const GAME_COST = 15;
const STORAGE_KEY = '@tamagotchi_pro_state';
const RACER_SCORES_KEY = '@tamagotchi_racer_highscores';

// Şerit merkezleri (X koordinatları)
const LANES = [
  LANE_WIDTH / 2 - CAR_SIZE / 2,        // Sol Şerit
  SCREEN_WIDTH / 2 - CAR_SIZE / 2,      // Orta Şerit
  SCREEN_WIDTH - LANE_WIDTH / 2 - CAR_SIZE / 2 // Sağ Şerit
];

const getPetEvolution = (level: number) => {
  if (level >= 30) return '🐉';
  if (level >= 20) return '🦅';
  if (level >= 11) return '🐥';
  if (level >= 6) return '🐣';
  return '🥚';
};

const getAccessoryStyle = (level: number) => {
  if (level >= 30) return { fontSize: 30, top: -25 };
  if (level >= 20) return { fontSize: 25, top: -20 };
  if (level >= 11) return { fontSize: 20, top: -15 };
  if (level >= 6) return { fontSize: 18, top: -10 };
  return { fontSize: 15, top: -5 };
};

export default function RacerGameScene() {
  const router = useRouter();

  const [currentLane, setCurrentLane] = useState(1); // 0, 1, 2
  const currentLaneRef = useRef(1);
  const [roadItems, setRoadItems] = useState<{ id: number, type: 'obs'|'coin'|'boost', lane: number, y: number, passed: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [petVisual, setPetVisual] = useState({ 
    emoji: '🥚', 
    accessory: null as string | null,
    level: 1
  });
  const [highScores, setHighScores] = useState<number[]>([]);

  const scoreRef = useRef(0);
  const collectedCoinsRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const obstacleIdRef = useRef(0);
  const difficultyMultiplier = useRef(1);
  const lastSpawnLaneRef = useRef<number | null>(null);

  // --- EVCİL HAYVAN VERİSİNİ YÜKLE ---
  useEffect(() => {
    const loadPetData = async () => {
      try {
        const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          const evolution = getPetEvolution(savedState.level || 1);
          const emoji = savedState.selectedSkin || evolution;
          const accessory = savedState.equippedItem ? AVAILABLE_ITEMS.find(i => i.id === savedState.equippedItem)?.emoji || null : null;
          setPetVisual({ emoji, accessory, level: savedState.level || 1 });
        }
        
        const scoresStr = await AsyncStorage.getItem(RACER_SCORES_KEY);
        if (scoresStr) {
          setHighScores(JSON.parse(scoresStr));
        }
      } catch(e) {}
    };
    loadPetData();
  }, []);

  // --- OYUN DÖNGÜSÜ ---
  useEffect(() => {
    if (!hasStarted || isGameOver) return;

    const loop = () => {
      const currentSpeed = ROAD_SPEED * difficultyMultiplier.current;

      setRoadItems(currentItems => {
        let newItems = currentItems.map(item => {
          let passed = item.passed;
          
          if (item.type === 'obs') {
            if (!passed && item.y > SCREEN_HEIGHT - 100) {
              passed = true;
              scoreRef.current += 1;
              setScore(scoreRef.current);
              if (scoreRef.current % 10 === 0) {
                difficultyMultiplier.current = Math.min(2.5, difficultyMultiplier.current + 0.1);
              }
            }
          } else {
            // ALTIN VEYA ŞİMŞEK KONTROLÜ
            const carY = SCREEN_HEIGHT - 150;
            const carLeft = LANES[currentLaneRef.current];
            if (!passed && 
                carLeft + CAR_SIZE - 10 > LANES[item.lane] && 
                carLeft < LANES[item.lane] + OBSTACLE_SIZE - 10 && 
                carY + CAR_SIZE - 10 > item.y && 
                carY < item.y + OBSTACLE_SIZE - 10) {
              
              passed = true;
              
              if (item.type === 'coin') {
                collectedCoinsRef.current += 1;
                setCollectedCoins(collectedCoinsRef.current);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else if (item.type === 'boost') {
                // Şimşek alındı -> hız aniden artsın
                difficultyMultiplier.current = Math.min(3.5, difficultyMultiplier.current + 0.3);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            }
          }

          return { ...item, y: item.y + currentSpeed, passed };
        }).filter(item => item.y < SCREEN_HEIGHT + OBSTACLE_SIZE && (!item.passed || item.type === 'obs'));

        // Yeni eşya ekle
        const lastItem = newItems.length > 0 ? newItems[newItems.length - 1] : null;
        if (!lastItem || lastItem.y > SCREEN_HEIGHT * 0.35) {
          obstacleIdRef.current += 1;
          
          let randomLane = Math.floor(Math.random() * 3);
          // Üst üste aynı şeritte çıkmasını engelle
          while (randomLane === lastSpawnLaneRef.current) {
            randomLane = Math.floor(Math.random() * 3);
          }
          lastSpawnLaneRef.current = randomLane;

          let type: 'obs'|'coin'|'boost' = 'obs';
          const r = Math.random();
          
          if (scoreRef.current < 20) {
            // Başlangıçta şimşek çıkma ihtimali yüksek: %10 Şimşek, %20 Altın
            if (r < 0.10) type = 'boost';
            else if (r < 0.30) type = 'coin';
          } else {
            // İlerledikçe şimşek çıkma ihtimali çok azalır: %3 Şimşek, %20 Altın
            if (r < 0.03) type = 'boost';
            else if (r < 0.23) type = 'coin';
          }

          newItems.push({ id: obstacleIdRef.current, type, lane: randomLane, y: -OBSTACLE_SIZE, passed: false });
        }

        return newItems;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, isGameOver]);

  // --- ÇARPIŞMA KONTROLÜ ---
  useEffect(() => {
    if (!hasStarted || isGameOver) return;

    const carY = SCREEN_HEIGHT - 150;
    const carTop = carY;
    const carBottom = carY + CAR_SIZE - 10;
    const carLeft = LANES[currentLane];
    const carRight = carLeft + CAR_SIZE - 10;

    for (let item of roadItems) {
      if (item.type !== 'obs') continue;

      const obsTop = item.y;
      const obsBottom = item.y + OBSTACLE_SIZE - 10;
      const obsLeft = LANES[item.lane];
      const obsRight = obsLeft + OBSTACLE_SIZE - 10;

      // Kesişim var mı?
      if (carRight > obsLeft && carLeft < obsRight && carBottom > obsTop && carTop < obsBottom) {
        setIsGameOver(true);
        setHasStarted(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        updateHighScores();
      }
    }
  }, [currentLane, roadItems, hasStarted, isGameOver]);

  const updateHighScores = async () => {
    const finalScore = scoreRef.current;
    if (finalScore === 0) return;
    try {
      let newScores = [...highScores, finalScore];
      newScores.sort((a, b) => b - a); // descending
      newScores = [...new Set(newScores)].slice(0, 3);
      setHighScores(newScores);
      await AsyncStorage.setItem(RACER_SCORES_KEY, JSON.stringify(newScores));
    } catch(e) {}
  };

  // --- KONTROLLER ---
  const handleTouch = (event: any) => {
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }
    if (isGameOver) return;

    // Ekranın sağına mı soluna mı dokunuldu?
    const touchX = event.nativeEvent.pageX;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (touchX > SCREEN_WIDTH / 2) {
      // Sağa git
      setCurrentLane(prev => {
        const next = Math.min(2, prev + 1);
        currentLaneRef.current = next;
        return next;
      });
    } else {
      // Sola git
      setCurrentLane(prev => {
        const next = Math.max(0, prev - 1);
        currentLaneRef.current = next;
        return next;
      });
    }
  };

  const resetGame = () => {
    setCurrentLane(1);
    currentLaneRef.current = 1;
    setRoadItems([]);
    setScore(0);
    scoreRef.current = 0;
    setCollectedCoins(0);
    collectedCoinsRef.current = 0;
    difficultyMultiplier.current = 1;
    obstacleIdRef.current = 0;
    lastSpawnLaneRef.current = null;
    setIsGameOver(false);
    setHasStarted(false);
  };

  const saveAndExit = async () => {
    try {
      const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedStateStr) {
        const state = JSON.parse(savedStateStr);
        
        // Puan hesaplaması: +5 XP ve +2 Mutluluk
        const totalXpGained = score * 5;
        const totalHappiness = score * 2;
        const totalCoins = collectedCoins;

        const newHappiness = Math.min(100, state.happiness + totalHappiness);
        const newEnergy = Math.max(0, state.energy - GAME_COST);
        const newCoins = state.coins + totalCoins;

        let newXp = state.xp + totalXpGained;
        let newLevel = state.level;
        while (newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
        }

        const updatedState = { ...state, happiness: newHappiness, energy: newEnergy, coins: newCoins, xp: newXp, level: newLevel, lastSeen: Date.now() };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      }
    } catch (e) {} finally {
      router.back();
    }
  };

  const forceExit = () => {
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        
        {/* YOL (Yatay Çizgiler) */}
        <View style={[styles.laneDivider, { left: LANE_WIDTH }]} />
        <View style={[styles.laneDivider, { left: LANE_WIDTH * 2 }]} />

        {/* GERİ BUTONU */}
        <SafeAreaView style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={forceExit}>
            <Text style={styles.backBtnText}>✕ Çıkış</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <SafeAreaView style={styles.scoreBoard}>
          <Text style={styles.scoreText}>{score}</Text>
          {collectedCoins > 0 && <Text style={styles.coinText}>🪙 {collectedCoins}</Text>}
        </SafeAreaView>

        {!hasStarted && !isGameOver && (
          <View style={styles.startOverlay}>
            <Text style={styles.startText}>Başlamak/Şerit Değiştirmek için Dokun!</Text>
          </View>
        )}

        {/* ARABA (Pet) */}
        <View style={[styles.car, { left: LANES[currentLane], top: SCREEN_HEIGHT - 150 }]}>
          <View style={styles.chassis}>
            <Text style={{ fontSize: 40, marginTop: -30 }}>{petVisual.emoji}</Text>
            {petVisual.accessory && (
              <Text style={[
                styles.accessoryEmoji, 
                { 
                  fontSize: getAccessoryStyle(petVisual.level).fontSize,
                  top: -20, // Relative to chassis
                  left: 0,
                  right: 0,
                  textAlign: 'center'
                }
              ]}>
                {petVisual.accessory}
              </Text>
            )}
          </View>
        </View>

        {/* ENGELLER, ALTINLAR & ŞİMŞEKLER */}
        {roadItems.map(item => (
          <View key={item.id} style={[styles.obstacle, { left: LANES[item.lane], top: item.y }]}>
            <Text style={{ fontSize: 40 }}>
              {item.type === 'obs' ? '🚧' : (item.type === 'coin' ? '🪙' : '⚡️')}
            </Text>
          </View>
        ))}

        {/* GAME OVER MODAL */}
        <Modal visible={isGameOver} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.gameOverTitle}>KAZA YAPTIN!</Text>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreCardTitle}>ATLATILAN ARAÇ</Text>
                <Text style={styles.scoreCardValue}>{score}</Text>
                <Text style={styles.scoreCardDesc}>🪙 +{collectedCoins} Altın</Text>
                <Text style={styles.scoreCardDesc}>+{score * 2} Mutluluk</Text>
                <Text style={styles.scoreCardDesc}>+{score * 5} XP (Deneyim)</Text>
                <Text style={styles.scoreCardDesc}>-{GAME_COST} Enerji</Text>
              </View>

              {highScores.length > 0 && (
                <View style={styles.highScoresContainer}>
                  <Text style={styles.highScoresTitle}>En İyi Skorlar</Text>
                  {highScores.map((h, i) => (
                    <Text key={i} style={styles.highScoreItem}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {h} Araç
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.buttonsRow}>
                <TouchableOpacity style={[styles.btn, styles.btnHome]} onPress={saveAndExit}>
                  <Text style={styles.btnText}>Evine Dön</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPlay]} onPress={resetGame}>
                  <Text style={styles.btnText}>Tekrar Oyna</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#334155', overflow: 'hidden' }, // Koyu Gri Asfalt Yolu
  laneDivider: { position: 'absolute', width: 4, height: '100%', backgroundColor: '#94A3B8', opacity: 0.5 },
  navBar: { position: 'absolute', top: 40, left: 20, zIndex: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  backBtnText: { color: '#FFF', fontWeight: '800' },
  scoreBoard: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 10 },
  scoreText: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  coinText: { fontSize: 24, fontWeight: '800', color: '#FDE047', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, marginTop: 4 },
  startOverlay: { position: 'absolute', top: '40%', width: '100%', alignItems: 'center' },
  startText: { fontSize: 18, fontWeight: '800', color: '#0F172A', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', textAlign: 'center' },
  
  car: { position: 'absolute', width: CAR_SIZE, height: CAR_SIZE + 20, alignItems: 'center', justifyContent: 'flex-end', zIndex: 5 },
  chassis: { width: 50, height: 80, backgroundColor: '#EF4444', borderRadius: 10, alignItems: 'center', paddingTop: 10, borderWidth: 3, borderColor: '#B91C1C' },
  accessoryEmoji: { fontSize: 24, position: 'absolute', top: -35, right: -5, transform: [{ rotate: '15deg' }] },
  
  obstacle: { position: 'absolute', width: OBSTACLE_SIZE, height: OBSTACLE_SIZE, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', padding: 30, borderRadius: 30, alignItems: 'center', width: '85%', maxWidth: 350, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 15 } }) },
  gameOverTitle: { fontSize: 28, fontWeight: '900', color: '#EF4444', marginBottom: 20 },
  scoreCard: { backgroundColor: '#F1F5F9', width: '100%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 24 },
  scoreCardTitle: { color: '#64748B', fontWeight: '800', marginBottom: 5 },
  scoreCardValue: { fontSize: 48, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  scoreCardDesc: { color: '#059669', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  highScoresContainer: { width: '100%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 15, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  highScoresTitle: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 5 },
  highScoreItem: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginVertical: 2 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnHome: { backgroundColor: '#94A3B8' },
  btnPlay: { backgroundColor: '#3B82F6' },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
