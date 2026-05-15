;;; ============================================================
;;; COTARE AUTOMATA — Studio Office Kolectiv
;;; Comenzi: COTA-AUTO | COTA-NIVEL | COTA-LANT | COTA-TOTAL
;;;          STILURI-COTA | COTA-SUPRAFATA
;;; ============================================================

(defun deg->rad (d) (* d (/ pi 180.0)))

;;; --- Creare stiluri de cotare standard ---
(defun C:STILURI-COTA ( / )
  (princ "\nCreare stiluri de cotare standard...")

  ;; Stil 1:100 (uzual pentru planuri)
  (command "_.-DIMSTYLE" "_New" "ARH-1-100" "Standard" "")
  (command "_DIMSCALE" 100)
  (setvar "DIMTXT"   0.025)    ; 2.5mm la 1:100
  (setvar "DIMASZ"   0.018)    ; sageata
  (setvar "DIMEXO"   0.010)    ; extensie linie ajutatoare
  (setvar "DIMEXE"   0.015)    ; depasire
  (setvar "DIMDLI"   0.008)    ; spatiu intre linii cota
  (setvar "DIMGAP"   0.010)    ; spatiu text-linie
  (setvar "DIMTAD"   1)        ; text deasupra liniei
  (setvar "DIMZIN"   0)        ; fara zerouri de supresie
  (setvar "DIMLUNIT" 2)        ; unitati decimale
  (setvar "DIMDSEP"  46)       ; separator zecimal (punct)
  (setvar "DIMRND"   0)        ; fara rotunjire
  (command "_.-DIMSTYLE" "_Save" "ARH-1-100" "")

  ;; Stil 1:50
  (command "_.-DIMSTYLE" "_New" "ARH-1-50" "ARH-1-100" "")
  (command "_DIMSCALE" 50)
  (setvar "DIMTXT" 0.030)
  (command "_.-DIMSTYLE" "_Save" "ARH-1-50" "")

  ;; Stil 1:200 (planuri de incadrare)
  (command "_.-DIMSTYLE" "_New" "ARH-1-200" "ARH-1-100" "")
  (command "_DIMSCALE" 200)
  (setvar "DIMTXT" 0.020)
  (command "_.-DIMSTYLE" "_Save" "ARH-1-200" "")

  ;; Stil detalii 1:20
  (command "_.-DIMSTYLE" "_New" "ARH-1-20" "ARH-1-100" "")
  (command "_DIMSCALE" 20)
  (setvar "DIMTXT" 0.035)
  (setvar "DIMASZ" 0.025)
  (command "_.-DIMSTYLE" "_Save" "ARH-1-20" "")

  (command "_.-DIMSTYLE" "_Set" "ARH-1-100" "")

  (princ "\nStiluri create: ARH-1-20 | ARH-1-50 | ARH-1-100 | ARH-1-200")
  (princ "\nStil curent setat: ARH-1-100")
  (princ)
)

;;; --- COTA LANT — selectezi puncte coliniare, coteza fiecare interval ---
(defun C:COTA-LANT ( / pt-list pt gata directie layer-bkp offset-cota)
  (princ "\n=== COTARE LANT ===")
  (princ "\nClick puncte de-a lungul unui perete (ENTER pentru a termina):")

  (setq layer-bkp (getvar "CLAYER"))
  (command "_.-LAYER" "_Set" "A-COTA" "")

  ;; Colectare puncte
  (setq pt-list '())
  (setq pt (getpoint "\nPrimul punct: "))
  (while (not (null pt))
    (setq pt-list (append pt-list (list pt)))
    (if (> (length pt-list) 1)
      (progn
        (grdraw (nth (- (length pt-list) 2) pt-list) pt 1 1)
      )
    )
    (setq pt (getpoint "\nUrmator punct (ENTER termina): "))
  )

  (if (< (length pt-list) 2)
    (progn
      (princ "\nNevoie de cel putin 2 puncte.")
      (exit)
    )
  )

  (initget 6)
  (setq offset-cota (getdist "\nDistanta liniei de cota fata de perete <0.50>: "))
  (if (null offset-cota) (setq offset-cota 0.50))

  ;; Determina directia principala
  (setq p1 (car pt-list))
  (setq p2 (last pt-list))
  (setq unghi-principal (angle p1 p2))

  ;; Offset in directie perpendiculara
  (setq directie-perp (+ unghi-principal (deg->rad 90)))

  ;; Deseneaza cotele in lant
  (setq i 0)
  (while (< i (- (length pt-list) 1))
    (setq pa (nth i pt-list))
    (setq pb (nth (+ i 1) pt-list))
    ;; Punct de plasare cota (offsetat perpendicular)
    (setq pt-dim (polar pa directie-perp offset-cota))
    (command "_DIMALIGNED" pa pb pt-dim)
    (setq i (+ i 1))
  )

  ;; Cota totala
  (setq pt-total (polar pa (+ directie-perp (deg->rad 0)) (* offset-cota 1.6)))
  (command "_DIMALIGNED" (car pt-list) (last pt-list) pt-total)

  (command "_.-LAYER" "_Set" layer-bkp "")
  (princ (strcat "\n" (itoa (- (length pt-list) 1)) " cote inserate + cota totala."))
  (princ)
)

;;; --- COTA NIVEL (altimetrie) ---
(defun C:COTA-NIVEL ( / pt valoare-nivel tip-nivel txt-nivel)
  (princ "\n=== COTA DE NIVEL ===")

  (setq pt (getpoint "\nPunctul de nivel: "))
  (if (null pt) (exit))

  (initget "Absolut Relativ")
  (setq tip-nivel (getkword "\nTip nivel [Absolut/Relativ] <R>: "))
  (if (null tip-nivel) (setq tip-nivel "Relativ"))

  (setq valoare-nivel (getreal (strcat "\nValoarea cotei de nivel ("
    (if (= tip-nivel "Absolut") "m NMN" "m") ") <0.00>: ")))
  (if (null valoare-nivel) (setq valoare-nivel 0.0))

  (command "_.-LAYER" "_Set" "A-COTA-NIVEL" "")

  ;; Format text
  (setq semn (if (>= valoare-nivel 0) "+" "-"))
  (setq txt-nivel (strcat semn (rtos (abs valoare-nivel) 2 2)))
  (if (= tip-nivel "Absolut")
    (setq txt-nivel (strcat txt-nivel " NMN"))
  )

  ;; Simbol cota de nivel (triunghi + linie + text)
  (setq dim-triunghi 0.05)
  (setq pt-stg (polar pt (+ pi (deg->rad 45)) dim-triunghi))
  (setq pt-dr  (polar pt (- (deg->rad 45)) dim-triunghi))  ; 45° fata de orizontal, sub
  (setq pt-sus (polar pt (deg->rad 90) dim-triunghi))

  ;; Triunghi
  (command "_LINE" pt-stg pt-sus pt-dr pt-stg "")
  ;; Linie orizontala
  (setq pt-linie-end (polar pt 0 (* dim-triunghi 3)))
  (command "_LINE" pt pt-linie-end "")
  ;; Text
  (setq pt-text (polar pt-linie-end 0 0.02))
  (command "_TEXT" "_J" "_L" pt-text (* dim-triunghi 1.5) "0" txt-nivel)

  (princ (strcat "\nCota nivel " txt-nivel " inserata."))
  (princ)
)

;;; --- COTA SUPRAFATA incapere ---
(defun C:COTA-SUPRAFATA ( / poly-sel area ent-data centroid txt-area txt-final)
  (princ "\n=== COTA SUPRAFATA INCAPERE ===")
  (princ "\nSelecteaza conturul incaperii (polylinie inchisa):")

  (setq ent-sel (entsel))
  (if (null ent-sel) (exit))

  (setq ent-data (entget (car ent-sel)))

  ;; Calcul arie
  (command "_AREA" "_Object" (car ent-sel))
  (setq area (getvar "AREA"))

  ;; Centroid aproximat
  (setq pt-centroid (cadr ent-sel))

  (command "_.-LAYER" "_Set" "A-TEXT-INCAPERI" "")

  ;; Text suprafata
  (setq txt-area (strcat (rtos area 2 2) " mp"))

  (command "_TEXT" "_J" "_MC" pt-centroid 0.20 "0" txt-area)

  (princ (strcat "\nSuprafata: " txt-area))
  (princ)
)

;;; --- COTA TOTALA rapida intre 2 puncte ---
(defun C:COTA-TOTAL ( / p1 p2 pt-dim)
  (princ "\n=== COTA RAPIDA ===")
  (command "_.-LAYER" "_Set" "A-COTA" "")

  (setq p1 (getpoint "\nPrimul punct: "))
  (if (null p1) (exit))

  (setq p2 (getpoint p1 "\nAl doilea punct: "))
  (if (null p2) (exit))

  (setq pt-dim (getpoint p2 "\nLocatie linie de cota: "))
  (if (null pt-dim) (exit))

  (command "_DIMALIGNED" p1 p2 pt-dim)

  (princ (strcat "\nCota: " (rtos (distance p1 p2) 2 3) " m"))
  (princ)
)

;;; --- Setare scara de lucru ---
(defun C:SCARA ( / scara-val)
  (princ "\n=== SETARE SCARA DESEN ===")

  (initget "20 50 100 200 500 1000")
  (setq scara-val (getkword "\nScara [20/50/100/200/500/1000] <100>: "))
  (if (null scara-val) (setq scara-val "100"))

  (setq scara-num (atoi scara-val))
  (setvar "DIMSCALE" (/ scara-num 1.0))
  (setvar "LTSCALE"  (/ scara-num 100.0))
  (setvar "TEXTSIZE" (* 0.025 scara-num))

  ;; Seteaza stilul de cotare corespunzator
  (cond
    ((= scara-val "20")   (command "_.-DIMSTYLE" "_Set" "ARH-1-20" ""))
    ((= scara-val "50")   (command "_.-DIMSTYLE" "_Set" "ARH-1-50" ""))
    ((= scara-val "100")  (command "_.-DIMSTYLE" "_Set" "ARH-1-100" ""))
    ((= scara-val "200")  (command "_.-DIMSTYLE" "_Set" "ARH-1-200" ""))
  )

  (princ (strcat "\nScara setata: 1:" scara-val))
  (princ (strcat "\n  DIMSCALE = " (rtos (getvar "DIMSCALE") 2 0)))
  (princ (strcat "\n  LTSCALE  = " (rtos (getvar "LTSCALE") 2 2)))
  (princ (strcat "\n  TEXTSIZE = " (rtos (getvar "TEXTSIZE") 2 3) " m"))
  (princ)
)

(princ "\nCotare automata incarcata.")
(princ "\nComenzi: COTA-LANT | COTA-NIVEL | COTA-SUPRAFATA | COTA-TOTAL | STILURI-COTA | SCARA")
(princ)
