import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface SkinItem {
  id: string;
  emoji: string;
  name: string;
  minLevel: number;
}

const SKINS: SkinItem[] = [
  { id: 'egg', emoji: '🥚', name: 'Yumurta', minLevel: 1 },
  { id: 'hatch', emoji: '🐣', name: 'Yeni Çıkmış', minLevel: 6 },
  { id: 'chick', emoji: '🐥', name: 'Civciv', minLevel: 11 },
  { id: 'eagle', emoji: '🦅', name: 'Kartal', minLevel: 20 },
  { id: 'dragon', emoji: '🐉', name: 'Ejderha', minLevel: 30 },
];

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSkin: (skinEmoji: string | null) => void;
  level: number;
  selectedSkin: string | null;
}

export default function ProfileModal({ 
  visible, 
  onClose, 
  onSelectSkin, 
  level, 
  selectedSkin 
}: ProfileModalProps) {

  const renderItem = ({ item }: { item: SkinItem }) => {
    const isUnlocked = level >= item.minLevel;
    const isSelected = selectedSkin === item.emoji || (!selectedSkin && item.emoji === getAutoSkin(level));

    return (
      <TouchableOpacity 
        style={[
          styles.skinCard, 
          !isUnlocked && styles.lockedCard,
          isSelected && styles.selectedCard
        ]} 
        onPress={() => {
          if (isUnlocked) {
            onSelectSkin(item.emoji);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }}
        disabled={!isUnlocked}
      >
        <Text style={[styles.skinEmoji, !isUnlocked && styles.lockedEmoji]}>
          {isUnlocked ? item.emoji : '🔒'}
        </Text>
        <View style={styles.skinInfo}>
          <Text style={styles.skinName}>{item.name}</Text>
          <Text style={styles.skinRequirement}>
            Seviye {item.minLevel}+
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getAutoSkin = (lvl: number) => {
    if (lvl >= 30) return '🐉';
    if (lvl >= 20) return '🦅';
    if (lvl >= 11) return '🐥';
    if (lvl >= 6) return '🐣';
    return '🥚';
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Koleksiyon 🏆</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Seviye atladıkça yeni görünümlerin kilidini açarsın. İstediğin görünüme geçebilirsin!
          </Text>

          <FlatList 
            data={SKINS}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
          />
          
          <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={() => onSelectSkin(null)}
          >
            <Text style={styles.resetBtnText}>Otomatik Gelişime Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontWeight: 'bold',
    color: '#64748B',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  skinCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  lockedCard: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  skinEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  skinInfo: {
    alignItems: 'center',
  },
  skinName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  skinRequirement: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#8B5CF6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resetBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  resetBtnText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 15,
  },
});
