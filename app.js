(() => {
  'use strict';

  // PDF.js (laddas från CDN) används för att rita upp brevet. Saknas nätverk
  // faller förhandsgranskningen tillbaka på webbläsarens inbyggda PDF-visare.
  const PDFJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  const MAX_DESCRIPTION = 500;

  const RECIPIENT_TYPES = {
    jobseeker: {
      label: 'Arbetssökande',
      idLabel: 'Personnummer',
      idHelp: '12 siffror, ÅÅÅÅMMDDNNNN',
      placeholder: 'ÅÅÅÅMMDD-NNNN',
      missingId: 'Ange personnummer för den arbetssökande som ska få brevet.',
      caseFile: 'den arbetssökandes diarieakt',
    },
    organizer: {
      label: 'Anordnare',
      idLabel: 'Anordnarnummer',
      idHelp: 'Anordnarens kundnummer, endast siffror',
      placeholder: 't.ex. 123456',
      missingId: 'Ange anordnarnummer för den anordnare som ska få brevet.',
      caseFile: 'anordnarens diarieakt',
    },
  };

  const state = {
    file: null,
    fileBytes: null,
    fileUrl: null,
    pageCount: null,
    recipientType: 'jobseeker',
    recipient: null,
    lookupToken: 0,
    lookingUp: false,
    description: '',
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    form: $('letter-form'),
    fileInput: $('file-input'),
    dropzone: $('dropzone'),
    chooseBtn: $('choose-btn'),
    fileCard: $('file-card'),
    fileName: $('file-name'),
    fileSub: $('file-sub'),
    fileRemove: $('file-remove'),
    fileError: $('file-error'),
    idLabel: $('id-label'),
    idHelp: $('id-help'),
    idInput: $('id-input'),
    lookupBtn: $('lookup-btn'),
    idError: $('id-error'),
    recipientCard: $('recipient-card'),
    descInput: $('desc-input'),
    descCount: $('desc-count'),
    descError: $('desc-error'),
    formError: $('form-error'),
    previewFilename: $('preview-filename'),
    previewPages: $('preview-pages'),
    previewSummary: $('preview-summary'),
    pdfViewer: $('pdf-viewer'),
    sendBtn: $('send-btn'),
    backBtn: $('back-btn'),
    replaceBtn: $('replace-btn'),
    progressList: $('progress-list'),
    doneLead: $('done-lead'),
    daynoteCard: $('daynote-card'),
    diaryCard: $('diary-card'),
    doneSummary: $('done-summary'),
    newBtn: $('new-btn'),
    toasts: $('toasts'),
  };

  // ---------------------------------------------------------------- Hjälpfunktioner

  /** Skapar ett DOM-element. Text sätts alltid som textnoder (ingen innerHTML). */
  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} byte`;
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
    return `${(bytes / (1024 * 1024)).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} MB`;
  }

  function formatDateTime(date) {
    return `${date.toLocaleDateString('sv-SE')} kl. ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function formatId(type, id) {
    return type === 'jobseeker' && id.length === 12 ? `${id.slice(0, 8)}-${id.slice(8)}` : id;
  }

  const pagesText = (n) => (n === 1 ? '1 sida' : `${n} sidor`);
  const addressLines = (r) => [r.street, h('br'), `${r.postalCode} ${r.city}`];

  function showFieldError(errorEl, message, input) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(errorEl, input) {
    errorEl.hidden = true;
    errorEl.textContent = '';
    if (input) input.removeAttribute('aria-invalid');
    if (els.fileError.hidden && els.idError.hidden && els.descError.hidden) els.formError.hidden = true;
  }

  /** Bygger en <dl> med rader [rubrik, värde, extraklass]. */
  function fillSummary(dl, rows) {
    dl.replaceChildren(
      ...rows.map(([term, value, cls]) => h('div', { class: cls && cls.includes('span-2') ? 'span-2' : null },
        h('dt', null, term),
        h('dd', { class: cls ? cls.replace('span-2', '').trim() || null : null }, value)))
    );
  }

  function toast(kind, title, text) {
    const node = h('div', { class: `toast toast-${kind}`, role: 'status' },
      h('div', { class: 'toast-icon', 'aria-hidden': 'true' }, kind === 'success' ? '✓' : 'i'),
      h('div', { class: 'toast-body' }, h('strong', null, title), h('div', null, text)),
      h('button', { type: 'button', class: 'toast-close', 'aria-label': 'Stäng meddelande', onclick: () => dismiss() }, '×'));
    els.toasts.append(node);
    const timer = setTimeout(dismiss, 7000);
    function dismiss() {
      clearTimeout(timer);
      node.classList.add('is-leaving');
      setTimeout(() => node.remove(), 200);
    }
  }

  // ---------------------------------------------------------------- Vyer

  const VIEWS = ['form', 'preview', 'sending', 'done'];

  function showView(name, focusEl) {
    for (const view of VIEWS) $(`view-${view}`).hidden = view !== name;
    const current = { form: 0, preview: 1, sending: 2, done: 2 }[name];
    document.querySelectorAll('.stepper li').forEach((li, i) => {
      const complete = i < current || name === 'done';
      li.classList.toggle('is-complete', complete);
      li.classList.toggle('is-current', i === current && !complete);
      if (i === current) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    (focusEl || document.querySelector(`#view-${name} h1`)).focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- 1. Uppladdning av brev

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    clearFieldError(els.fileError);

    if (state.file) {
      showFieldError(els.fileError, 'Det finns redan ett uppladdat brev. Ta bort det innan du laddar upp ett nytt.');
      return;
    }
    if (fileList.length > 1) {
      showFieldError(els.fileError, `Du försökte ladda upp ${fileList.length} filer. Det går bara att ladda upp en fil åt gången.`);
      return;
    }

    const file = fileList[0];
    const result = await readPdf(file);
    if (result.error) {
      showFieldError(els.fileError, result.error);
      return;
    }
    setFile(file, result.bytes);
  }

  /** Kontrollerar att filen är en PDF: filändelse + att innehållet börjar med PDF-signaturen "%PDF-". */
  async function readPdf(file) {
    const name = file.name;
    if (!/\.pdf$/i.test(name)) {
      return { error: `Filen ”${name}” är inte en PDF-fil. Endast PDF-filer kan laddas upp.` };
    }
    if (file.size === 0) {
      return { error: `Filen ”${name}” är tom. Välj en annan PDF-fil.` };
    }
    const bytes = await file.arrayBuffer();
    const head = new TextDecoder('latin1').decode(bytes.slice(0, 1024));
    if (!head.includes('%PDF-')) {
      return { error: `Filen ”${name}” är inte en giltig PDF-fil, trots filändelsen .pdf. Välj en annan fil.` };
    }
    return { bytes };
  }

  function setFile(file, bytes) {
    state.file = file;
    state.fileBytes = bytes;
    state.fileUrl = URL.createObjectURL(file);
    state.pageCount = null;
    els.fileName.textContent = file.name;
    els.fileSub.textContent = `PDF-dokument · ${formatSize(file.size)}`;
    els.dropzone.hidden = true;
    els.fileCard.hidden = false;
    els.fileInput.value = '';
  }

  function removeFile() {
    if (state.fileUrl) URL.revokeObjectURL(state.fileUrl);
    state.file = null;
    state.fileBytes = null;
    state.fileUrl = null;
    state.pageCount = null;
    els.fileInput.value = '';
    els.fileCard.hidden = true;
    els.dropzone.hidden = false;
    clearFieldError(els.fileError);
  }

  els.chooseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.fileInput.click();
  });
  els.dropzone.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', () => handleFiles(els.fileInput.files));
  els.fileRemove.addEventListener('click', () => {
    const name = state.file ? state.file.name : '';
    removeFile();
    els.chooseBtn.focus();
    toast('info', 'Brevet har tagits bort', `”${name}” är borttaget. Du kan nu ladda upp ett nytt brev.`);
  });

  ['dragenter', 'dragover'].forEach((type) => els.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    els.dropzone.classList.add('is-dragover');
  }));
  ['dragleave', 'dragend'].forEach((type) => els.dropzone.addEventListener(type, () => els.dropzone.classList.remove('is-dragover')));
  els.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.dropzone.classList.remove('is-dragover');
    handleFiles(e.dataTransfer && e.dataTransfer.files);
  });
  // Filer som släpps utanför uppladdningsytan ska inte öppnas av webbläsaren,
  // men hanteras som en uppladdning om formuläret visas.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!$('view-form').hidden && e.dataTransfer && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });

  // ---------------------------------------------------------------- 2–3. Mottagare

  function setRecipientType(type) {
    const cfg = RECIPIENT_TYPES[type];
    state.recipientType = type;
    els.idLabel.textContent = cfg.idLabel;
    els.idHelp.textContent = cfg.idHelp;
    els.idInput.placeholder = cfg.placeholder;
    els.idInput.value = '';
    invalidateRecipient();
    clearFieldError(els.idError, els.idInput);
  }

  function invalidateRecipient() {
    state.lookupToken++;
    state.recipient = null;
    setLookupBusy(false);
    els.recipientCard.hidden = true;
    els.recipientCard.replaceChildren();
  }

  function setLookupBusy(busy) {
    state.lookingUp = busy;
    els.lookupBtn.disabled = busy;
    els.lookupBtn.replaceChildren(...(busy ? [h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Hämtar…'] : ['Hämta uppgifter']));
  }

  const normalizeId = (raw) => raw.replace(/[\s-]/g, '');

  async function lookupRecipient() {
    const type = state.recipientType;
    const cfg = RECIPIENT_TYPES[type];
    const id = normalizeId(els.idInput.value);

    invalidateRecipient();

    let formatError = null;
    if (!id) formatError = cfg.missingId;
    else if (type === 'jobseeker' && !/^\d{12}$/.test(id)) formatError = 'Personnumret ska anges med 12 siffror, ÅÅÅÅMMDDNNNN (t.ex. 19990101-7777).';
    else if (type === 'organizer' && !/^\d+$/.test(id)) formatError = 'Anordnarnumret får bara innehålla siffror.';
    if (formatError) {
      showFieldError(els.idError, formatError, els.idInput);
      els.idInput.focus();
      return;
    }

    clearFieldError(els.idError, els.idInput);
    const token = state.lookupToken;
    setLookupBusy(true);
    const record = await window.MockApi.lookupRecipient(type, id);
    if (token !== state.lookupToken) return; // Inmatningen har ändrats under tiden.
    setLookupBusy(false);

    if (!record) {
      showFieldError(els.idError,
        `Uppgiften finns inte. Det finns ingen ${cfg.label.toLowerCase()} med ${cfg.idLabel.toLowerCase()} ${formatId(type, id)}. Kontrollera numret och försök igen.`,
        els.idInput);
      els.idInput.focus();
      return;
    }

    state.recipient = { ...record, type };
    renderRecipient();
  }

  function renderRecipient() {
    const r = state.recipient;
    const cfg = RECIPIENT_TYPES[r.type];
    els.recipientCard.replaceChildren(
      h('div', { class: 'recipient-head' },
        h('span', { class: 'badge' }, cfg.label),
        h('span', { class: 'found' }, '✓ Mottagare hittad')),
      h('dl', { class: 'kv' },
        h('dt', null, 'Namn'), h('dd', { id: 'recipient-name' }, r.name),
        h('dt', null, 'Adress'), h('dd', { id: 'recipient-address' }, addressLines(r)),
        h('dt', null, cfg.idLabel), h('dd', null, formatId(r.type, r.id))));
    els.recipientCard.hidden = false;
  }

  document.querySelectorAll('input[name="recipient-type"]').forEach((radio) => {
    radio.addEventListener('change', () => { if (radio.checked) setRecipientType(radio.value); });
  });
  els.lookupBtn.addEventListener('click', lookupRecipient);
  els.idInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupRecipient();
    }
  });
  els.idInput.addEventListener('input', () => {
    if (state.recipient || state.lookingUp) invalidateRecipient();
    if (!els.idError.hidden) clearFieldError(els.idError, els.idInput);
  });

  // ---------------------------------------------------------------- 4. Beskrivning och validering

  function updateCharCount() {
    els.descCount.textContent = `${els.descInput.value.length} / ${MAX_DESCRIPTION} tecken`;
  }

  els.descInput.addEventListener('input', () => {
    updateCharCount();
    if (els.descInput.value.trim() && !els.descError.hidden) clearFieldError(els.descError, els.descInput);
  });

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalid = [];

    if (!state.file) {
      if (els.fileError.hidden) showFieldError(els.fileError, 'Ladda upp brevet som ska skickas (PDF-fil).');
      invalid.push(els.chooseBtn);
    } else {
      clearFieldError(els.fileError);
    }

    if (!state.recipient) {
      const cfg = RECIPIENT_TYPES[state.recipientType];
      if (state.lookingUp) showFieldError(els.idError, 'Vänta tills mottagarens uppgifter har hämtats.', els.idInput);
      else if (!normalizeId(els.idInput.value)) showFieldError(els.idError, cfg.missingId, els.idInput);
      else if (els.idError.hidden) showFieldError(els.idError, 'Klicka på ”Hämta uppgifter” för att visa mottagarens namn och adress innan du går vidare.', els.idInput);
      invalid.push(els.idInput);
    }

    if (!els.descInput.value.trim()) {
      showFieldError(els.descError, 'Beskriv syftet med utskicket. Fältet får inte lämnas tomt.', els.descInput);
      invalid.push(els.descInput);
    }

    if (invalid.length) {
      els.formError.textContent = invalid.length === 1
        ? 'En uppgift saknas eller är felaktig. Se det markerade fältet ovan.'
        : `${invalid.length} uppgifter saknas eller är felaktiga. Se de markerade fälten ovan.`;
      els.formError.hidden = false;
      invalid[0].focus();
      return;
    }

    els.formError.hidden = true;
    state.description = els.descInput.value.trim();
    openPreview();
  });

  // ---------------------------------------------------------------- 5. Förhandsgranskning

  let pdfjsPromise = null;
  function loadPdfJs() {
    if (!pdfjsPromise) {
      pdfjsPromise = new Promise((resolve) => {
        if (window.pdfjsLib) return resolve(window.pdfjsLib);
        const script = document.createElement('script');
        const timer = setTimeout(() => resolve(null), 10000);
        script.src = `${PDFJS_BASE}pdf.min.js`;
        script.async = true;
        script.onload = () => {
          clearTimeout(timer);
          if (!window.pdfjsLib) return resolve(null);
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}pdf.worker.min.js`;
          resolve(window.pdfjsLib);
        };
        script.onerror = () => { clearTimeout(timer); resolve(null); };
        document.head.append(script);
      });
    }
    return pdfjsPromise;
  }

  function renderPreviewSummary() {
    const r = state.recipient;
    const cfg = RECIPIENT_TYPES[r.type];
    fillSummary(els.previewSummary, [
      ['Brev', state.file.name],
      ['Mottagare', [r.name, ' ', h('span', { class: 'muted' }, `(${cfg.label.toLowerCase()})`)]],
      ['Adress', addressLines(r)],
      [cfg.idLabel, formatId(r.type, r.id)],
      ['Syfte med utskicket', state.description, 'pre'],
    ]);
  }

  function openPreview() {
    renderPreviewSummary();
    els.previewFilename.textContent = state.file.name;
    els.previewPages.textContent = state.pageCount ? pagesText(state.pageCount) : '';
    showView('preview');
    renderPdf();
  }

  let renderToken = 0;
  let currentDoc = null;
  let renderedWidth = 0;
  let resizeTimer = null;

  // Rita om sidorna om ytan ändrar bredd märkbart, så att texten förblir skarp.
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const canvasMode = els.pdfViewer.querySelector('canvas');
      if (!$('view-preview').hidden && state.file && canvasMode && Math.abs(els.pdfViewer.clientWidth - renderedWidth) > 40) renderPdf();
    }, 300);
  });

  async function renderPdf() {
    const token = ++renderToken;
    const viewer = els.pdfViewer;
    renderedWidth = viewer.clientWidth;
    viewer.replaceChildren(h('div', { class: 'viewer-status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Laddar förhandsgranskning…'));

    const pdfjs = await loadPdfJs();
    if (token !== renderToken || !state.file) return;

    if (pdfjs) {
      try {
        if (currentDoc) { currentDoc.destroy(); currentDoc = null; }
        const doc = await pdfjs.getDocument({ data: new Uint8Array(state.fileBytes.slice(0)) }).promise;
        if (token !== renderToken) { doc.destroy(); return; }
        currentDoc = doc;
        state.pageCount = doc.numPages;
        els.previewPages.textContent = pagesText(doc.numPages);

        const pages = h('div', { class: 'pdf-pages' });
        viewer.replaceChildren(pages);
        const cssWidth = Math.min(viewer.clientWidth - 40, 820);
        const ratio = window.devicePixelRatio || 1;

        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (token !== renderToken) return;
          const scale = (cssWidth / page.getViewport({ scale: 1 }).width) * ratio;
          const viewport = page.getViewport({ scale });
          const canvas = h('canvas', { width: Math.floor(viewport.width), height: Math.floor(viewport.height), role: 'img', 'aria-label': `Brevet, sida ${n} av ${doc.numPages}` });
          pages.append(h('figure', { class: 'pdf-page-wrap' }, canvas, h('figcaption', null, `Sida ${n} av ${doc.numPages}`)));
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
        return;
      } catch (err) {
        console.warn('PDF.js kunde inte visa brevet – använder webbläsarens PDF-visare.', err);
      }
    }

    if (token !== renderToken) return;
    viewer.replaceChildren(h('iframe', { class: 'pdf-native', src: `${state.fileUrl}#view=FitH`, title: `Förhandsgranskning av ${state.file.name}` }));
  }

  els.backBtn.addEventListener('click', () => {
    renderToken++;
    showView('form');
  });

  els.replaceBtn.addEventListener('click', () => {
    renderToken++;
    const name = state.file.name;
    removeFile();
    showView('form', els.chooseBtn);
    els.dropzone.scrollIntoView({ block: 'center' });
    toast('info', 'Brevet har tagits bort', `”${name}” är borttaget. Ladda upp ett nytt brev. Mottagare och beskrivning finns kvar.`);
  });

  // ---------------------------------------------------------------- Skicka

  function setProgress(step, status) {
    const li = els.progressList.querySelector(`[data-step="${step}"]`);
    li.classList.toggle('is-active', status === 'active');
    li.classList.toggle('is-done', status === 'done');
  }

  els.sendBtn.addEventListener('click', async () => {
    els.sendBtn.disabled = true;
    const recipient = state.recipient;
    const cfg = RECIPIENT_TYPES[recipient.type];
    const payload = { recipient, fileName: state.file.name, description: state.description };

    ['print', 'daynote', 'diary'].forEach((step) => setProgress(step, 'idle'));
    showView('sending');

    try {
      setProgress('print', 'active');
      const shipment = await window.MockApi.sendToPrintCenter(payload);
      setProgress('print', 'done');

      setProgress('daynote', 'active');
      const dayNote = await window.MockApi.createDayNote(payload);
      setProgress('daynote', 'done');
      toast('success', 'Daganteckning skapad', `En daganteckning har skapats automatiskt för ${recipient.name}.`);

      setProgress('diary', 'active');
      const diary = await window.MockApi.registerInCaseFile(payload);
      setProgress('diary', 'done');
      toast('success', 'Brevet har diarieförts', `Brevet har diarieförts i ${cfg.caseFile} (${diary.diaryNumber}).`);

      await delay(500);
      renderDone({ shipment, dayNote, diary });
      showView('done');
    } finally {
      els.sendBtn.disabled = false;
    }
  });

  // ---------------------------------------------------------------- Bekräftelse

  function renderDone({ shipment, dayNote, diary }) {
    const r = state.recipient;
    const cfg = RECIPIENT_TYPES[r.type];

    els.doneLead.textContent = `Brevet ”${state.file.name}” har skickats till utskrivningscentralen för behandling och kommer att skickas till ${r.name}.`;

    els.daynoteCard.replaceChildren(
      h('h2', null, h('span', { class: 'ok', 'aria-hidden': 'true' }, '✓'), 'Daganteckning skapad'),
      h('p', null, `En daganteckning har skapats automatiskt för ${r.name} (${cfg.label.toLowerCase()}).`),
      h('dl', { class: 'kv' },
        h('dt', null, 'Datum'), h('dd', null, formatDateTime(dayNote.createdAt)),
        h('dt', null, 'Rubrik'), h('dd', null, dayNote.heading),
        h('dt', null, 'Anteckning'), h('dd', { class: 'pre' }, dayNote.text),
        h('dt', null, 'Registrerad av'), h('dd', null, dayNote.author)));

    els.diaryCard.replaceChildren(
      h('h2', null, h('span', { class: 'ok', 'aria-hidden': 'true' }, '✓'), 'Brevet har diarieförts'),
      h('p', null, `Brevet har diarieförts automatiskt i ${cfg.caseFile}.`),
      h('dl', { class: 'kv' },
        h('dt', null, 'Diarienummer'), h('dd', null, diary.diaryNumber),
        h('dt', null, 'Handling nr'), h('dd', null, diary.documentNumber),
        h('dt', null, 'Handlingstyp'), h('dd', null, diary.documentType),
        h('dt', null, 'Handling'), h('dd', null, diary.title),
        h('dt', null, 'Diariefört'), h('dd', null, formatDateTime(diary.registeredAt))));

    fillSummary(els.doneSummary, [
      ['Brev', [state.file.name, state.pageCount ? h('span', { class: 'muted' }, ` (${pagesText(state.pageCount)})`) : null]],
      ['Status', shipment.status],
      ['Mottagare', r.name],
      ['Typ av mottagare', cfg.label],
      [cfg.idLabel, formatId(r.type, r.id)],
      ['Adress', addressLines(r)],
      ['Skickat', formatDateTime(shipment.sentAt)],
      ['Utskicks-ID', shipment.shipmentId],
      ['Syfte med utskicket', state.description, 'pre span-2'],
    ]);
  }

  els.newBtn.addEventListener('click', () => {
    removeFile();
    document.querySelector('input[name="recipient-type"][value="jobseeker"]').checked = true;
    setRecipientType('jobseeker');
    els.descInput.value = '';
    updateCharCount();
    clearFieldError(els.descError, els.descInput);
    state.description = '';
    showView('form');
  });

  // ---------------------------------------------------------------- Start

  els.descInput.maxLength = MAX_DESCRIPTION;
  updateCharCount();
  loadPdfJs(); // Förladda så att förhandsgranskningen går snabbt.
})();
