;;; ============================================================
;;; SABLOANE PERETI & DETALII EXECUTIE — Studio Office Kolectiv
;;; Pereti: caramida, BCA, timberframe, gipscarton, termosisteme
;;; Comenzi: PERETE | P-CARAMIDA | P-BCA | P-TIMBER | P-GIPS
;;;          P-TERMOEXT | P-COMPLEX | DETALIU-PERETE
;;; ============================================================

(defun deg->rad (d) (* d (/ pi 180.0)))

;;; Haşuri disponibile pentru fiecare material
;;; (trebuie sa existe in AutoCAD sau in fisierele .pat din /hasuri)
(setq HASURI-MATERIALE
  '(("CARAMIDA"    . "BRICK")
    ("BCA"         . "AR-B816")
    ("BETON"       . "AR-CONC")
    ("BETON-ARMAT" . "AR-RSHKE")
    ("LEMN"        . "WOOD")
    ("IZOLATIE"    . "AR-SAND")
    ("VATA"        . "DOTS")
    ("GIPSCARTON"  . "LINE")
    ("MORTAR"      . "NET")
  )
)

;;; --- Desenare strat simplu perete ---
(defun draw-strat (pt-start pt-end grosime unghi cod-hasura culoare-hasura denumire /
                   pt1 pt2 pt3 pt4 contur)
  (setq pt1 pt-start)
  (setq pt2 pt-end)
  (setq pt3 (polar pt-end   (+ unghi (deg->rad 90)) grosime))
  (setq pt4 (polar pt-start (+ unghi (deg->rad 90)) grosime))

  ;; Contur strat
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (command "_PLINE" pt1 pt2 pt3 pt4 "_Close" "")

  ;; Hasura strat (daca e specificata)
  (if (and cod-hasura (not (= cod-hasura "")))
    (progn
      (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
      (if culoare-hasura
        (command "_.-LAYER" "_Color" culoare-hasura "A-HASURA-PERETE" "")
      )
      (command "_HATCH" cod-hasura 1 0
        (list (/ (+ (car pt1) (car pt3)) 2)
              (/ (+ (cadr pt1) (cadr pt3)) 2)
              0)
        "")
    )
  )

  ;; Returnare punct nou de start (exteriorul stratului)
  (polar pt-start (+ unghi (deg->rad 90)) grosime)
)

;;; --- PERETE CARAMIDA simpla (30cm) ---
(defun C:P-CARAMIDA ( / pt-start lungime grosime unghi pt-end tip)
  (princ "\n=== PERETE CARAMIDA ===")

  (setq pt-start (getpoint "\nPunct start perete (stanga-exterior): "))
  (if (null pt-start) (exit))

  (initget 6)
  (setq lungime (getdist pt-start "\nLungimea peretelui: "))
  (if (null lungime) (exit))

  (initget 6)
  (setq unghi (getangle pt-start "\nUnghiul peretelui <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (initget "24 30 37.5")
  (setq tip (getkword "\nTip zidarie [24/30/37.5cm] <30>: "))
  (if (null tip) (setq tip "30"))

  (setq grosime (/ (atof tip) 100.0))
  (setq pt-end (polar pt-start unghi lungime))

  (command "_.-LAYER" "_Set" "A-PERETE" "")

  ;; Contur exterior
  (setq pt-int1 (polar pt-start (+ unghi (deg->rad 90)) grosime))
  (setq pt-int2 (polar pt-end   (+ unghi (deg->rad 90)) grosime))

  (command "_PLINE" pt-start pt-end pt-int2 pt-int1 "_Close" "")

  ;; Hasura caramida
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (command "_HATCH" "BRICK" 0.05 0
    (list (/ (+ (car pt-start) (car pt-int2)) 2)
          (/ (+ (cadr pt-start) (cadr pt-int2)) 2)
          0)
    "")

  (princ (strcat "\nPerete caramida " tip "cm, " (rtos lungime 2 2) "m lungime."))
  (princ)
)

;;; --- PERETE BCA ---
(defun C:P-BCA ( / pt-start lungime unghi grosime tip pt-end)
  (princ "\n=== PERETE BCA ===")

  (setq pt-start (getpoint "\nPunct start (stanga-exterior): "))
  (if (null pt-start) (exit))

  (initget 6)
  (setq lungime (getdist pt-start "\nLungimea peretelui: "))
  (if (null lungime) (exit))

  (initget 6)
  (setq unghi (getangle pt-start "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (initget "20 25 30")
  (setq tip (getkword "\nGrosime BCA [20/25/30cm] <25>: "))
  (if (null tip) (setq tip "25"))

  (setq grosime (/ (atof tip) 100.0))
  (setq pt-end (polar pt-start unghi lungime))

  ;; Structura perete BCA: 1.5cm tencuiala + BCA + 1.5cm tencuiala
  (setq tenc 0.015)
  (setq pt-cur pt-start)
  (setq pt-cur-end pt-end)

  ;; Tencuiala exterioara
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (setq pt-cur (draw-strat pt-cur pt-cur-end tenc unghi "NET" "8" "Tencuiala"))

  ;; BCA
  (command "_.-LAYER" "_Set" "A-PERETE" "")
  (setq pt-bca-start pt-cur)
  (setq pt-bca-end (polar pt-cur-end (+ unghi (deg->rad 90)) 0))
  (setq pt-cur (draw-strat pt-cur pt-cur-end grosime unghi "AR-B816" "7" "BCA"))

  ;; Tencuiala interioara
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (setq pt-cur (draw-strat pt-cur pt-cur-end tenc unghi "NET" "8" "Tencuiala"))

  ;; Contur exterior total
  (command "_.-LAYER" "_Set" "A-PERETE" "")
  (setq grosime-totala (+ (* 2 tenc) grosime))
  (setq pt-int1 (polar pt-start (+ unghi (deg->rad 90)) grosime-totala))
  (setq pt-int2 (polar pt-end   (+ unghi (deg->rad 90)) grosime-totala))
  (command "_LINE" pt-start pt-end "")
  (command "_LINE" pt-int1 pt-int2 "")
  (command "_LINE" pt-start pt-int1 "")
  (command "_LINE" pt-end pt-int2 "")

  (princ (strcat "\nPerete BCA " tip "cm (+" (itoa (round (* tenc 100))) "cm tencuiala/fata)."))
  (princ)
)

;;; --- PERETE TIMBERFRAME (structura lemn) ---
(defun C:P-TIMBER ( / pt-start lungime unghi sectiune-montant distanta-ax pt-end grosime-totala)
  (princ "\n=== PERETE TIMBERFRAME ===")
  (princ "\nStructura: OSB 15mm | Montanti 50x150 + vata min. | OSB 15mm | GC 12.5mm")

  (setq pt-start (getpoint "\nPunct start (fata exterioara OSB): "))
  (if (null pt-start) (exit))

  (initget 6)
  (setq lungime (getdist pt-start "\nLungimea peretelui: "))
  (if (null lungime) (exit))

  (initget 6)
  (setq unghi (getangle pt-start "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (initget "150 200 250")
  (setq adancime-str (getkword "\nAdancimea structurii [150/200/250mm] <150>: "))
  (if (null adancime-str) (setq adancime-str "150"))

  (setq osb    0.015)
  (setq gc     0.0125)
  (setq struct (/ (atof adancime-str) 1000.0))
  (setq grosime-totala (+ osb struct gc))

  (setq pt-end (polar pt-start unghi lungime))
  (setq pt-cur pt-start)

  ;; Strat 1: OSB exterior 15mm
  (command "_.-LAYER" "_Set" "A-HASURA-LEMN" "")
  (setq pt-cur (draw-strat pt-cur pt-end osb unghi "LINE" "34" "OSB"))

  ;; Strat 2: Structura (montanti + vata)
  (command "_.-LAYER" "_Set" "A-PERETE" "")
  (setq pt-struct-start pt-cur)
  (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) struct unghi "DOTS" "9" "Structura"))

  ;; Montanti 50x150 la 62.5cm — desenare simbolica
  (command "_.-LAYER" "_Set" "A-HASURA-LEMN" "")
  (setq nr-montanti (fix (/ lungime 0.625)))
  (setq i 0)
  (while (<= i nr-montanti)
    (setq dist-montant (* i 0.625))
    (if (<= dist-montant lungime)
      (progn
        (setq pm1 (polar (polar pt-struct-start unghi dist-montant)
                         (+ unghi (deg->rad 90)) 0))
        (setq pm2 (polar pm1 (+ unghi (deg->rad 90)) struct))
        (setq pm1b (polar pm1 unghi 0.05))
        (setq pm2b (polar pm2 unghi 0.05))
        (if (<= (+ dist-montant 0.05) lungime)
          (command "_RECTANG" pm1 pm2b)
        )
      )
    )
    (setq i (+ i 1))
  )

  ;; Strat 3: OSB interior 15mm
  (command "_.-LAYER" "_Set" "A-HASURA-LEMN" "")
  (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) osb unghi "LINE" "34" "OSB"))

  ;; Strat 4: Gips carton 12.5mm
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) gc unghi "LINE" "253" "GC"))

  ;; Contur exterior
  (command "_.-LAYER" "_Set" "A-PERETE-STR" "")
  (setq pt-int1 (polar pt-start (+ unghi (deg->rad 90)) grosime-totala))
  (setq pt-int2 (polar pt-end   (+ unghi (deg->rad 90)) grosime-totala))
  (command "_LINE" pt-start pt-end "")
  (command "_LINE" pt-int1 pt-int2 "")
  (command "_LINE" pt-start pt-int1 "")
  (command "_LINE" pt-end pt-int2 "")

  (princ (strcat "\nPerete Timberframe " adancime-str "mm structura."))
  (princ (strcat "\nGrosime totala: " (rtos (* grosime-totala 100) 2 1) "cm"))
  (princ)
)

;;; --- PERETE GIPS CARTON (simplu si dublu) ---
(defun C:P-GIPS ( / pt-start lungime unghi tip pt-end)
  (princ "\n=== PERETE GIPS CARTON ===")

  (setq pt-start (getpoint "\nPunct start (ax perete): "))
  (if (null pt-start) (exit))

  (initget 6)
  (setq lungime (getdist pt-start "\nLungimea peretelui: "))
  (if (null lungime) (exit))

  (initget 6)
  (setq unghi (getangle pt-start "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (initget "1x12 2x12 1x15 2x15 Dublu-50 Dublu-75 Dublu-100")
  (setq tip (getkword "\nTip perete GC [1x12/2x12/1x15/2x15/Dublu-50/Dublu-75/Dublu-100] <1x12>: "))
  (if (null tip) (setq tip "1x12"))

  (setq pt-end (polar pt-start unghi lungime))

  (cond
    ((= tip "1x12")
     (setq grosime-gc 0.0125) (setq nr-straturi 1) (setq profil 0.05)
     (setq grosime-totala (+ (* 2 grosime-gc) profil)))
    ((= tip "2x12")
     (setq grosime-gc 0.0125) (setq nr-straturi 2) (setq profil 0.05)
     (setq grosime-totala (+ (* 4 grosime-gc) profil)))
    ((= tip "1x15")
     (setq grosime-gc 0.015) (setq nr-straturi 1) (setq profil 0.05)
     (setq grosime-totala (+ (* 2 grosime-gc) profil)))
    ((= tip "2x15")
     (setq grosime-gc 0.015) (setq nr-straturi 2) (setq profil 0.05)
     (setq grosime-totala (+ (* 4 grosime-gc) profil)))
    ((= tip "Dublu-50")
     (setq grosime-gc 0.0125) (setq nr-straturi 1) (setq profil 0.10)
     (setq grosime-totala (+ (* 4 grosime-gc) profil)))
    ((= tip "Dublu-75")
     (setq grosime-gc 0.0125) (setq nr-straturi 1) (setq profil 0.115)
     (setq grosime-totala (+ (* 4 grosime-gc) profil)))
    ((= tip "Dublu-100")
     (setq grosime-gc 0.0125) (setq nr-straturi 1) (setq profil 0.14)
     (setq grosime-totala (+ (* 4 grosime-gc) profil)))
    (t
     (setq grosime-totala 0.075))
  )

  ;; Centrat pe ax
  (setq offset-lateral (/ grosime-totala 2.0))
  (setq pt-start-ext (polar pt-start (- unghi (deg->rad 90)) offset-lateral))
  (setq pt-end-ext   (polar pt-end   (- unghi (deg->rad 90)) offset-lateral))

  (command "_.-LAYER" "_Set" "A-PERETE-NESTR" "")
  (setq pt-cur pt-start-ext)

  ;; Placa GC fata
  (repeat nr-straturi
    (setq pt-cur (draw-strat pt-cur (polar pt-end-ext 0 0) grosime-gc unghi "LINE" "253" "GC"))
  )

  ;; Profil metalic (umplut cu hasura rara)
  (setq pt-profil-start pt-cur)
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (setq pt-cur (draw-strat pt-cur (polar pt-end-ext 0 0) profil unghi "NET3" "9" "Profil"))

  ;; Vata minerala (optional, in interiorul profilului)
  (command "_.-LAYER" "_Set" "A-HASURA-IZOLATIE" "")
  (setq pt-vata1 pt-profil-start)
  (setq pt-vata2 (polar pt-end-ext (+ unghi (deg->rad 90)) 0))
  (command "_HATCH" "DOTS" 0.02 0
    (list (/ (+ (car pt-vata1) (car pt-cur)) 2)
          (/ (+ (cadr pt-vata1) (cadr pt-cur)) 2)
          0)
    "")

  ;; Placa GC spate
  (command "_.-LAYER" "_Set" "A-PERETE-NESTR" "")
  (repeat nr-straturi
    (setq pt-cur (draw-strat pt-cur (polar pt-end-ext 0 0) grosime-gc unghi "LINE" "253" "GC"))
  )

  ;; Contur final
  (setq pt-int1 (polar pt-start-ext (+ unghi (deg->rad 90)) grosime-totala))
  (setq pt-int2 (polar pt-end-ext   (+ unghi (deg->rad 90)) grosime-totala))
  (command "_LINE" pt-start-ext pt-end-ext "")
  (command "_LINE" pt-int1 pt-int2 "")
  (command "_LINE" pt-start-ext pt-int1 "")
  (command "_LINE" pt-end-ext pt-int2 "")

  (princ (strcat "\nPerete GC " tip " — grosime " (rtos (* grosime-totala 100) 2 1) "cm"))
  (princ)
)

;;; --- TERMOSISTEM EXTERIOR (EPS/vata pe perete existent) ---
(defun C:P-TERMOEXT ( / pt-start lungime unghi tip-izolatie grosime-izolatie pt-end)
  (princ "\n=== TERMOSISTEM EXTERIOR ===")
  (princ "\nStructura: Tencuiala existenta + Adeziv + EPS/Vata + Plasa + Grund + Tencuiala decorativa")

  (setq pt-start (getpoint "\nPunct start (suprafata exterioara a peretelui existent): "))
  (if (null pt-start) (exit))

  (initget 6)
  (setq lungime (getdist pt-start "\nLungimea sectiunii: "))
  (if (null lungime) (exit))

  (initget 6)
  (setq unghi (getangle pt-start "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (initget "EPS60 EPS80 EPS100 EPS120 EPS150 EPS200 Vata80 Vata100 Vata120")
  (setq tip-izolatie (getkword "\nTip/grosime izolatie [EPS60/80/100/120/150/200 | Vata80/100/120] <EPS100>: "))
  (if (null tip-izolatie) (setq tip-izolatie "EPS100"))

  (setq grosime-izolatie
    (/ (atof (substr tip-izolatie 4)) 1000.0))

  (setq adeziv   0.005)   ; 5mm
  (setq plasa    0.003)   ; 3mm (grund + plasa)
  (setq tencuiala-dec 0.003) ; 3mm tencuiala decorativa

  (setq pt-end (polar pt-start unghi lungime))
  (setq pt-cur pt-start)

  ;; Adeziv
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) adeziv unghi "NET" "8" "Adeziv"))

  ;; EPS sau Vata
  (command "_.-LAYER" "_Set" "A-HASURA-IZOLATIE" "")
  (if (wcmatch tip-izolatie "EPS*")
    (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) grosime-izolatie unghi "AR-SAND" "2" "EPS"))
    (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) grosime-izolatie unghi "DOTS" "6" "Vata"))
  )

  ;; Plasa armare + grund
  (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
  (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) plasa unghi "NET3" "9" "Plasa+grund"))

  ;; Tencuiala decorativa
  (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) tencuiala-dec unghi "LINE" "252" "Tenc.dec."))

  ;; Cotare automata a grosimilor (daca exista obiect de selectat)
  (setq grosime-totala (+ adeziv grosime-izolatie plasa tencuiala-dec))

  (command "_.-LAYER" "_Set" "A-DETALIU-TEXT" "")
  (setq pt-eticheta (polar pt-start (- unghi (deg->rad 90)) 0.10))
  (command "_TEXT" "_J" "_R" pt-eticheta 0.025 "0"
    (strcat "Termosistem " tip-izolatie " — " (rtos (* grosime-totala 100) 2 1) "cm"))

  (princ (strcat "\nTermosistem " tip-izolatie " — grosime totala: "
    (rtos (* grosime-totala 100) 2 1) "cm"))
  (princ)
)

;;; --- PERETE COMPLEX (wizard stratificat) ---
(defun C:P-COMPLEX ( / pt-start lungime unghi stratificare total-grosime tip-perete)
  (princ "\n=== PERETE COMPLEX (Wizard) ===")
  (princ "\nConstructii frecvent utilizate:")
  (princ "\n  1 = Caramida 30 + Termosistem EPS100")
  (princ "\n  2 = BCA 25 + Termosistem EPS100")
  (princ "\n  3 = Caramida 25 + Termo 5cm EPS + Aer 10cm + Caramida 12cm (perete dublu)")
  (princ "\n  4 = Beton armat 25 + Termosistem EPS150")
  (princ "\n  5 = Gips carton dublu perete despartitor 75mm")

  (setq tip-perete (getint "\nSelecteaza tip [1-5]: "))
  (if (null tip-perete) (setq tip-perete 1))

  (setq pt-start (getpoint "\nPunct start (exterior): "))
  (if (null pt-start) (exit))

  (initget 6)
  (setq lungime (getdist pt-start "\nLungimea: "))
  (if (null lungime) (exit))

  (initget 6)
  (setq unghi (getangle pt-start "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (setq pt-end (polar pt-start unghi lungime))
  (setq pt-cur pt-start)

  (cond
    ((= tip-perete 1)
     (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
     (setq pt-cur (draw-strat pt-cur pt-end 0.015 unghi "NET" "8" "Tencuiala ext"))
     (command "_.-LAYER" "_Set" "A-HASURA-IZOLATIE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.100 unghi "AR-SAND" "2" "EPS 100mm"))
     (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.003 unghi "NET3" "9" "Plasa"))
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.003 unghi "LINE" "8" "Grund+tenc"))
     (command "_.-LAYER" "_Set" "A-PERETE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.300 unghi "BRICK" "7" "Caramida 30cm"))
     (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.015 unghi "NET" "8" "Tencuiala int"))
     (setq total-grosime 0.436)
     (setq txt-perete "Zidarie caramida 30cm + Termosistem EPS100 = 43.6cm")
    )
    ((= tip-perete 2)
     (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
     (setq pt-cur (draw-strat pt-cur pt-end 0.015 unghi "NET" "8" "Tencuiala ext"))
     (command "_.-LAYER" "_Set" "A-HASURA-IZOLATIE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.100 unghi "AR-SAND" "2" "EPS 100mm"))
     (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.006 unghi "NET3" "9" "Plasa+tenc"))
     (command "_.-LAYER" "_Set" "A-PERETE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.250 unghi "AR-B816" "7" "BCA 25cm"))
     (command "_.-LAYER" "_Set" "A-HASURA-PERETE" "")
     (setq pt-cur (draw-strat pt-cur (polar pt-end 0 0) 0.015 unghi "NET" "8" "Tencuiala int"))
     (setq total-grosime 0.386)
     (setq txt-perete "BCA 25cm + Termosistem EPS100 = 38.6cm")
    )
    ((= tip-perete 5)
     (command "_LISP" "_C:P-GIPS")
    )
    (t
     (princ "\nTip perete implementat partial. Utilizeaza comenzile specifice.")
     (exit)
    )
  )

  (command "_.-LAYER" "_Set" "A-DETALIU-TEXT" "")
  (setq pt-etich (polar pt-start (- unghi (deg->rad 90)) 0.20))
  (command "_TEXT" "_J" "_TC" pt-etich 0.030 "0" txt-perete)

  (princ (strcat "\n" txt-perete))
  (princ)
)

(princ "\nPereti si detalii incarcate.")
(princ "\nComenzi: P-CARAMIDA | P-BCA | P-TIMBER | P-GIPS | P-TERMOEXT | P-COMPLEX")
(princ)
