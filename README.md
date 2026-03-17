# Yazılımcı Kimlik Kartı Projesi

Bu proje, React Native kullanılarak "Clean Code" prensipleri doğrultusunda geliştirilmiş "Yazılımcı Kimlik Kartı" bileşenini barındırır. State yönetimi ana bileşende (App), UI bileşeni ise ayrı bir dosyada tutularak (DeveloperCard) tam modüler bir mimari elde edilmiştir.

---

## 1. Uygulamanın Ana Kodları (Son Hal)

Uygulamanın kodları şu iki ana dosyaya bölünmüştür:

**`app/(tabs)/index.tsx` (Logic ve Ana State Dosyası):**
```tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import DeveloperCard from '@/components/DeveloperCard';

export default function HomeScreen() {
  const [musaitMi, setMusaitMi] = useState(true);
  const [aclikSeviyesi, setAclikSeviyesi] = useState(60); 

  const handleToggleMusaitlik = useCallback(() => {
    setMusaitMi((prev) => !prev);
  }, []);

  const handleYemekYe = useCallback(() => {
    setAclikSeviyesi((prev) => Math.max(0, prev - 25)); 
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DeveloperCard 
          ad="Bahri Talha Baş" 
          uzmanlik="React Native"
          seviye="Senior"
          musaitMi={musaitMi}
          aclikSeviyesi={aclikSeviyesi}
          onToggleMusaitlik={handleToggleMusaitlik}
          onYemekYe={handleYemekYe}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' },
});
```

**`components/DeveloperCard.tsx` (UI ve Sunum Dosyası):**
```tsx
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

const DeveloperCard: React.FC<DeveloperCardProps> = ({ 
  ad, 
  uzmanlik, 
  seviye, 
  musaitMi, 
  aclikSeviyesi, 
  onToggleMusaitlik, 
  onYemekYe 
}) => {
  const cardBorderColor = musaitMi ? '#10B981' : '#EF4444';
  const statusText = musaitMi ? '😎 Müsait (Kodlama Yapabilir)' : '🛑 Rahatsız Etmeyin (Odakta)';

  return (
    <View style={[styles.cardContainer, { borderColor: cardBorderColor }]}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{ad.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nameText}>{ad}</Text>
          <Text style={styles.roleText}>{uzmanlik} • {seviye}</Text>
        </View>
      </View>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.hungerText}>
          Açlık Seviyesi: {aclikSeviyesi > 70 ? '🍕 Çok Aç' : aclikSeviyesi > 30 ? '🤔 İdare Eder' : '🔋 Tok'} ({aclikSeviyesi}%)
        </Text>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity style={[styles.button, styles.toggleButton]} onPress={onToggleMusaitlik} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Durumu Değiştir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.feedButton, aclikSeviyesi === 0 && styles.disabledButton]} onPress={onYemekYe} disabled={aclikSeviyesi === 0} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Pizza Ismarla 🍕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(DeveloperCard);

const styles = StyleSheet.create({
  cardContainer: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, padding: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 10 }, web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.1)' } }) },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  nameText: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  roleText: { fontSize: 14, color: '#64748B', fontWeight: '600', letterSpacing: 0.5 },
  statusContainer: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginBottom: 24 },
  statusText: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 8 },
  hungerText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleButton: { backgroundColor: '#0F172A' },
  feedButton: { backgroundColor: '#F59E0B' },
  disabledButton: { backgroundColor: '#D1D5DB', opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }
});
```

---

## 2. Ekran Görüntüsü

![Uygulama Ekran Görüntüsü](./assets/images/screenshot.png) 
*(Lütfen kendi çektiğiniz ekran görüntüsünü bu isimle `assets/images` klasörüne ekleyin veya hocanıza doğrudan dosyayı atın)*

---

## 3. AI Prompt Özeti

**En İyi Prompt (İstem):**
> *"Bir Senior React Native Developer gibi hareket etmeni istiyorum. Senden Yazılımcı Kimlik Kartı projesi için profesyonel, üretim standartlarında (production-ready) bir component yapısı oluşturmanı bekliyorum. Kodları 'Clean Code' prensiplerine uygun, UI ve Mantıksal (Logic) işlemleri birbirinden tamamen ayrı olarak yaz ve içerisine Senior bir yazılımcının gözünden neden bu yapıyı kullandığına dair 'Best Practice' yorum satırları ekle."*

**Yapay Zekadan Öğrendiğim Ufak Detay:**
> *"Uygulamada tüm kodları tek bir dosyaya yığmak yerine, State (Durum) yönetimini bir Ana Bileşende (Container Component) tutup, Görsel Arayüzü (Presentational Component) sadece prop alan "Dumb Component" olarak ayırmanın (Modülerleştirme) daha temiz bir mimari yarattığını öğrendim. Ayrıca alt bileşenlerin gereksiz yere tekrar render edilmesini engellemek ve mobilde performansı artırmak için `useCallback` ve `React.memo` (Memoization) kullanımının önemini kavradım."*
