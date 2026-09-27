# Pulizia e correzioni — 27 settembre 2026

## Risultato

- Immagini raster in cartella: da 34.77 MB a 4.53 MB, incluse due nuove varianti responsive della hero (riduzione 87.0%). Questo è il peso delle risorse, non una misura dei tempi di caricamento.
- 13 immagini inutilizzate rimosse: 19.50 MB.
- CSS e JavaScript: da 174.7 kB a 118.4 kB nella cartella, inclusa la rimozione del foglio mai caricato `styles.css`.
- Eliminati `vecchi/`, `footer.html` duplicato e i file `.DS_Store`.
- Conservati registri di provenienza, specifiche e materiali di revisione `.impeccable/`.

## Correzioni

- Navigazione condivisa fra tutte le pagine; rimossi gestori duplicati e vecchi stili di header, menu, footer e contatti non più presenti.
- Focus confinato nel menu, contenuto sottostante inerte, ritorno al pulsante con Escape e ripristino immediato della posizione di scorrimento.
- Link alle sezioni con URL e cronologia coerenti, focus sulla destinazione e rispetto della preferenza di movimento ridotto.
- Regole tablet dei servizi estratte da una media query mobile accidentalmente annidata; tipografia delle anteprime applicata anche su desktop.
- Anteprime senza ID duplicati, titolo alternativo per itinerari senza intestazione e chiusura solo cliccando effettivamente fuori dal dialogo.
- Eliminati gestori per gallerie, articoli e dialoghi legali assenti; rimossa l’anteprima blog non più raggiungibile.
- Carosello con pulsante Pausa/Riprendi; focus trasferito prima di rendere inerte una slide; stop con dialoghi e menu aperti, focus, hover, scheda nascosta e sezione fuori vista.
- Parametri articolo come `constructor` o `__proto__` non interrompono più l’esecuzione.
- Condivisione: nessuna falsa conferma se gli appunti non sono disponibili o il permesso viene negato; errori gestiti.
- Footer da un’unica fonte senza fetch ripetuto e anno automatico. Le tre pagine legali mancanti non producono più link 404: le voci sono segnalate come in preparazione.
- Immagini WebP con trasparenza mantenuta; foto principale responsive; immagini sotto la prima schermata differite e dimensioni intrinseche aggiunte dove mancavano.
- Descrizione della homepage ricavata dal testo già presente; modulo esplicito sull’apertura dell’app di posta.

## Verifiche

- `python3 tests/check-static.py`: superato. Dipendenze locali, asset, ancore, ID e parentesi CSS.
- Controllo sintattico Node su tutti gli script: superato.
- `tests/site-check.cjs`, Chromium/Chrome: superato su home, archivio, tre articoli e due parametri anomali; viewport 320, 390, 768, 900 e 1440 px. Verificati link interni, assenza di overflow, menu, focus, scroll, dialoghi, carosello e rifiuto accesso agli appunti.

- Verifica aggiuntiva della rotazione automatica e della pausa persistente: superata.

## Da completare con materiale approvato

Articoli e parti dell’itinerario contengono ancora segnaposto. I ritratti sono in arrivo. Mancano i testi delle tre pagine legali. Il contatto prepara un’email e non invia dati tramite server. I documenti di validazione precedenti descrivono revisioni storiche.

## Recupero

Backup completo: `/Users/Mattia/Desktop/elyexploreworld-backup-20260927-pre-cleanup.tar.gz`. Prima della cancellazione, le immagini sono state confrontate byte per byte con la copia archiviata.

### Immagini inutilizzate rimosse

- `assets/balinese-botanical-ambient.png`
- `assets/bio-botanical-medallion.png`
- `assets/chi-sono-background-clean.png`
- `assets/chi-sono-background.png`
- `assets/consultation-reference.png`
- `assets/hero-traveler.jpg`
- `assets/services-agenda-passport-final-source.png`
- `assets/services-agenda-passport-final.png`
- `assets/services-agenda-passport-light-source.png`
- `assets/services-agenda-passport-v2.png`
- `assets/services-agenda-passport.png`
- `assets/stories/amalfi.png`
- `assets/stories/jordan.png`

### Conversioni

- `assets/bali-rice-terraces.jpg` → `assets/bali-rice-terraces.webp`
- `assets/balinese-botanical-ambient.jpg` → `assets/balinese-botanical-ambient.webp`
- `assets/bio-balinese-bamboo-medallion.png` → `assets/bio-balinese-bamboo-medallion.webp`
- `assets/consultation-polaroid-cutout.png` → `assets/consultation-polaroid-cutout.webp`
- `assets/hero-river.jpg` → `assets/hero-river.webp`
- `assets/hero-temple.jpg` → `assets/hero-temple.webp`
- `assets/services-agenda-passport-light.png` → `assets/services-agenda-passport-light.webp`
- `assets/stories/bali.jpg` → `assets/stories/bali.webp`
- `assets/stories/bali.png` → `assets/stories/bali-detail.webp`
- `assets/stories/japan.jpg` → `assets/stories/japan.webp`
- `assets/stories/japan.png` → `assets/stories/japan-detail.webp`
- `assets/stories/singapore.jpg` → `assets/stories/singapore.webp`
