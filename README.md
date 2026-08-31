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
