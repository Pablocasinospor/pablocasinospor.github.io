const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// !!! BURASI ÇOK ÖNEMLİ: CORS AYARLARI BURADA YAPILIR !!!
const corsOptions = {
  origin: [
    'https://pablocasinospor.github.io', // Sizin GitHub Pages URL'niz
    'http://localhost:3000',             // Yerel geliştirme için (isteğe bağlı, ama faydalı)
    // Eğer Render'ın kendi frontend adresinden de test ediyorsanız buraya ekleyebilirsiniz (örn: Render'ın geçici URL'si)
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // İzin verilen HTTP metotları
  credentials: true, // Eğer cookie veya yetkilendirme başlıkları kullanıyorsanız bunu true yapın
  optionsSuccessStatus: 204 // Bazı tarayıcılar için
};
app.use(cors(corsOptions)); // CORS middleware'ini bu ayarlar ile kullanın.
// !!! CORS AYARLARI BURADA BİTİYOR !!!

// JSON formatındaki istek gövdelerini ayrıştırmak için
app.use(express.json());

// db.json dosyasını yükle veya oluştur
async function loadDb() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('db.json dosyası bulunamadı, yeni bir dosya oluşturuluyor.');
            const defaultDb = {
                mainBanner: { image: 'https://via.placeholder.com/1200x180/333333/ffffff?text=ANA+BANNER+ALANI', link: '#' },
                socialLinks: [
                    { id: "1", icon: "fab fa-twitter", text: "ILLEGALBET X", link: "#" },
                    { id: "2", icon: "fas fa-link", text: "ILLEGALBET HEYLINK", link: "#" }
                ],
                banners: [ // sponsors'ı banners olarak değiştirdim, index.html ile uyumlu olması için
                    { id: "3", image: "https://via.placeholder.com/1200x100/FFD700/000000?text=SPONSOR+1", link: "#" }
                ],
                trustedSites: [
                    { id: "4", image: "https://via.placeholder.com/100x100/FFBC00/000000?text=LOGO", name: "GÜVENİLİR SİTE 1", description: "En iyi bonuslar!", link: "#" }
                ],
                scrollingText: { text: "Önemli duyurular yakında burada olacak!" },
                mainSponsorPopup: {
                    image: "https://via.placeholder.com/600x250/FF4500/FFFFFF?text=ANA+SPONSOR+POPUP",
                    mainText: "ANA SPONSORUMUZU KEŞFEDİN!",
                    subText: "Özel teklifler sizi bekliyor.",
                    link: "#",
                    active: true
                }
            };
            await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
            return defaultDb;
        }
        throw error;
    }
} // loadDb fonksiyonunun kapanış küme parantezi burada bitiyor.

// db.json dosyasını kaydet
async function saveDb(db) {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
} // saveDb fonksiyonunun kapanış küme parantezi burada bitiyor.

// API rotaları (daha önce eklediklerimiz)
// Ana Banner Yönetimi
app.get('/api/mainBanner', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.mainBanner);
    } catch (error) {
        console.error('Ana banner çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Ana banner çekilemedi.' });
    }
});

app.put('/api/mainBanner', async (req, res) => {
    try {
        const db = await loadDb();
        db.mainBanner = { image: req.body.image, link: req.body.link };
        await saveDb(db);
        res.status(200).json({ message: 'Ana banner güncellendi.', data: db.mainBanner });
    } catch (error) {
        console.error('Ana banner güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Ana banner güncellenemedi.' });
    }
});

// Sosyal Medya Linkleri Yönetimi
app.get('/api/socialLinks', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.socialLinks);
    } catch (error) {
        console.error('Sosyal linkler çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sosyal linkler çekilemedi.' });
    }
});

app.post('/api/socialLinks', async (req, res) => {
    try {
        const db = await loadDb();
        const newLink = { id: Date.now().toString(), ...req.body };
        db.socialLinks.push(newLink);
        await saveDb(db);
        res.status(201).json({ message: 'Sosyal link eklendi.', data: newLink });
    } catch (error) {
        console.error('Sosyal link eklenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sosyal link eklenemedi.' });
    }
});

app.put('/api/socialLinks/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const index = db.socialLinks.findIndex(link => link.id === id);
        if (index !== -1) {
            db.socialLinks[index] = { ...db.socialLinks[index], ...req.body };
            await saveDb(db);
            res.status(200).json({ message: 'Sosyal link güncellendi.', data: db.socialLinks[index] });
        } else {
            res.status(404).json({ message: 'Sosyal link bulunamadı.' });
        }
    } catch (error) {
        console.error('Sosyal link güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sosyal link güncellenemedi.' });
    }
});

app.delete('/api/socialLinks/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const initialLength = db.socialLinks.length;
        db.socialLinks = db.socialLinks.filter(link => link.id !== id);
        if (db.socialLinks.length < initialLength) {
            await saveDb(db);
            res.status(200).json({ message: 'Sosyal link silindi.' });
        } else {
            res.status(404).json({ message: 'Sosyal link bulunamadı.' });
        }
    } catch (error) {
        console.error('Sosyal link silinirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sosyal link silinemedi.' });
    }
});

// Sponsorlar (banners) Yönetimi
app.get('/api/banners', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.banners);
    } catch (error) {
        console.error('Sponsorlar çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsorlar çekilemedi.' });
    }
});

app.post('/api/banners', async (req, res) => {
    try {
        const db = await loadDb();
        const newBanner = { id: Date.now().toString(), ...req.body };
        db.banners.push(newBanner);
        await saveDb(db);
        res.status(201).json({ message: 'Sponsor eklendi.', data: newBanner });
    } catch (error) {
        console.error('Sponsor eklenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsor eklenemedi.' });
    }
});

app.put('/api/banners/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const index = db.banners.findIndex(banner => banner.id === id);
        if (index !== -1) {
            db.banners[index] = { ...db.banners[index], ...req.body };
            await saveDb(db);
            res.status(200).json({ message: 'Sponsor güncellendi.', data: db.banners[index] });
        } else {
            res.status(404).json({ message: 'Sponsor bulunamadı.' });
        }
    } catch (error) {
        console.error('Sponsor güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsor güncellenemedi.' });
    }
});

app.delete('/api/banners/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const initialLength = db.banners.length;
        db.banners = db.banners.filter(banner => banner.id !== id);
        if (db.banners.length < initialLength) {
            await saveDb(db);
            res.status(200).json({ message: 'Sponsor silindi.' });
        } else {
            res.status(404).json({ message: 'Sponsor bulunamadı.' });
        }
    } catch (error) {
        console.error('Sponsor silinirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsor silinemedi.' });
    }
});

// Güvenilir Siteler Yönetimi
app.get('/api/trustedSites', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.trustedSites);
    } catch (error) {
        console.error('Güvenilir siteler çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Güvenilir siteler çekilemedi.' });
    }
});

app.post('/api/trustedSites', async (req, res) => {
    try {
        const db = await loadDb();
        const newSite = { id: Date.now().toString(), ...req.body };
        db.trustedSites.push(newSite);
        await saveDb(db);
        res.status(201).json({ message: 'Güvenilir site eklendi.', data: newSite });
    } catch (error) {
        console.error('Güvenilir site eklenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Güvenilir site eklenemedi.' });
    }
});

app.put('/api/trustedSites/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const index = db.trustedSites.findIndex(site => site.id === id);
        if (index !== -1) {
            db.trustedSites[index] = { ...db.trustedSites[index], ...req.body };
            await saveDb(db);
            res.status(200).json({ message: 'Güvenilir site güncellendi.', data: db.trustedSites[index] });
        } else {
            res.status(404).json({ message: 'Güvenilir site bulunamadı.' });
        }
    } catch (error) {
        console.error('Güvenilir site güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Güvenilir site güncellenemedi.' });
    }
});

app.delete('/api/trustedSites/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const initialLength = db.trustedSites.length;
        db.trustedSites = db.trustedSites.filter(site => site.id !== id);

        if (db.trustedSites.length < initialLength) {
            await saveDb(db);
            res.status(200).json({ message: 'Güvenilir site silindi.' });
        } else {
            res.status(404).json({ message: 'Güvenilir site bulunamadı.' });
        }
    } catch (error) {
        console.error('Güvenilir site silinirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Güvenilir site silinemedi.' });
    }
});

// Kaydırma Metni Yönetimi
app.get('/api/scrollingText', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.scrollingText); // Direk objeyi dönüyoruz
    } catch (error) {
        console.error('Kaydırma metni çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Kaydırma metni çekilemedi.' });
    }
});

app.put('/api/scrollingText/1', async (req, res) => { // PUT metodu ve sabit ID 1
    try {
        const db = await loadDb();
        db.scrollingText = { text: req.body.text }; // objeyi güncelliyoruz
        await saveDb(db);
        res.status(200).json({ message: 'Kaydırma metni güncellendi.', data: db.scrollingText });
    } catch (error) {
        console.error('Kaydırma metni güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Kaydırma metni güncellenemedi.' });
    }
});

// Ana Sponsor Pop-up Yönetimi
app.get('/api/mainSponsorPopup', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.mainSponsorPopup);
    } catch (error) {
        console.error('Main sponsor popup çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Main sponsor popup çekilemedi.' });
    }
});

app.put('/api/mainSponsorPopup/1', async (req, res) => { // PUT metodu ve sabit ID 1
    try {
        const db = await loadDb();
        db.mainSponsorPopup = { ...db.mainSponsorPopup, ...req.body };
        await saveDb(db);
        res.status(200).json({ message: 'Main sponsor popup güncellendi.', data: db.mainSponsorPopup });
    } catch (error) {
        console.error('Main sponsor popup güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Main sponsor popup güncellenemedi.' });
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    console.log(`API istekleri için http://localhost:${PORT}/api/* adresini kullanın.`);
});
