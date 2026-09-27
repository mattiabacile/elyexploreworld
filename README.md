# ElyExploreWorld

Sito statico HTML/CSS/JavaScript, senza build o dipendenze di produzione.

```sh
python3 -m http.server 4173
```

Aprire http://localhost:4173/.

## Struttura attuale

- `index.html`: homepage, biografia, consulenza, servizi, itinerario, carosello e contatti.
- `racconti.html`: archivio dei racconti.
- `racconto.html` e `racconto.js`: modello articolo e dati per Giappone, Bali e Singapore. Gli slug sconosciuti mostrano il Giappone.
- `navigation.js` e `navigation.css`: unico menu condiviso, gestione focus, blocco dello scorrimento e navigazione alle sezioni.
- `footer.js` e `footer.css`: footer condiviso, senza richieste aggiuntive; anno aggiornato automaticamente.
- `script.js`: anteprime dei servizi e dell’itinerario, biografia e preparazione dell’email di contatto.
- `stories.js` e `stories.css`: carosello dei racconti, con pausa persistente durante la visita. La rotazione si ferma con focus, mouse, menu o dialoghi aperti, scheda nascosta e sezione fuori vista. La preferenza per movimento ridotto disattiva la rotazione iniziale.
- `hero.css`: base e composizione dei servizi/itinerario; `responsive.css`: adattamenti e anteprime; `panorama-hero.css`: apertura fotografica; `story-refined.css`: biografia; `consultation.css` e `contact.css`: sezioni corrispondenti.
- `assets/`: risorse effettivamente usate, con immagini WebP e varianti responsive della foto iniziale. Font caricati da Google Fonts.

## Contenuti da completare

Il modulo apre l’app di posta dell’utente: non esiste un servizio di invio sul server. La pagina lo indica esplicitamente. Gli articoli e alcune parti dell’itinerario conservano i testi provvisori; i ritratti restano segnaposto. Privacy, cookie policy e termini non sono presenti: il footer mostra voci non cliccabili con l’indicazione “Documento in preparazione”, senza collegamenti a pagine inesistenti. Occorre inserire i documenti approvati e ripristinare i relativi link quando disponibili.

I file `*-VALIDATION.md`, `VALIDATION.md` e i materiali `.impeccable/` documentano revisioni precedenti: non costituiscono test del sito corrente. Provenienza delle immagini: `assets/bali-rice-terraces-source.md` e `assets/stories/PROVENANCE.md`. Il riepilogo della pulizia è in `CLEANUP-REPORT.md`.

## Verifiche

Con il server locale attivo:

```sh
python3 tests/check-static.py
node tests/site-check.cjs
```

Il secondo comando richiede Playwright disponibile in Node e Google Chrome installato. `SITE_URL` permette di cambiare l’indirizzo del server. Il controllo verifica sette URL (inclusi parametri non validi), cinque larghezze da 320 a 1440 px, menu, focus, ripristino dello scroll, anteprime, carosello, errori JavaScript, condivisione senza permesso agli appunti e collegamenti interni.

## Backup

Prima della pulizia del 27 settembre 2026 è stata salvata una copia completa esterna alla cartella del sito:
`/Users/Mattia/Desktop/elyexploreworld-backup-20260927-pre-cleanup.tar.gz`.

Le immagini originali, le varianti scartate, `vecchi/`, `styles.css` e `footer.html` sono recuperabili da quella copia. Il backup non va pubblicato insieme al sito.
