# Pace Studio — Running Analytics

Dashboard HTML / CSS / JavaScript senza dipendenze di runtime.

## Avvio

Apri `index.html` nel browser oppure, da VS Code, usa **Live Server**. La foto deve restare in `assets/running-shoes.png`.

## Funzionalità

- Hero fotografica con parallax/perspective CSS 3D al movimento del mouse (non è un modello 3D delle singole scarpe).
- Dashboard adattiva, grafico SVG delle andature, corsa più lunga e più veloce, confronto percentuale su distanze identiche.
- Aggiunta ed eliminazione corse, persistenza tramite `localStorage`, pulsante di ripristino dati di esempio.
- `durata` interna in **secondi**, `distanza` in **chilometri**. `passoMedio` del report in **secondi per chilometro**, visualizzato come `min:ss /km`.
- Report miglioramento: confronta prima e ultima corsa della stessa distanza, ordinate per data. Positivo = più veloce; negativo = più lento; zero = invariato. Con meno di due corse della stessa distanza restituisce `null`.

## Note

La foto originale fornita è un'immagine raster 2D: il parallax aggiunge profondità visiva ma non ricostruisce un oggetto 3D rotabile. Per un vero modello 3D serve un file `.glb`/`.gltf` o una ricostruzione 3D dedicata.

Font caricati da Google Fonts solo se è disponibile la connessione; in assenza di rete restano i font di sistema.
