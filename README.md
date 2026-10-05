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
- `script.js`: anteprime dei servizi e dell’itinerario, biografia e invio del modulo tramite Web3Forms, con stato di invio e gestione errori.
- `stories.js` e `stories.css`: carosello dei racconti, con pausa persistente durante la visita. La rotazione si ferma con focus, mouse, menu o dialoghi aperti, scheda nascosta e sezione fuori vista. La preferenza per movimento ridotto disattiva la rotazione iniziale.
- `hero.css`: base e composizione dei servizi/itinerario; `responsive.css`: adattamenti e anteprime; `panorama-hero.css`: apertura fotografica; `story-refined.css`: biografia; `consultation.css` e `contact.css`: sezioni corrispondenti.
- `assets/`: risorse effettivamente usate, con immagini WebP e fotografie degli slideshow. Font ospitati localmente, con licenze in `assets/fonts/`.

## Esperienza smartphone — 5 ottobre 2026

`mobile.css` contiene gli adattamenti di base; `mobile-mockup.css`, caricato per ultimo su tutte le pagine, riproduce il mockup mobile fornito. Gli adattamenti sono limitati alle larghezze fino a 767 px, con dimensioni fluide e verifiche dedicate da 320 a 480 px. Il layout desktop conserva le proprie regole e proporzioni.

Header compatto, menu a tutta altezza, controlli da almeno 44 px, servizi e archivio in verticale, form con etichette persistenti e scelte leggibili. Il campo partenza utilizza il selettore date del telefono, sincronizzato con il campo inviato dal modulo. La CTA Road Map porta direttamente al modulo. Gli aiuti dei servizi vengono mostrati alla selezione, senza richiedere hover. Anteprime e biografia scorrono a dimensione di lettura, senza ridurre il testo per farlo entrare nello schermo. Il carosello dei racconti supporta il gesto orizzontale e i pulsanti; su smartphone la rotazione fotografica parte in pausa e si può riattivare esplicitamente.

`mobile.js` gestisce i controlli dedicati e la selezione degli asset. `assets/mobile/` contiene copie WebP a 640, 960 e 1440 px, mantenendo gli originali per desktop. Le immagini HTML usano sorgenti `picture` riservate al mobile, le foto SVG successive della biografia si caricano su richiesta e gli slideshow fotografici si fermano fuori vista o nella scheda nascosta.

Il controllo dedicato è `node tests/mobile-check.cjs` (Playwright disponibile in Node). Copre sette pagine a otto larghezze smartphone, schermi corti, orientamento orizzontale, menu, finestre, selezione data, viaggiatori, aiuti, immagini responsive e gesto del carosello. Le verifiche sono eseguite con emulazione Chromium; non sostituiscono una prova su dispositivi iOS e Android fisici.

### Mockup mobile — 5 ottobre 2026

Il riferimento governa hero fotografica e raccordo curvo, menu allineato a sinistra, ritratto sagomato, schede dei servizi, racconti con frecce sulla foto, articolo con immagine iniziale, modulo con tre scelte affiancate e footer verde. Copy, destinazioni dei link e contenuti originali sono conservati. I contenuti aggiuntivi rispetto al mockup rimangono disponibili. Sul telefono i servizi seguono la hero e l’esempio di itinerario precede il footer; `mobile.js` ripristina l’ordine originale tornando al desktop. Le immagini dinamiche ripristinano anche le sorgenti desktop al cambio di larghezza. Gli indicatori del carosello sono interattivi; la hero supporta il gesto orizzontale.

Le nuove regole sono interamente limitate al mobile: fino a 767 px, oppure telefoni con schermo orizzontale e puntatore touch fino a 950 px e altezza di 500 px. Nessun foglio di stile desktop è modificato.

## Contenuti da completare

Il modulo invia i dati a `https://api.web3forms.com/submit` soltanto al submit; non carica script esterni o CAPTCHA. Per attivarlo inserire in `index.html` la chiave pubblica Web3Forms nel campo `access_key`, associata a `elisa.exploreworld@gmail.com`. Finché manca la chiave, nessuna richiesta viene inviata e viene proposto il contatto email. I dati restano nel modulo in caso di errore; il successo è mostrato solo dopo una risposta positiva del servizio. Prima dell’uso verificare l’account, il DPA Web3Forms e l’eventuale restrizione al dominio definitivo. Gli articoli e alcune parti dell’itinerario conservano i testi provvisori; i ritratti restano segnaposto. Il footer collega `privacy.html` (informativa unica privacy e cookie) e `note-legali.html` (ruolo del sito e collaborazione con Act Travel). Titolare dei contatti: Elisa Tosi. Hosting: Cloudflare, collegato a GitHub; posta: Gmail. Prima della pubblicazione verificare configurazione e conservazione dei log, accordi dei fornitori e informazioni identificative eventualmente richieste per l’attività effettiva. Non aggiungere banner cookie o consenso obbligatorio al modulo per semplici richieste precontrattuali. Verificare sul dominio pubblicato che hosting/CDN non aggiungano cookie, analytics o altri tracciatori.

La cartella contiene le risorse del sito corrente. Mockup, schermate, PDF di progetto, report storici e immagini inutilizzate sono stati eliminati definitivamente. Sono conservati i test, le specifiche di progetto e la provenienza delle immagini ancora utilizzate.

## Verifiche

Con il server locale attivo:

```sh
python3 tests/check-static.py
node tests/site-check.cjs
node tests/edge-check.cjs
node tests/second-check.cjs
```

I comandi Node richiedono Playwright disponibile in Node e Google Chrome installato. `SITE_URL` permette di cambiare l’indirizzo del server. Il controllo verifica sette URL (inclusi parametri non validi), cinque larghezze da 320 a 1440 px, menu, focus, ripristino dello scroll, anteprime, carosello, errori JavaScript, condivisione senza permesso agli appunti e collegamenti interni.

## Immagini aggiornate — 5 ottobre 2026

Le 36 fotografie utilizzate sono state ritoccate senza rigenerazione AI: riduzione del rumore e degli artefatti di compressione, curva tonale per ciascun soggetto, recupero delle ombre e contrasto locale contenuto, senza levigare la pelle o ricostruire dettagli. I file `*-retouched.webp` conservano il contenuto e le proporzioni delle foto e sono salvati senza perdita aggiuntiva. Singapore, valigia, pianificazione e risaie di Tegallalang usano le stesse sorgenti fotografiche originali scaricate in una risoluzione superiore (3200–3840 px di larghezza). Il filtro seppia che oscurava e desaturava la foto iniziale è stato rimosso; restano le sfumature per la leggibilità del testo. Sono state rimosse le texture a puntini che aggiungevano grana artificiale sopra le pagine dei racconti e la sezione contatti. Le foto di Racconti e consigli non sono state rigenerate. Decorazioni `*-refined.webp`, attestati `*-refined.png` e SVG conservano la resa e le trasparenze. I file fotografici precedenti sono stati eliminati dopo la sostituzione. Il ritocco migliora la resa visiva, senza inventare dettagli assenti dagli scatti; le quattro nuove sorgenti stock hanno una risoluzione reale superiore alle vecchie copie ridotte.
