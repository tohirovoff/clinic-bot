# 🏥 Clinic Referral Tracking Bot

Klinika yo'llanma kuzatuv Telegram boti — bemorlarni kuzatish va statistikani ko'rish uchun.

## 📁 Loyiha tuzilishi

```
clinic bot/
├── .env                        # Muhit o'zgaruvchilari
├── .env.example                # Namuna .env fayli
├── .gitignore
├── package.json
├── README.md
├── data/                       # SQLite ma'lumotlar bazasi (auto-yaratiladi)
│   └── clinic.db
└── src/
    ├── index.js                # Asosiy faylni ishga tushirish
    ├── config/
    │   └── index.js            # Konfiguratsiya (.env o'qish)
    ├── database/
    │   ├── connection.js       # SQLite ulanishi va sxema
    │   ├── queries.js          # Tayyorlangan SQL so'rovlari
    │   └── init.js             # Ma'lumotlar bazasini ishga tushirish
    ├── handlers/
    │   ├── index.js            # Barcha handlerlarni ro'yxatga olish
    │   ├── start.js            # /start, til tanlash, ro'yxatdan o'tish
    │   ├── auth.js             # Parol bilan autentifikatsiya
    │   ├── user.js             # Foydalanuvchi statistikasi
    │   └── admin.js            # Admin: user/bemor qo'shish, ro'yxatlar, statistika
    ├── keyboards/
    │   └── index.js            # Inline klaviaturalar
    ├── locales/
    │   ├── index.js            # Til boshqaruvchisi
    │   ├── uz_latin.js         # O'zbek (Lotin) tarjimalari
    │   └── uz_cyrillic.js      # Ўзбек (Кирилл) таржималари
    └── utils/
        ├── dates.js            # Sana helper funksiyalari
        ├── helpers.js          # Session, admin tekshirish, MD escape
        └── password.js         # Unikal 4-xonali parol generatsiya
```

## ⚡ Tez boshlash

### 1. Oldindan tayyorgarlik

- [Node.js](https://nodejs.org/) v18+ o'rnatilgan bo'lishi kerak

### 2. O'rnatish

```bash
# Loyihani klonlang yoki papkaga o'ting
cd "clinic bot"

# Bog'liqliklarni o'rnating
npm install
```

### 3. .env faylini sozlash

`.env` faylini oching va quyidagilarni o'zgartiring:

```env
# @BotFather dan olingan token
BOT_TOKEN=YOUR_REAL_BOT_TOKEN

# Admin Telegram ID (o'zingizni @userinfobot ga yozing)
ADMIN_ID=YOUR_TELEGRAM_CHAT_ID

# Klinika ma'lumotlari
CLINIC_NAME=MedLife Klinikasi
CLINIC_PHONE=+998 90 123 45 67
```

### 4. Ma'lumotlar bazasini yaratish

```bash
npm run db:init
```

### 5. Botni ishga tushirish

```bash
# Oddiy ishga tushirish
npm start

# Ishlab chiqish rejimida (auto-reload)
npm run dev
```

## 🎯 Bot qanday ishlaydi

### Foydalanuvchi oqimi:
1. `/start` → Til tanlash (Lotin / Кирилл)
2. "Ro'yxatdan o'tish" tugmasini bosish
3. Klinika telefon raqami ko'rsatiladi
4. Admin ga qo'ng'iroq qilib parol olish
5. 4-xonali parolni kiritish
6. Statistika menyu ochiladi

### Admin oqimi:
1. `/start` → Til tanlash → Admin menyu
2. User qo'shish (ism, hudud, tug'ilgan yil → avtomatik parol)
3. Bemor qo'shish (userni tanlash → bemor ma'lumotlari)
4. Userlar ro'yxatini ko'rish
5. Har bir user statistikasi (kunlik/haftalik/oylik/yillik)
6. Umumiy statistikani ko'rish

## 🗃 Ma'lumotlar bazasi

### Users jadvali
| Ustun | Tur | Izoh |
|-------|-----|------|
| id | INTEGER | Birlamchi kalit |
| full_name | TEXT | To'liq ism |
| region | TEXT | Hudud (viloyat/shahar) |
| birth_year | INTEGER | Tug'ilgan yil |
| password | TEXT | Unikal 4-xonali parol |
| telegram_id | INTEGER | Telegram chat ID |
| created_at | TEXT | Yaratilgan sana |

### Patients jadvali
| Ustun | Tur | Izoh |
|-------|-----|------|
| id | INTEGER | Birlamchi kalit |
| user_id | INTEGER | Qaysi user yubordi (FK) |
| full_name | TEXT | Bemor ismi |
| region | TEXT | Hudud |
| birth_year | INTEGER | Tug'ilgan yil |
| created_at | TEXT | Yaratilgan sana |

### Sessions jadvali
| Ustun | Tur | Izoh |
|-------|-----|------|
| telegram_id | INTEGER | Birlamchi kalit |
| user_id | INTEGER | Bog'langan user |
| lang | TEXT | Tanlangan til |
| state | TEXT | Joriy holat (multi-step form) |
| state_data | TEXT | Holat ma'lumotlari (JSON) |

## 🚀 Deploy qilish

### VPS/Server ga deploy

```bash
# 1. Server ga fayllarni ko'chiring (scp, git clone, va hokazo)

# 2. Bog'liqliklarni o'rnating
npm install --production

# 3. PM2 bilan doimiy ishga tushirish
npm install -g pm2
pm2 start src/index.js --name clinic-bot
pm2 save
pm2 startup
```

### Docker bilan

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "src/index.js"]
```

```bash
docker build -t clinic-bot .
docker run -d --name clinic-bot --env-file .env clinic-bot
```

## 🔒 Xavfsizlik

- Parollar unikal va 4-xonali
- Admin faqat bitta (ADMIN_ID orqali)
- Foydalanuvchilar faqat o'z statistikasini ko'ra oladi
- Session asosida autentifikatsiya
- SQL injection dan himoyalangan (prepared statements)

## 📝 Litsenziya

MIT
