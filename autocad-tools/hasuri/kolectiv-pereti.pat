;;; ============================================================
;;; HASURI PERSONALIZATE PERETI — Studio Office Kolectiv
;;; Instalare: copiaza in C:\Users\<user>\AppData\Roaming\Autodesk\AutoCAD <ver>\<lang>\Support\
;;; sau in directorul de suport al proiectului
;;; ============================================================

;;
;; KOLBCA — BCA (blocuri beton celular autoclavizat)
;; Dimensiune bloc standard 60x25x24cm
;;
*KOLBCA,BCA - Beton Celular Autoclavizat
0,    0,0,  60,25,  57,-3
90,   0,0,  60,25,  22,-3
0,    0,25, 60,25,  57,-3

;;
;; KOLCAR — Caramida plina standard 24x11.5x6.5cm
;; Vizibilitate buna la scara 1:20 - 1:50
;;
*KOLCAR,Caramida plina standard
0,   0,0,   24,13,   21,-3
90,  0,0,   24,13,   10,-3
0,   0,13,  24,13,   21,-3

;;
;; KOLCAR12 — Caramida la scara 1:10 - 1:20 (detaliu)
;;
*KOLCAR12,Caramida detaliu scara mica
0,   0,0,   12,6.5,  10,-2
90,  0,0,   12,6.5,  5,-2
0,   0,6.5, 12,6.5,  10,-2

;;
;; KOLIEPS — Polistiren expandat EPS (izolatie termica)
;; Linii ondulate orizontale
;;
*KOLIEPS,Izolatie EPS - Polistiren expandat
0, 0,0,  0,10,  8,-2
0, 0,5,  0,10,  8,-2
45, 0,0, 10,10, 14.14,-7.07

;;
;; KOLIVAT — Vata minerala (minerala sau de sticla)
;;
*KOLIVAT,Vata minerala / de sticla
0,  0,0,  0,8, 6,-2
0,  0,4,  0,8, 6,-2
45, 0,2,  8,8, 11.31,-5.66
135,8,2,  8,8, 11.31,-5.66

;;
;; KOLXPS — XPS Extrudat
;; Dreptunghiuri mici (celule inchise)
;;
*KOLXPS,Izolatie XPS - Polistiren extrudat
0,   0,0,  20,15,  18,-2
90,  0,0,  20,15,  12,-3
0,   0,15, 20,15,  18,-2
90,  20,0, 20,15,  12,-3

;;
;; KOLGIPS — Gips carton (placi GC)
;; Linii paralele dese
;;
*KOLGIPS,Gips carton
0, 0,0, 0,3, 100,0

;;
;; KOLOSB — OSB (oriented strand board)
;; Linii diagonale incrucisate cu densitate mica
;;
*KOLOSB,OSB - Oriented Strand Board
45,  0,0, 10,10, 8,-2
135, 0,0, 10,10, 8,-2

;;
;; KOLLEMN — Lemn masiv (sectiune transversala)
;;
*KOLLEMN,Lemn masiv - sectiune transversala
0,   0,0, 0,5, 4,-1
45,  0,0, 5,5, 7.07,-3.54
135, 5,0, 5,5, 7.07,-3.54

;;
;; KOLBETON — Beton simplu
;;
*KOLBETON,Beton simplu
45,  0,0, 10,10, 8,-2

;;
;; KOLBETONAR — Beton armat
;; Hasura densa + puncte simbolice pentru armatura
;;
*KOLBETONAR,Beton armat
45,  0,0, 8,8, 6,-2
135, 0,0, 8,8, 6,-2

;;
;; KOLMORTAR — Mortar / rosturi zidarie
;;
*KOLMORTAR,Mortar de zidarie
45, 0,0, 6,6, 5,-1
