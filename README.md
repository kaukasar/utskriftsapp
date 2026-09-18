# Brevutskick – prototyp

Klickbar prototyp (interaktiv wireframe) för att skicka ut ett brev till en arbetssökande eller en arbetsgivare.
Allt körs i webbläsaren – det finns ingen backend, all data är mockad och inga brev skickas på riktigt.

## Starta

Öppna `index.html` i Edge eller Chrome (dubbelklicka på filen). Ingen installation eller byggsteg behövs.

> Förhandsgranskningen ritar upp PDF:en med PDF.js som hämtas från cdnjs.cloudflare.com.
> Saknas internetanslutning används webbläsarens inbyggda PDF-visare i stället.

## Testdata

| Typ           | Namn            | Adress                          | Nummer                          |
|---------------|-----------------|---------------------------------|---------------------------------|
| Arbetssökande | Joakim VonAnka  | Valvgatan 28, 16556 Ankeborg    | Personnummer `199901017777`     |
| Arbetsgivare  | Joakims Bank AB | Penninggatan 36, 43572 Ankestad | Arbetsgivarnummer `666777`      |

Alla andra nummer ger felmeddelandet att uppgiften inte finns.

## Testfiler (`testfiler/`)

| Fil | Används för |
|-----|-------------|
| `Kallelse_planeringssamtal_Joakim_VonAnka.pdf` | Giltigt brev (2 sidor) till den arbetssökande |
| `Begaran_komplettering_Joakims_Bank_AB.pdf` | Giltigt brev (1 sida) till arbetsgivaren |
| `inte-en-pdf.txt` | Fel filtyp – visar felmeddelande |
| `falsk-pdf.pdf` | Heter .pdf men är inte en PDF – visar felmeddelande |

## Demoflöde

1. **Brev** – dra och släpp eller välj en PDF. Filnamn och storlek visas. Filen kontrolleras både på filändelse
   och innehåll (PDF-signatur). Endast en fil åt gången; vill man byta tar man bort den först.
2. **Mottagare** – välj *Arbetssökande* eller *Arbetsgivare*, ange personnummer/arbetsgivarnummer och klicka
   *Hämta uppgifter* (eller Enter).
3. Namn och adress för mottagaren visas. För arbetssökande visas även en rad om att informationen är
   hämtad från sökandeblanketten.
4. **Syfte** – fyll i beskrivningen (får inte vara tom) och klicka *Gå vidare till förhandsgranskning*.
5. **Förhandsgranska** – hela brevet visas sida för sida tillsammans med mottagare och syfte.
   Välj *Skicka brevet*, *Tillbaka* eller *Ta bort brevet och ladda upp ett nytt*. Brevet kan inte redigeras.
6. **Skickat** – brevet går till utskrivningscentralen, en daganteckning skapas och brevet diarieförs
   (visas både som notiser och i bekräftelsen). Sammanfattningen visar brevets namn och mottagarens uppgifter.

## Filer

| Fil | Innehåll |
|-----|----------|
| `index.html` | Vyer: uppgifter, förhandsgranskning, skickar, bekräftelse |
| `styles.css` | Utseende och responsiv layout |
| `app.js` | Flöde, validering, PDF-förhandsgranskning |
| `mockdata.js` | Mockat API: testdata, uppslag av mottagare, utskrivningscentral, daganteckning, diarieföring |
