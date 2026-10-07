# Editor racconti

Target: `admin/`. Mode: Operate. Ordinary extension of the existing CMS and ElyExploreWorld identity.

## Direction contract

THESIS: Help Ely write and publish travel stories with a clear path from the invitation to the final review. Keep native saving, media management and draft protection.

OWN-WORLD: The site's forest, warm cream and sage surfaces; Plus Jakarta Sans for editor controls and headings; Cormorant in the brand wordmark and the article preview according to its existing appearance settings. Compact rounded controls, thin separators, no decorative animation.

STORY: The author sees the draft's visibility after saving, moves to the relevant field, writes with optional personal prompts, checks photos and provisional text, then saves through the native CMS.

FIRST VIEWPORT: Native Save remains at the top, beside Pagina/Campi, Aspetto and Pubblica. Page mode fills the workspace with the editable article and Desktop/Telefono controls. A short instruction explains clicking text or photos. Empty optional blocks have explicit add controls.

FORM: Extend the native preview with click and keyboard selection. The actual native field appears over the selected page area, retaining rich text tools, media selection, validation and draft saving. Fine returns focus to the page without saving; Campi restores the traditional editor. On phones the selected field is a bottom sheet. No concept seed is needed for this extension.

FINISH: The finish reviewer returned `ship` for `page-desktop.png`, `page-writing.png` and `page-mobile.png`. This ordinary extension preserves the existing DESIGN.md; it introduces no shipping raster and no replacement visual world.

## Scope and evidence

The user prioritizes writing and publishing stories and explicitly asks for an aesthetically pleasant editor. No new imagery, factual claims, public story content or authentication behavior is changed. The checklist is advisory and never blocks draft saving. Downloads contain Markdown text and image references, not bundled photos. Existing DESIGN.md remains the visual authority.

## Confirmed page editing choice — 6 October 2026

The user asked to edit directly in the preview and selected keeping the choice between **Pagina** and **Campi**. **Campi** remains the default. Both modes operate on the same native CMS draft.

In **Pagina**, selecting text, a photo or its caption by click, Enter or Space opens the actual CMS field over that page area. Rich text formatting, media selection, validation and native draft protection remain owned by the CMS. **Fine** closes the field and returns to the page without saving; the native **Salva** persists the draft. **Aspetto** and **Pubblica** open their native fields over the preview without changing mode. Add controls expose missing optional content and the native chapter/gallery reorder controls.

On phones the CMS uses one pane. Page mode uses its native preview toggle; selecting a field returns to the native edit pane and presents the field in a lower sheet. An aria-hidden, noninteractive, script-free snapshot preserves the visible page context behind the field until live preview returns. The injected form studio, navigation and guide are removed when the reused native container becomes preview, preventing duplicate navigation. Native rich text serialization is allowed to complete before **Fine** closes its control.

## Implementation mapping

| Source | Responsibility |
| --- | --- |
| `admin/visual-editor.js` | Pagina/Campi controls, preview selection, native field highlighting and placement, Fine/focus behavior, phone preview transition and snapshot; page-based Aspetto/Pubblica selection and mounting of fields for newly created chapters/gallery. |
| `admin/boot.js` | Editable preview key paths and labels for text, photos and captions; explicit add controls for missing opening/body, quotes/notes, chapter layout/photo format, chapters and blank gallery; footer article metadata and appearance/visibility targets. |
| `admin/editor.css` | Existing CMS palette and type tokens; mode controls, anchored field/toolbar, phone sheet and preview backdrop. |
| `admin/preview.css` | Page selection hover/focus, add controls, guide and local chapter/footer tools; existing article preview composition remains the authority. |
| `admin/editor.js` | Existing studio and writing tools; removal of form-only additions when the phone pane becomes preview. |
| `CMS.md` | Usage instructions and the listed `tests/cms-visual-check.cjs` verification entry. |
| `content.js` | Public image validation for local assets and parsed HTTPS URLs without embedded credentials, keeping hosted CMS images eligible for archive, homepage and detail rendering. |

## Local visual rules

The extension reuses `--ely-forest`, `--ely-paper`, `--ely-surface`, `--ely-soft`, `--ely-line`, `--ely-ink`, `--ely-muted` and `--ely-clay` from `admin/editor.css`; it adds no global palette or type ramp. Controls retain Plus Jakarta Sans at the established interface scale. The article's serif headings and optional journal text remain article presentation, separate from editor chrome.

**The Native Field Rule.** Page editing presents the native CMS field rather than a second content model; future changes must retain its tools, validation and saving behavior.

**The Explicit Save Rule.** Fine returns to the page; Salva persists changes. The interface must continue to make this distinction visible.

**The Incumbent World Rule.** Mode controls use forest selection, soft hover surfaces and clay focus; the floating editor uses the existing cream surfaces and restrained rounded shape. Its structural shadow distinguishes an active field over the article and is local to this interaction.

## Documentation evidence

Checked PRODUCT.md, DESIGN.md, the shipped documenter guidance, the source mappings above and the three approved captures in `.impeccable/review/`: `page-desktop.png` shows the full article workspace and top actions; `page-writing.png` shows the native rich text field anchored over the article; `page-mobile.png` shows the phone field over preserved page context. The finish reviewer verdict and the single detector result `[]` were supplied by the build handoff; this documentation pass did not rerun tests or the detector.

DESIGN.md is preserved. Pre-existing configuration drift (missing `buildPath`) is recorded without repair. `.impeccable/design.json` was absent at this documentation pass and is left absent; no new tokens or defects are canonized to justify a system rewrite.

## Complete page authoring follow-up

Pagina now covers blank articles as well as existing entries. Empty opening and chapter text, optional quotes and practical notes, empty gallery items, chapter layout and photo format have explicit native-field targets. Appearance and publishing open native fields over the page. The footer also exposes kind, category, tags, title accent, homepage copy and preparing status. Campi remains the default alternative.

`tests/cms-create-check.cjs` exercises an entirely new article in isolated storage: uploads, chapters, gallery, optional object creation, appearance, visibility and persisted JSON. The public image validator accepts safe HTTPS images saved by the hosted CMS, while rejecting executable schemes, protocol-relative URLs and embedded credentials; this fixes the saved but invisible test article. Production content must be retained during release.

The completed build handoff reports full creation passing at desktop and 390 px phone width, including new uploads, direct Salva immediately after typing and persisted JSON. It also reports archive, homepage and article-detail regression checks passing after the HTTPS image correction. These are supplied verification results; this documentation reconciliation did not rerun them.

Checked the final source targets and `.impeccable/review/page-created-1440.png` and `page-created-390.png`: both show the newly created article in Pagina with its title, cover, caption and visible-after-save status; the phone capture retains Pagina/Campi, Salva, Aspetto and Pubblica within the viewport. The earlier reviewer `ship` remains scoped to its original three captures. This follow-up adds functional coverage and capture evidence without claiming another review verdict or introducing a new design system.


## October 6: inline writing, contextual options
The latest user instruction supersedes the fixed inspector implementation. Pagina uses the full canvas without a persistent sidebar. Text targets present the native CMS field in the selected article block, without dialog styling. Images and complex settings use a contextual popup. Chapter and gallery creation and ordering act directly on the article. Inline article controls expose chapters, gallery, labels, appearance and visibility. Fine closes the editing state; Salva persists the same native draft. On phones the same inline writing behavior applies.


## October 6: direct structural actions and flow corrections
The user explicitly rejected leaving newly created chapters in a popup. Aggiungi capitolo now invokes the native list add action without presenting the list editor, waits for the new article block, and focuses its title in a region within the article. Gallery creation likewise inserts the new slot and only opens its image picker. Choosing an image returns automatically to the article.
Move-before/move-after and removal controls live beside each item. Removal uses inline confirm/cancel. Image descriptions, captions and labels are in context; infrequent options are grouped under details. Pagina hides both the fixed inspector and the native utility sidebar. Campi preserves the native sidebar. Native rich text, list mutation, upload, validation and save remain authoritative.
Keyboard return works across the article iframe and the native field. Phone editing reserves space before creating its inert article snapshot, retaining the surrounding content. Native validation is presented in the article on desktop; the native phone error sheet returns to the selected inline field. `tests/cms-page-actions-check.cjs` verifies creation, moves, confirm/cancel deletion, ordering, keyboard return and failed-save recovery at 1440 and 390 px. No new independent design review verdict is claimed.

## October 7: integrated editing and publishing
Latest user direction supersedes the older group controls. Pagina has no Dettagli/Aspetto/Visibilità, Organizza or history controls. Publication choice is in a persistent right rail on desktop and a compact bottom area on phones. Additional metadata is collapsible on phones. Bold and italic remain native rich text controls; title accent and drop cap are beside their text. Chapters expose direct up/down movement. Empty images reserve their chosen aspect ratio with Aggiungi foto. Device controls use screen and phone icons with accessible labels. Campi selection and scrolling synchronize the preview and highlight the active target.

The saved-upload regression revealed Unicode filenames were rejected by the public content validator. Local accented and apostrophe filenames are now accepted, with traversal and unsafe characters rejected. Creation tests use actual saved CMS JSON to verify slideshow, archive placement and full article without modifying live content.

Final live inspection found selected Pagina inherited an unreadable hover background. The ordinary hover rule now excludes the selected mode; no additional visual redesign pass was opened.

## October 7: native inline formatting and compact authoring
Latest user direction supersedes phone Pagina and separate title-accent controls. All editorial short text uses compact native rich text; titles offer only bold/italic. Public article, archive and slideshow preserve formatting, while metadata and accessibility names stay plain. Existing titleAccent remains compatible until an edited title is saved. Page settings have two collapsed sections; publication stays visible. Phones use Campi plus preview, without the mode switch, and resizing out of Pagina preserves the draft. Native rich-text serialization completes before mode, publication or save transitions.
One batched inspection of page-desktop, page-writing and page-mobile confirms legible native controls and the preserved palette. Functional checks cover immediate saves, formatted titles, uploads, ordering, validation, draft isolation, phone editing, protected publishing proxy and resulting archive/slideshow/detail. The single detector invocation returned no findings. No additional visual-world or reviewer verdict is claimed.

## October 7: long articles and recovery
Confirmed defects fixed after the main redesign: contents anchors now move and focus the selected chapter; distant virtualized chapters mount their native fields before selection; delayed page actions are tied to their originating article. Preview links select the native editor and keep the CMS frame open. Preparing advice explains its archive-only publication state. Native caption links are consistent across all photo captions.
Loading failure has a visible retry action, failed publishing preserves the open draft and permits another save, and failed logout has a visible retry without clearing the session prematurely. The resilience check covers 16 chapters, long multilingual text, keyboard navigation, links, Escape and leaving an article during an operation. Protected publishing tests cover failed save, successful retry, failed boot and failed logout. No content or access permissions are changed. Existing mobile Campi policy and design remain in effect. The detector was invoked once for this continuation and reported no findings.

## October 7: fields without an introductory layer
The user's explicit correction supersedes all earlier studio, navigation and writing-assistant rules for Campi. Campi starts at the native title field. Studio branding and greeting, statistics, export shortcut, sticky step navigation, first-time guide, narrative section headings, writing prompts and publication checklist are removed from the source, including their unused styles and read-only text serialization. Brief native field hints explain output rather than prescribing a writing voice. Native fields, formatting, media, Save, phone preview, field/preview synchronization and conditional advice controls remain authoritative.
Desktop and phone screenshots were inspected as one batch. Updated functional checks use native scrolling rather than removed product shortcuts; they verify saving, article types, preview, page mode and the protected publishing flow. No new visual world is introduced.

## October 7: open native chapters with three defaults
The user now requests expanded chapters in Campi and three starter chapters for every new article, with free addition/removal. Native list configuration sets collapsed and minimize_collapsed false, and defines three empty objects as new-entry defaults. No minimum or maximum is introduced; existing article data is unchanged. Dedicated checks prove existing chapters open without dirtying the article, three empty new chapters, unrestricted addition/removal including all chapters on desktop and phone. Protected publishing persists three completed chapters, while page creation removes unused defaults and publishes a complete article.

## 7 ottobre: copertina, articolo e capitoli continui
La richiesta attuale sostituisce l’impostazione precedente con capitoli aperti: i capitoli non presentano alcuna scatola richiudibile. Campi e Pagina distinguono Copertina e Articolo, con anteprime collegate allo stesso modello CMS nativo. Copertina resta la foto di slideshow/archivio; Articolo sceglie Sì/No per riutilizzarla come prima foto. I tag sono relazioni a un registro persistente condiviso, creati dal campo Tag e salvati atomicamente con l’articolo; cliccare un tag nel sito filtra racconti e consigli. Nessuna seconda bozza o accesso a store privati.


## 7 ottobre: categorie, colore del titolo e un capitolo iniziale
L’ultima richiesta sostituisce i tre capitoli iniziali con uno, liberamente aggiungibile o rimovibile. Categoria usa lo stesso registro persistente e le stesse relazioni native di Tag; il collegamento pubblico filtra sia racconti sia consigli. Il colore dei dettagli non appare più in Aspetto: il titolo permette di selezionare parole e applicare un colore, con anteprima immediata. Il controllo del titolo è registrato tramite l’API pubblica CMS.registerFieldType e aggiorna direttamente onChange del campo CMS; validazione e Salva rimangono quelli del CMS, senza bozza parallela o store privati. Questa eccezione al precedente titolo richtext risponde alla richiesta esplicita del colore inline. Il formato salvato consente soltanto grassetto, corsivo e span con colore esadecimale validato; la compatibilità dei titoli precedenti resta intatta. Verifiche isolate coprono Campi desktop/telefono, Pagina con colore personalizzato, salvataggio/riapertura, rimozione formato, categorie riutilizzabili, pubblicazione protetta e filtri pubblici. Il controllo visivo usa una sola coppia di schermate desktop/telefono.


## 7 ottobre: rimozione esplicita del colore
Il titolo offre Nessun colore per rimuovere soltanto il colore della selezione, mantenendo grassetto e corsivo. La serializzazione normalizza i colori annidati per parti di parola; Annulla usa la cronologia nativa del browser. I precedenti accenti del titolo vengono presentati nel campo attraverso la proprietà entry dell’API pubblica CMS, senza rendere la voce modificata alla sola apertura. Un reset esplicito resta riconoscibile anche quando ripristina il testo originale, evitando la ricomparsa dell’accento nascosto. Il corsivo nei titoli ora eredita il colore normale; solo gli accenti precedenti ancora intatti usano la loro classe specifica. Verificate rimozione parziale e totale, Annulla, accenti precedenti, salvataggio e riapertura a 1440 e 390 px; verifica pubblica del corsivo e del grassetto senza colore. Correzione preparata in worktree isolato per preservare altre modifiche locali contemporanee.

## 7 ottobre: operazioni durante la scrittura
Riordino, aggiunta e rimozione nei capitoli e nella galleria attendono la serializzazione del testo appena inserito, usando la stessa attesa limitata già prevista per Salva. I controlli vengono ritrovati nella lista corrente perché il CMS può ricrearli. Un cambio a Campi durante la creazione di un capitolo annulla la successiva apertura del controllo sulla pagina; il focus torna ai controlli visibili. Il formato dell’anteprima resta coerente dopo il ridimensionamento e Incolla nel titolo usa la selezione corrente. Otto controlli isolati verificano conservazione del testo, didascalie, riordino da tastiera, cambio modalità e testo incollato, insieme alle verifiche esistenti desktop e telefono.

## 7 ottobre: semplificazione dei controlli e lavoro ripetuto
I pannelli contestuali mostrano soltanto il titolo del campo e Fine: rimossi la seconda azione di chiusura, l’intestazione generica Articolo e il messaggio duplicato sulla bozza. Le foto usano un pannello alto al massimo 380 px, lasciando visibile più articolo. Il suggerimento di modifica resta annunciato alle tecnologie assistive, senza coprire i controlli. L’altezza della barra viene aggiornata quando cambia dimensione, anziché riletta a ogni modifica del DOM; solo i controlli potenzialmente relativi alla cronologia vengono esaminati. Su una bozza isolata di 16 capitoli, l’apertura della stessa foto passa da 348 a 3–4 controlli esaminati e da 5 a 2 letture della barra. I test condividono gli articoli campione identificati per id, così nuove pubblicazioni e cambi nell’ordine dell’archivio non alterano le verifiche.
Su telefono la scelta di una prima foto indipendente aggiorna subito la visibilità dei campi, anche senza aprire l’anteprima. Tipo di articolo e riuso della copertina vengono letti dai controlli nativi con un solo aggiornamento condiviso; il controllo su telefono verifica anche il cambio da tastiera e il passaggio tra Copertina e Articolo attraverso l’anteprima nativa.
