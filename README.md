# Dino Officina

Monta il tuo veicolo e guidalo. Gioco canvas per tablet, offline, senza
librerie né risorse esterne.

## Banco di prova

Dal menu scegli **Banco di prova** per provare un montaggio su una pista corta.
Tocca una ruota e poi un attacco libero. Il veicolo parte da solo quando
tocchi **Prova il veicolo**. Se monti il razzo, accendilo con il suo pulsante
o con spazio vicino al cartello. Il montaggio resta salvato al rientro al banco.

Con le ruote larghe il telaio può attraversare il fosso anche senza razzo.
L’attacco alto e quello basso fanno inclinare il telaio in direzioni opposte
quando il razzo spinge.

## Squadra di soccorso

Dal menu scegli **L’uovo sull’isolotto**. La via del fiume si attraversa
con barca ed elica, la via delle rampe con ruote grandi e razzo. All’isolotto
tocca l’uovo per caricarlo. Al ritorno la barca sale sulle creste, rallenta e
scende dall’altro lato. Tieni premuto **Tieni l’uovo** (↓ su tastiera) sulle
onde e all’atterraggio per tenere fermo il carico. Se perdi l’assetto,
il cesto recupera l’uovo e riparti con il carico. L’uovo si schiude al nido.

Piccolo può montare il progetto con un tocco e si ferma sulla rampa finché tocca il
razzo. Grande vede il terreno e sceglie quando partire. La mappa ricorda
quali vie ha completato ciascun bambino. I due montaggi restano salvati
separatamente.

## Come si gioca

**In officina** si sceglie un pezzo per ciascuno dei quattro attacchi, e ogni
pezzo cambia davvero come va il veicolo:

| Attacco | Pezzi |
|---|---|
| Telaio | macchina (veloce) · barca (galleggia) |
| Ruote | piccole (veloci, salgono poco) · giganti (salgono le colline) · cingoli (salgono tutto, lenti) |
| Motore | motore · turbo (più veloce, un po' più presa) · elica (spinge in acqua) |
| Extra | nessuno · razzo (tasto: spinta) · ali (planano) · palloncini (leggero) · molla (tasto: salto) |

**Sulla strada** lo si guida, visto di lato: pedale verde a destra (o tutta
la metà destra dello schermo), freno a sinistra e pulsante per razzo e
molla vicino al pollice sinistro. Il bordo si illumina vicino agli ostacoli.
Il **Gas automatico** permette di giocare con un dito. Il freno lo spegne.
Colline, salite ripide, fiumi, burroni e muri chiedono pezzi diversi.
Chi cade in acqua o nel burrone riparte appena prima, con un
consiglio; chi resta bloccato su una salita vede **Aggiusta**, che riporta in
officina. È il ciclo **monto → provo → aggiusto**.

**Venti missioni** in cinque raccolte (Prime gite, Acqua, Cielo, Montagna,
Gran tour) che si aprono una dopo l'altra, stelle in base ai frutti raccolti,
e l'**Officina libera** con tre piste di prova subito disponibili: Colline,
Acqua e Salti. Razzo e molla si possono accendere direttamente sul banco.

Ogni nuova missione parte da un **telaio vuoto**. Il montaggio si salva pezzo
per pezzo e si può ricominciare con **Smonta tutto**. Qualsiasi pezzo si può montare:
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
