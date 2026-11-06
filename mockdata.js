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

    /**
     * Skapar en daganteckning på den arbetssökande eller arbetsgivaren.
     * Utskicks-ID tas med för spårbarhet vid felsökning.
     */
    async createDayNote({ recipient, description, shipmentId }) {
      await delay(800);
      return {
        id: `DA-${randomDigits(7)}`,
        createdAt: new Date(),
        heading: 'Brev skickat',
        text: `Brevet har skickats till ${recipient.name} via utskrivningscentralen.\nSyfte: ${description}\nUtskicks-ID: ${shipmentId}`,
        author: CURRENT_USER,
      };
    },
  };
})();
