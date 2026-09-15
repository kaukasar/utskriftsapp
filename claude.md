Skapa en prototyp enligt följande specifikation. Prototypen (webb baserad frontend) ska endast användas i demosyfte likt interaktiva wireframes. Bygg inget backend, använd endast mockar så att användaren kan få prova på applikationen och dess features.



Kravspecifkation och flöde:

1. Handläggaren tar fram en PDF fil av det brevet som denne vill skicka ut. Filen ska läsas in av applikationen. Det ska synas att det har lagts till en fil och dess filnamn. En kontroll ska göras att filen som laddas upp är en pdf fil, annars visas ett lämpligt felmeddelande. Det ska endast vara möjligt att ha en enda uppladdad fil åt gången.

2\. Handläggaren anger personnumret för den sökande som ska ha brevet eller kundnummer för den anordnare som ska ha brevet.

3\. Namn och adress visas upp för den parten som brevet ska skickas ut till. 

4\. Handläggaren fyller i en beskrivning av syftet med detta utskick och klickar för att gå vidare. Beskrivningsfältet får inte lämnas tomt.

5\. Handläggaren kommer till en förhandsgransknings vy där brevet syns i sin helhet. Om allt ser bra ut kan handläggaren gå vidare till att skicka, om inte kan handläggaren välja gå tillbaka och ta bort det uppladdade brevet och ladda upp ett nytt. Applikationen kommer ej innehålla någon redigeringsmöjlighet av de uppladdade breven.

Handläggaren väljer att skicka brevet efter förhandsgranskningen, som går till utskrivningscentralen för behandling. Då ska även följande hända:



&#x20;   \* Daganteckning skapas automatiskt för arbesssökande eller anordnare som har valts. Detta visas genom ett lämpligt meddelande.



&#x20;   \* Brevet som skickats ut diarieförs automatiskt i arbetssökandes eller anordnarens diarieakt. Detta visas genom ett lämpligt meddelande.



&#x20;   \* En bekräftelse visas för användaren att utskicket har gjorts framgångsrik. I sammanfattningen syns brevets namn och uppgifter on den sökande eller anordnare som har fått brevet.



Skapa följande testdata:

Arbetssökande: Joakim VonAnka, Valvgatan 28, 16556 Ankeborg. Personnummer 199901017777

Anordnare: Joakims Bank AB, Penninggatan 36, 43572 Ankestad. Anordnarnummer 666777



Om användaren anger något annat personnummer eller anordnarnummer än dessa ska lämpligt felmeddelande visas då (uppgiften inte finns).

