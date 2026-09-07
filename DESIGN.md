# ElyExploreWorld Design System

## Intent

Un taccuino di viaggio contemporaneo: editoriale ma umano, immersivo ma leggibile, organico senza decorazioni folkloristiche. La fotografia porta il luogo; tipografia, spazio e colore comunicano ascolto e cura.

## Color

Strategia “full palette” con verde foresta come identità principale, argilla come accento e superfici chiare. I token sono espressi in OKLCH nel CSS; i valori esadecimali del brief restano il riferimento cromatico di approvazione.

- `deep-forest`: #254535 — navigazione, titoli, CTA, superfici immersive.
- `olive`: #5F6B51 — testo secondario e annotazioni.
- `sage`: #A7B79A — supporto su fondi scuri e campiture leggere.
- `eucalyptus`: #7E9D8A — sezioni di processo e dettagli ambientali.
- `warm-cream`: #F7F3E9 — superficie editoriale primaria.
- `sand`: #DCC9A8 — divisori, bordi e segni grafici.
- `clay`: #C97859 — enfasi, numeri e stati interattivi.
- `terracotta`: #B4644A — hover e accenti più profondi.
- `charcoal`: #2D302B — testo corrente.

## Typography

- Display: Cormorant Garamond. Titoli fluidi, contrasti importanti, corsivo solo per parole o frasi che portano tono.
- Testo e interfaccia: Plus Jakarta Sans. Corpo 16–20 px, interlinea generosa, righe di massimo 70 caratteri.
- Annotazioni: Dancing Script. Riservato a firme, didascalie e una sola frase di atmosfera per sezione.
- Maiuscolo tracciato solo per brevi etichette, metadati e CTA; mai per paragrafi.

## Layout

- Contenuto centrato con larghezza massima di circa 1.560 px e margini fluidi.
- Hero a piena altezza con fotografia full-bleed, gradiente di leggibilità e stampe sovrapposte.
- Sezioni lunghe alternate: biografia asimmetrica, processo ordinato, galleria orizzontale, magazine grid, contatto immersivo.
- Raggi contenuti (12–18 px) per immagini e pannelli; pillole solo per pulsanti e tag.
- Spaziatura verticale fluida tra 88 e 160 px su desktop, ridotta su mobile.

## Components

- Header trasparente che diventa superficie compatta dopo lo scroll.
- Pulsanti principali a pillola verde foresta, testo chiaro e spostamento minimo in hover.
- Cornici fotografiche bianche con ombra breve e definita.
- Tag valori con fondo salvia leggero e bordo verde.
- Timeline servizi con alternanza testo/immagine e nodi centrali.
- Card viaggio fotografiche con informazioni rivelate in hover e selezione che precompila il modulo.
- Articoli come controlli completi che aprono un’anteprima accessibile.
- Campi con etichetta persistente e bordo inferiore; messaggi di successo in una live region.

## Motion

- Un ingresso iniziale orchestrato per hero e stampe fotografiche.
- Parallasse molto lieve soltanto sul hero.
- Reveal diversi per biografia, processo e gallery; il contenuto resta visibile anche senza JavaScript.
- Transizioni con curve ease-out, nessun rimbalzo decorativo.
- `prefers-reduced-motion` disattiva parallasse, animazioni continue e scorrimenti morbidi.

## Responsive Behavior

- La terza sezione «Ciao, sono Ely.» deve rientrare in una sola schermata sui laptop, menu incluso. Conservare fotografia, testi, forme e ornamenti; adattare le proporzioni senza deformare il ritratto. Su mobile privilegiare la leggibilità con una disposizione verticale.
- Sotto 1024 px la navigazione diventa drawer e compare una CTA fissa inferiore.
- Hero e contatto passano a una colonna; le stampe decorative non competono con il testo.
- Timeline diventa una sequenza verticale senza linea centrale.
- Galleria viaggio mantiene lo scorrimento orizzontale con snap e controlli accessibili.
- Form e newsletter impilano campi e pulsanti; target interattivi minimi di 44 px.
