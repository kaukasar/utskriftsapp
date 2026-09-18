/*
 * Mockad "backend" för prototypen. Inga anrop lämnar webbläsaren –
 * fördröjningarna finns bara för att demon ska kännas som ett riktigt system.
 */
(() => {
  'use strict';

  const JOBSEEKERS = [
    { id: '199901017777', name: 'Joakim VonAnka', street: 'Valvgatan 28', postalCode: '16556', city: 'Ankeborg' },
  ];

  const ORGANIZERS = [
    { id: '666777', name: 'Joakims Bank AB', street: 'Penninggatan 36', postalCode: '43572', city: 'Ankestad' },
  ];

  const CURRENT_USER = 'Handläggare Demo';

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

  window.MockApi = {
    currentUser: CURRENT_USER,

    /** Slår upp arbetssökande (personnummer) eller arbetsgivare (arbetsgivarnummer). Returnerar null om uppgiften saknas. */
    async lookupRecipient(type, id) {
      await delay(600);
      const register = type === 'jobseeker' ? JOBSEEKERS : ORGANIZERS;
      const match = register.find((r) => r.id === id);
      return match ? { ...match } : null;
    },

    /** Skickar brevet till utskrivningscentralen. */
    async sendToPrintCenter({ fileName }) {
      await delay(1000);
      const now = new Date();
      return {
        shipmentId: `UTS-${now.getFullYear()}-${randomDigits(6)}`,
        fileName,
        sentAt: now,
        status: 'Mottaget av utskrivningscentralen',
      };
    },

    /** Skapar en daganteckning på den arbetssökande eller arbetsgivaren. */
    async createDayNote({ recipient, fileName, description }) {
      await delay(800);
      return {
        id: `DA-${randomDigits(7)}`,
        createdAt: new Date(),
        heading: 'Brev skickat',
        text: `Brevet ”${fileName}” har skickats till ${recipient.name} via utskrivningscentralen.\nSyfte: ${description}`,
        author: CURRENT_USER,
      };
    },

    /** Diarieför det skickade brevet i mottagarens diarieakt. */
    async registerInCaseFile({ recipient, fileName }) {
      await delay(800);
      const now = new Date();
      return {
        diaryNumber: `Dnr ${now.getFullYear()}/${randomDigits(6)}`,
        documentNumber: String(Math.floor(Math.random() * 40) + 2),
        documentType: 'Utgående brev',
        title: fileName,
        recipientName: recipient.name,
        registeredAt: now,
      };
    },
  };
})();
