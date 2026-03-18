import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  PanResponder, 
  Platform,
  Dimensions
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing,
  ZoomIn,
  FadeOut
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { AVAILABLE_ITEMS } from '@/components/MarketModal';

interface BathModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  level: number;
  equippedItem: string | null;
  selectedSkin: string | null;
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
    return { fontSize: 70, top: -45, rotate: '0deg' };
  }
  if (level >= 20) { // Eagle
    return { fontSize: 65, top: -35, rotate: '0deg' };
  }
  if (level >= 11) { // Chick
    return { fontSize: 50, top: -20, rotate: '0deg' };
  }
  if (level >= 6) { // Hatching
    return { fontSize: 40, top: -10, rotate: '0deg' };
  }
  return { fontSize: 30, top: -5, rotate: '0deg' }; // Egg
};

const DirtOverlay = ({ visible, hygiene }: { visible: boolean, hygiene: number }) => {
  if (!visible || hygiene >= 75) return null;

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

const FOAM_TARGET = 35; // Number of foams to reach 100% coverage
const PET_AREA_SIZE = 240; // The bounding box for the pet

export default function BathModal({ visible, onClose, onComplete, level, equippedItem, selectedSkin }: BathModalProps) {
  const [phase, setPhase] = useState<'foaming' | 'rinsing'>('foaming');
  const [foams, setFoams] = useState<{ id: string; x: number; y: number; size: number }[]>([]);
  const [showerPos, setShowerPos] = useState<{ x: number; y: number } | null>(null);

  // Audio references
  const completeSoundRef = useRef<Audio.Sound | null>(null);
  const waterSoundRef = useRef<Audio.Sound | null>(null);
  
  // Ref for phase to avoid stale closures in PanResponder
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Floating animation for pet
  const floatY = useSharedValue(0);

  // Load Sounds
  useEffect(() => {
    async function loadAudio() {
      try {
        // We use remote URIs to ensure they work without local file imports
        const { sound: cmpSound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=success-1-6297.mp3' } // simple ting
        );
        completeSoundRef.current = cmpSound;

        const { sound: wSound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_51c6e18af4.mp3?filename=water-running-84180.mp3' } // running water
        );
        await wSound.setIsLoopingAsync(true);
        waterSoundRef.current = wSound;
      } catch (e) {
        console.warn("Failed to load audio files, haptics will be used instead", e);
      }
    }
    loadAudio();

    return () => {
      // Cleanup
      if (completeSoundRef.current) completeSoundRef.current.unloadAsync();
      if (waterSoundRef.current) waterSoundRef.current.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setPhase('foaming');
      setFoams([]);
      setShowerPos(null);
      floatY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      stopWaterSound();
    }
  }, [visible, floatY]);

  const stopWaterSound = async () => {
    if (waterSoundRef.current) {
      const status = await waterSoundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await waterSoundRef.current.pauseAsync();
      }
    }
  };

  const playWaterSound = async () => {
    if (waterSoundRef.current) {
      const status = await waterSoundRef.current.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await waterSoundRef.current.playAsync();
      }
    }
  };

  const handleWashComplete = async () => {
    stopWaterSound();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const finishFoamingPhase = async () => {
    if (phase === 'rinsing') return;
    setPhase('rinsing');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (completeSoundRef.current) {
      try { await completeSoundRef.current.playFromPositionAsync(0); } catch(e){}
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (phaseRef.current === 'rinsing') {
          playWaterSound();
          setShowerPos({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const x = evt.nativeEvent.locationX;
        const y = evt.nativeEvent.locationY;

        if (phaseRef.current === 'foaming') {
          setFoams(prev => {
            if (prev.length < FOAM_TARGET) {
              const last = prev[prev.length - 1];
              if (!last || Math.hypot(last.x - x, last.y - y) > 20) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const newFoams = [...prev, { 
                  id: Math.random().toString(), 
                  x, 
                  y,
                  size: Math.random() * 30 + 35 // 35 to 65
                }];
                if (newFoams.length >= FOAM_TARGET) {
                  setTimeout(finishFoamingPhase, 200);
                }
                return newFoams;
              }
            }
            return prev;
          });
        } else if (phaseRef.current === 'rinsing') {
          setShowerPos({ x, y });
          setFoams(prev => {
            const remaining = prev.filter(f => Math.hypot(f.x - x, f.y - y) > 50); // Increased interaction radius
            if (remaining.length !== prev.length) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (remaining.length === 0 && prev.length > 0) {
              setTimeout(handleWashComplete, 600);
            }
            return remaining;
          });
        }
      },
      onPanResponderRelease: () => {
        if (phaseRef.current === 'rinsing') {
          stopWaterSound();
          setShowerPos(null);
        }
      },
    })
  ).current;

  // Render variables
  const animatedPetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }]
  }));
  const accessory = equippedItem ? AVAILABLE_ITEMS.find(i => i.id === equippedItem)?.emoji : null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.headerRow}>
            <Text style={styles.title}>Banyo Vakti 🛁</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.instructions}>
            {phase === 'foaming' 
              ? `Pet'in üzerini sabunla ovalayarak köpürt!` 
              : `Şimdi duş başlığı ile köpükleri durula!`}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: phase === 'foaming' ? '#E2E8F0' : '#DCFCE7' }]}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, Math.round((foams.length / FOAM_TARGET) * 100))}%`,
                    backgroundColor: phase === 'foaming' ? '#3B82F6' : '#22C55E'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {phase === 'foaming' 
                ? `%${Math.min(100, Math.round((foams.length / FOAM_TARGET) * 100))} Köpüklendi`
                : foams.length === 0 ? 'Tertemiz!' : 'Durulanıyor...'}
            </Text>
          </View>

          <View style={styles.interactionArea}>
            <View 
              {...panResponder.panHandlers} 
              style={styles.petStage}
            >
              {/* Pet Render */}
              <Animated.View style={[styles.petWrapper, animatedPetStyle]} pointerEvents="none">
                <View style={styles.glowEffect} />
                <Text style={styles.petEmoji}>{selectedSkin || getPetEvolution(level)}</Text>
                
                {/* Visual Dirtiness during Wash Phase */}
                <DirtOverlay visible={phase === 'foaming'} hygiene={0} /> 

                {accessory && (
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
              </Animated.View>

              {/* Foams Render */}
              {foams.map(f => (
                <Animated.View
                  key={f.id}
                  entering={ZoomIn.springify()}
                  exiting={FadeOut.duration(300)}
                  pointerEvents="none"
                  style={[
                    styles.foam, 
                    { 
                      left: f.x - f.size / 2, 
                      top: f.y - f.size / 2, 
                      width: f.size, 
                      height: f.size,
                      borderRadius: f.size / 2
                    }
                  ]}
                />
              ))}

              {/* Cursor / Tool Indicator */}
              {phase === 'foaming' && (
                <View style={styles.toolFloatingIcon} pointerEvents="none">
                  <Text style={{ fontSize: 44, opacity: 0.4 }}>🧼</Text>
                </View>
              )}
              {phase === 'rinsing' && (
                <View 
                  style={[
                    styles.showerHead, 
                    showerPos ? { left: showerPos.x - 25, top: showerPos.y - 45 } : { right: 20, top: 20 }
                  ]} 
                  pointerEvents="none"
                >
                  <Text style={{ fontSize: 55 }}>🚿</Text>
                  {showerPos && <Text style={{ fontSize: 20, position: 'absolute', bottom: -10, left: 10 }}>💧</Text>}
                </View>
              )}
              
              {/* Flash Transition Effect */}
              {phase === 'rinsing' && foams.length === FOAM_TARGET && (
                <Animated.View 
                  entering={ZoomIn.duration(400)}
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }]} 
                  pointerEvents="none"
                />
              )}
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 15 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontWeight: 'bold',
    color: '#64748B',
  },
  instructions: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600'
  },
  interactionArea: {
    width: '100%',
    alignItems: 'center',
  },
  petStage: {
    width: PET_AREA_SIZE,
    height: PET_AREA_SIZE,
    backgroundColor: '#E0F2FE', // light blue bathroom floor
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  petWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    backgroundColor: '#BAE6FD',
    borderRadius: 70,
    opacity: 0.5,
  },
  petEmoji: {
    fontSize: 120,
  },
  accessoryEmoji: {
    position: 'absolute',
  },
  foam: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.5)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  toolFloatingIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  showerHead: {
    position: 'absolute',
    zIndex: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  progressTrack: {
    width: '80%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
});
