const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// DB Dosyası İçin Klasör
const DB_DIR = path.join(__dirname, 'tmp');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Uygulama başlangıcında 'tmp' klasörünü oluştur
async function ensureTmpDirectory() {
    try {
        await fs.mkdir(DB_DIR, { recursive: true });
        console.log('tmp dizini oluşturuldu veya zaten mevcut.');
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('tmp dizini oluşturulurken hata:', error);
            process.exit(1);
        }
    }
}

// CORS Ayarları
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// JSON formatındaki istek gövdelerini ayrıştırmak için
app.use(express.json());

// Frontend dosyalarını servis etmek için ana dizini kullan
app.use(express.static(__dirname));

// db.json dosyasını yükle veya oluştur
async function loadDb() {
    await ensureTmpDirectory();
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('db.json dosyası bulunamadı, yeni bir dosya oluşturuluyor.');
            const defaultDb = {
                mainBanner: { image: 'https://via.placeholder.com/1200x180/333333/ffffff?text=ANA+BANNER+ALANI', link: '#' },
                socialLinks: [
                    { id: "1", icon: "fab fa-twitter", text: "ILLEGALBET X", url: "#" },
                    { id: "2", icon: "fas fa-link", text: "ILLEGALBET HEYLINK", url: "#" }
                ],
                sponsors: [
                    { id: "3", image: "https://via.placeholder.com/1200x100/555555/dddddd?text=SPONSOR+1", link: "#", order: 1 }
                ],
                trustedSites: [
                    { id: "4", image: "https://via.placeholder.com/100x100/777777/ffffff?text=LOGO", name: "Güvenilir Site 1", description: "En iyi oranlar", link: "#" }
                ],
                scrollingText: "ÖNEMLİ DUYURU: Yeni üyelerimize özel %200 hoşgeldin bonusu! • Canlı destek 7/24 hizmetinizde! • Haftalık kayıp bonusları devam ediyor! • Anında para çekimleri başladı!",
                mainSponsorPopup: {
                    image: 'https://via.placeholder.com/600x250/007bff/ffffff?text=ANA+SPONSOR+POPUP',
                    mainText: 'ANA SPONSORUMUZU KEŞFEDİN!',
                    subText: 'Özel teklifler sizi bekliyor.',
                    link: '#',
                    active: false
                }
            };
            await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2));
            return defaultDb;
        }
        throw error;
    }
}

// db.json dosyasını kaydet
async function saveDb(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// ===================================
// API Uç Noktaları (Endpoints)
// ===================================

// Test Endpointi
app.get('/api/test', (req, res) => {
    res.json({ status: 'active', message: 'API çalışıyor!' });
});

// Genel Veri Alımı
app.get('/api/data', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db);
    } catch (error) {
        console.error('Veri çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Veri çekilemedi.' });
    }
});

// Ana Banner YÖNETİMİ
app.get('/api/main-banner', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.mainBanner);
    } catch (error) {
        console.error('Ana banner çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Ana banner çekilemedi.' });
    }
});

app.post('/api/main-banner', async (req, res) => {
    try {
        const db = await loadDb();
        db.mainBanner = req.body;
        await saveDb(db);
        res.status(200).json({ message: 'Ana banner güncellendi.', data: db.mainBanner });
    } catch (error) {
        console.error('Ana banner güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Ana banner güncellenemedi.' });
    }
});

// Sosyal Linkler YÖNETİMİ
app.get('/api/social-links', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.socialLinks);
    } catch (error) {
        console.error('Sosyal linkler çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sosyal linkler çekilemedi.' });
    }
});

app.post('/api/social-links', async (req, res) => {
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

app.put('/api/social-links/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const updatedLink = req.body;
        const index = db.socialLinks.findIndex(link => link.id === id);

        if (index !== -1) {
            db.socialLinks[index] = { ...db.socialLinks[index], ...updatedLink, id: id };
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

app.delete('/api/social-links/:id', async (req, res) => {
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

// Sponsorlar YÖNETİMİ
app.get('/api/sponsors', async (req, res) => {
    try {
        const db = await loadDb();
        // Order alanına göre sırala
        const sponsors = db.sponsors.sort((a, b) => a.order - b.order);
        res.json(sponsors);
    } catch (error) {
        console.error('Sponsorlar çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsorlar çekilemedi.' });
    }
});

app.post('/api/sponsors', async (req, res) => {
    try {
        const db = await loadDb();
        // Mevcut maksimum order'ı bul
        const maxOrder = db.sponsors.length > 0 ? Math.max(...db.sponsors.map(s => s.order)) : 0;
        const newSponsor = { 
            id: Date.now().toString(), 
            ...req.body,
            order: maxOrder + 1 
        };
        db.sponsors.push(newSponsor);
        await saveDb(db);
        res.status(201).json({ message: 'Sponsor eklendi.', data: newSponsor });
    } catch (error) {
        console.error('Sponsor eklenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsor eklenemedi.' });
    }
});

app.put('/api/sponsors/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const updatedSponsor = req.body;
        const index = db.sponsors.findIndex(sponsor => sponsor.id === id);

        if (index !== -1) {
            db.sponsors[index] = { ...db.sponsors[index], ...updatedSponsor, id: id };
            await saveDb(db);
            res.status(200).json({ message: 'Sponsor güncellendi.', data: db.sponsors[index] });
        } else {
            res.status(404).json({ message: 'Sponsor bulunamadı.' });
        }
    } catch (error) {
        console.error('Sponsor güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Sponsor güncellenemedi.' });
    }
});

app.delete('/api/sponsors/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const initialLength = db.sponsors.length;
        db.sponsors = db.sponsors.filter(sponsor => sponsor.id !== id);

        if (db.sponsors.length < initialLength) {
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

// Güvenilir Siteler YÖNETİMİ
app.get('/api/trusted-sites', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.trustedSites);
    } catch (error) {
        console.error('Güvenilir siteler çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Güvenilir siteler çekilemedi.' });
    }
});

app.post('/api/trusted-sites', async (req, res) => {
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

app.put('/api/trusted-sites/:id', async (req, res) => {
    try {
        const db = await loadDb();
        const { id } = req.params;
        const updatedSite = req.body;
        const index = db.trustedSites.findIndex(site => site.id === id);

        if (index !== -1) {
            db.trustedSites[index] = { ...db.trustedSites[index], ...updatedSite, id: id };
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

app.delete('/api/trusted-sites/:id', async (req, res) => {
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

// Kaydırma Metni YÖNETİMİ
app.get('/api/scrolling-text', async (req, res) => {
    try {
        const db = await loadDb();
        res.json({ text: db.scrollingText });
    } catch (error) {
        console.error('Kaydırma metni çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Kaydırma metni çekilemedi.' });
    }
});

app.post('/api/scrolling-text', async (req, res) => {
    try {
        const db = await loadDb();
        db.scrollingText = req.body.text;
        await saveDb(db);
        res.status(200).json({ message: 'Kaydırma metni güncellendi.', text: db.scrollingText });
    } catch (error) {
        console.error('Kaydırma metni güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Kaydırma metni güncellenemedi.' });
    }
});

// Ana Sponsor Pop-up Yönetimi
app.get('/api/main-sponsor-popup', async (req, res) => {
    try {
        const db = await loadDb();
        res.json(db.mainSponsorPopup);
    } catch (error) {
        console.error('Ana sponsor pop-up çekilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Ana sponsor pop-up çekilemedi.' });
    }
});

app.post('/api/main-sponsor-popup', async (req, res) => {
    try {
        const db = await loadDb();
        db.mainSponsorPopup = req.body;
        await saveDb(db);
        res.status(200).json({ message: 'Ana sponsor pop-up güncellendi.', data: db.mainSponsorPopup });
    } catch (error) {
        console.error('Ana sponsor pop-up güncellenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Ana sponsor pop-up güncellenemedi.' });
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    loadDb().catch(err => console.error('Veritabanı yüklenirken başlangıç hatası:', err));
});
