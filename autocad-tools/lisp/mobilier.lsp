;;; ============================================================
;;; MOBILIER PARAMETRIC — Studio Office Kolectiv
;;; Comenzi: MOB-PAT | MOB-MASA | MOB-SCAUN | MOB-BIROU
;;;          MOB-BAIE | MOB-BUCATARIE | MOB-DULAP | MOB-SOFA
;;; ============================================================

(defun deg->rad (d) (* d (/ pi 180.0)))

(defun rect-centrat (cx cy latime inaltime unghi / pt1 pt2 pt3 pt4 hl hi)
  (setq hl (/ latime 2.0))
  (setq hi (/ inaltime 2.0))
  (setq pt1 (polar (polar (list cx cy 0) unghi (- hl)) (+ unghi (deg->rad 90)) (- hi)))
  (setq pt2 (polar (polar (list cx cy 0) unghi hl)     (+ unghi (deg->rad 90)) (- hi)))
  (setq pt3 (polar (polar (list cx cy 0) unghi hl)     (+ unghi (deg->rad 90)) hi))
  (setq pt4 (polar (polar (list cx cy 0) unghi (- hl)) (+ unghi (deg->rad 90)) hi))
  (command "_PLINE" pt1 pt2 pt3 pt4 "_Close" "")
)

;;; --- PAT ---
(defun C:MOB-PAT ( / pt unghi latime inaltime tip cx cy)
  (princ "\n=== PAT ===")
  (command "_.-LAYER" "_Set" "A-MOBILIER" "")

  (setq pt (getpoint "\nCentrul patului: "))
  (if (null pt) (exit))

  (initget "Single Double King")
  (setq tip (getkword "\nTip pat [Single/Double/King] <Double>: "))
  (if (null tip) (setq tip "Double"))

  (initget 6)
  (setq unghi (getangle pt "\nOrientare <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (setq cx (car pt))
  (setq cy (cadr pt))

  (cond
    ((= tip "Single")  (setq latime 0.90) (setq inaltime 2.00))
    ((= tip "Double")  (setq latime 1.60) (setq inaltime 2.00))
    ((= tip "King")    (setq latime 2.00) (setq inaltime 2.00))
  )

  ;; Contur pat
  (rect-centrat cx cy latime inaltime unghi)

  ;; Perna/e
  (setq perna-l (if (= tip "Single") 0.80 0.60))
  (setq perna-h 0.45)
  (setq offset-perna (- (/ inaltime 2.0) 0.25))

  (if (= tip "Single")
    (progn
      (setq pt-c1 (polar pt unghi (- offset-perna)))
      (rect-centrat (car pt-c1) (cadr pt-c1) perna-l perna-h unghi)
    )
    (progn
      ;; 2 perne
      (setq offset-lat (- (/ latime 4.0)))
      (setq pt-c1 (polar (polar pt unghi (- offset-perna)) (+ unghi (deg->rad 90)) (- offset-lat)))
      (setq pt-c2 (polar (polar pt unghi (- offset-perna)) (+ unghi (deg->rad 90)) offset-lat))
      (rect-centrat (car pt-c1) (cadr pt-c1) perna-l perna-h unghi)
      (rect-centrat (car pt-c2) (cadr pt-c2) perna-l perna-h unghi)
    )
  )

  ;; Cuvertura / linie de pe pat
  (setq pt-cuverta1 (polar (polar pt unghi (- offset-perna (/ perna-h 1.5)))
                           (+ unghi (deg->rad 90)) (- (/ latime 2.0) 0.03)))
  (setq pt-cuverta2 (polar pt-cuverta1 (+ unghi (deg->rad 90)) (- latime 0.06)))
  (command "_LINE" pt-cuverta1 pt-cuverta2 "")

  (princ (strcat "\nPat " tip " " (rtos latime 2 2) "x" (rtos inaltime 2 2) "m."))
  (princ)
)

;;; --- MASA ---
(defun C:MOB-MASA ( / pt latime adancime unghi nr-scaune)
  (princ "\n=== MASA ===")
  (command "_.-LAYER" "_Set" "A-MOBILIER" "")

  (setq pt (getpoint "\nCentrul mesei: "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea mesei <1.20>: "))
  (if (null latime) (setq latime 1.20))

  (initget 6)
  (setq adancime (getdist "\nAdancimea mesei <0.80>: "))
  (if (null adancime) (setq adancime 0.80))

  (initget 6)
  (setq unghi (getangle pt "\nOrientare <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (setq nr-scaune (getint "\nNumar scaune (0 = fara) <4>: "))
  (if (null nr-scaune) (setq nr-scaune 4))

  ;; Masa
  (rect-centrat (car pt) (cadr pt) latime adancime unghi)

  ;; Scaune
  (if (> nr-scaune 0)
    (progn
      (command "_.-LAYER" "_Set" "A-MOBILIER" "")
      (setq scaun-l 0.45)
      (setq scaun-a 0.45)
      (setq dist-masa (+ (/ adancime 2.0) 0.08 (/ scaun-a 2.0)))

      ;; Scaun jos
      (setq pt-sc1 (polar pt (- unghi (deg->rad 90)) dist-masa))
      (rect-centrat (car pt-sc1) (cadr pt-sc1) scaun-l scaun-a unghi)

      ;; Scaun sus
      (setq pt-sc2 (polar pt (+ unghi (deg->rad 90)) dist-masa))
      (rect-centrat (car pt-sc2) (cadr pt-sc2) scaun-l scaun-a unghi)

      (if (>= nr-scaune 4)
        (progn
          ;; Stanga
          (setq dist-lat (+ (/ latime 2.0) 0.08 (/ scaun-l 2.0)))
          (setq pt-sc3 (polar pt (- unghi pi) dist-lat))
          (rect-centrat (car pt-sc3) (cadr pt-sc3) scaun-a scaun-l unghi)
          ;; Dreapta
          (setq pt-sc4 (polar pt unghi dist-lat))
          (rect-centrat (car pt-sc4) (cadr pt-sc4) scaun-a scaun-l unghi)
        )
      )
    )
  )

  (princ (strcat "\nMasa " (rtos latime 2 2) "x" (rtos adancime 2 2) "m, " (itoa nr-scaune) " scaune."))
  (princ)
)

;;; --- OBIECTE SANITARE ---
(defun C:MOB-BAIE ( / tip pt unghi)
  (princ "\n=== OBIECTE SANITARE ===")
  (princ "\n  1=Cada, 2=Dus, 3=WC, 4=Lavoar, 5=Bideu, 6=Spalator bucatarie")

  (setq tip (getint "\nSelecteaza obiect [1-6]: "))
  (if (null tip) (setq tip 3))

  (setq pt (getpoint "\nPunctul de insertie (colt stanga-jos): "))
  (if (null pt) (exit))

  (initget 6)
  (setq unghi (getangle pt "\nOrientare <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (command "_.-LAYER" "_Set" "A-SANITARE" "")

  (cond
    ((= tip 1) ; Cada
     (setq l 1.70) (setq a 0.75)
     (rect-centrat (+ (car pt) (* l 0.5)) (+ (cadr pt) (* a 0.5)) l a unghi)
     ;; Contur interior cada
     (rect-centrat (+ (car pt) (* l 0.5)) (+ (cadr pt) (* a 0.5))
                   (- l 0.08) (- a 0.08) unghi)
     ;; Robineti (cerc mic)
     (setq pt-rob (polar (polar pt unghi (- l 0.10)) (+ unghi (deg->rad 90)) (* a 0.5)))
     (command "_CIRCLE" pt-rob 0.03)
     (princ "\nCada 170x75cm")
    )
    ((= tip 2) ; Dus
     (setq l 0.90) (setq a 0.90)
     (rect-centrat (+ (car pt) (* l 0.5)) (+ (cadr pt) (* a 0.5)) l a unghi)
     ;; Sifon central
     (setq pt-sif (polar (polar pt unghi (* l 0.5)) (+ unghi (deg->rad 90)) (* a 0.5)))
     (command "_CIRCLE" pt-sif 0.05)
     (command "_CIRCLE" pt-sif 0.02)
     (princ "\nCabina dus 90x90cm")
    )
    ((= tip 3) ; WC
     (setq l 0.38) (setq a 0.68)
     ;; Rezervor
     (setq pt-rez (list (car pt) (cadr pt) 0))
     (command "_RECTANG" pt-rez (polar (polar pt-rez unghi l) (+ unghi (deg->rad 90)) 0.18))
     ;; Vas WC (elipsa aproximata)
     (setq pt-vas (polar (polar pt unghi (* l 0.5)) (+ unghi (deg->rad 90)) (+ 0.18 0.25)))
     (command "_ELLIPSE" "_C" pt-vas
       (polar pt-vas unghi (* l 0.5))
       (polar pt-vas (+ unghi (deg->rad 90)) 0.25))
     (princ "\nWC 38x68cm")
    )
    ((= tip 4) ; Lavoar
     (setq l 0.60) (setq a 0.50)
     (setq pt-c (polar (polar pt unghi (* l 0.5)) (+ unghi (deg->rad 90)) (* a 0.5)))
     (rect-centrat (car pt-c) (cadr pt-c) l a unghi)
     ;; Bazin (elipsa)
     (command "_ELLIPSE" "_C" pt-c
       (polar pt-c unghi (* l 0.35))
       (polar pt-c (+ unghi (deg->rad 90)) (* a 0.35)))
     ;; Baterie
     (command "_CIRCLE" (polar pt-c (+ unghi (deg->rad 90)) (* a 0.38)) 0.025)
     (princ "\nLavoar 60x50cm")
    )
    ((= tip 5) ; Bideu
     (setq l 0.38) (setq a 0.55)
     (setq pt-c (polar (polar pt unghi (* l 0.5)) (+ unghi (deg->rad 90)) (* a 0.5)))
     (command "_ELLIPSE" "_C" pt-c
       (polar pt-c unghi (* l 0.45))
       (polar pt-c (+ unghi (deg->rad 90)) (* a 0.45)))
     (command "_ELLIPSE" "_C" pt-c
       (polar pt-c unghi (* l 0.35))
       (polar pt-c (+ unghi (deg->rad 90)) (* a 0.35)))
     (princ "\nBideu 38x55cm")
    )
    ((= tip 6) ; Spalator bucatarie
     (setq l 0.80) (setq a 0.50)
     (setq pt-c (polar (polar pt unghi (* l 0.5)) (+ unghi (deg->rad 90)) (* a 0.5)))
     (rect-centrat (car pt-c) (cadr pt-c) l a unghi)
     ;; Cuva stanga
     (setq pt-cuva1 (polar pt-c unghi (- (/ l 4.0))))
     (rect-centrat (car pt-cuva1) (cadr pt-cuva1) (* l 0.42) (* a 0.70) unghi)
     ;; Cuva dreapta (mai mica)
     (setq pt-cuva2 (polar pt-c unghi (* l 0.25)))
     (rect-centrat (car pt-cuva2) (cadr pt-cuva2) (* l 0.30) (* a 0.60) unghi)
     (princ "\nSpalator 80x50cm (dublu)")
    )
  )

  (princ)
)

;;; --- DULAP ---
(defun C:MOB-DULAP ( / pt latime adancime unghi nr-usi)
  (princ "\n=== DULAP ===")
  (command "_.-LAYER" "_Set" "A-MOBILIER-FIX" "")

  (setq pt (getpoint "\nColt stanga-jos dulap: "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea dulapului <2.00>: "))
  (if (null latime) (setq latime 2.00))

  (initget 6)
  (setq adancime (getdist "\nAdancimea dulapului <0.60>: "))
  (if (null adancime) (setq adancime 0.60))

  (initget 6)
  (setq unghi (getangle pt "\nOrientare <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (setq nr-usi (getint "\nNumar usi <2>: "))
  (if (null nr-usi) (setq nr-usi 2))

  ;; Contur dulap
  (setq pt-end (polar pt unghi latime))
  (setq pt-int1 (polar pt (+ unghi (deg->rad 90)) adancime))
  (setq pt-int2 (polar pt-end (+ unghi (deg->rad 90)) adancime))
  (command "_RECTANG" pt pt-int2)

  ;; Linii de separare usi
  (setq latime-usa (/ latime nr-usi))
  (setq i 1)
  (while (< i nr-usi)
    (setq pt-sep1 (polar pt unghi (* i latime-usa)))
    (setq pt-sep2 (polar pt-sep1 (+ unghi (deg->rad 90)) adancime))
    (command "_LINE" pt-sep1 pt-sep2 "")
    (setq i (+ i 1))
  )

  ;; Maner la fiecare usa
  (setq i 0)
  (while (< i nr-usi)
    (setq pt-maner (polar (polar pt unghi (+ (* i latime-usa) (/ latime-usa 2.0)))
                          (+ unghi (deg->rad 90)) (* adancime 0.8)))
    (command "_CIRCLE" pt-maner 0.015)
    (setq i (+ i 1))
  )

  (princ (strcat "\nDulap " (rtos latime 2 2) "x" (rtos adancime 2 2) "m, " (itoa nr-usi) " usi."))
  (princ)
)

(princ "\nMobilier incarcat. Comenzi: MOB-PAT | MOB-MASA | MOB-BAIE | MOB-DULAP")
(princ)
