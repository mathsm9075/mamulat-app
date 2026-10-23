// Android entrypoint: load persistent app-private copies before initializing the existing UI.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const PREFIX = 'mamulat.v2.cats.';
const FIELDS = ['cfg', 'recs', 'stars', 'prefs', 'tas'];
const filePath = field => `state/${field}.json`;
const queues = new Map();

if (Capacitor.isNativePlatform()) {
  // Light tap feedback when an item is marked.
  window.__haptic = () => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); };

  // Android back button: close the open book/library first, exit only from the main screen.
  App.addListener('backButton', ({ canGoBack }) => { if (canGoBack) history.back(); else App.exitApp(); });

  // DOM localStorage is still the fast synchronous UI store. Android's private
  // Filesystem mirror can restore it if Android WebView storage is reclaimed.
  for (const field of FIELDS) {
    const key = PREFIX + field;
    if (localStorage.getItem(key) !== null) continue;
    try {
      const restored = await Filesystem.readFile({
        path: filePath(field), directory: Directory.Data, encoding: Encoding.UTF8
      });
      if (typeof restored.data === 'string') {
        JSON.parse(restored.data); // reject damaged state
        localStorage.setItem(key, restored.data);
      }
    } catch (e) {
      // First install or no mirrored data; the original app will initialize it.
    }
  }

  window.__nativePersist = (key, value) => {
    if (!key.startsWith(PREFIX)) return;
    const field = key.substring(PREFIX.length);
    if (!FIELDS.includes(field)) return;
    const serialized = JSON.stringify(value);
    // Serialize writes per field so rapid taps cannot race into an older state.
    const previous = queues.get(field) || Promise.resolve();
    const next = previous.catch(() => {}).then(() => Filesystem.writeFile({
      path: filePath(field), directory: Directory.Data,
      data: serialized, encoding: Encoding.UTF8, recursive: true
    }));
    queues.set(field, next);
    next.catch(e => console.error(`Could not persist ${field}`, e));
  };

  window.__nativeExportBackup = async (json, filename) => {
    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 100);
    // Write the JSON only into the app's cache, then open Android's share/save sheet.
    await Filesystem.writeFile({
      path: safeName, directory: Directory.Cache, data: json,
      encoding: Encoding.UTF8
    });
    const { uri } = await Filesystem.getUri({path: safeName, directory: Directory.Cache});
    await Share.share({
      title: 'معمولاتِ یومیہ — بیک اَپ',
      text: 'ذاتی معمولات کا JSON بیک اَپ',
      files: [uri],
      dialogTitle: 'بیک اَپ کہاں محفوظ یا شیئر کرنا ہے؟'
    });
  };
}

// Dynamic import deliberately runs after native restoration.
await import('./app.js');
await import('./books.js');
