;;; ============================================================
;;; INITIALIZARE TOOLKIT — Studio Office Kolectiv
;;; Incarca toate modulele LISP si seteaza mediul de lucru
;;; Comanda: KOL-INIT
;;; Adauga in ACAD.LSPUI sau ACADDOC.LSP pentru autoloadare
;;; ============================================================

(defun C:KOL-INIT ( / cale-toolkit)

  ;; Detectare cale toolkit (cauta in Support Path al AutoCAD)
  (setq cale-toolkit
    (if (findfile "layere-arhitectura.lsp")
      (vl-filename-directory (findfile "layere-arhitectura.lsp"))
      nil
    )
  )

  ;; Daca nu e in support path, cere manual
  (if (null cale-toolkit)
    (progn
      (setq cale-toolkit
        (getfiled "Selecteaza dosarul cu fisierele LISP Kolectiv"
                  (getenv "USERPROFILE") "lsp" 8))
      (if cale-toolkit
        (setq cale-toolkit (vl-filename-directory cale-toolkit))
      )
    )
  )

  (if (null cale-toolkit)
    (progn
      (princ "\nERROR: Nu s-a putut localiza toolkit-ul. Adauga calea in Tools > Options > Files > Support File Search Path")
      (exit)
    )
  )

  (princ "\n")
  (princ "╔══════════════════════════════════════════════════╗\n")
  (princ "║   Studio Office Kolectiv — AutoCAD Toolkit      ║\n")
  (princ "╚══════════════════════════════════════════════════╝\n")

  (defun incarca-modul (fisier descriere / cale-fisier)
    (setq cale-fisier (strcat cale-toolkit "\\" fisier))
    (if (findfile cale-fisier)
      (progn
        (load cale-fisier)
        (princ (strcat "  ✓ " descriere "\n"))
      )
      (princ (strcat "  ✗ " descriere " — fisier negasit: " cale-fisier "\n"))
    )
  )

  (princ "\nIncarcare module:\n")
  (incarca-modul "layere-arhitectura.lsp" "Layere Arhitectura")
  (incarca-modul "layere-urbanism.lsp"    "Layere Urbanism")
  (incarca-modul "usi-dinamice.lsp"       "Usi parametrice")
  (incarca-modul "ferestre-dinamice.lsp"  "Ferestre parametrice")
  (incarca-modul "mobilier.lsp"           "Mobilier")
  (incarca-modul "cotare-auto.lsp"        "Cotare automata")
  (incarca-modul "pereti-detalii.lsp"     "Pereti si detalii")

  ;; Setari generale recomandate
  (setvar "OSMODE"   4135)   ; Endpoint, Midpoint, Center, Intersection, Perpendicular
  (setvar "ORTHOMODE" 0)
  (setvar "DYNMODE"   3)     ; Dynamic input ON
  (setvar "UNITS"     2)     ; Decimal
  (setvar "INSUNITS"  6)     ; Meters
  (setvar "LUPREC"    3)     ; 3 zecimale lungimi
  (setvar "AUPREC"    0)     ; 0 zecimale unghiuri

  (princ "\n────────────────────────────────────────────────────")
  (princ "\n COMENZI DISPONIBILE:\n")
  (princ "\n LAYERE:")
  (princ "\n   LAYERE-ARHI  — Sistem layere arhitectura")
  (princ "\n   LAYERE-URB   — Sistem layere urbanism")
  (princ "\n   LA           — Setare layer curent rapid\n")
  (princ "\n USI:")
  (princ "\n   USA          — Usa batanta simpla")
  (princ "\n   USA2         — Usa dubla batanta")
  (princ "\n   USA-CULISANTA — Usa culisanta")
  (princ "\n   USA-EXT      — Usa exterioara\n")
  (princ "\n FERESTRE:")
  (princ "\n   FEREASTRA    — Fereastra batanta")
  (princ "\n   FER-FIX      — Fereastra fixa")
  (princ "\n   FER-CULISANTA — Fereastra culisanta")
  (princ "\n   FER-OSCILO   — Fereastra oscilo-batanta\n")
  (princ "\n PERETI:")
  (princ "\n   P-CARAMIDA   — Perete caramida")
  (princ "\n   P-BCA        — Perete BCA")
  (princ "\n   P-TIMBER     — Perete Timberframe")
  (princ "\n   P-GIPS       — Perete gips carton")
  (princ "\n   P-TERMOEXT   — Termosistem exterior")
  (princ "\n   P-COMPLEX    — Wizard perete stratificat\n")
  (princ "\n MOBILIER:")
  (princ "\n   MOB-PAT      — Pat (Single/Double/King)")
  (princ "\n   MOB-MASA     — Masa + scaune")
  (princ "\n   MOB-BAIE     — Obiecte sanitare")
  (princ "\n   MOB-DULAP    — Dulap\n")
  (princ "\n COTARE:")
  (princ "\n   COTA-LANT    — Cotare in lant pe puncte")
  (princ "\n   COTA-NIVEL   — Cota de nivel / altimetrie")
  (princ "\n   COTA-SUPRAFATA — Aria unei incaperi")
  (princ "\n   COTA-TOTAL   — Cota rapida intre 2 puncte")
  (princ "\n   STILURI-COTA — Creare stiluri cotare ARH")
  (princ "\n   SCARA        — Setare scara desen (1:20...1:1000)")
  (princ "\n────────────────────────────────────────────────────\n")

  (princ)
)

;;; Alias rapid
(defun C:KI ( / ) (C:KOL-INIT) (princ))

(princ "\nKolectiv Toolkit gata. Ruleaza KOL-INIT (sau KI) pentru a inarca toate modulele.")
(princ)
