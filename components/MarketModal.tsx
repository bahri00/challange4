import React, { memo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';

export interface MarketItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

export const AVAILABLE_ITEMS: MarketItem[] = [
  { id: 'hat_cap', name: 'Şapka', emoji: '🧢', price: 50 },
  { id: 'hat_crown', name: 'Kral Tacı', emoji: '👑', price: 200 },
  { id: 'glasses_cool', name: 'Gözlük', emoji: '😎', price: 100 },
  { id: 'scarf_red', name: 'Atkı', emoji: '🧣', price: 75 },
  { id: 'headphones', name: 'Kulaklık', emoji: '🎧', price: 150 },
  { id: 'ribbon_pink', name: 'Fiyonk', emoji: '🎀', price: 60 },
  { id: 'mask_theater', name: 'Maske', emoji: '🎭', price: 120 },
  { id: 'diamond_neck', name: 'Elmas Kolye', emoji: '💎', price: 500 },
];

interface MarketModalProps {
  visible: boolean;
  coins: number;
  ownedItems: string[];
  equippedItem: string | null;
  onClose: () => void;
  onBuyItem: (item: MarketItem) => void;
  onEquipItem: (itemId: string | null) => void;
}

const MarketModal: React.FC<MarketModalProps> = ({ 
  visible, coins, ownedItems, equippedItem, onClose, onBuyItem, onEquipItem 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🛒 Market</Text>
            <Text style={styles.coins}>🪙 {coins}</Text>
          </View>

          <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
            {AVAILABLE_ITEMS.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped = equippedItem === item.id;

              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>

                  {isOwned ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, isEquipped ? styles.equippedBtn : styles.equipBtn]}
                      onPress={() => onEquipItem(isEquipped ? null : item.id)}
                    >
                      <Text style={styles.btnText}>
                        {isEquipped ? 'Çıkar' : 'Giy'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.buyBtn, coins < item.price && styles.disabledBtn]}
                      onPress={() => onBuyItem(item)}
                      disabled={coins < item.price}
                    >
                      <Text style={styles.btnText}>🪙 {item.price}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default memo(MarketModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  coins: { fontSize: 20, fontWeight: '800', color: '#F59E0B' },
  
  itemList: { flex: 1 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 }
    })
  },
  itemInfo: { flexDirection: 'row', alignItems: 'center' },
  itemEmoji: { fontSize: 32, marginRight: 12 },
  itemName: { fontSize: 18, fontWeight: '700', color: '#334155' },

  actionBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  buyBtn: { backgroundColor: '#3B82F6' },
  equipBtn: { backgroundColor: '#10B981' },
  equippedBtn: { backgroundColor: '#EF4444' },
  disabledBtn: { backgroundColor: '#94A3B8' },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  closeBtn: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});
