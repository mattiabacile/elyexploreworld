# ElyExploreWorld

Sito statico HTML/CSS/JavaScript, senza build o dipendenze di produzione.

```sh
python3 -m http.server 4173
```

Aprire http://localhost:4173/.

## Struttura attuale

- `index.html`: homepage, biografia, consulenza, servizi, itinerario, carosello e contatti.
- `racconti.html`: archivio dei racconti.
- `racconto.html` e `racconto.js`: modello articolo con capitoli dinamici, fotografie, tag, condivisione e navigazione. I collegamenti inesistenti mostrano un messaggio e il ritorno all’archivio.
- `content/stories.json`: sorgente dei racconti e consigli gestiti da Sveltia. `content.js` la carica e fornisce la resa sicura del testo formattato.
- `admin/`: Sveltia CMS, configurazione in italiano, anteprima e libreria fotografica. [Guida al CMS](CMS.md).
- `functions/` e `server/`: accesso GitHub tramite l’Authenticator ufficiale Sveltia, eseguito da Cloudflare Pages Functions.
- `navigation.js` e `navigation.css`: unico menu condiviso, gestione focus, blocco dello scorrimento e navigazione alle sezioni.
- `footer.js` e `footer.css`: footer condiviso, senza richieste aggiuntive; anno aggiornato automaticamente.
- `script.js`: anteprima dell’itinerario, biografia, collegamento Road Map al modulo e invio tramite Web3Forms, con stato di invio e gestione errori.
- `mobile.js`: immagini responsive e pulsante del menu condivisi da tutte le pagine.
- `home-mobile.js`: controlli della home, ordine mobile delle sezioni, biografia, calendario nativo e popup dei servizi. Viene caricato soltanto dalla home.
- `stories.js` e `stories.css`: carosello dei racconti, con pausa persistente durante la visita. La rotazione si ferma con focus, mouse, menu o dialoghi aperti, scheda nascosta e sezione fuori vista. La preferenza per movimento ridotto disattiva la rotazione iniziale.
- `hero.css`: base e composizione dei servizi/itinerario; `responsive.css`: adattamenti e anteprime; `panorama-hero.css`: apertura fotografica; `story-refined.css`: biografia; `consultation.css` e `contact.css`: sezioni corrispondenti.
- `assets/`: risorse effettivamente usate, con immagini WebP e fotografie degli slideshow. Font ospitati localmente, con licenze in `assets/fonts/`.

## Esperienza smartphone — 5 ottobre 2026

`mobile.css` contiene gli adattamenti di base; `mobile-mockup.css`, caricato per ultimo su tutte le pagine, riproduce il mockup mobile fornito. Gli adattamenti sono limitati alle larghezze fino a 767 px, con dimensioni fluide e verifiche dedicate da 320 a 480 px. Il layout desktop conserva le proprie regole e proporzioni.

Header compatto, menu a tutta altezza, controlli da almeno 44 px, servizi e archivio in verticale, form con etichette persistenti e scelte leggibili. Il campo partenza utilizza il selettore date del telefono, sincronizzato con il campo inviato dal modulo. La CTA Road Map porta direttamente al modulo. Gli aiuti dei servizi vengono mostrati alla selezione, senza richiedere hover. Anteprime e biografia scorrono a dimensione di lettura, senza ridurre il testo per farlo entrare nello schermo. Il carosello dei racconti supporta il gesto orizzontale e i pulsanti; su smartphone la rotazione fotografica parte in pausa e si può riattivare esplicitamente.

`mobile.js` gestisce la selezione degli asset condivisi; `home-mobile.js` gestisce i controlli dedicati alla home. `assets/mobile/` contiene copie WebP a 640, 960 e 1440 px, mantenendo gli originali per desktop. Le immagini HTML usano sorgenti `picture` riservate al mobile; il ritratto SVG della biografia seleziona una variante mobile della fotografia fissa. La hero cambia foto automaticamente ogni 5 secondi su desktop e mobile e si ferma fuori vista o nella scheda nascosta.

Il controllo dedicato è `node tests/mobile-check.cjs` (Playwright disponibile in Node). Copre sette pagine a otto larghezze smartphone, schermi corti, orientamento orizzontale, menu, finestre, selezione e reset della data, allineamento dei campi data/viaggiatori, dimensioni dei banner, ordine delle sezioni, aiuti, immagini responsive e gesto del carosello. Le verifiche sono eseguite con emulazione Chromium; non sostituiscono una prova su dispositivi iOS e Android fisici.

### Mockup mobile — 5 ottobre 2026

Il riferimento governa hero fotografica e raccordo curvo, menu allineato a sinistra, ritratto sagomato, schede dei servizi, racconti con frecce sulla foto, articolo con immagine iniziale, modulo con tre scelte affiancate e footer verde. Copy, destinazioni dei link e contenuti originali sono conservati, salvo le abbreviazioni mobile richieste. I contenuti aggiuntivi rispetto al mockup rimangono disponibili. Sul telefono la biografia segue la hero e precede i servizi e l’esempio di itinerario precede il footer; `home-mobile.js` ripristina l’ordine originale tornando al desktop. Le immagini dinamiche ripristinano anche le sorgenti desktop al cambio di larghezza. I racconti si navigano con frecce e gesto orizzontale, senza puntini; la hero ruota automaticamente senza frecce, pausa o contatore.

Le correzioni successive agli screenshot riducono e abbassano il ritratto a destra del saluto, compattano racconti e banner, rimuovono i selettori fotografici superflui e delimitano il controllo data nativo per evitare sovrapposizioni. La spiegazione dell’itinerario precede l’esempio, senza una seconda scheda.

Le nuove regole sono interamente limitate al mobile: fino a 767 px, oppure telefoni con schermo orizzontale e puntatore touch fino a 950 px e altezza di 500 px. Nessun foglio di stile desktop è modificato.

Su mobile la biografia mostra soltanto il primo paragrafo: gli altri due sono disponibili nella finestra «Scopri di più», mentre email e Instagram restano nei contatti e nel footer. Le descrizioni estese dei servizi sono spostate nei rispettivi approfondimenti; l'introduzione ai servizi, la dicitura «Percorso» e il lungo paragrafo introduttivo dei racconti sono nascosti. La biografia e gli approfondimenti conservano la formulazione originale. Al ritorno sul desktop, `home-mobile.js` ripristina la posizione originale di tutti i paragrafi e le etichette complete.

Gli ultimi ritocchi mobile fanno seguire al testo il contorno del ritratto, aumentano leggermente «Ciao, sono» e centrano il titolo dei servizi. Full Immersion unisce assistenza e assicurazione in una riga e conserva la sola dicitura «Consulenza gratuita di 30m». Nel carosello la data è più piccola e allineata a sinistra, destinazione e didascalia sono allineate a sinistra, il pulsante diventa «Leggi» e rimane il collegamento all'archivio.

Nei racconti mobile, data, destinazione, didascalia e «Leggi» sono integrati nella fotografia di ogni articolo, con una sfumatura scura per la leggibilità e senza pannello bianco separato. I testi sono allineati a sinistra e le frecce sono raggruppate in basso a destra, sulla stessa riga di «Leggi». «Scopri di più» dei servizi apre il popup condiviso con i paragrafi originali, senza allungare la card. Il popup si adatta al contenuto, scorre sugli schermi corti, conserva il focus e restituisce il focus al pulsante alla chiusura. Il passaggio al desktop lo chiude e ripristina le espansioni originali dei servizi.

Le due card mobile adottano il riferimento «Servizi di viaggio su misura»: foto orizzontale, fondo crema, angoli arrotondati, titolo affiancato al controllo con «+» cerchiato, inclusioni comprese tra due divisori e CTA larga in fondo. Si conserva il testo «Scopri di più»; sugli schermi fino a 360 px rimane visibile il solo «+», con l'etichetta accessibile completa. Road Map mantiene prezzo e nota originali. Titoli, controlli e contenuti ritornano alle posizioni desktop originali al cambio di larghezza.

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
node tests/mobile-check.cjs
node tests/services-screen.cjs
node tests/contact-check.cjs
node tests/deep-check.cjs
```

I comandi Node richiedono Playwright disponibile in Node e Google Chrome installato. `SITE_URL` permette di cambiare l’indirizzo del server. Il controllo verifica sette URL (inclusi parametri non validi), cinque larghezze da 320 a 1440 px, menu, focus, ripristino dello scroll, anteprime, carosello, errori JavaScript, condivisione senza permesso agli appunti e collegamenti interni.

Il controllo statico verifica anche i file dei font e la versione del contenuto di ogni CSS e script. Il controllo dei servizi copre le card e i popup attuali a nove dimensioni, con contenuto scorrevole e chiusura visibile. Il controllo del modulo intercetta tutte le richieste a Web3Forms e simula invio, errori e mancanza della chiave, senza inviare messaggi reali.

Il controllo approfondito verifica i punti di cambio del layout, ridimensionamenti con menu e popup aperti, riaperture consecutive, attestati, trasferimento della data tra mobile e desktop, parametri degli articoli, arresto e ripresa degli slideshow e risposte incomplete o timeout del modulo. Si può eseguire anche con `BROWSER_ENGINE=webkit node tests/deep-check.cjs`, se il browser WebKit di Playwright è disponibile. Tutte le richieste del modulo sono simulate localmente.

## Immagini aggiornate — 5 ottobre 2026

Le 36 fotografie utilizzate sono state ritoccate senza rigenerazione AI: riduzione del rumore e degli artefatti di compressione, curva tonale per ciascun soggetto, recupero delle ombre e contrasto locale contenuto, senza levigare la pelle o ricostruire dettagli. I file `*-retouched.webp` conservano il contenuto e le proporzioni delle foto e sono salvati senza perdita aggiuntiva. Singapore, valigia, pianificazione e risaie di Tegallalang usano le stesse sorgenti fotografiche originali scaricate in una risoluzione superiore (3200–3840 px di larghezza). Il filtro seppia che oscurava e desaturava la foto iniziale è stato rimosso; restano le sfumature per la leggibilità del testo. Sono state rimosse le texture a puntini che aggiungevano grana artificiale sopra le pagine dei racconti e la sezione contatti. Le foto di Racconti e consigli non sono state rigenerate. Decorazioni `*-refined.webp`, attestati `*-refined.png` e SVG conservano la resa e le trasparenze. I file fotografici precedenti sono stati eliminati dopo la sostituzione. Il ritocco migliora la resa visiva, senza inventare dettagli assenti dagli scatti; le quattro nuove sorgenti stock hanno una risoluzione reale superiore alle vecchie copie ridotte.

## Selezione fotografica — 5 ottobre 2026

La hero conserva soltanto la prima foto delle risaie della selezione precedente, seguita dalle tre nuove foto fornite: tramonto sulla spiaggia (file desktop e mobile dedicati), giardino con palme e spiaggia turchese. Il ciclo automatico dura 5 secondi per foto su desktop e smartphone, senza controlli. Con movimento ridotto il cambio avviene senza dissolvenza. Il banner «Parliamone insieme» mantiene fissa la foto 4 del vicolo con le lanterne; la biografia mantiene la foto 7 di Elisa con un cocco al ristorante; l’itinerario usa la nuova foto dell’alba sul Monte Batur. I relativi slideshow e selettori sono rimossi. Gli allegati sono convertiti in WebP e ridimensionati per il mobile senza alterarne il contenuto.

## Card servizi e popup condivisi — 5 ottobre 2026

`service-cards.css` applica il nuovo riferimento alle card desktop Full Immersion e Road Map: fotografia panoramica, fondo crema, titolo affiancato da «Cosa include?» e icona «+», inclusioni con descrizioni e icone su cerchio, riquadro finale per consulenza o prezzo e CTA. Due card affiancate dagli schermi di 1100 px, una colonna sui tablet. L’approfondimento si apre in un popup su desktop e smartphone, con fotografia, testi completi, inclusioni e CTA; il contenuto scorre senza ridurre i caratteri e la chiusura resta visibile. Il passaggio tra desktop e mobile chiude il popup e mantiene i controlli disponibili in entrambi i layout. Prezzo e destinazioni dei collegamenti rimangono quelli esistenti. La CTA Road Map funziona anche dalla copia nel popup. Questa versione sostituisce le precedenti espansioni dei servizi su desktop e i popup mobile di solo testo.

## Sfondo fotografico dei contatti — 6 ottobre 2026

I contatti mostrano soltanto la fotografia fissa `contact-ocean-waves.webp`, mantenendo le inquadrature e le versioni responsive della stessa foto. `contact-background.js` seleziona la risoluzione in base alle dimensioni effettive dello sfondo; la rotazione e il secondo livello fotografico sono rimossi. `contact-background.css` conserva il gradiente per la leggibilità e il pannello opaco del modulo. La riga partenza/viaggiatori è distanziata di 20 px dal campo destinazione, su mobile e desktop. Le altre fotografie restano conservate fra le risorse inutilizzate.

La home conserva tre fotografie: risaie di Bali, tramonto sulla spiaggia e palme con piscina. La quarta foto della spiaggia con acqua turchese è rimossa dallo slideshow iniziale.

## Verifica del codice — 6 ottobre 2026

Pulizia senza modifiche alle versioni mobile e desktop o alle immagini, comprese quelle inutilizzate. Il dettaglio delle riduzioni, dei confronti visivi e delle verifiche è in [output/code-audit-2026-10-06.md](output/code-audit-2026-10-06.md).

## CMS Sveltia — 6 ottobre 2026

Pannello `/admin/` con accesso diretto tramite nome utente e password, racconti e consigli, editor, capitoli liberi, immagini ottimizzate, anteprima e stato di visibilità. Archivio e homepage leggono lo stesso archivio di contenuti; aggiunte, modifiche e rimozioni si propagano automaticamente dopo la pubblicazione Cloudflare. Le nuove immagini usano il file caricato, senza richiedere varianti mobile inesistenti. Per accesso iniziale, uso quotidiano e manutenzione vedere [CMS.md](CMS.md).
