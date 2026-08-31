# Dino Officina

Gioco canvas/PWA offline per tablet: si prendono pezzi grandi da un vassoio, si agganciano al banco e si prova la macchina. Se qualcosa è fuori posto, il gioco indica cosa aggiustare.

## Cosa c’è

- profili di difficoltà **Piccolo** e **Grande**;
- costruzione libera, senza errori e con almeno tre pezzi;
- **100 progetti rigiocabili e strutturalmente distinti**, organizzati in dieci raccolte da dieci: ruote, cantiere, cielo, mare, spazio, fattoria, soccorso, città, robot e festa;
- album a due livelli: prima si sceglie una raccolta, poi si sfogliano al massimo quattro progetti per pagina;
- scorciatoie **Continua** e **Sorprendimi** per giocare senza attraversare tutto l’album;
- sedici tipi di pezzi originali, combinati da schede dati invece di duplicare la logica del gioco;
- controllo touch: trascina un pezzo oppure toccalo per agganciarlo automaticamente;
- sagome, agganci lampeggianti e pulsante **Aiuto**;
- ciclo completo **monto → provo → aggiusto → riprovo**;
- salvataggio locale di stelle e missioni completate;
- profili separati per ogni bambino (nome, colore, Piccolo/Grande e segreto facoltativo a tre figure);
- creazione guidata in quattro passi con tastiera/overlay del tablet (nessun prompt del browser), nove figure per il segreto e pulsante per saltarlo;
- accesso richiesto a ogni avvio e cambio profilo protetto dall'area genitori;
- migrazione automatica del precedente salvataggio singolo nel profilo `Dino`;
- PWA installabile e utilizzabile offline, senza asset esterni o licenziati.

## Avvio

```bash
node build.js
python -m http.server 8000
```

Aprire `http://localhost:8000`. Il gioco è pensato per un tablet in orizzontale.

## Collaudo

```bash
node test/smoke.js
node test/look.js
```

Il test avvia l’intero bundle in un canvas simulato, verifica i profili e la migrazione dei salvataggi, controlla che le 100 strutture restino uniche anche ignorando una traslazione globale, apre e completa tutti i progetti, attraversa le pagine dell’album, prova la modalità libera e controlla un montaggio errato in modalità Grande.
Il controllo visuale apre il gioco in Chrome headless e aggiorna quattro schermate di riferimento in `test/frames/`.

## Sito pubblico

Il workflow `.github/workflows/deploy.yml` pubblica automaticamente ogni push su `main` su `https://leandronesi.github.io/dino-officina/`. La prima volta, in **Settings → Pages**, la sorgente deve essere impostata su **GitHub Actions**.
