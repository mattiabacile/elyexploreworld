# Gestione di racconti e consigli

Il pannello è all’indirizzo **https://elyexploreworld.pages.dev/admin/**. Per il lavoro quotidiano non serve aprire Cloudflare.

## Entrare

Inserire **nome utente e password** nel pannello. Non serve un account GitHub o Cloudflare per il lavoro quotidiano. Usare **Esci dal pannello** quando si termina; la sessione scade dopo otto ore. Nome e password vengono scelti durante la prima attivazione. La password deve avere almeno 14 caratteri. Non viene conservata in chiaro: il server memorizza un hash con sale e segreto aggiuntivo.

## Aggiungere un contenuto

1. Aprire **Racconti e consigli** e creare un nuovo racconto.
2. Scegliere **Racconto di viaggio** oppure **Consiglio di viaggio**.
3. Inserire titolo, data, destinazione, introduzione breve e foto di copertina. Descrivere la foto nel campo dedicato.
4. Scrivere l’apertura con l’editor. Ogni nuovo articolo parte con tre capitoli vuoti. Aggiungerli o eliminarli secondo necessità: ognuno può avere testo, foto, didascalia, citazione e un consiglio pratico.
5. Controllare l’anteprima. Lasciare **Visibile sul sito** disattivato durante la preparazione.
6. Quando il contenuto è pronto, attivare **Visibile sul sito**, disattivare **Consiglio in preparazione** e premere **Salva**.

**Campi** divide il modulo in **Copertina** e **Articolo**. Copertina gestisce la foto dello slideshow e dell’archivio; Articolo contiene il testo, i capitoli, le fotografie interne, i tag e l’aspetto. I capitoli sono campi in sequenza, senza box o controlli per chiuderli. Le frecce spostano un capitolo prima o dopo e il pulsante Rimuovi lo elimina. Le etichette e le brevi istruzioni dei singoli campi spiegano cosa inserire. Nell’elenco, i filtri distinguono bozze, pubblicati, racconti, consigli e consigli in preparazione.

## Modificare sulla pagina

Su desktop la barra superiore offre due modalità: **Pagina** e **Campi**. Campi mantiene l’editor tradizionale: l’anteprima segue il campo selezionato e lo scorrimento dei campi. Pagina mostra il racconto al centro dello spazio di lavoro.

In **Pagina**, cliccare il titolo, un testo, una fotografia o una didascalia: il relativo editor appare sulla pagina. Il testo conserva gli strumenti di formattazione e le fotografie usano la libreria del CMS. È possibile selezionare gli elementi anche con Tab e Invio. **Fine** chiude il controllo e torna all’anteprima; **Salva** conserva tutte le modifiche. Per pubblicare, scegliere **Visibile sul sito** nel pannello laterale e premere **Salva**. **Bozza** conserva l’articolo senza mostrarlo sul sito. Per un consiglio in preparazione, il pannello specifica che viene pubblicata soltanto la scheda nell’archivio; articolo completo e slideshow restano esclusi.

I controlli per aggiungere o riordinare capitoli e fotografie sono presenti nella pagina. Il sommario porta al capitolo scelto, anche da tastiera e negli articoli lunghi. La visibilità è sempre a lato; informazioni, tag e aspetto sono nelle impostazioni laterali. Le sezioni **Copertina** e **Articolo** sono disponibili anche in Pagina, con anteprime distinte. Titoli, introduzione breve, didascalie e citazioni si formattano direttamente nei rispettivi campi con grassetto e corsivo. I testi lunghi offrono anche gli altri strumenti di scrittura. La lettera iniziale grande si sceglie in **Aspetto dell’articolo**. Un articolo vuoto offre spazi fotografici proporzionati con **Aggiungi foto**, oltre ai controlli per iniziare il testo e aggiungere capitoli; ogni capitolo consente anche citazioni e consigli pratici. Sui telefoni si usa **Campi** con il pulsante dell’anteprima: **Pagina** è disabilitata per evitare controlli sovrapposti in uno spazio troppo piccolo. Il passaggio tra Pagina e Campi conserva la stessa bozza.

## Strumenti per scrivere e rileggere

- **Solo scrittura**: su desktop allarga lo spazio per il testo e nasconde l’anteprima. **Mostra anteprima** ripristina i due pannelli.
- **Icone schermo / telefono**: l’icona telefono restringe l’anteprima a 390 pixel, quando lo spazio disponibile lo consente.

Per salvare una bozza, lasciare **Visibile sul sito** disattivato. Per pubblicare, attivarlo e premere **Salva**. **Consiglio in preparazione** compare solo per i consigli e pubblica la scheda nell’archivio. La data ordina i contenuti, senza programmare la pubblicazione.

## Copertina, fotografie interne e tag

La foto di **Copertina** appare nello slideshow e nelle schede dell’archivio. In **Articolo**, la scelta **Usare la copertina anche come prima foto nell’articolo?** offre **Sì** o **No**. Sì mantiene le fotografie collegate; No permette una prima foto diversa, oppure nessuna prima foto. La didascalia e il formato della prima foto appartengono all’articolo. Gli articoli esistenti mantengono la foto precedente finché non si sceglie No.

**Tag** permette di cercare e scegliere tag già salvati, oppure di aggiungerne uno. Un nuovo tag viene salvato insieme all’articolo in `content/tags.json` e resta disponibile negli articoli successivi, anche se viene tolto da un articolo. L’elenco iniziale contiene tutti i tag già utilizzati. Cliccare un tag nel sito apre l’archivio filtrato per quel tag, comprendendo racconti e consigli pubblicati. **Mostra tutti** rimuove il filtro.

## Personalizzare un articolo

- **Aspetto dell’articolo**: scegliere colore dei dettagli, formato e ritaglio della prima foto interna, testo contemporaneo o da diario, iniziale grande e sommario con link ai capitoli. L’anteprima mostra il risultato mentre si modifica.
- **Formattazione**: selezionare il testo nel campo e usare gli strumenti inline di grassetto e corsivo.
- In ogni **Capitolo**, scegliere foto a destra, a sinistra o grande sotto il testo. Il formato può essere orizzontale, verticale, quadrato o senza ritaglio. “Alternanza automatica” conserva la composizione originale.
- **Informazioni del viaggio**: aggiungere durata, periodo consigliato e tipo di viaggio. I campi vuoti non compaiono sul sito.
- **Galleria fotografica**: aggiungere immagini, descrizioni e didascalie; trascinare per riordinarle. Sul sito le foto si possono aprire e sfogliare ingrandite.
- **Conclusione**: scrivere un saluto o una riflessione finale, con la stessa formattazione del testo principale.

Tutte queste opzioni sono facoltative. Gli articoli esistenti mantengono il loro aspetto fino a quando si sceglie una personalizzazione.

Il racconto compare nella sezione racconti dell’archivio; il consiglio nella sezione consigli. Entrambi entrano automaticamente nello slideshow della homepage e hanno una pagina di lettura. Sono ordinati dal più recente. Cloudflare pubblica la modifica dopo il salvataggio: l’aggiornamento può richiedere qualche minuto.

La data serve a ordinare i contenuti, non a programmare la pubblicazione. Per ritirare un contenuto, disattivare **Visibile sul sito** e salvare. Per eliminarlo, usare l’azione di eliminazione nel pannello. Le immagini non vengono cancellate insieme all’articolo, per evitare di rompere altri contenuti che le utilizzano.

## Fotografie

Caricare le immagini dal relativo campo o dalla libreria. Le nuove foto vengono salvate in `assets/uploads`, con nomi univoci, convertite in WebP e ridimensionate entro 2400 pixel di lato con qualità 88. Il limite di caricamento è 25 MB per file. Preferire immagini orizzontali per la copertina; scegliere una foto diversa per ogni capitolo è facoltativo. Le fotografie già utilizzate nei racconti sono disponibili come raccolta in sola lettura.

Le copertine HTTPS già salvate sono supportate anche sul sito pubblico: non fanno scomparire l’articolo dall’archivio. Per i nuovi articoli è preferibile caricare le foto nella libreria del CMS, così restano conservate insieme al sito.

Le varianti mobile preesistenti sono usate solo per le fotografie che le possiedono. Le nuove foto caricate dal CMS funzionano anche su smartphone senza richiedere la creazione manuale di altre versioni.

## Bozze e contenuti esistenti

**Visibile sul sito** nasconde un contenuto dal sito, ma non rende privato il file: il repository GitHub e l’archivio JSON sono pubblici. Per bozze riservate usare la bozza locale del CMS senza pubblicarla su GitHub. Non inserire dati personali riservati, password o chiavi nei testi.

I tre racconti precedenti sono stati trasferiti nel CMS conservando i contenuti. I testi provvisori dei capitoli sono ancora da sostituire. Anche i tre consigli già presenti sono modificabili; rimangono in preparazione fino a quando viene disattivata l’opzione dedicata.

## Configurazione iniziale dell’accesso

Questa parte riguarda soltanto chi configura il sito. L’accesso diretto è un’integrazione dedicata per questa installazione di Sveltia: una sessione protetta consente al CMS di pubblicare tramite un proxy sullo stesso dominio. La chiave GitHub rimane sul server. Il proxy consente scritture solo su `content/stories.json`, sul registro `content/tags.json` e sulle immagini in `assets/uploads`, sul branch `main` del repository del sito. Non consente di modificare il codice del sito o altri repository.

1. Registrare una GitHub App privata **ElyExploreWorld Editor**, con Homepage `https://elyexploreworld.pages.dev/admin/`, senza OAuth per gli utenti e senza webhook. Concedere **Contents: Read and write**; Metadata viene aggiunto in sola lettura. Installarla **solo** sul repository `mattiabacile/elyexploreworld`.
2. Generare la chiave privata dell’app e convertirla nel formato PEM PKCS#8. Conservare App ID e Installation ID. Il server genera automaticamente credenziali di pubblicazione di breve durata, limitate al repository.
3. Creare il database D1 `elyexploreworld-cms`, eseguire `server/cms-schema.sql` e collegarlo al progetto Pages di produzione con il nome `CMS_DB`.
4. Nelle variabili di produzione impostare `CMS_GITHUB_APP_ID` e `CMS_GITHUB_INSTALLATION_ID`. Nei **Secret** impostare `CMS_GITHUB_PRIVATE_KEY` (PEM PKCS#8 oppure DER PKCS#8 codificato in base64) e `CMS_SECRET` (segreto casuale di almeno 32 caratteri). Non salvare questi segreti nel repository. Ripubblicare il progetto dopo la configurazione.
5. Aprire una sola volta `/admin/#setup=SEGRETO`, usando il valore di `CMS_SECRET`. Il frammento viene rimosso subito dall’indirizzo e non è inviato nei log delle richieste. Il proprietario completa personalmente nome utente, password e conferma. Dopo il primo account, questa procedura non permette di creare altri utenti.

L’accesso viene bloccato dopo dieci tentativi per indirizzo in quindici minuti; esiste anche un limite globale. La sessione usa un cookie HttpOnly, Secure e SameSite=Strict; l’uscita la revoca nel database. Non modificare `CMS_SECRET` dopo la creazione dell’account senza una procedura di ripristino: è usato anche nella verifica della password.

Per ripristinare un accesso dimenticato, il gestore deve revocare le sessioni, rimuovere l’account nel database e far ripetere la creazione personale. Questa operazione non va eseguita dal normale editor. Con un dominio diverso aggiornare l’indirizzo dell’app e aprire il pannello sul nuovo dominio; il CMS usa automaticamente il proprio dominio per le API e le anteprime.

Per una configurazione tecnica alternativa è supportato `CMS_GITHUB_TOKEN`, un token dedicato con permesso Contents di lettura/scrittura **solo** sul repository del sito. Si preferisce l’app perché rinnova automaticamente le credenziali temporanee.

Se il pannello non si carica, **Riprova ad aprire il pannello** ripete il caricamento. Un errore durante il salvataggio conserva la modifica aperta: confermare il messaggio e riprovare **Salva**. Se l’uscita fallisce, il pulsante **Uscita non riuscita. Riprova** permette di ripeterla.

## Verifica locale

`/admin/?local=1` abilita il flusso locale di Sveltia soltanto su `localhost` o `127.0.0.1`; non apre l’accesso al server e non è disponibile sul dominio pubblico. I test usano archivi isolati e simulano GitHub, senza pubblicare articoli di prova.

## Manutenzione

- Non è necessario un comando di build per i contenuti: `content/stories.json` è la sorgente condivisa da archivio, slideshow e articolo.
- Sveltia è ospitato nel sito e fissato alla versione `0.229.0`. Gli aggiornamenti si provano prima di sostituire il file.
- Marked `18.1.0` e DOMPurify `3.4.16` sono copie locali: rendono il testo formattato e rimuovono codice eseguibile dai contenuti.
- Il proxy usa il parser GraphQL ufficiale, versione `16.11.0`; licenza in `server/vendor/graphql-LICENSE.txt`.
- `_routes.json` limita le funzioni alle API riservate del CMS, lasciando statiche tutte le altre richieste.
- Verifiche: `python3 tests/check-static.py`, `node tests/cms-check.cjs`, `node tests/cms-editor-check.cjs`, `node tests/cms-chapters-check.cjs`, `node tests/cms-visual-check.cjs`, `node tests/cms-page-actions-check.cjs`, `node tests/cms-create-check.cjs`, `node tests/cms-access-check.cjs`, `node tests/cms-resilience-check.cjs`, `node tests/site-check.cjs`, `node tests/mobile-check.cjs`, `node tests/deep-check.cjs`. I controlli Node richiedono Playwright e Chrome.
