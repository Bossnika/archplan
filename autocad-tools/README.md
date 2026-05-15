# AutoCAD Toolkit — Studio Office Kolectiv

Toolkit complet pentru automatizarea proceselor de proiectare in AutoCAD.

---

## Structura

```
autocad-tools/
├── lisp/
│   ├── initializare.lsp        ← Incarca toate modulele (KOL-INIT)
│   ├── layere-arhitectura.lsp  ← 50+ layere standard arhitectura
│   ├── layere-urbanism.lsp     ← 60+ layere standard urbanism
│   ├── usi-dinamice.lsp        ← Usi parametrice (4 tipuri)
│   ├── ferestre-dinamice.lsp   ← Ferestre parametrice (4 tipuri)
│   ├── mobilier.lsp            ← Mobilier si sanitare
│   ├── cotare-auto.lsp         ← Cotare automata + stiluri
│   └── pereti-detalii.lsp      ← Pereti stratificati (5 tipuri)
├── python/
│   ├── export-cantitati.py     ← Export lista cantitati Excel
│   └── batch-operatii.py       ← Operatii batch pe fisiere DWG
├── hasuri/
│   └── kolectiv-pereti.pat     ← Hasuri personalizate materiale
└── scripturi/
    └── initializare-nou-proiect.scr  ← Setup proiect nou
```

---

## Instalare

### 1. Fisierele LISP

**Metoda A — Autoloading (recomandat)**

1. Copiaza toate fisierele `.lsp` din `lisp/` intr-un folder dedicat, ex:
   ```
   C:\Kolectiv\AutoCAD-Toolkit\lisp\
   ```
2. In AutoCAD: `Tools > Options > Files > Support File Search Path`
   → Adauga calea de mai sus
3. Deschide `C:\Users\<user>\AppData\Roaming\Autodesk\AutoCAD <ver>\<lang>\Support\acad.lsp`
   (sau `acaddoc.lsp` pentru per-document) si adauga:
   ```lisp
   (load "initializare.lsp")
   ```

**Metoda B — Manual**

In AutoCAD, scrie in command line:
```
APPLOAD
```
Selecteaza fisierele LISP si apasa `Load`.

### 2. Hasurile personalizate

Copiaza `kolectiv-pereti.pat` in:
```
C:\Users\<user>\AppData\Roaming\Autodesk\AutoCAD <ver>\<lang>\Support\
```

Sau adauga calea folderului `hasuri/` in Support Search Path (pasul 2 de mai sus).

### 3. Python (pentru export Excel si batch)

```bash
pip install openpyxl pywin32 comtypes
```

---

## Comenzi disponibile

### Initializare
| Comanda | Descriere |
|---------|-----------|
| `KOL-INIT` sau `KI` | Incarca toate modulele |

### Layere
| Comanda | Descriere |
|---------|-----------|
| `LAYERE-ARHI` | Creeaza sistemul complet de layere arhitectura |
| `LAYERE-URB`  | Creeaza sistemul complet de layere urbanism |
| `LA`          | Seteaza rapid un layer curent |

### Usi
| Comanda | Descriere |
|---------|-----------|
| `USA`           | Usa batanta simpla |
| `USA2`          | Usa dubla batanta |
| `USA-CULISANTA` | Usa culisanta |
| `USA-EXT`       | Usa exterioara cu toc gros |

### Ferestre
| Comanda | Descriere |
|---------|-----------|
| `FEREASTRA`    | Fereastra batanta |
| `FER-FIX`      | Fereastra fixa |
| `FER-CULISANTA`| Fereastra culisanta 2 canate |
| `FER-OSCILO`   | Fereastra oscilo-batanta |

### Pereti
| Comanda | Descriere |
|---------|-----------|
| `P-CARAMIDA`  | Perete caramida (24/30/37.5cm) |
| `P-BCA`       | Perete BCA cu tencuiala (20/25/30cm) |
| `P-TIMBER`    | Perete Timberframe (150/200/250mm structura) |
| `P-GIPS`      | Perete gips carton (multiple configuratii) |
| `P-TERMOEXT`  | Termosistem exterior (EPS/Vata, 60-200mm) |
| `P-COMPLEX`   | Wizard pereti uzuale (5 configuratii) |

### Mobilier
| Comanda | Descriere |
|---------|-----------|
| `MOB-PAT`   | Pat (Single 90/Double 160/King 200cm) |
| `MOB-MASA`  | Masa cu scaune |
| `MOB-BAIE`  | Cada, dus, WC, lavoar, bideu, spalator |
| `MOB-DULAP` | Dulap cu usi |

### Cotare
| Comanda | Descriere |
|---------|-----------|
| `COTA-LANT`      | Cotare in lant (mai multe puncte coliniare) |
| `COTA-NIVEL`     | Cota de nivel altimetrica |
| `COTA-SUPRAFATA` | Calcul si afisare arie incapere |
| `COTA-TOTAL`     | Cota rapida intre 2 puncte |
| `STILURI-COTA`   | Creare stiluri ARH-1-20/50/100/200 |
| `SCARA`          | Setare scara desen (DIMSCALE + LTSCALE + TEXTSIZE) |

---

## Python — Export Cantitati

```bash
# Export simplu (date demo sau din AutoCAD activ)
python python/export-cantitati.py

# Cu nume fisier specificat
python python/export-cantitati.py Cantitati_Proiect_X.xlsx
```

**Foile generate in Excel:**
1. `Rezumat Proiect` — informatii generale + sumar suprafete
2. `Suprafete Incaperi` — tabel cu toate incaperile si suprafetele
3. `Tamplarie` — lista usi si ferestre
4. `Pereti & Finisaje` — pereti, pardoseli, finisaje pereti/tavan
5. `Structura & Acoperis` — elemente structurale si acoperis
6. `Centralizator Cantitati` — deviz estimativ complet

---

## Python — Operatii Batch

```bash
# Export PDF din toate DWG-urile unui folder
python python/batch-operatii.py --actiune plot --folder ./desene --output ./pdf

# Extrage atribute blocuri in Excel
python python/batch-operatii.py --actiune extrage --folder ./desene

# Aplica layere standard in toate DWG-urile
python python/batch-operatii.py --actiune layere-arhi --folder ./desene

# Raport audit (dimensiuni, layere, entitati)
python python/batch-operatii.py --actiune audit --folder ./desene
```

---

## Hasuri personalizate disponibile

| Cod hasura | Material |
|-----------|----------|
| `KOLBCA`     | BCA — Beton Celular Autoclavizat |
| `KOLCAR`     | Caramida plina standard |
| `KOLCAR12`   | Caramida (detalii la scara mica) |
| `KOLIEPS`    | EPS — Polistiren expandat |
| `KOLIVAT`    | Vata minerala / de sticla |
| `KOLXPS`     | XPS — Polistiren extrudat |
| `KOLGIPS`    | Gips carton |
| `KOLOSB`     | OSB |
| `KOLLEMN`    | Lemn masiv (sectiune) |
| `KOLBETON`   | Beton simplu |
| `KOLBETONAR` | Beton armat |
| `KOLMORTAR`  | Mortar de zidarie |

---

## Versiuni AutoCAD suportate

Testat cu AutoCAD 2018 — 2025 (Windows).
Fisierele LISP sunt compatibile cu AutoCAD LT cu functii LISP activate.
