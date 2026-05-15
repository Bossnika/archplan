;;; ============================================================
;;; SISTEM LAYERE ARHITECTURA — Studio Office Kolectiv
;;; Standard ISO 13567 adaptat pentru practica romaneasca
;;; Comanda: LAYERE-ARHI
;;; ============================================================

(defun C:LAYERE-ARHI ( / )
  (princ "\nCreare sistem layere Arhitectura...")

  ;; Helper: creeaza layer daca nu exista
  (defun make-layer (nume culoare tip-linie grosime descriere / lyr)
    (if (not (tblsearch "LAYER" nume))
      (progn
        (command "_.-LAYER" "_Make" nume "")
        (command "_.-LAYER" "_Color" culoare nume "")
        (if (tblsearch "LTYPE" tip-linie)
          (command "_.-LAYER" "_LType" tip-linie nume "")
        )
        (command "_.-LAYER" "_LWeight" grosime nume "")
        (command "_.-LAYER" "" )
        (princ (strcat "\n  + Layer creat: " nume " — " descriere))
      )
      (princ (strcat "\n  ~ Layer existent: " nume))
    )
  )

  ;; Asigura incarcarea linetypes necesare
  (foreach lt (list "DASHED" "DASHED2" "CENTER" "CENTER2" "HIDDEN" "PHANTOM")
    (if (not (tblsearch "LTYPE" lt))
      (command "_.-LINETYPE" "_Load" lt "acad.lin" "")
    )
  )

  (princ "\n--- ELEMENTE PRINCIPALE ---")
  (make-layer "A-PERETE"           "7"   "Continuous" "0.50" "Pereti structurali si nestructurali")
  (make-layer "A-PERETE-STR"       "1"   "Continuous" "0.70" "Pereti structurali")
  (make-layer "A-PERETE-NESTR"     "8"   "Continuous" "0.35" "Pereti nestructurali")
  (make-layer "A-PERETE-DEMOLARE"  "1"   "DASHED"     "0.25" "Pereti de demolat")
  (make-layer "A-PERETE-NOU"       "3"   "Continuous" "0.50" "Pereti noi")

  (princ "\n--- GOLURI ---")
  (make-layer "A-USA"              "4"   "Continuous" "0.25" "Usi — foaie si pervaz")
  (make-layer "A-USA-INT"          "4"   "Continuous" "0.25" "Usi interioare")
  (make-layer "A-USA-EXT"          "6"   "Continuous" "0.35" "Usi exterioare")
  (make-layer "A-FEREASTRA"        "5"   "Continuous" "0.25" "Ferestre")
  (make-layer "A-FEREASTRA-EXT"    "5"   "Continuous" "0.35" "Ferestre exterioare")
  (make-layer "A-GOL"              "8"   "DASHED2"    "0.18" "Goluri in pereti")

  (princ "\n--- STRUCTURA ---")
  (make-layer "A-STRUCTURA"        "1"   "Continuous" "0.70" "Elemente structurale — general")
  (make-layer "A-STALP"            "1"   "Continuous" "0.70" "Stalpi")
  (make-layer "A-GRINDA"           "1"   "Continuous" "0.70" "Grinzi")
  (make-layer "A-PLANSEU"          "8"   "HIDDEN"     "0.25" "Planseu peste nivel")
  (make-layer "A-FUNDATII"         "1"   "HIDDEN"     "0.35" "Fundatii")
  (make-layer "A-SCARA"            "7"   "Continuous" "0.35" "Scari si rampe")
  (make-layer "A-SCARA-MANA-CURENTA" "8" "Continuous" "0.18" "Mana curenta scara")

  (princ "\n--- ACOPERIS ---")
  (make-layer "A-ACOPERIS"         "3"   "Continuous" "0.35" "Acoperis — contur")
  (make-layer "A-ACOPERIS-PANTA"   "3"   "CENTER2"    "0.18" "Directia de scurgere ape")
  (make-layer "A-COS-FUM"          "7"   "Continuous" "0.35" "Cos fum si ventilatie")
  (make-layer "A-TERASA"           "3"   "Continuous" "0.35" "Terasa — perimetru")

  (princ "\n--- MOBILIER & ECHIPAMENTE ---")
  (make-layer "A-MOBILIER"         "9"   "Continuous" "0.18" "Mobilier interior")
  (make-layer "A-MOBILIER-FIX"     "9"   "Continuous" "0.25" "Mobilier fix — bucatarie baie")
  (make-layer "A-SANITARE"         "5"   "Continuous" "0.18" "Obiecte sanitare")
  (make-layer "A-ELECTROCASNICE"   "9"   "Continuous" "0.18" "Electrocasnice")

  (princ "\n--- INSTALATII ---")
  (make-layer "A-INST-AP"          "5"   "Continuous" "0.18" "Instalatii apa — rece si calda")
  (make-layer "A-INST-CA"          "5"   "DASHED"     "0.18" "Instalatii canalizare")
  (make-layer "A-INST-EL"          "2"   "Continuous" "0.18" "Instalatii electrice")
  (make-layer "A-INST-GZ"          "1"   "Continuous" "0.18" "Instalatii gaz")
  (make-layer "A-INST-CR"          "6"   "Continuous" "0.18" "Instalatii incalzire-racire")
  (make-layer "A-INST-VENT"        "4"   "Continuous" "0.18" "Ventilatii mecanice")

  (princ "\n--- TEREN & AMENAJARI EXTERIOARE ---")
  (make-layer "A-TEREN"            "82"  "Continuous" "0.18" "Teren natural")
  (make-layer "A-TEREN-SIST"       "82"  "Continuous" "0.25" "Teren sistematizat")
  (make-layer "A-TROTUARE"         "8"   "Continuous" "0.25" "Trotuare si platforme")
  (make-layer "A-SPATII-VERZI"     "3"   "Continuous" "0.18" "Spatii verzi si plantatii")
  (make-layer "A-GARD"             "7"   "Continuous" "0.25" "Gard si poarta")
  (make-layer "A-PARCARE"          "8"   "Continuous" "0.18" "Locuri parcare")

  (princ "\n--- HAŞURI ---")
  (make-layer "A-HASURA-PERETE"    "253" "Continuous" "0.09" "Hasuri pereti la sectiune")
  (make-layer "A-HASURA-TEREN"     "82"  "Continuous" "0.09" "Hasuri teren")
  (make-layer "A-HASURA-BETON"     "253" "Continuous" "0.09" "Hasuri beton")
  (make-layer "A-HASURA-LEMN"      "34"  "Continuous" "0.09" "Hasuri lemn")
  (make-layer "A-HASURA-IZOLATIE"  "2"   "Continuous" "0.09" "Hasuri izolatii")

  (princ "\n--- COTE & ADNOTARI ---")
  (make-layer "A-COTA"             "2"   "Continuous" "0.18" "Cote dimensionale")
  (make-layer "A-COTA-NIVEL"       "2"   "Continuous" "0.18" "Cote de nivel — altimetrie")
  (make-layer "A-TEXT"             "7"   "Continuous" "0.18" "Texte si note")
  (make-layer "A-TEXT-INCAPERI"    "7"   "Continuous" "0.25" "Denumiri incaperi si arii")
  (make-layer "A-SIMBOL"           "7"   "Continuous" "0.18" "Simboluri — sectiuni vedere")
  (make-layer "A-AXURI"            "1"   "CENTER"     "0.18" "Axe structurale")
  (make-layer "A-GRID"             "8"   "CENTER2"    "0.09" "Grid / Retea de proiectare")

  (princ "\n--- DETALII ---")
  (make-layer "A-DETALIU"          "6"   "Continuous" "0.25" "Detalii de executie")
  (make-layer "A-DETALIU-TEXT"     "7"   "Continuous" "0.18" "Text in detalii")
  (make-layer "A-MATERIAL"         "9"   "Continuous" "0.09" "Etichete materiale")

  (princ "\n--- CADRU PLANŞA ---")
  (make-layer "A-CADRU"            "7"   "Continuous" "0.70" "Cadru planşa si indicator")
  (make-layer "A-INDICATOR"        "7"   "Continuous" "0.35" "Tabel indicator (cartus)")
  (make-layer "A-VIEWPORT"         "8"   "Continuous" "0.18" "Viewport-uri layout")

  (princ "\n--- REFERINTE ---")
  (make-layer "A-XREF"             "8"   "Continuous" "0.18" "Referinte externe (XREF)")
  (make-layer "A-TOPOGRAFIE"       "82"  "Continuous" "0.18" "Plan topografic referinta")
  (make-layer "A-CADASTRU"         "82"  "CENTER2"    "0.18" "Limite cadastrale")

  ;; Seteaza layer curent la A-PERETE
  (command "_.-LAYER" "_Set" "A-PERETE" "")

  (princ "\n\nSistem layere ARHITECTURA creat cu succes!")
  (princ "\nLayer curent setat: A-PERETE")
  (princ)
)

;;; Comanda rapida pentru setarea layerului curent
(defun C:LA ( / alegere)
  (setq alegere (getstring "\nNume layer (ex: A-PERETE, A-USA, A-COTA): "))
  (if (tblsearch "LAYER" alegere)
    (progn
      (command "_.-LAYER" "_Set" alegere "")
      (princ (strcat "\nLayer curent: " alegere))
    )
    (princ (strcat "\nERROR: Layer '" alegere "' nu exista. Ruleaza LAYERE-ARHI mai intai."))
  )
  (princ)
)

(princ "\nLayere Arhitectura incarcate. Comenzi: LAYERE-ARHI | LA")
(princ)
