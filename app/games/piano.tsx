import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { AVAILABLE_ITEMS } from '@/components/MarketModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LANE_WIDTH = SCREEN_WIDTH / 4;
const TILE_HEIGHT = 120;
const HIT_ZONE_Y = SCREEN_HEIGHT - 160;
const GAME_COST = 20;

const STORAGE_KEY = '@tamagotchi_pro_state';
const PIANO_SCORES_KEY = '@tamagotchi_piano_highscores';

// Audio URLs (Tek ses dosyası ile pitch shifting yapılacak)
const ERROR_SOUND_URL = 'https://s3.amazonaws.com/freecodecamp/drums/Kick_n_Hat.mp3'; // Yanlış tıklama sesi

const getPetEvolution = (level: number) => {
  if (level >= 30) return '🐉';
  if (level >= 20) return '🦅';
  if (level >= 11) return '🐥';
  if (level >= 6) return '🐣';
  return '🥚';
};

const getAccessoryStyle = (level: number) => {
  if (level >= 30) return { fontSize: 25, top: -15 };
  if (level >= 20) return { fontSize: 22, top: -12 };
  if (level >= 11) return { fontSize: 20, top: -10 };
  if (level >= 6) return { fontSize: 18, top: -8 };
  return { fontSize: 15, top: -5 };
};

export default function PianoGameScene() {
  const router = useRouter();

  const [tiles, setTiles] = useState<{ id: number, lane: number, y: number, noteIndex: number }[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [petVisual, setPetVisual] = useState({ 
    emoji: '🥚', 
    accessory: null as string | null,
    level: 1
  });
  const [highScores, setHighScores] = useState<number[]>([]);

  const frameRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const tileIdRef = useRef(0);
  const velocityRef = useRef(6); // Hız lineer artacak
  const lastSpawnYRef = useRef(0);
  const noteIndexRef = useRef(0);
  
  // Tekil Audio Objeleri
  const errorAudioRef = useRef<Audio.Sound | null>(null);
  const bgAudioRef = useRef<Audio.Sound | null>(null);

  // --- 1. PRE-LOAD AUDIO & DATA ---
  useEffect(() => {
    const init = async () => {
      try {
        // Load Pet Data
        const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStateStr) {
          const state = JSON.parse(savedStateStr);
          const evolution = getPetEvolution(state.level || 1);
          const emoji = state.selectedSkin || evolution;
          const accessory = state.equippedItem ? AVAILABLE_ITEMS.find(i => i.id === state.equippedItem)?.emoji || null : null;
          setPetVisual({ emoji, accessory, level: state.level || 1 });
        }
        
        const scoresStr = await AsyncStorage.getItem(PIANO_SCORES_KEY);
        if (scoresStr) setHighScores(JSON.parse(scoresStr));

        // Load Audio async (Artık sadece hata sesi ve arka plan müziği yüklüyoruz)
        setIsReady(false);
        const { sound: errorSound } = await Audio.Sound.createAsync({ uri: ERROR_SOUND_URL });
        const { sound: bgSound } = await Audio.Sound.createAsync(require('../../assets/sounds/mozart.mp3'));
        
        await bgSound.setIsLoopingAsync(true);
        await bgSound.setRateAsync(0.7, false); // Başlangıç hızı 0.7x
        
        errorAudioRef.current = errorSound;
        bgAudioRef.current = bgSound;
        setIsReady(true);
      } catch(e) {
        console.warn("Audio loading error:", e);
        setIsReady(true);
      }
    };
    init();

    return () => {
      // Memory cleanup: Unload sounds
      if (errorAudioRef.current) errorAudioRef.current.unloadAsync().catch(() => {});
      if (bgAudioRef.current) bgAudioRef.current.unloadAsync().catch(() => {});
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // --- 2. GAME LOOP (Falling Tiles) & BG MUSIC ---
  useEffect(() => {
    if (hasStarted && !isGameOver) {
      bgAudioRef.current?.playAsync();
    } else {
      bgAudioRef.current?.pauseAsync();
    }
  }, [hasStarted, isGameOver]);

  useEffect(() => {
    if (!hasStarted || isGameOver) return;

    const loop = () => {
      // Hız lineer artar: Başlangıç 6, her puanda çok hafif hızlanır (+0.02)
      velocityRef.current = 6 + (scoreRef.current * 0.02);

      setTiles(currentTiles => {
        let yOffset = velocityRef.current;
        let newTiles = currentTiles.map(t => ({ ...t, y: t.y + yOffset }));

        // Check for missed tiles (Game Over condition)
        for (let t of newTiles) {
          if (t.y > SCREEN_HEIGHT) {
            handleGameOver(false);
            return currentTiles; // Stop updates
          }
        }

        // Spawn new tiles
        const lastTile = newTiles.length > 0 ? newTiles[newTiles.length - 1] : null;
        if (!lastTile || lastTile.y > 0) {
          tileIdRef.current += 1;
          const lane = Math.floor(Math.random() * 4);
          newTiles.push({
            id: tileIdRef.current,
            lane,
            y: !lastTile ? -TILE_HEIGHT : lastTile.y - TILE_HEIGHT - 60, // İlk tile tam yukarıdan başlar
            noteIndex: noteIndexRef.current
          });
          noteIndexRef.current += 1;
        }

        return newTiles;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, isGameOver]);

  const playErrorSound = async () => {
    try {
      if (errorAudioRef.current) {
        await errorAudioRef.current.replayAsync();
      }
    } catch (e) { }
  };

  const handleLaneTap = (tappedLane: number) => {
    if (!hasStarted && isReady && !isGameOver) {
      setHasStarted(true);
      return;
    }
    if (isGameOver) return;

    // Bulunduğumuz lane'deki en aşağıdaki TILE'ı bul (Tıklanabilir alanda olmalı)
    const lowestTile = [...tiles]
      .filter(t => t.lane === tappedLane)
      .sort((a, b) => b.y - a.y)[0];

    // Ekranın belirli bir Tıklanma Alanından (örn: Y > 200) aşağısında geçerli sayalım (Farklı tarzlar var, biz ekranda tamamen çıkanlara kabul edelim)
    if (lowestTile && lowestTile.y > SCREEN_HEIGHT / 3) {
      // Başarılı Tıklama
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      scoreRef.current += 1;
      setScore(scoreRef.current);

      // Müzik hızını 0.7'ten başlatıp çok daha yavaş artır
      const targetRate = 0.7 + (scoreRef.current * 0.005);
      const safeRate = Math.min(targetRate, 3.0);
      
      // Performans iyileştirmesi: Sesi her defasında değil, sadece belli bir aşamada güncelle (Kasmayı önler)
      if (scoreRef.current % 3 === 0) {
        bgAudioRef.current?.setRateAsync(safeRate, false).catch(() => {});
      }

      // Sadece en aşağıdaki tile'ı ekrandan (arrayden) çıkar (unmount)
      setTiles(prev => prev.filter(t => t.id !== lowestTile.id));
    } else {
      // Hatalı yere basıldı (Boş sütun veya TILE çok yukarıda)
      handleGameOver(true);
    }
  };

  const handleGameOver = (wrongTap: boolean) => {
    if (wrongTap) {
      playErrorSound(); // Error sound
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setIsGameOver(true);
    setHasStarted(false);
    updateHighScores();
  };

  const updateHighScores = async () => {
    const finalScore = scoreRef.current;
    if (finalScore === 0) return;
    try {
      let newScores = [...highScores, finalScore];
      newScores.sort((a, b) => b - a);
      newScores = [...new Set(newScores)].slice(0, 3);
      setHighScores(newScores);
      await AsyncStorage.setItem(PIANO_SCORES_KEY, JSON.stringify(newScores));
    } catch(e) {}
  };

  const resetGame = () => {
    setTiles([]);
    setScore(0);
    scoreRef.current = 0;
    tileIdRef.current = 0;
    noteIndexRef.current = 0;
    velocityRef.current = 6;
    bgAudioRef.current?.setRateAsync(0.7, false);
    bgAudioRef.current?.setPositionAsync(0);
    setIsGameOver(false);
    setHasStarted(false);
  };

  const saveAndExit = async () => {
    try {
      const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedStateStr) {
        const state = JSON.parse(savedStateStr);
        
        let addedHappiness = score; // Her nota +1
        let addedXp = score; // Her nota +1
        
        // Master Pianist Bonus (20 nota bitirmek)
        if (score >= 20) {
          addedHappiness += 10;
          addedXp += 20;
        }

        const newHappiness = Math.min(100, state.happiness + addedHappiness);
        const newEnergy = Math.max(0, state.energy - GAME_COST);

        let newXp = state.xp + addedXp;
        let newLevel = state.level;
        while (newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
        }

        const updatedState = { ...state, happiness: newHappiness, energy: newEnergy, xp: newXp, level: newLevel, lastSeen: Date.now() };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      }
    } catch (e) {} finally {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      
      {/* 4 ŞERİT DİZİLİMİ */}
      <View style={styles.board}>
        {[0, 1, 2, 3].map(lane => (
          <TouchableOpacity 
            key={lane} 
            activeOpacity={0.7} 
            style={[styles.lane, { left: lane * LANE_WIDTH, width: LANE_WIDTH }]} 
            onPress={() => handleLaneTap(lane)}
          >
            <View style={styles.laneDivider} />
          </TouchableOpacity>
        ))}
      </View>

      {/* GERİ BUTONU */}
      <SafeAreaView style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>✕ Çıkış</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <SafeAreaView style={styles.scoreBoard}>
        <Text style={styles.scoreText}>{score}</Text>
        {score >= 20 && <Text style={styles.masterBadge}>🏆 Master Pianist!</Text>}
      </SafeAreaView>

      {!hasStarted && !isGameOver && (
        <View style={styles.startOverlay} pointerEvents="none">
          <Text style={styles.startText}>{isReady ? 'Herhangi bir şeride dokun!' : 'Yükleniyor...'}</Text>
        </View>
      )}

      {/* DÜŞEN TİLE'LAR */}
      <View pointerEvents="none" style={styles.fallingTilesLayer}>
        {tiles.map(item => (
          <View 
            key={item.id} 
            style={[styles.tile, { 
              left: item.lane * LANE_WIDTH, 
              width: LANE_WIDTH, 
              top: item.y 
            }]}
          >
            <Text style={styles.tileEmoji}>{petVisual.emoji}</Text>
            {petVisual.accessory && (
              <Text style={[
                styles.tileAccessory, 
                { 
                  fontSize: getAccessoryStyle(petVisual.level).fontSize,
                  top: getAccessoryStyle(petVisual.level).top,
                  left: 0,
                  right: 0,
                  textAlign: 'center'
                }
              ]}>
                {petVisual.accessory}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* OYUN BİTTİ EKRANI */}
      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.gameOverTitle}>OYUN BİTTİ!</Text>
            
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardTitle}>DOĞRU NOTA</Text>
              <Text style={styles.scoreCardValue}>{score}</Text>
              
              {score >= 20 ? (
                <>
                  <Text style={styles.scoreCardDesc}>+{score + 10} Mutluluk (Master Bonus)</Text>
                  <Text style={styles.scoreCardDesc}>+{score + 20} XP (Master Bonus)</Text>
                </>
              ) : (
                <>
                  <Text style={styles.scoreCardDesc}>+{score} Mutluluk / +{score} XP</Text>
                </>
              )}
              
              <Text style={styles.scoreCardDesc}>-{GAME_COST} Enerji</Text>
            </View>

            {highScores.length > 0 && (
              <View style={styles.highScoresContainer}>
                <Text style={styles.highScoresTitle}>En İyi Skorlar</Text>
                {highScores.map((h, i) => (
                  <Text key={i} style={styles.highScoreItem}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {h} Nota
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  board: { flex: 1, flexDirection: 'row', width: '100%', height: '100%', position: 'absolute' },
  lane: { position: 'absolute', height: '100%', backgroundColor: '#FFFFFF' },
  laneDivider: { position: 'absolute', right: 0, width: 1, height: '100%', backgroundColor: '#E2E8F0' },
  
  navBar: { position: 'absolute', top: 40, left: 20, zIndex: 20 },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  backBtnText: { color: '#FFF', fontWeight: '800' },
  
  scoreBoard: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 10 },
  scoreText: { fontSize: 64, fontWeight: '900', color: '#3B82F6', textShadowColor: 'rgba(255, 255, 255, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  masterBadge: { fontSize: 18, fontWeight: '800', color: '#EAB308', backgroundColor: '#FEF08A', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 5, overflow: 'hidden' },
  
  startOverlay: { position: 'absolute', top: '40%', width: '100%', alignItems: 'center', zIndex: 11 },
  startText: { fontSize: 18, fontWeight: '800', color: '#0F172A', backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' },
  
  fallingTilesLayer: { position: 'absolute', width: '100%', height: '100%', zIndex: 5 },
  tile: { position: 'absolute', height: TILE_HEIGHT, backgroundColor: '#1E293B', borderWidth: 2, borderColor: '#000', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tileEmoji: { fontSize: 40 },
  tileAccessory: { fontSize: 25, position: 'absolute', top: -5, right: '10%', transform: [{ rotate: '15deg' }] },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 30, alignItems: 'center', width: '85%', maxWidth: 350, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 15 } }) },
  gameOverTitle: { fontSize: 28, fontWeight: '900', color: '#EF4444', marginBottom: 15 },
  scoreCard: { backgroundColor: '#F1F5F9', width: '100%', padding: 15, borderRadius: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  scoreCardTitle: { color: '#64748B', fontWeight: '800', marginBottom: 5 },
  scoreCardValue: { fontSize: 48, fontWeight: '900', color: '#0F172A', marginBottom: 5 },
  scoreCardDesc: { color: '#059669', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  highScoresContainer: { width: '100%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 15, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  highScoresTitle: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 5 },
  highScoreItem: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginVertical: 2 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnHome: { backgroundColor: '#94A3B8' },
  btnPlay: { backgroundColor: '#3B82F6' },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
