import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface DeveloperCardProps {
  ad: string;
  uzmanlik: string;
  seviye: string;
  musaitMi: boolean;
  aclikSeviyesi: number;
  onToggleMusaitlik: () => void;
  onYemekYe: () => void;
}

// --- BİLEŞEN: DeveloperCard (Sunum / Presentational Component) ---
// BEST PRACTICE: Modülerliği artırmak için UI (Arayüz) ayrı bir bileşen olarak tasarlanmıştır.
// Bu sayede bileşen sadece veriyi alır (Props) ve gösterir, iç state barındırmaz (Dumb Component).
const DeveloperCard: React.FC<DeveloperCardProps> = ({ 
  ad, 
  uzmanlik, 
  seviye, 
  musaitMi, 
  aclikSeviyesi, 
  onToggleMusaitlik, 
  onYemekYe 
}) => {
  
  // BEST PRACTICE: Dinamik stiller/değerler için inline mantık (inline logic) kurmak yerine
  // bileşenin en üstünde okunabilir değişkenler oluşturmak temiz kodun gereğidir.
  const cardBorderColor = musaitMi ? '#10B981' : '#EF4444'; // Müsaitse zümrüt yeşili, değilse kırmızı
  const statusText = musaitMi ? '😎 Müsait (Kodlama Yapabilir)' : '🛑 Rahatsız Etmeyin (Odakta)';

  return (
    <View style={[styles.cardContainer, { borderColor: cardBorderColor }]}>
      
      {/* Profil Bilgileri */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{ad.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nameText}>{ad}</Text>
          <Text style={styles.roleText}>{uzmanlik} • {seviye}</Text>
        </View>
      </View>

      {/* Dinamik Durum Alanı */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.hungerText}>
          Açlık Seviyesi: {aclikSeviyesi > 70 ? '🍕 Çok Aç' : aclikSeviyesi > 30 ? '🤔 İdare Eder' : '🔋 Tok'} ({aclikSeviyesi}%)
        </Text>
      </View>

      {/* Aksiyon Butonları */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.toggleButton]} 
          onPress={onToggleMusaitlik}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Durumu Değiştir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.feedButton, aclikSeviyesi === 0 && styles.disabledButton]} 
          onPress={onYemekYe}
          disabled={aclikSeviyesi === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Pizza Ismarla 🍕</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
};

// BEST PRACTICE: React.memo kullanımı, ebeveyn bileşen render olsa dahi
// bu bileşene gelen propslar değişmediği sürece yeniden render edilmesini engeller.
// Bu, özellikle büyük listelerde veya sık güncellenen uygulamalarda ciddi performans kazancı sağlar.
export default memo(DeveloperCard);

// --- STİLLER ---
// BEST PRACTICE: Stilleri component gövdesi dışında oluşturmak, her render döngüsünde 
// bu stil objesinin tekrar tekrar oluşturulmasını (memory allocation) engeller.
const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,           // Yumuşak köşeler
    borderWidth: 2,             // Duruma göre dinamik renklenen border
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,          // Android için yumuşak ve derin gölge
      },
      web: {
        boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
      }
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6', // Okyanus Mavisi
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A', // Siyahın çok sert olmasını engeller (Slate-900)
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#64748B', // Slate-500
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusContainer: {
    backgroundColor: '#F1F5F9', // Çok açık gri alan (Slate-100)
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  hungerText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // React Native v0.71+ flexbox gap desteği
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: '#0F172A', // Lacivertimsi siyah (Kontrastlı CTA)
  },
  feedButton: {
    backgroundColor: '#F59E0B', // Pizza/Enerji rengi (Amber-500)
  },
  disabledButton: {
    backgroundColor: '#D1D5DB', // İnaktif/Tok durum rengi
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
