import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import DeveloperCard from '@/components/DeveloperCard';

// --- ANA BİLEŞEN: App (Mantık / Container Component) ---
export default function HomeScreen() {
  // BEST PRACTICE: Uygulamanın/Bileşenin "Single Source of Truth" (Tek Doğru Kaynağı) için
  // stateler parent katmanında tutulur ve çocuklara prop olarak aktarılır.
  const [musaitMi, setMusaitMi] = useState(true);
  const [aclikSeviyesi, setAclikSeviyesi] = useState(60); // 0 (Tok) ile 100 (Çok Aç) arası

  // BEST PRACTICE: Alt bileşenlere prop olarak geçirilen metotlar useCallback ile sarmalandı.
  // Bu, metot referansının her render'da yeniden oluşturulmasını engelleyerek performansı optimize eder.
  const handleToggleMusaitlik = useCallback(() => {
    setMusaitMi((prev) => !prev);
  }, []);

  const handleYemekYe = useCallback(() => {
    setAclikSeviyesi((prev) => Math.max(0, prev - 25)); // Her tetiklemede 25 doygunluk artar, en az 0'a iner
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Modern, göz yormayan soğuk beyaz/gri (Slate-50)
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Flexbox: Dikeyde tam merkeziyet
    alignItems: 'center',     // Flexbox: Yatayda tam merkeziyet
    padding: 24,
    backgroundColor: '#F8FAFC', 
  },
});
