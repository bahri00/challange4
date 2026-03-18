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

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  satiety: number;
}

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'burger', name: 'Hamburger', emoji: '🍔', price: 5, satiety: 25 },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', price: 5, satiety: 25 },
  { id: 'lahmacun', name: 'Lahmacun', emoji: '🌮', price: 4, satiety: 22 },
  { id: 'kebab', name: 'Kebap', emoji: '🥘', price: 5, satiety: 25 },
  { id: 'sandwich', name: 'Sandviç', emoji: '🥪', price: 3, satiety: 20 },
  { id: 'ramen', name: 'Ramen', emoji: '🍜', price: 4, satiety: 22 },
  { id: 'salad', name: 'Salata', emoji: '🥗', price: 3, satiety: 20 },
];

interface FoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: FoodItem) => void;
  coins: number;
}

export default function FoodModal({ visible, onClose, onSelect, coins }: FoodModalProps) {
  const renderItem = ({ item }: { item: FoodItem }) => {
    const canAfford = coins >= item.price;

    return (
      <TouchableOpacity 
        style={[styles.foodCard, !canAfford && styles.disabledCard]} 
        onPress={() => {
          if (canAfford) {
            onSelect(item);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.foodEmojiWrapper}>
          <Text style={styles.foodEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodStats}>Doygunluk: +%{item.satiety}</Text>
        </View>
        <View style={[styles.priceTag, !canAfford && styles.priceTagDisabled]}>
          <Text style={styles.priceText}>🪙 {item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Menü 🍽️</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Evcil hayvanına ne ikram etmek istersin?</Text>

          <FlatList 
            data={FOOD_ITEMS}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    fontWeight: '600',
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
  listContainer: {
    paddingBottom: 8,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledCard: {
    opacity: 0.5,
  },
  foodEmojiWrapper: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foodEmoji: {
    fontSize: 30,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  foodStats: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  priceTag: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  priceTagDisabled: {
    backgroundColor: '#F1F5F9',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
});
