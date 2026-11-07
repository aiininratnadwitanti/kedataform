/**
 * Registry paste (Ctrl+V) global untuk lampiran AI.
 *
 * Listener dipasang di level document sehingga gambar/dokumen yang ditempel
 * tetap tertangkap walau fokus keyboard tidak berada di dalam panel/modal.
 * Handler yang aktif adalah yang terakhir terdaftar (paling atas) — jadi panel
 * dashboard dan modal AI tidak memproses lampiran yang sama dua kali.
 */
type PasteFilesHandler = (files: File[]) => void;

const handlers: PasteFilesHandler[] = [];
let listenerAttached = false;

function readFilesFromClipboard(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const files: File[] = [];
  if (dt.files && dt.files.length) {
    files.push(...Array.from(dt.files));
  } else if (dt.items) {
    for (const item of Array.from(dt.items)) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
  }
  return files;
}

function handleDocumentPaste(e: ClipboardEvent) {
  const handler = handlers[handlers.length - 1];
  if (!handler) return;
  const files = readFilesFromClipboard(e.clipboardData);
  if (files.length) {
    e.preventDefault();
    handler(files);
  }
}

function attach() {
  if (listenerAttached || handlers.length === 0) return;
  document.addEventListener('paste', handleDocumentPaste);
  listenerAttached = true;
}

function detachIfIdle() {
  if (!listenerAttached || handlers.length > 0) return;
  document.removeEventListener('paste', handleDocumentPaste);
  listenerAttached = false;
}

/** Daftarkan handler paste; mengembalikan fungsi untuk melepasnya. */
export function registerAiPasteHandler(handler: PasteFilesHandler): () => void {
  handlers.push(handler);
  attach();
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
    detachIfIdle();
  };
}
