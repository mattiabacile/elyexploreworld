# Gestione di racconti e consigli

Il pannello è all’indirizzo **https://elyexploreworld.pages.dev/admin/**. Per il lavoro quotidiano non serve aprire Cloudflare.

## Entrare

Premere **Accedi con GitHub** e usare l’account autorizzato a modificare il repository `mattiabacile/elyexploreworld`. L’accesso a Cloudflare serve solo a chi configura il sito. Un account GitHub diverso da quello del proprietario deve prima essere aggiunto come collaboratore con permesso di scrittura.

## Aggiungere un contenuto

1. Aprire **Racconti e consigli** e creare un nuovo racconto.
2. Scegliere **Racconto di viaggio** oppure **Consiglio di viaggio**.
3. Inserire titolo, data, destinazione, introduzione breve e foto di copertina. Descrivere la foto nel campo dedicato.
4. Scrivere l’apertura con l’editor. Aggiungere i capitoli necessari: ognuno può avere testo, foto, didascalia, citazione e un consiglio pratico.
5. Controllare l’anteprima. Lasciare **Visibile sul sito** disattivato durante la preparazione.
6. Quando il contenuto è pronto, attivare **Visibile sul sito**, disattivare **Mostra solo l’anteprima: articolo in preparazione** e salvare/pubblicare.

Il racconto compare nella sezione racconti dell’archivio; il consiglio nella sezione consigli. Entrambi entrano automaticamente nello slideshow della homepage e hanno una pagina di lettura. Sono ordinati dal più recente. Cloudflare pubblica la modifica dopo il salvataggio: l’aggiornamento può richiedere qualche minuto.

La data serve a ordinare i contenuti, non a programmare la pubblicazione. Per ritirare un contenuto, disattivare **Visibile sul sito** e salvare. Per eliminarlo, usare l’azione di eliminazione nel pannello. Le immagini non vengono cancellate insieme all’articolo, per evitare di rompere altri contenuti che le utilizzano.

## Fotografie

Caricare le immagini dal relativo campo o dalla libreria. Le nuove foto vengono salvate in `assets/uploads`, con nomi univoci, convertite in WebP e ridimensionate entro 2400 pixel di lato con qualità 88. Il limite di caricamento è 25 MB per file. Preferire immagini orizzontali per la copertina; scegliere una foto diversa per ogni capitolo è facoltativo. Le fotografie già utilizzate nei racconti sono disponibili come raccolta in sola lettura.

Le varianti mobile preesistenti sono usate solo per le fotografie che le possiedono. Le nuove foto caricate dal CMS funzionano anche su smartphone senza richiedere la creazione manuale di altre versioni.

## Bozze e contenuti esistenti

**Visibile sul sito** nasconde un contenuto dal sito, ma non rende privato il file: il repository GitHub e l’archivio JSON sono pubblici. Per bozze riservate usare la bozza locale del CMS senza pubblicarla su GitHub. Non inserire dati personali riservati, password o chiavi nei testi.

I tre racconti precedenti sono stati trasferiti nel CMS conservando i contenuti. I testi provvisori dei capitoli sono ancora da sostituire. Anche i tre consigli già presenti sono modificabili; rimangono in preparazione fino a quando viene disattivata l’opzione dedicata.

## Configurazione iniziale dell’accesso

L’accesso usa l’Authenticator ufficiale Sveltia, adattato a Cloudflare Pages Functions. Il sito pubblica `/auth` e `/callback`; il segreto non deve comparire nei file del sito.

Registrare una GitHub OAuth App con:

- Nome: `ElyExploreWorld CMS`.
- Homepage: `https://elyexploreworld.pages.dev/admin/`.
- Callback: `https://elyexploreworld.pages.dev/callback`.

In Cloudflare, progetto `elyexploreworld`, impostazioni di produzione, aggiungere:

- `GITHUB_CLIENT_ID`: Client ID dell’app.
- `GITHUB_CLIENT_SECRET`: Client Secret, di tipo **Secret**.
- `ALLOWED_DOMAINS`: `elyexploreworld.pages.dev`.

Ripubblicare il progetto dopo aver impostato le variabili. Con un nuovo dominio, aggiornare callback, homepage dell’app e `ALLOWED_DOMAINS`. Il pannello usa automaticamente il proprio dominio per l’accesso e le anteprime.

Il CMS richiede lo scope OAuth `public_repo`: GitHub lo applica ai repository pubblici modificabili dall’account che accede, non soltanto a questo repository. L’editor deve avere permesso di scrittura sul branch `main`. Il CMS non può usare la pubblicazione diretta se una protezione del branch impone una pull request.

## Manutenzione

- Non è necessario un comando di build per i contenuti: `content/stories.json` è la sorgente condivisa da archivio, slideshow e articolo.
- Sveltia è ospitato nel sito e fissato alla versione `0.229.0`. Gli aggiornamenti si provano prima di sostituire il file.
- Marked `18.1.0` e DOMPurify `3.4.16` sono copie locali: rendono il testo formattato e rimuovono codice eseguibile dai contenuti.
- L’Authenticator proviene dal progetto ufficiale `sveltia/sveltia-cms-auth`; la sua licenza è in `server/LICENSE.txt`.
- `_routes.json` limita le funzioni all’accesso, lasciando statiche tutte le altre richieste.
- Verifiche: `python3 tests/check-static.py`, `node tests/cms-check.cjs`, `node tests/site-check.cjs`, `node tests/mobile-check.cjs`, `node tests/deep-check.cjs`. I controlli Node richiedono Playwright e Chrome.
