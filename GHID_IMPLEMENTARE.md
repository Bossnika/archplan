# 🚀 Ghid complet implementare ArchPlan
## De la zero la aplicație live pe studiokolectiv.ro

---

## CE AI NEVOIE (toate gratuite sau cu plan free)

| Serviciu | Rol | Cost |
|----------|-----|------|
| [GitHub](https://github.com) | Stocare cod sursă | Gratuit |
| [Firebase](https://firebase.google.com) | Bază de date + autentificare + stocare fișiere | Gratuit (Spark plan) |
| [Vercel](https://vercel.com) | Hosting aplicație web | Gratuit |
| [SendGrid](https://sendgrid.com) | Email notificări @menționare | Gratuit (100/zi) |

**Timp estimat: 2-3 ore** (prima dată), ~30 min ulterior pentru actualizări.

---

## PASUL 1 — Instalezi Node.js pe calculator

Node.js este mediul de rulare necesar pentru a construi aplicația.

1. Mergi la **https://nodejs.org**
2. Descarcă versiunea **LTS** (butonul verde mare)
3. Rulează installer-ul → Next → Next → Install
4. Verifică instalarea: deschide **Command Prompt** (Windows) sau **Terminal** (Mac)
   și scrie:
   ```
   node --version
   ```
   Ar trebui să apară ceva de genul: `v20.11.0`

---

## PASUL 2 — Dezarhivezi și pregătești codul

1. Dezarhivează fișierul `archplan-studio-kolectiv.zip` pe calculator
   → va crea un folder `archplan/`

2. În **Command Prompt** / **Terminal**, navighează în folder:
   ```
   cd calea/catre/archplan
   ```
   Exemplu Windows: `cd C:\Users\NumeTau\Desktop\archplan`
   Exemplu Mac: `cd ~/Desktop/archplan`

3. Instalează dependențele (toate bibliotecile necesare):
   ```
   npm install
   ```
   ⏳ Durează 1-2 minute. Va apărea un folder `node_modules/`.

4. Testează că merge local:
   ```
   npm run dev
   ```
   Deschide browserul la **http://localhost:5173** — ar trebui să vezi aplicația.
   Apasă `Ctrl+C` în terminal pentru a opri.

---

## PASUL 3 — Creezi proiectul Firebase

Firebase este "creierul" aplicației — stochează datele, gestionează login-ul și fișierele.

### 3.1 Creează proiectul
1. Mergi la **https://console.firebase.google.com**
2. Click **"Add project"** (sau "Creați un proiect")
3. Nume proiect: `archplan-kolectiv` → Continue
4. Dezactivează Google Analytics (nu e necesar) → Continue
5. Aștepți ~30 secunde → **"Continue"**

### 3.2 Activează Authentication (login)
1. În meniul stânga → **Build → Authentication**
2. Click **"Get started"**
3. Tab **"Sign-in method"** → activează:
   - **Google** → Enable → email suport: `office@studiokolectiv.ro` → Save
   - **Email/Password** → Enable → Save

### 3.3 Activează Firestore (baza de date)
1. Meniul stânga → **Build → Firestore Database**
2. Click **"Create database"**
3. Selectează **"Start in production mode"** → Next
4. Locație: `eur3 (europe-west)` → Enable
5. Aștepți ~1 minut

### 3.4 Activează Storage (fișiere)
1. Meniul stânga → **Build → Storage**
2. Click **"Get started"** → Next → Done

### 3.5 Copiază configurația
1. Click pe **iconița rotiță ⚙️** (Project Settings) din stânga sus
2. Scroll jos la **"Your apps"** → click **`</>`** (Web)
3. App nickname: `ArchPlan Web` → **"Register app"**
4. Copiezi **obiectul `firebaseConfig`** — arată ca:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "archplan-kolectiv.firebaseapp.com",
     projectId: "archplan-kolectiv",
     storageBucket: "archplan-kolectiv.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
5. Deschizi fișierul `archplan/src/lib/firebase.js` cu **Notepad** sau **VS Code**
6. Înlocuiești toate valorile `"REPLACE_WITH_YOUR_..."` cu valorile reale din pasul 4

### 3.6 Publică regulile de securitate
1. În Firestore → tab **"Rules"** → înlocuiește tot cu conținutul din `firestore.rules`
2. Click **"Publish"**
3. La fel pentru Storage → tab **"Rules"** → conținut din `storage.rules` → Publish

---

## PASUL 4 — Urci codul pe GitHub

GitHub păstrează codul și permite Vercel să-l preia automat.

1. Mergi la **https://github.com** → creează cont (dacă nu ai)
2. Click **"New repository"** (butonul verde)
   - Repository name: `archplan-kolectiv`
   - Private ✓ (recomandat)
   - Click **"Create repository"**
3. În terminal, în folderul `archplan/`:
   ```
   git init
   git add .
   git commit -m "ArchPlan initial"
   git branch -M main
   git remote add origin https://github.com/USERUL_TAU/archplan-kolectiv.git
   git push -u origin main
   ```
   ⚠️ Înlocuiește `USERUL_TAU` cu username-ul tău de GitHub

---

## PASUL 5 — Deploy pe Vercel

Vercel face aplicația accesibilă pe internet.

1. Mergi la **https://vercel.com** → **"Sign up"** cu contul GitHub
2. Click **"Add New Project"**
3. **"Import"** lângă `archplan-kolectiv`
4. Framework Preset: se detectează automat **Vite** ✓
5. Click **"Deploy"** → aștepți ~2 minute
6. ✅ Vei primi un link de genul: `https://archplan-kolectiv.vercel.app`

### 5.1 Conectezi domeniul studiokolectiv.ro (subdomain)
1. Vercel Dashboard → proiectul tău → **Settings → Domains**
2. Adaugă: `app.studiokolectiv.ro` → Add
3. Vercel îți arată un record DNS de adăugat (tip CNAME)
4. Mergi la registrarul domeniului tău (ex: RoTLD, GoDaddy, Namecheap)
5. DNS Management → adaugă recordul CNAME:
   - **Name/Host**: `app`
   - **Value/Target**: `cname.vercel-dns.com`
   - **TTL**: 3600
6. Aștepți 5-30 minute → aplicația e live la **https://app.studiokolectiv.ro** ✅

### 5.2 Autorizezi domeniul în Firebase
1. Firebase Console → Authentication → **Settings** → **Authorized domains**
2. Click **"Add domain"** → adaugi `app.studiokolectiv.ro`

---

## PASUL 6 — Configurezi emailurile (SendGrid)

Necesar pentru notificările la @menționare în chat.

1. **https://sendgrid.com** → cont gratuit (100 emailuri/zi)
2. **Verifică domeniu**:
   - Settings → Sender Authentication → **Authenticate Your Domain**
   - Provider: selectează registrarul tău
   - Domain: `studiokolectiv.ro`
   - Adaugă recordurile DNS afișate (CNAME-uri) la registrarul domeniului
   - Click **"Verify"** (după 30 min - 1 oră)
3. **Creează API Key**:
   - Settings → API Keys → **Create API Key**
   - Selectează **Full Access**
   - Copiază cheia `SG.XXXXXXXXXXXXXXXX` — **salvează-o undeva sigur!**

4. **Instalează Firebase CLI** și **deploy-ează Cloud Functions**:
   ```
   npm install -g firebase-tools
   firebase login
   cd archplan
   firebase init functions
   ```
   Selectează proiectul `archplan-kolectiv` → JavaScript → Yes pentru ESLint → Yes pentru install
   ```
   cd functions
   npm install
   cd ..
   firebase functions:config:set sendgrid.api_key="SG.CHEIA_TA_AICI"
   firebase functions:config:set app.url="https://app.studiokolectiv.ro"
   firebase deploy --only functions
   ```
   ⏳ Durează 3-5 minute prima dată.

---

## PASUL 7 — Verifici că totul funcționează

Deschide **https://app.studiokolectiv.ro** și testează:

- [ ] Login cu Google funcționează
- [ ] Login cu email/parolă funcționează
- [ ] Poți crea un proiect nou
- [ ] Poți schimba status-ul unei faze
- [ ] Upload fișier în Faze/Avize funcționează
- [ ] Chat funcționează — scrie un mesaj
- [ ] @menționare — adaugă un membru cu email real → scrie @NumeMembru → verifică inbox
- [ ] Tema Dark/Light comută corect

---

## ACTUALIZĂRI VIITOARE

Când vrei să modifici ceva în aplicație (după ce eu îți trimit cod actualizat):

1. Înlocuiești fișierele modificate în folderul `archplan/`
2. În terminal:
   ```
   git add .
   git commit -m "Descriere actualizare"
   git push
   ```
3. Vercel detectează automat push-ul și redeploy-ează în ~2 minute ✅
4. Fără altă intervenție necesară.

---

## PROBLEME FRECVENTE

**"npm install" dă erori**
→ Șterge folderul `node_modules/` și fișierul `package-lock.json`, apoi rulează din nou `npm install`

**Login cu Google nu funcționează**
→ Verifică că ai adăugat domeniul în Firebase → Authentication → Authorized domains

**Fișierele nu se uploadează**
→ Verifică regulile din Firebase Storage că sunt publicate corect

**Emailurile nu se trimit**
→ Verifică că domeniul `studiokolectiv.ro` e verificat în SendGrid și că functions sunt deployed

**Aplicația merge local dar nu pe Vercel**
→ Verifică că `src/lib/firebase.js` are toate valorile reale (nu `REPLACE_WITH_...`)

---

## CONTACT TEHNIC

Dacă te blochezi la vreun pas, revino cu mesajul exact de eroare și te ajut să îl rezolv.

