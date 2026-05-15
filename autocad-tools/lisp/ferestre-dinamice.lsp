;;; ============================================================
;;; FERESTRE PARAMETRICE — Studio Office Kolectiv
;;; Deseneaza ferestre cu dimensiuni variabile
;;; Comenzi: FEREASTRA | FER-FIX | FER-CULISANTA | FER-OSCILO
;;; ============================================================

(defun deg->rad (d) (* d (/ pi 180.0)))

;;; --- FEREASTRA batanta standard (plan, sectiune, vedere) ---
(defun C:FEREASTRA ( / pt latime grosime-perete unghi tip-vedere)
  (princ "\n=== FEREASTRA BATANTA ===")

  (setq pt (getpoint "\nPunct insertie fereastra (colt stanga exterior): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea ferestrei <1.20>: "))
  (if (null latime) (setq latime 1.20))

  (initget 6)
  (setq grosime (getdist "\nGrosimea peretelui <0.30>: "))
  (if (null grosime) (setq grosime 0.30))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul peretelui <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (command "_.-LAYER" "_Set" "A-FEREASTRA" "")

  (setq pt-end (polar pt unghi latime))

  ;; Reprezentare in plan — 3 linii paralele (rama + geam)
  ;; Linie exterioara
  (command "_LINE" pt pt-end "")

  ;; Rama (offset 0.05)
  (setq pt-r1 (polar pt (+ unghi (deg->rad 90)) 0.05))
  (setq pt-r2 (polar pt-end (+ unghi (deg->rad 90)) 0.05))
  (command "_LINE" pt-r1 pt-r2 "")

  ;; Geam (la mijlocul grosimii)
  (setq adancime-geam (/ grosime 2.0))
  (setq pt-g1 (polar pt (+ unghi (deg->rad 90)) adancime-geam))
  (setq pt-g2 (polar pt-end (+ unghi (deg->rad 90)) adancime-geam))
  (command "_LINE" pt-g1 pt-g2 "")

  ;; Rama interioara
  (setq pt-ri1 (polar pt (+ unghi (deg->rad 90)) (- grosime 0.05)))
  (setq pt-ri2 (polar pt-end (+ unghi (deg->rad 90)) (- grosime 0.05)))
  (command "_LINE" pt-ri1 pt-ri2 "")

  ;; Linie interioara
  (setq pt-int1 (polar pt (+ unghi (deg->rad 90)) grosime))
  (setq pt-int2 (polar pt-end (+ unghi (deg->rad 90)) grosime))
  (command "_LINE" pt-int1 pt-int2 "")

  ;; Inchide lateralele (montanti toc)
  (command "_LINE" pt pt-int1 "")
  (command "_LINE" pt-end pt-int2 "")

  ;; Linie de deschidere batanta (la 90°)
  (setq pt-mid (list (/ (+ (car pt-g1) (car pt-g2)) 2)
                     (/ (+ (cadr pt-g1) (cadr pt-g2)) 2)
                     0))
  (setq pt-foaie (polar pt-g1 (+ unghi (deg->rad 90)) latime))
  (command "_LINE" pt-g1 pt-foaie "")
  (command "_ARC" "_C" pt-g1 pt-g2 pt-foaie)

  (princ (strcat "\nFereastra batanta " (rtos latime 2 2) "m inserata."))
  (princ)
)

;;; --- FEREASTRA FIXA ---
(defun C:FER-FIX ( / pt latime grosime unghi)
  (princ "\n=== FEREASTRA FIXA ===")

  (setq pt (getpoint "\nPunct insertie (colt stanga exterior): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea ferestrei <1.20>: "))
  (if (null latime) (setq latime 1.20))

  (initget 6)
  (setq grosime (getdist "\nGrosimea peretelui <0.30>: "))
  (if (null grosime) (setq grosime 0.30))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul peretelui <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (command "_.-LAYER" "_Set" "A-FEREASTRA" "")

  (setq pt-end (polar pt unghi latime))
  (setq pt-int1 (polar pt (+ unghi (deg->rad 90)) grosime))
  (setq pt-int2 (polar pt-end (+ unghi (deg->rad 90)) grosime))

  ;; Contur exterior
  (command "_RECTANG" pt pt-int2)

  ;; Geam (linie la mijloc)
  (setq adancime (/ grosime 2.0))
  (setq pt-g1 (polar pt (+ unghi (deg->rad 90)) adancime))
  (setq pt-g2 (polar pt-end (+ unghi (deg->rad 90)) adancime))
  (command "_LINE" pt-g1 pt-g2 "")

  (princ (strcat "\nFereastra fixa " (rtos latime 2 2) "m inserata."))
  (princ)
)

;;; --- FEREASTRA CULISANTA ---
(defun C:FER-CULISANTA ( / pt latime grosime unghi)
  (princ "\n=== FEREASTRA CULISANTA ===")

  (setq pt (getpoint "\nPunct insertie (colt stanga exterior): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea ferestrei <1.50>: "))
  (if (null latime) (setq latime 1.50))

  (initget 6)
  (setq grosime (getdist "\nGrosimea peretelui <0.30>: "))
  (if (null grosime) (setq grosime 0.30))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul peretelui <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (command "_.-LAYER" "_Set" "A-FEREASTRA" "")

  (setq pt-end (polar pt unghi latime))
  (setq pt-int1 (polar pt (+ unghi (deg->rad 90)) grosime))
  (setq pt-int2 (polar pt-end (+ unghi (deg->rad 90)) grosime))
  (setq jumatate (/ latime 2.0))

  ;; Contur total
  (command "_RECTANG" pt pt-int2)

  ;; Geam
  (setq pt-g1 (polar pt (+ unghi (deg->rad 90)) (/ grosime 2.0)))
  (setq pt-g2 (polar pt-end (+ unghi (deg->rad 90)) (/ grosime 2.0)))
  (command "_LINE" pt-g1 pt-g2 "")

  ;; Separator la jumatate (2 canate)
  (setq pt-sep1 (polar pt unghi jumatate))
  (setq pt-sep2 (polar pt-sep1 (+ unghi (deg->rad 90)) grosime))
  (command "_LINE" pt-sep1 pt-sep2 "")

  ;; Sagetuta culisare
  (setq pt-saг1 (polar (polar pt (+ unghi (deg->rad 90)) (/ grosime 2.0)) unghi (* jumatate 0.2)))
  (setq pt-sag2 (polar pt-saг1 unghi (* jumatate 0.6)))
  (command "_LINE" pt-saг1 pt-sag2 "")

  (princ (strcat "\nFereastra culisanta " (rtos latime 2 2) "m inserata."))
  (princ)
)

;;; --- FEREASTRA OSCILO-BATANTA ---
(defun C:FER-OSCILO ( / pt latime grosime unghi)
  (princ "\n=== FEREASTRA OSCILO-BATANTA ===")

  (setq pt (getpoint "\nPunct insertie (colt stanga exterior): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea <0.90>: "))
  (if (null latime) (setq latime 0.90))

  (initget 6)
  (setq grosime (getdist "\nGrosimea peretelui <0.30>: "))
  (if (null grosime) (setq grosime 0.30))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (command "_.-LAYER" "_Set" "A-FEREASTRA" "")

  (setq pt-end (polar pt unghi latime))
  (setq pt-int1 (polar pt (+ unghi (deg->rad 90)) grosime))
  (setq pt-int2 (polar pt-end (+ unghi (deg->rad 90)) grosime))

  ;; Contur
  (command "_RECTANG" pt pt-int2)

  ;; Geam
  (setq pt-g1 (polar pt (+ unghi (deg->rad 90)) (/ grosime 2.0)))
  (setq pt-g2 (polar pt-end (+ unghi (deg->rad 90)) (/ grosime 2.0)))
  (command "_LINE" pt-g1 pt-g2 "")

  ;; Diagonala oscilo (semn distinctiv X in geam)
  (command "_LINE" pt-g1 pt-int2 "")
  (command "_LINE" pt-int1 pt-g2 "")

  (princ (strcat "\nFereastra oscilo-batanta " (rtos latime 2 2) "m inserata."))
  (princ)
)

(princ "\nFerestre incarcate. Comenzi: FEREASTRA | FER-FIX | FER-CULISANTA | FER-OSCILO")
(princ)
