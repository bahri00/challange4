import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, Modal, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { AVAILABLE_ITEMS } from '@/components/MarketModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- OYUN FİZİK AYARLARI ---
const GRAVITY = 0.5; // Kütle çekimi azaltıldı (daha yavaş düşecek)
const JUMP_FORCE = -9; // Sıçrama gücü uyarlandı
let BASE_PIPE_SPEED = 2.5; // Boruların geliş hızı (değişken yapıldı ki değiştirebilelim)
const PIPE_WIDTH = 70;
const PIPE_GAP = 240; // Borular arası boşluk biraz artırıldı
const BIRD_SIZE = 60; // Pet boyutu
const COIN_SIZE = 40;

const STORAGE_KEY = '@tamagotchi_pro_state';
const BIRD_SCORES_KEY = '@tamagotchi_bird_highscores';
const GAME_COST = 15; // Oynama bedeli (sabit)

const getPetEvolution = (level: number) => {
  if (level >= 30) return '🐉';
  if (level >= 20) return '🦅';
  if (level >= 11) return '🐥';
  if (level >= 6) return '🐣';
  return '🥚';
};

const getAccessoryStyle = (level: number) => {
  if (level >= 30) return { fontSize: 35, top: -25, rotate: '0deg' }; // Dragon
  if (level >= 20) return { fontSize: 30, top: -20, rotate: '0deg' }; // Eagle
  if (level >= 11) return { fontSize: 25, top: -15, rotate: '0deg' }; // Chick
  if (level >= 6) return { fontSize: 20, top: -10, rotate: '0deg' };  // Hatching
  return { fontSize: 15, top: -5, rotate: '0deg' };                  // Egg
};

export default function BirdGameScene() {
  const router = useRouter();

  // --- STATE ---
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
  const [pipes, setPipes] = useState<{ x: number, topHeight: number, passed: boolean, hasCoin: boolean, coinCollected: boolean }[]>([]);
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

  // --- REFS FOR PHYSICS ---
  const birdYRef = useRef(SCREEN_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const difficultyMultiplier = useRef(1);
  const scoreRef = useRef(0);
  const collectedCoinsRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  // --- 1. VERİLERİ YÜKLE ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          const evolution = getPetEvolution(savedState.level || 1);
          const emoji = savedState.selectedSkin || evolution;
          const accessory = savedState.equippedItem ? AVAILABLE_ITEMS.find(i => i.id === savedState.equippedItem)?.emoji || null : null;
          const accessoryStyle = getAccessoryStyle(savedState.level || 1);
          
          setPetVisual({ 
            emoji, 
            accessory,
            level: savedState.level || 1
          });
        }
        
        const scoresStr = await AsyncStorage.getItem(BIRD_SCORES_KEY);
        if (scoresStr) {
          setHighScores(JSON.parse(scoresStr));
        }
      } catch(e) {}
    };
    loadData();
  }, []);

  // --- 3. OYUN DÖNGÜSÜ ---
  useEffect(() => {
    if (!hasStarted || isGameOver) return;

    const loop = () => {
      birdVelocity.current += GRAVITY;
      birdYRef.current += birdVelocity.current;
      setBirdY(birdYRef.current);

      const currentSpeed = BASE_PIPE_SPEED * difficultyMultiplier.current;

      setPipes(currentPipes => {
        let newPipes = currentPipes.map(pipe => {
          let passed = pipe.passed;
          if (!passed && pipe.x < (SCREEN_WIDTH / 2) - PIPE_WIDTH) {
            passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            if (scoreRef.current % 5 === 0) {
              difficultyMultiplier.current = Math.min(2, difficultyMultiplier.current + 0.1);
            }
          }

          // ALTIN KONTROLÜ
          let coinCollected = pipe.coinCollected;
          if (pipe.hasCoin && !coinCollected) {
            const birdLeft = SCREEN_WIDTH / 2 - (BIRD_SIZE / 2);
            const birdRight = SCREEN_WIDTH / 2 + (BIRD_SIZE / 2) - 10;
            const birdTop = birdYRef.current;
            const birdBottom = birdYRef.current + BIRD_SIZE - 10;
            
            const coinLeft = pipe.x + PIPE_WIDTH/2 - COIN_SIZE/2;
            const coinRight = coinLeft + COIN_SIZE;
            const coinTop = pipe.topHeight + PIPE_GAP/2 - COIN_SIZE/2;
            const coinBottom = coinTop + COIN_SIZE;

            if (birdRight > coinLeft && birdLeft < coinRight && birdBottom > coinTop && birdTop < coinBottom) {
              coinCollected = true;
              collectedCoinsRef.current += 1;
              setCollectedCoins(collectedCoinsRef.current);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }

          return { ...pipe, x: pipe.x - currentSpeed, passed, coinCollected };
        }).filter(pipe => pipe.x > -PIPE_WIDTH);

        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < SCREEN_WIDTH - 250) {
          const maxTop = SCREEN_HEIGHT - PIPE_GAP - 150;
          const topHeight = Math.max(100, Math.floor(Math.random() * maxTop));
          // %40 ihtimalle boru arasına altın koy
          const hasCoin = Math.random() < 0.4;
          newPipes.push({ x: SCREEN_WIDTH, topHeight, passed: false, hasCoin, coinCollected: false });
        }

        return newPipes;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, isGameOver]);

  // --- 4. ÇARPIŞMA KONTROLÜ ---
  useEffect(() => {
    if (!hasStarted || isGameOver) return;

    if (birdY > SCREEN_HEIGHT - 100 || birdY < -50) {
      handleGameOver();
      return;
    }

    const birdLeft = SCREEN_WIDTH / 2 - (BIRD_SIZE / 2);
    const birdRight = SCREEN_WIDTH / 2 + (BIRD_SIZE / 2) - 10;
    const birdTop = birdY;
    const birdBottom = birdY + BIRD_SIZE - 10;

    for (let pipe of pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
          handleGameOver();
        }
      }
    }
  }, [birdY, pipes, hasStarted, isGameOver]);

  // --- 5. OYUN AKSİYONLARI ---
  const handleJump = () => {
    if (!hasStarted) {
      setHasStarted(true);
    }
    if (!isGameOver) {
      birdVelocity.current = JUMP_FORCE;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setHasStarted(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    updateHighScores();
  };

  const updateHighScores = async () => {
    const finalScore = scoreRef.current;
    if (finalScore === 0) return;
    try {
      let newScores = [...highScores, finalScore];
      newScores.sort((a, b) => b - a); // descending
      // Keep unique top 3, or just top 3
      newScores = [...new Set(newScores)].slice(0, 3);
      setHighScores(newScores);
      await AsyncStorage.setItem(BIRD_SCORES_KEY, JSON.stringify(newScores));
    } catch(e) {}
  };

  const resetGame = () => {
    birdYRef.current = SCREEN_HEIGHT / 2;
    setBirdY(SCREEN_HEIGHT / 2);
    birdVelocity.current = 0;
    scoreRef.current = 0;
    collectedCoinsRef.current = 0;
    setCollectedCoins(0);
    difficultyMultiplier.current = 1;
    setPipes([]);
    setScore(0);
    setIsGameOver(false);
    setHasStarted(false);
  };

  // --- 6. KAYDET VE ZARAR / KAZANÇ UYGULA ---
  const saveAndExit = async () => {
    try {
      const savedStateStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedStateStr) {
        const state = JSON.parse(savedStateStr);
        
        const newHappiness = Math.min(100, state.happiness + (score * 3));
        const newEnergy = Math.max(0, state.energy - GAME_COST); // -15 Enerji
        
        // Altın = Geçilen Boru sayısı (score * 5) + Toplanan Altın (collectedCoins)
        const totalCoinsEarned = (score * 5) + collectedCoins;
        const newCoins = state.coins + totalCoinsEarned;

        let newXp = state.xp + score;
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
    // HasStarted ise ve oyun bitmemişse direkt geri dön (Ödül veya ceza yok)
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={handleJump}>
      <View style={styles.container}>
        
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
            <Text style={styles.startText}>Zıplamak için Dokun!</Text>
          </View>
        )}

        <View style={[styles.bird, { top: birdY, left: SCREEN_WIDTH / 2 - BIRD_SIZE / 2 }]}>
          <Text style={{ fontSize: BIRD_SIZE }}>{petVisual.emoji}</Text>
          {petVisual.accessory && (
            <Text style={[
              styles.accessoryEmoji, 
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

        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            <View style={[styles.pipe, { left: pipe.x, top: 0, height: pipe.topHeight }]} />
            <View style={[styles.pipe, { left: pipe.x, top: pipe.topHeight + PIPE_GAP, bottom: 0, height: SCREEN_HEIGHT - (pipe.topHeight + PIPE_GAP)}]} />
            
            {/* Altın İkonu */}
            {pipe.hasCoin && !pipe.coinCollected && (
              <View style={[styles.coinContainer, { left: pipe.x + PIPE_WIDTH/2 - COIN_SIZE/2, top: pipe.topHeight + PIPE_GAP/2 - COIN_SIZE/2 }]}>
                <Text style={{ fontSize: 30 }}>🪙</Text>
              </View>
            )}
          </React.Fragment>
        ))}

        <Modal visible={isGameOver} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.gameOverTitle}>OYUN BİTTİ!</Text>
              
              <View style={styles.scoreCard}>
                <Text style={styles.scoreCardTitle}>SKOR</Text>
                <Text style={styles.scoreCardValue}>{score}</Text>
                <Text style={styles.scoreCardDesc}>+{score * 3} Mutluluk / +{score} XP</Text>
                <Text style={styles.scoreCardDesc}>🪙 +{(score * 5) + collectedCoins} Toplam Altın</Text>
                <Text style={styles.scoreCardDesc}>-{GAME_COST} Enerji</Text>
              </View>

              {highScores.length > 0 && (
                <View style={styles.highScoresContainer}>
                  <Text style={styles.highScoresTitle}>En İyi Skorlar</Text>
                  {highScores.map((h, i) => (
                    <Text key={i} style={styles.highScoreItem}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {h} Puan
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
  container: { flex: 1, backgroundColor: '#7DD3FC', overflow: 'hidden' },
  navBar: { position: 'absolute', top: 40, left: 20, zIndex: 20 },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  backBtnText: { color: '#FFF', fontWeight: '800' },
  scoreBoard: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 10 },
  // Diğer stiller (Bird, Pipes, Modal vs)
  scoreText: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  coinText: { fontSize: 24, fontWeight: '800', color: '#FDE047', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, marginTop: 4 },
  startOverlay: { position: 'absolute', top: '40%', width: '100%', alignItems: 'center' },
  startText: { fontSize: 24, fontWeight: '800', color: '#0F172A', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
  bird: { position: 'absolute', width: BIRD_SIZE, height: BIRD_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  accessoryEmoji: { fontSize: 30, position: 'absolute', top: -10, right: 0, transform: [{ rotate: '15deg' }] },
  pipe: { position: 'absolute', width: PIPE_WIDTH, backgroundColor: '#84CC16', borderColor: '#4D7C0F', borderWidth: 4, borderRadius: 8 },
  coinContainer: { position: 'absolute', width: COIN_SIZE, height: COIN_SIZE, justifyContent: 'center', alignItems: 'center', zIndex: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 30, alignItems: 'center', width: '85%', maxWidth: 350, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 15 } }) },
  gameOverTitle: { fontSize: 28, fontWeight: '900', color: '#EF4444', marginBottom: 15 },
  scoreCard: { backgroundColor: '#F1F5F9', width: '100%', padding: 15, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
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
