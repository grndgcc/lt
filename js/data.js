window.GameData = {
  days: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  traits: [
    { id: "social", name: "Sosyal", tip: "Sosyallik daha hızlı düşer ama konuşmalardan daha çok keyif alır." },
    { id: "shy", name: "Utangaç", tip: "Sosyal başarı biraz düşer, yalnız aktiviteler daha eğlencelidir." },
    { id: "lazy", name: "Tembel", tip: "Enerji daha hızlı azalır, spor daha az keyif verir." },
    { id: "hardworking", name: "Çalışkan", tip: "Kariyer performansı daha hızlı artar." },
    { id: "romantic", name: "Romantik", tip: "Romantik ruh hali daha kolay oluşur." },
    { id: "hotheaded", name: "Sinirli", tip: "Düşük ihtiyaçlarda sinirlenmeye yatkındır." },
    { id: "cheerful", name: "Neşeli", tip: "Mutlu ruh hali daha kalıcıdır." },
    { id: "messy", name: "Dağınık", tip: "Kirli ortamdan daha az etkilenir." },
    { id: "clean", name: "Temiz", tip: "Hijyen ve ortam konusunda hassastır, temizliği sever." },
    { id: "creative", name: "Yaratıcı", tip: "Sanat, müzik ve yazarlık daha hızlı gelişir." },
    { id: "bookworm", name: "Kitap Kurdu", tip: "Okumaktan daha fazla eğlence ve odak kazanır." },
    { id: "athletic", name: "Sporcu", tip: "Fitness daha hızlı gelişir." },
    { id: "tech", name: "Teknoloji Meraklısı", tip: "Bilgisayar aktiviteleri daha etkili olur." }
  ],
  skills: {
    cooking: "Yemek",
    charisma: "Karizma",
    fitness: "Fitness",
    music: "Müzik",
    painting: "Resim",
    writing: "Yazarlık",
    programming: "Programlama",
    gardening: "Bahçecilik",
    logic: "Mantık",
    repair: "Tamir",
    cleaning: "Temizlik"
  },
  careers: {
    none: { name: "İşsiz", levels: ["İşsiz"], start: 0, end: 0, days: [], salary: 0, skill: null },
    programmer: {
      name: "Programcı",
      levels: ["Stajyer", "Junior Geliştirici", "Web Geliştirici", "Yazılım Mühendisi", "Kıdemli Geliştirici", "Teknik Lider", "Yapay Zekâ Uzmanı", "Baş Mimar", "Teknoloji Direktörü", "Şirket Ortağı"],
      start: 9, end: 17, days: [0,1,2,3,4], salary: 110, skill: "programming"
    },
    artist: {
      name: "Sanatçı",
      levels: ["Sokak Çizeri", "Atölye Asistanı", "İllüstratör", "Galeri Sanatçısı", "Portre Ustası", "Küratör", "Ünlü Ressam", "Sanat Direktörü", "Usta Sanatçı", "Yaşayan Efsane"],
      start: 10, end: 16, days: [1,2,3,4,5], salary: 95, skill: "painting"
    },
    chef: {
      name: "Aşçılık",
      levels: ["Bulaşıkçı", "Mutfak Yardımcısı", "Hazırlık Aşçısı", "Hat Aşçısı", "Sous Chef", "Şef", "Gurme Şef", "Mutfak Şefi", "Restoran Yıldızı", "Efsane Şef"],
      start: 12, end: 20, days: [0,1,2,4,5], salary: 100, skill: "cooking"
    },
    writer: {
      name: "Yazar",
      levels: ["Blog Yazarı", "Editör Yardımcısı", "Köşe Yazarı", "Metin Yazarı", "Romancı", "Senarist", "Baş Editör", "Çok Satan Yazar", "Edebiyat Ustası", "Klasikleşmiş İsim"],
      start: 8, end: 14, days: [0,1,2,3,4], salary: 90, skill: "writing"
    },
    athlete: {
      name: "Sporcu",
      levels: ["Amatör", "Kulüp Oyuncusu", "Takım Üyesi", "Profesyonel", "Kaptan", "Yıldız", "Şampiyon", "Efsane", "Koç", "Spor İkonu"],
      start: 7, end: 13, days: [0,2,3,5], salary: 105, skill: "fitness"
    }
  },
  objects: {
    bed_basic: {
      id: "bed_basic", name: "Rahat Başlangıç Yatağı", icon: "🛏", category: "Yatak", price: 300, size: { w: 2, h: 3 }, color: "#7fb2ff",
      interactions: [
        { id: "sleep", label: "Uyu", duration: 420, effects: { energy: +70, comfort: +12, mood: "rested" } },
        { id: "nap", label: "Kestir", duration: 90, effects: { energy: +24, comfort: +8 } },
        { id: "relax", label: "Rahatla", duration: 45, effects: { fun: +8, comfort: +12 } }
      ], comfort: 18, environment: 4
    },
    fridge_basic: {
      id: "fridge_basic", name: "Kompakt Buzdolabı", icon: "🧊", category: "Mutfak", price: 420, size: { w: 1, h: 1 }, color: "#d6eef5",
      interactions: [
        { id: "snack", label: "Hızlı atıştır", duration: 35, cost: 12, effects: { hunger: +28, fun: +2, dirty: +1 } },
        { id: "cook", label: "Yemek hazırla", duration: 95, cost: 24, skill: "cooking", xp: 18, effects: { hunger: +55, fun: +3, dirty: +2, mood: "tastyMeal" } }
      ], comfort: 2, environment: 1
    },
    toilet_basic: {
      id: "toilet_basic", name: "Basit Tuvalet", icon: "🚽", category: "Banyo", price: 260, size: { w: 1, h: 1 }, color: "#f2f4ff",
      interactions: [ { id: "use_toilet", label: "Tuvaleti kullan", duration: 35, effects: { bladder: +100, hygiene: -3 } } ], comfort: 2, environment: 0
    },
    shower_basic: {
      id: "shower_basic", name: "Pratik Duş", icon: "🚿", category: "Banyo", price: 380, size: { w: 1, h: 1 }, color: "#8de3ff",
      interactions: [
        { id: "shower", label: "Duş al", duration: 80, effects: { hygiene: +82, mood: "fresh" } },
        { id: "quick_shower", label: "Hızlı duş", duration: 45, effects: { hygiene: +48 } }
      ], comfort: 4, environment: 1
    },
    sofa_basic: {
      id: "sofa_basic", name: "İki Kişilik Koltuk", icon: "🛋", category: "Oturma", price: 330, size: { w: 2, h: 1 }, color: "#d796ff",
      interactions: [
        { id: "sit", label: "Otur", duration: 40, effects: { comfort: +18, energy: +6 } },
        { id: "nap_sofa", label: "Koltukta kestir", duration: 80, effects: { energy: +16, comfort: +9 } }
      ], comfort: 22, environment: 6
    },
    tv_basic: {
      id: "tv_basic", name: "Küçük Ekran TV", icon: "📺", category: "Eğlence", price: 520, size: { w: 2, h: 1 }, color: "#30394a",
      interactions: [
        { id: "watch_tv", label: "İzle", duration: 80, effects: { fun: +34, social: +4, energy: -3 } },
        { id: "play_game", label: "Oyun oyna", duration: 90, effects: { fun: +42, energy: -5 }, skill: "logic", xp: 10 }
      ], comfort: 5, environment: 5
    },
    computer_basic: {
      id: "computer_basic", name: "Masaüstü Bilgisayar", icon: "💻", category: "Elektronik", price: 850, size: { w: 2, h: 1 }, color: "#4f5d73",
      interactions: [
        { id: "browse", label: "İnternette gezin", duration: 70, effects: { fun: +24, social: +6 } },
        { id: "study_programming", label: "Programlama çalış", duration: 115, skill: "programming", xp: 24, effects: { fun: +8, energy: -8, mood: "focused" } },
        { id: "write", label: "Yazı yaz", duration: 110, skill: "writing", xp: 24, effects: { fun: +10, energy: -6, mood: "inspired" } },
        { id: "find_job", label: "İş ara", duration: 45, special: "findJob", effects: { fun: -3 } },
        { id: "pay_bills", label: "Fatura öde", duration: 20, special: "payBills", effects: { mood: "relief" } }
      ], comfort: 4, environment: 7
    },
    bookcase_basic: {
      id: "bookcase_basic", name: "Kısa Kitaplık", icon: "📚", category: "Beceri", price: 280, size: { w: 1, h: 1 }, color: "#b5794c",
      interactions: [
        { id: "read", label: "Roman oku", duration: 90, effects: { fun: +26, mood: "focused" } },
        { id: "charisma_book", label: "Karizma kitabı oku", duration: 115, skill: "charisma", xp: 22, effects: { fun: +12, mood: "focused" } },
        { id: "cooking_book", label: "Yemek kitabı oku", duration: 115, skill: "cooking", xp: 18, effects: { fun: +10 } }
      ], comfort: 3, environment: 9
    },
    easel_basic: {
      id: "easel_basic", name: "Resim Sehpası", icon: "🎨", category: "Sanat", price: 430, size: { w: 1, h: 1 }, color: "#f2b36d",
      interactions: [
        { id: "paint", label: "Resim yap", duration: 140, skill: "painting", xp: 30, earn: [30, 135], effects: { fun: +30, energy: -8, mood: "inspired" } }
      ], comfort: 2, environment: 8
    },
    treadmill_basic: {
      id: "treadmill_basic", name: "Katlanır Koşu Bandı", icon: "🏃", category: "Spor", price: 650, size: { w: 2, h: 1 }, color: "#53616b",
      interactions: [
        { id: "run", label: "Koş", duration: 100, skill: "fitness", xp: 26, effects: { fun: +10, energy: -20, hygiene: -22, mood: "energized" } }
      ], comfort: 1, environment: 3
    },
    lamp_basic: {
      id: "lamp_basic", name: "Sıcak Işık", icon: "💡", category: "Aydınlatma", price: 140, size: { w: 1, h: 1 }, color: "#ffd166",
      interactions: [ { id: "admire_lamp", label: "Işığı ayarla", duration: 15, effects: { environment: +8 } } ], comfort: 3, environment: 14
    },
    plant_basic: {
      id: "plant_basic", name: "Saksı Bitkisi", icon: "🪴", category: "Dekor", price: 160, size: { w: 1, h: 1 }, color: "#5ebd73",
      interactions: [
        { id: "water_plant", label: "Sula", duration: 35, skill: "gardening", xp: 10, effects: { environment: +12, fun: +5 } },
        { id: "admire_plant", label: "İncele", duration: 25, effects: { fun: +8, mood: "inspired" } }
      ], comfort: 3, environment: 16
    }
  },
  buildTools: [
    { id: "floor", name: "Zemin", price: 8, hint: "Boş kareye zemin döşer." },
    { id: "wall", name: "Duvar", price: 35, hint: "Geçişi engelleyen duvar oluşturur." },
    { id: "door", name: "Kapı", price: 85, hint: "Duvar üstünde geçilebilir kapı açar." },
    { id: "erase", name: "Sil", price: 0, hint: "Duvar, kapı, zemin veya eşyayı kaldırır." }
  ]
};
