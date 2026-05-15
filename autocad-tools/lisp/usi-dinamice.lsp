;;; ============================================================
;;; USI PARAMETRICE — Studio Office Kolectiv
;;; Deseneaza usi cu dimensiuni variabile pe layer corect
;;; Comenzi: USA | USA2 | USA-CULISANTA | USA-BATANTA
;;; ============================================================

;;; --- Utilitare ---
(defun deg->rad (d) (* d (/ pi 180.0)))

(defun draw-door-single (pt unghi latime grosime-perete sens-deschidere /
                          pt1 pt2 pt3 pt4 cx cy arc-pt raza ang-start ang-end)
  ;; Deseneaza o usa batanta simpla
  ;; pt = punct de insertie (coltul tocului in perete)
  ;; unghi = rotatia peretului
  ;; latime = latimea usii
  ;; sens-deschidere: 1 = stanga, -1 = dreapta

  (setq grosime-perete (if grosime-perete grosime-perete 0.15))

  (command "_.-LAYER" "_Set" "A-USA" "")

  ;; Toc usa (dreptunghi simplu)
  (setq pt1 pt)
  (setq pt2 (polar pt unghi latime))

  ;; Golul in perete — linie ajutatoare
  (command "_LINE"
    pt1 pt2 "")

  ;; Foaia usii (linie diagonala de la balamale)
  (setq pt3 (if (= sens-deschidere 1)
    pt1
    pt2
  ))
  (setq arc-end-pt (polar pt3
    (+ unghi (* sens-deschidere (deg->rad 90)))
    latime))

  (command "_LINE" pt3 arc-end-pt "")

  ;; Arc de deschidere
  (command "_ARC" "_C" pt3 pt2 arc-end-pt)
)

;;; --- USA simpla batanta ---
(defun C:USA ( / pt latime grosime sens unghi)
  (princ "\n=== USA BATANTA SIMPLA ===")
  (command "_.-LAYER" "_Set" "A-USA-INT" "")

  (setq pt (getpoint "\nPunct insertie usa (colt toc): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea usii <0.90>: "))
  (if (null latime) (setq latime 0.90))

  (initget 6)
  (setq grosime (getdist "\nGrosimea peretelui <0.30>: "))
  (if (null grosime) (setq grosime 0.30))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul peretelui (ENTER = orizontal): "))
  (if (null unghi) (setq unghi 0.0))

  (initget "Stanga Dreapta" "S D")
  (setq sens (getkword "\nSens deschidere [Stanga/Dreapta] <D>: "))
  (if (null sens) (setq sens "D"))

  (command "_.-LAYER" "_Set" "A-USA-INT" "")

  (setq pt-sfarsit (polar pt unghi latime))

  ;; Toc
  (command "_LINE" pt pt-sfarsit "")

  (if (= sens "S")
    (progn
      ;; Foaie usa deschisa spre stanga
      (setq pt-foaie (polar pt (+ unghi (deg->rad 90)) latime))
      (command "_LINE" pt pt-foaie "")
      (command "_ARC" "_C" pt pt-sfarsit pt-foaie)
    )
    (progn
      ;; Foaie usa deschisa spre dreapta
      (setq pt-foaie (polar pt-sfarsit (- unghi (deg->rad 90)) latime))
      (command "_LINE" pt-sfarsit pt-foaie "")
      (command "_ARC" "_C" pt-sfarsit pt pt-foaie)
    )
  )

  (princ (strcat "\nUsa batanta " (rtos latime 2 2) "m inserata."))
  (princ)
)

;;; --- USA dubla batanta ---
(defun C:USA2 ( / pt latime unghi)
  (princ "\n=== USA DUBLA BATANTA ===")
  (command "_.-LAYER" "_Set" "A-USA-INT" "")

  (setq pt (getpoint "\nPunct insertie usa dubla (centrul tocului): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea totala usa dubla <1.40>: "))
  (if (null latime) (setq latime 1.40))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul peretelui <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (setq jumatate (/ latime 2.0))
  (setq pt-stg (polar pt (+ unghi pi) jumatate))
  (setq pt-dr  (polar pt unghi jumatate))

  ;; Toc
  (command "_LINE" pt-stg pt-dr "")

  ;; Foaie stanga
  (setq pt-f-stg (polar pt-stg (+ unghi (deg->rad 90)) jumatate))
  (command "_LINE" pt-stg pt-f-stg "")
  (command "_ARC" "_C" pt-stg pt-dr pt-f-stg)

  ;; Foaie dreapta
  (setq pt-f-dr (polar pt-dr (+ unghi (deg->rad 90)) jumatate))
  (command "_LINE" pt-dr pt-f-dr "")
  (command "_ARC" "_C" pt-dr pt-stg pt-f-dr)

  (princ (strcat "\nUsa dubla batanta " (rtos latime 2 2) "m inserata."))
  (princ)
)

;;; --- USA CULISANTA ---
(defun C:USA-CULISANTA ( / pt latime unghi nr-canate)
  (princ "\n=== USA CULISANTA ===")
  (command "_.-LAYER" "_Set" "A-USA-INT" "")

  (setq pt (getpoint "\nPunct insertie usa culisanta (colt stanga): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea golului <0.90>: "))
  (if (null latime) (setq latime 0.90))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul <0>: "))
  (if (null unghi) (setq unghi 0.0))

  (initget "1 2")
  (setq nr-canate (getkword "\nNumar canate [1/2] <1>: "))
  (if (null nr-canate) (setq nr-canate "1"))

  (setq pt-end (polar pt unghi latime))
  (setq pt-sus (polar pt (+ unghi (deg->rad 90)) 0.05))
  (setq pt-sus-end (polar pt-end (+ unghi (deg->rad 90)) 0.05))

  ;; Ghidaj culisare (linie dubla)
  (command "_LINE" pt pt-end "")
  (command "_LINE" pt-sus pt-sus-end "")

  (if (= nr-canate "1")
    (progn
      ;; Canat unic — se vede deschis 50%
      (setq pt-canat-end (polar pt unghi (/ latime 2.0)))
      (setq pt-c1 (polar pt (+ unghi (deg->rad 90)) 0.05))
      (setq pt-c2 (polar pt-canat-end (+ unghi (deg->rad 90)) 0.05))
      (command "_RECTANG" pt-c1 pt-c2)
      ;; Sageata directie de deschidere
      (command "_LINE" pt-c2 pt-end "")
      (command "_MLEADER" (polar pt-c2 unghi 0.05) pt-end "")
    )
    (progn
      ;; 2 canate
      (setq jumatate (/ latime 2.0))
      (setq pt-mid (polar pt unghi jumatate))
      ;; Canat stanga
      (command "_RECTANG" (polar pt (+ unghi (deg->rad 90)) 0.02)
                          (polar pt-mid (- unghi (deg->rad 90)) 0.02))
      ;; Canat dreapta
      (command "_RECTANG" (polar pt-mid (+ unghi (deg->rad 90)) 0.02)
                          (polar pt-end (- unghi (deg->rad 90)) 0.02))
    )
  )

  (princ (strcat "\nUsa culisanta " (rtos latime 2 2) "m inserata."))
  (princ)
)

;;; --- USA EXTERIOARA (cu prag si toc mai gros) ---
(defun C:USA-EXT ( / pt latime unghi grosime-toc)
  (princ "\n=== USA EXTERIOARA ===")
  (command "_.-LAYER" "_Set" "A-USA-EXT" "")

  (setq pt (getpoint "\nPunct insertie (colt exterior toc): "))
  (if (null pt) (exit))

  (initget 6)
  (setq latime (getdist pt "\nLatimea usii <0.90>: "))
  (if (null latime) (setq latime 0.90))

  (initget 6)
  (setq grosime-toc (getdist "\nGrosime toc exterior <0.10>: "))
  (if (null grosime-toc) (setq grosime-toc 0.10))

  (initget 6)
  (setq unghi (getangle pt "\nUnghiul peretelui <0>: "))
  (if (null unghi) (setq unghi 0.0))

  ;; Toc gros exterior
  (setq pt-end (polar pt unghi latime))
  (setq pt-int (polar pt (+ unghi (deg->rad 90)) grosime-toc))
  (setq pt-int-end (polar pt-end (+ unghi (deg->rad 90)) grosime-toc))

  (command "_RECTANG" pt pt-int-end)

  ;; Foaie usa
  (setq pt-foaie (polar pt-int (+ unghi (deg->rad 90)) latime))
  (command "_LINE" pt-int pt-foaie "")
  (command "_ARC" "_C" pt-int pt-int-end pt-foaie)

  (princ (strcat "\nUsa exterioara " (rtos latime 2 2) "m inserata."))
  (princ)
)

(princ "\nUsi incarcate. Comenzi: USA | USA2 | USA-CULISANTA | USA-EXT")
(princ)
