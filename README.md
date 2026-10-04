# Dino Officina

Monta il tuo veicolo e guidalo. Gioco canvas per tablet, offline, senza
librerie né risorse esterne.

## Come si gioca

**In officina** si sceglie un pezzo per ciascuno dei quattro attacchi, e ogni
pezzo cambia davvero come va il veicolo:

| Attacco | Pezzi |
|---|---|
| Telaio | macchina (veloce) · barca (galleggia) |
| Ruote | piccole (veloci, salgono poco) · giganti (salgono le colline) · cingoli (salgono tutto, lenti) |
| Motore | motore · turbo (più veloce, un po' più presa) · elica (spinge in acqua) |
| Extra | niente · razzo (tasto: spinta) · ali (planano) · palloncini (leggero) · molla (tasto: salto) |

**Sulla strada** lo si guida, visto di lato: pedale verde a destra (o tutta
la metà destra dello schermo), freno a sinistra, tasto rosso per razzo e
molla. Colline, salite ripide, fiumi, burroni e muri: ognuno chiede il pezzo
giusto. Chi cade in acqua o nel burrone riparte appena prima, con un
consiglio; chi resta bloccato su una salita vede **Aggiusta**, che riporta in
officina. È il ciclo **monto → provo → aggiusto**.

**Venti missioni** in cinque raccolte (Prime gite, Acqua, Cielo, Montagna,
Gran tour) che si aprono una dopo l'altra, stelle in base ai frutti raccolti,
e l'**Officina libera** per costruire quello che si vuole e fare un giro.

Ogni missione parte da un **telaio vuoto**, e qualsiasi pezzo si può montare:
**decide la strada**. Con il pezzo sbagliato il veicolo non sale, affonda o
cade, e la strada dice perché.

- **Piccolo** (3 anni): ogni missione mostra **il progetto**, la figura del
  veicolo da montare; una spunta verde segna le righe uguali alla figura. È un
  suggerimento, non un lucchetto: se monta altro, lo scopre guidando.
- **Grande** (6 anni): nessuna soluzione mostrata. La missione dice cosa c'è
  sulla strada (salita, fiume, burrone, muro) con i disegni, e capire quali
  pezzi servono è il gioco. Spesso le strade giuste sono più d'una.

I profili sono quelli di tutta la collezione. I bambini della versione
precedente vengono portati qui al primo avvio, con nome, colore, età, segreto
e stelle.

## Sviluppo

```
node build.js
node test/smoke.js   # ogni missione guidata col suo progetto; il veicolo base deve fallire dove c'è un ostacolo
node test/look.js    # Chrome vero, muto: fotogrammi in test/frames e pedale toccato davvero
```

Pezzi e loro numeri in `src/10-veicolo.js`, percorsi e missioni in
`src/20-percorsi.js`, guida in `src/40-strada.js`. Il collaudo verifica
anche, ostacolo per ostacolo, che il pezzo giusto passi e quello sbagliato no.
