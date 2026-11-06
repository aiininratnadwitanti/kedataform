declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: Record<string, (...args: any[]) => void>) => void;
    };
  }
}

let currentKey = '';

export function loadSnap(scriptUrl: string, clientKey: string): Promise<NonNullable<Window['snap']>> {
  return new Promise((resolve, reject) => {
    if (window.snap && currentKey === clientKey) {
      resolve(window.snap);
      return;
    }

    const existing = document.getElementById('midtrans-snap') as HTMLScriptElement | null;
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'midtrans-snap';
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => {
      currentKey = clientKey;
      if (window.snap) resolve(window.snap);
      else reject(new Error('Snap.js gagal dimuat'));
    };
    script.onerror = () => reject(new Error('Snap.js gagal dimuat'));
    document.body.appendChild(script);
  });
}
