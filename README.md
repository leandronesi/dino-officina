# Dino Officina

Gioco canvas/PWA offline per tablet: si prendono pezzi grandi da un vassoio, si agganciano al banco e si prova la macchina. Se qualcosa è fuori posto, il gioco indica cosa aggiustare.

## Cosa c’è nella prima versione

- profili di difficoltà **Piccolo** e **Grande**;
- costruzione libera, senza errori e con almeno tre pezzi;
- tre missioni: Dino-mobile, Gru Gialla e Macchina del Vento;
- controllo touch: trascina un pezzo oppure toccalo per agganciarlo automaticamente;
- sagome, agganci lampeggianti e pulsante **Aiuto**;
- ciclo completo **monto → provo → aggiusto → riprovo**;
- salvataggio locale di stelle e missioni completate;
- profili separati per ogni bambino (nome, colore, Piccolo/Grande e segreto facoltativo a tre figure);
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
```

Il test avvia l’intero bundle in un canvas simulato e attraversa tutte le missioni, la modalità libera e un montaggio errato in modalità Grande.

## Sito pubblico

Il workflow `.github/workflows/deploy.yml` pubblica automaticamente ogni push su `main` su `https://leandronesi.github.io/dino-officina/`. La prima volta, in **Settings → Pages**, la sorgente deve essere impostata su **GitHub Actions**.
