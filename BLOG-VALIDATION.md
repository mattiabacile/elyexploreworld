# Blog — critica e verifica, 25 settembre 2026

Target: `index.html#blog`, `stories.css`, `stories.js`. Modalità Read/Experience.
Metodo: due valutazioni indipendenti (blog_design_review e blog_technical_review), seguite da implementazione e verifica nel browser.

## Critica iniziale

L'identità visiva era già coerente con ElyExploreWorld: crema, verde, tipografia editoriale, immagini organiche. Il problema era l'organizzazione: le card mostravano promesse generiche invece di racconti, con fotografie non corrispondenti ai titoli. La sezione ripeteva “Racconti di viaggio”, “Blog” e “Cosa troverai nel Blog”, conservava segnaposto e offriva “Leggi il racconto” senza un racconto completo.

- P1 — Contenuti e azioni fuorvianti: sostituiti con anteprime di Bali, Giappone e Singapore e stato di pubblicazione esplicito.
- P1 — Sezione troppo alta: ripristinata la composizione del riferimento con introduzione centrata, immagine organica, testo laterale e tre schede fotografiche sotto. Le schede controllano lo slideshow. Le due righe si adattano allo spazio sotto il menu.
- P1 — Testi ridotti a circa 10 px sui laptop: sostituite coordinate assolute e scala proporzionale alla larghezza con griglie flessibili e dimensioni minime leggibili.
- P1 — Contrasto insufficiente: il corpo precedente era circa 3,26:1, i collegamenti 2,61:1. Il nuovo corpo è 5,80:1; i titoli verdi 9,59:1. L'argilla è scurita anche per i piccoli controlli in hover.
- P2 — Navigazione nativa: corretto il callback hashchange che confrontava un evento con gli URL delle sezioni.
- P2 — Interferenze del sito: nomi delle classi isolati dalla biografia; il pulsante flottante Torna su si nasconde quando coprirebbe il Blog.

Per un nuovo visitatore, le destinazioni sono ora riconoscibili immediatamente. Per chi usa tastiera o lettore di schermo, il racconto attivo è identificato e gli altri sono esclusi dall'interazione. Per chi usa il telefono, le immagini precedono il testo e i controlli hanno aree di pressione di almeno 44 px.

## Interazioni

Slideshow senza avanzamento automatico. Selettori nominativi, precedente/successivo, indicatore corrente, scorrimento orizzontale nativo. Frecce della tastiera e Home/End quando il contenitore ha il focus. Annuncio discreto del racconto scelto; slide inattive `inert`. Primo/ultimo limite esplicito: la navigazione non ricomincia in loop. Preferenza per movimento ridotto rispettata. Ridimensionando, la destinazione selezionata resta selezionata. Senza JavaScript resta disponibile lo scorrimento nativo; i controlli aggiuntivi non vengono mostrati.

## Verifiche effettuate

Browser Chromium integrato:

- Desktop 1440 × 900: sezione 828 px + menu 72 px.
- Laptop 1366 × 768: sezione 696 px + menu 72 px.
- Laptop compatto 1024 × 640: sezione 568 px + menu 72 px; controlli dentro la schermata, nessun overflow orizzontale.
- Mobile 390 × 844 e 320 × 740: layout verticale, nessun overflow orizzontale del documento. Su mobile la sezione può superare una schermata per conservare leggibilità.
- Bali → Giappone → Singapore tramite controlli; Home e ArrowRight tramite tastiera; contatore e stato corrispondenti; immagini caricate per tutte le destinazioni; slide inattive escluse dall'albero accessibile.
- Nessun errore JavaScript registrato. Sintassi di stories.js verificata.
- Il contenuto HTML fuori dal Blog è identico al precedente, salvo le versioni dei due file Blog negli URL delle risorse. CSS e script delle altre sezioni non modificati.
- Finiture dopo la verifica: pulsante Bali portato a 44 px minimi e accento scurito per il contrasto dei piccoli controlli.

Nessuna verifica su hardware iOS/Android o Safari fisico; lo swipe utilizza lo scorrimento nativo, ma non è stato collaudato su dispositivo touch reale. Su finestre desktop inferiori a 602 px di altezza il contenuto può espandersi: la leggibilità prevale sul taglio del testo.

## Detector e limiti

Scanner Impeccable eseguito una sola volta su index.html: 74 segnalazioni sull'intera pagina, tra cui 18 contrasti, 17 testi minuscoli e 8 testi UI sottodimensionati. I riferimenti cromatici delle segnalazioni di contrasto appartengono agli stili preesistenti delle altre sezioni; verificati separatamente i colori del Blog. Forme organiche, font e crema appartengono all'identità esistente. Non è una dichiarazione di conformità dell'intero sito.

Nessun overlay è stato iniettato: valutazione visiva, geometria DOM e scan locale. Server locale già presente, non avviato per la critica. Tab temporanee chiuse e viewport ripristinato. Target slug: index-html. Nessuna ignore list presente. Nessuna tendenza rispetto a snapshot precedenti è stata usata.

## Contenuti da pubblicare

Le schede sono anteprime editoriali, non articoli completi. Mancano i testi definitivi e gli URL di pubblicazione. Il sito lo dichiara con “Racconto in arrivo”, evitando pulsanti finti. La fonte della fotografia di Singapore e la provenienza delle immagini già presenti sono documentate in `assets/stories/PROVENANCE.md`. Le istruzioni per aggiungere articoli sono nel README.

Questions skipped: correzioni e vincoli già autorizzati dall'utente; nessuna decisione necessaria per completare il layout.

## Ripristino richiesto dall’utente

Ripristinata la composizione dello screenshot fornito il 25 settembre: introduzione centrata, immagine principale con il clip-path organico originale, testo laterale, decorazioni botaniche e fila di tre schede fotografiche. La copy errata resta sostituita dalle destinazioni. Le schede inferiori sono controlli reali dello slideshow e su telefono scorrono orizzontalmente. Il testo introduttivo è ridotto alle prime due frasi già presenti per rispettare il vincolo di una schermata. Il riferimento contiene una composizione più alta del normale desktop: le proporzioni sono quindi fluide, non una riproduzione pixel per pixel.

Verifica della composizione ripristinata: 1366 × 768, 920 × 740 e 1024 × 640 rispettano l'altezza della schermata con il menu; a 1024 × 640 il bordo inferiore delle schede è a 628 px e la sezione termina a 640 px. Le tre fotografie delle schede hanno la stessa altezza anche quando i titoli vanno su due righe. A 390 × 844 le schede inferiori scorrono orizzontalmente senza allargare il documento. Cambio destinazione via scheda confermato; immagini caricate, nessun errore in console. Viewport ripristinato e tab di verifica chiusa.
