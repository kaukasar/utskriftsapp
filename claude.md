Skapa en prototyp enligt följande specifikation. Prototypen (webb baserad frontend) ska endast användas i demosyfte likt interaktiva wireframes. Bygg inget backend, använd endast mockar så att användaren kan få prova på applikationen och dess features.

Applikationen heter "Digitala Utskick" och namnet visas i sidhuvudets vänstra hörn.



Kravspecifkation och flöde:

1. Handläggaren tar fram en PDF fil av det brevet som denne vill skicka ut. Filen ska läsas in av applikationen. Det ska synas att det har lagts till en fil och dess filnamn. En kontroll ska göras att filen som laddas upp är en pdf fil, annars visas ett lämpligt felmeddelande. Det ska endast vara möjligt att ha en enda uppladdad fil åt gången.

2\. Handläggaren väljer mottagartyp: Arbetssökande, Arbetsgivare eller Extern mottagare. För arbetssökande anges personnumret och för arbetsgivare kundnumret (arbetsgivarnummer), och uppgifterna hämtas med knappen "Hämta uppgifter". För en extern mottagare finns inget uppslag. I stället visas ett formulär där handläggaren fyller i Förnamn, Efternamn, Postadress, Postnummer, Postort och Personnummer. Alla sex fält är obligatoriska, personnumret ska vara 12 siffror och postnumret 5 siffror.

3\. Uppgifter visas upp för den parten som brevet ska skickas ut till. De enda uppgifter som får visas i applikationen är personnummer/arbetsgivarnummer, namn och ort. Gatunamn, gatunummer och postnummer ska inte visas någonstans, varken vid uppslaget, i förhandsgranskningen eller i bekräftelsen. Undantaget är en extern mottagare: den adress som handläggaren fyllt i (postadress, postnummer och postort) visas i förhandsgranskningen, där det också framgår att mottagaren är en "extern mottagare". I bekräftelsen visas den inte (där visas namn, ort och personnummer). Om mottagaren är en arbetssökande visas även en informationsrad med texten "Informationen är hämtad från sökandeblanketten".

4\. Om mottagaren är en arbetssökande fyller handläggaren i en beskrivning av syftet med detta utskick och klickar för att gå vidare. Beskrivningsfältet får inte lämnas tomt. Delen "Syfte med utskicket" finns endast för arbetssökande och ska döljas helt (och inte kontrolleras) när Arbetsgivare eller Extern mottagare är vald.

5\. Handläggaren kommer till en förhandsgransknings vy där brevet syns i sin helhet. Om allt ser bra ut kan handläggaren gå vidare till att skicka, om inte kan handläggaren välja gå tillbaka och ta bort det uppladdade brevet och ladda upp ett nytt. Applikationen kommer ej innehålla någon redigeringsmöjlighet av de uppladdade breven.

Handläggaren väljer att skicka brevet efter förhandsgranskningen, som går till utskrivningscentralen för behandling. Då ska även följande hända:



&#x20;   \* Daganteckning skapas automatiskt, men endast om mottagaren är en arbetssökande. Detta visas genom ett lämpligt meddelande. Daganteckningen innehåller syftet med utskicket samt utskickets ID (för felsökning). Brevets filnamn ska inte stå i daganteckningen. För arbetsgivare och externa mottagare skapas ingen daganteckning, och då visas inte heller något meddelande, någon daganteckningsruta eller något syfte i förhandsgranskningen, under skickandet eller i bekräftelsen.

Applikationen diarieför inte brevet. Det finns ingen diarieföring, inga diariemeddelanden och inga diarieuppgifter någonstans i applikationen.



&#x20;   \* En bekräftelse visas för användaren att utskicket har gjorts framgångsrik. I sammanfattningen syns brevets namn och uppgifter om den sökande, arbetsgivare eller externa mottagare som har fått brevet.



Skapa följande testdata:

Arbetssökande: Joakim VonAnka, Valvgatan 28, 16556 Ankeborg. Personnummer 199901017777

Arbetsgivare: Joakims Bank AB, Penninggatan 36, 43572 Ankestad. Arbetsgivarnummer 666777



Om användaren anger något annat personnummer eller arbetsgivarnummer än dessa ska lämpligt felmeddelande visas då (uppgiften inte finns).

