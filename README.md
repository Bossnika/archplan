# ArchPlan — Studio Office Kolectiv
## Ghid complet de deployment

---

## 📁 Structura proiectului

```
archplan/
├── src/
│   ├── lib/
│   │   ├── firebase.js          # Config Firebase (de completat!)
│   │   ├── constants.js         # Instituții, faze, culori, date firmă
│   │   ├── utils.js             # Helpers date, constructori
│   │   ├── db.js                # Firestore CRUD
│   │   ├── storageService.js    # Upload Firebase Storage
│   │   ├── notifications.js     # Push notifications
│   │   └── exportGantt.js       # Export PDF A1 landscape
│   ├── hooks/
│   │   ├── useAuth.js           # Context autentificare
│   │   └── useTheme.js          # Dark/Light/Auto theme
│   ├── pages/
│   │   └── LoginPage.jsx        # Pagina de login
│   ├── components/
│   │   ├── AppHeader.jsx        # Header cu branding
│   │   ├── AppFooter.jsx        # Footer cu date firmă
│   │   ├── AttachmentUploader.jsx # Upload fișiere + linkuri externe
│   │   └── BeneficiarView.jsx   # Fișă beneficiar cu amplasament
│   ├── styles/
│   │   └── global.css           # CSS variables dark/light
│   ├── App.jsx                  # Aplicația principală
│   └── main.jsx                 # Entry point
├── public/
│   └── firebase-messaging-sw.js # Service worker push notifications
├── firestore.rules              # Reguli securitate Firestore
├── storage.rules                # Reguli securitate Storage
├── vercel.json                  # Config deployment Vercel
├── vite.config.js               # Vite + PWA
└── package.json
```

---

## 🔥 PASUL 1 — Configurare Firebase

### 1.1 Creează proiect Firebase
1. Mergi la [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → denumește-l `archplan-kolectiv`
3. Dezactivează Google Analytics (opțional)

### 1.2 Activează serviciile
- **Authentication** → Sign-in method → activează:
  - ✅ Google
  - ✅ Email/Password
- **Firestore Database** → Create database → Start in **production mode**
- **Storage** → Get started → acceptă regulile implicite

### 1.3 Copiază configurația
- Project Settings (roata ⚙️) → Your apps → **Add app** → Web (`</>`)
- Copiază obiectul `firebaseConfig`
- Înlocuiește în `src/lib/firebase.js`

### 1.4 VAPID key (pentru push notifications)
- Project Settings → Cloud Messaging → **Web Push certificates**
- Click **"Generate key pair"**
- Copiază cheia și înlocuiește `REPLACE_WITH_YOUR_VAPID_KEY` în `src/lib/firebase.js`
- Copiază același config și în `public/firebase-messaging-sw.js`

### 1.5 Deploy regulile de securitate
```bash
npm install -g firebase-tools
firebase login
firebase init  # selectează Firestore + Storage
firebase deploy --only firestore:rules,storage:rules
```

---

## 📦 PASUL 2 — Instalare locală

```bash
cd archplan
npm install
npm run dev
# → http://localhost:5173
```

---

## 🌐 PASUL 3 — Deployment pe Vercel (recomandat)

### Opțiunea A — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Opțiunea B — GitHub + Vercel (recomandat pentru actualizări ușoare)
1. Creează repo nou pe GitHub: `archplan-kolectiv`
2. Push codul:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TUL/archplan-kolectiv.git
   git push -u origin main
   ```
3. Mergi la [vercel.com](https://vercel.com) → **New Project** → importă repo-ul
4. Vercel detectează automat Vite → click **Deploy**

### Opțiunea C — Pe domeniu studiokolectiv.ro (subdomain)
1. După ce ai deployed pe Vercel:
2. Vercel Dashboard → Project → Settings → **Domains**
3. Adaugă: `app.studiokolectiv.ro`
4. La registrarul tău de domeniu (ex: ROTLD, GoDaddy), adaugă:
   ```
   CNAME  app  cname.vercel-dns.com
   ```
5. Vercel generează automat certificat SSL

---

## 🔔 PASUL 4 — Push Notifications (server-side, opțional avansat)

Pentru notificări automate (ex: cu 7 zile înainte de termen), ai nevoie de un Cloud Function:

```bash
# Instalează Firebase Functions
npm install -g firebase-tools
firebase init functions
```

Exemplu funcție (functions/index.js):
```javascript
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

exports.checkDeadlines = functions.pubsub
  .schedule('every 24 hours').onRun(async () => {
    // Parcurge toate proiectele și trimite notificări
    // pentru termene în 1, 3, 7 zile
  })
```

---

## 📱 PASUL 5 — PWA (instalare pe telefon/desktop)

Aplicația este deja configurată ca PWA. Utilizatorii pot instala direct din browser:
- **Chrome/Edge**: click pe iconița de instalare din bara de adresă
- **iOS Safari**: Share → Add to Home Screen

---

## 🔗 Google Drive / Dropbox integration

Aplicația permite adăugarea de linkuri externe (Google Drive, Dropbox) direct din câmpul de link în `AttachmentUploader`. 

Pentru integrare completă Drive (browse fișiere din aplicație):
1. [Google Cloud Console](https://console.cloud.google.com) → Enable **Google Drive API**
2. OAuth 2.0 credentials → Web application
3. Adaugă logica de picker în `AttachmentUploader.jsx`

---

## 🏢 Date firmă (de actualizat)

Editează `src/lib/constants.js` → obiectul `COMPANY`:
```javascript
export const COMPANY = {
  name:    'Studio Office Kolectiv',
  cui:     'CUI 32238680',
  site:    'www.studiokolectiv.ro',
  email:   'office@studiokolectiv.ro',   // ← de actualizat
  phone:   '+40 000 000 000',             // ← de actualizat
  address: 'România',                    // ← de actualizat
  tagline: 'Arhitectură · Urbanism · Design'
}
```

---

## ✅ Checklist final înainte de lansare

- [ ] Firebase config completat în `src/lib/firebase.js`
- [ ] Același config copiat în `public/firebase-messaging-sw.js`
- [ ] VAPID key completat
- [ ] Date firmă actualizate în `constants.js`
- [ ] Reguli Firestore + Storage deployed
- [ ] Domeniu configurat (app.studiokolectiv.ro)
- [ ] Testare login Google + email
- [ ] Testare upload fișier
- [ ] Testare export PDF Gantt

---

## 📞 Suport

Stack folosit: React 18 · Vite 5 · Firebase 10 · jsPDF · date-fns · Vercel

Pentru întrebări tehnice: vezi documentația la [firebase.google.com/docs](https://firebase.google.com/docs)

---

## 💬 CHAT — Setup suplimentar

### Funcționalități chat
- **5 canale per proiect**: General, CU, Avize, PT, Dosar AC
- **Avatare colorate** cu inițiale (Prenume + Nume) — asignate automat per utilizator
- **@menționare** cu dropdown auto-complete și notificare email
- **Atașamente**: upload fișiere Firebase Storage + linkuri externe Drive/Dropbox
- **Membrii proiect**: adaugă colaboratori cu email pentru notificări

### Configurare email notificări (@menționare) cu SendGrid

1. **Cont SendGrid**: mergi la [sendgrid.com](https://sendgrid.com) → cont gratuit (**100 emailuri/zi**)
2. **Sender Authentication**: Settings → Sender Authentication → **Authenticate Your Domain** → `studiokolectiv.ro`
   - Adaugă recordurile CNAME la registrarul de domeniu (ROTLD / GoDaddy etc.)
3. **API Key**: Settings → API Keys → **Create API Key** → Full Access → copiază cheia `SG.XXXX`

4. **Deploy Cloud Functions**:
```bash
cd archplan
firebase init functions   # selectează JavaScript + Node 18
cd functions && npm install
firebase functions:config:set sendgrid.api_key="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
firebase functions:config:set app.url="https://app.studiokolectiv.ro"
firebase deploy --only functions
```

5. **Testare**: adaugă un membru în proiect → scrie `@NumeMembru` în chat → verifică inbox

> **Limită gratuită**: 100 emailuri/zi pe planul free SendGrid. Pentru volume mai mari, planul Essentials pornește de la $19.95/lună (50,000 emailuri).

### Avatare asignate per proiect
- Fiecare utilizator primește automat o culoare unică bazată pe email/nume
- Inițialele afișate sunt: prima literă din prenume + prima literă din nume
- Culorile sunt consistente în toată aplicația (chat, sidebar, header)
