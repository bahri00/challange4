# 🐾 NanoPet: Modern Tamagotchi Deneyimi

NanoPet, klasik evcil hayvan bakımı konseptini modern mobil oyun dinamikleriyle birleştiren, React Native ve Expo ile geliştirilmiş kapsamlı bir simülasyon uygulamasıdır. Kullanıcıların dijital bir dostu büyütürken sorumluluk almalarını ve eğlenceli mini oyunlarla etkileşimde kalmalarını hedefler.

---

## 🎯 Projenin Amacı ve Temel Özellikler

NanoPet, bir evcil hayvanın hayatta kalması için gerekli olan dört temel ihtiyacı (Açlık, Temizlik, Mutluluk, Enerji) yönetmeyi esas alan bir **"Software Identity"** projesidir. Projenin ana amacı, kullanıcı etkileşimini haptic feedbackler (titreşim), akıcı animasyonlar ve zengin bir ilerleme sistemiyle en üst düzeye çıkarmaktır.

### 🎮 Oyunlaştırma Özellikleri

*   **🐲 Kapsamlı Evrim Sistemi:** 
    *   Evcil hayvanınız kazandığınız XP'lere göre 5 farklı aşamada evrim geçirir:
        1.  🥚 **Yumurta** (Level 1-5)
        2.  🐣 **Yavru** (Level 6-10)
        3.  🐥 **Civciv** (Level 11-19)
        4.  🦅 **Kartal** (Level 20-29)
        5.  🐉 **Ejderha** (Level 30+)
*   **🕹️ Mini Oyun Merkezi:**
    *   **Sky Bird:** Boruların arasından süzülerek reflekslerini test et! (Mutluluk & XP)
    *   **Turbo Racer:** Trafikte makas atarak puan topla! (XP & Altın)
    *   **Magic Piano:** Ritmik notalara dokunarak müzik yap! (Mutluluk & XP)
*   **🛒 Market ve Özelleştirme:**
    *   Oyunlardan kazandığın altınlarla **Kulaklık, Kurdele, Maske, Elmas Kolye** gibi aksesuarlar alabilir ve petini kişiselleştirebilirsin.
    *   Belirli seviyelere ulaştığında nadir **Skin**'lerin kilidini açabilirsin.
*   **❤️ İnteraktif Sevme Mekanizması:**
    *   Petinize dokunarak onu sevebilir, kalp animasyonları ve haptic geri bildirim eşliğinde mutluluğunu artırabilirsiniz.
*   **🛁 Dinamik Kirlenme Sistemi:** 
    *   Petiniz temizlik %75'in altına düştüğünde görsel olarak tozlanmaya, çamurlanmaya ve uçuşan sineklere maruz kalır. Özel banyo moduyla onu temizleyebilirsiniz.

---

## 🚀 Nasıl Çalıştırılır? (Installation & Run)

Uygulamayı yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/bahri00/mobil_hafta4.git
    cd challange_3.1/yazilim_kimlik_karti
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Uygulamayı Başlatın:**
    ```bash
    npx expo start
    ```
    *   *Not: Expo Go uygulaması ile fiziksel cihazınızdan QR kodu tarayarak veya iOS/Android simülatörlerinizden çalıştırabilirsiniz.*

---

## 📂 Proje Konumu (Repo İçindeki Yer)

Bu projenin tüm kaynak kodları, ana klasör olan `challange_3.1` içerisindeki **`yazilim_kimlik_karti`** dizininde bulunmaktadır.

*   **Ana Bileşenler:** `/components`
*   **Oyun Sahneleri:** `/app/games`
*   **Durum Yönetimi:** `/app/(tabs)/index.tsx`

---

## 📺 Tanıtım Videosu

Projenin tüm özelliklerini ve oynanışını gösteren 1 dakikalık tanıtım videosuna aşağıdaki linkten ulaşabilirsiniz:

👉 **[NanoPet Tanıtım Videosu (https://www.youtube.com/shorts/d_g5dtF8tBQ)]**

---

*Bu proje bir eğitim ve gelişim challenge'ı kapsamında Bahri Talha Baş tarafından geliştirilmiştir.*
