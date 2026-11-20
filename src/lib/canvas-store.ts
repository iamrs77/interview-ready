/*
 * Free canvas drawings, saved in this browser only (IndexedDB). Not localStorage: a drawing can be large.
 * Store "boards", key = board id. Today there is one board, "free-canvas".
 * Every function returns a promise that fails when the browser can't save (for example, storage is blocked).
 * Callers catch that, keep working, and show "Can't save in this browser".
 *
 * The database keeps its first name and version, so a drawing saved before the rename is still found.
 */

const DB_NAME = 'interview-ready-practice';
const DB_VERSION = 2;
const BOARDS = 'boards';

/** The Excalidraw drawing: elements, the few view settings worth keeping, and pasted images. */
export type SavedScene = {
  elements: readonly object[];
  appState: Record<string, unknown>;
  files: Record<string, object>;
};

let opening: Promise<IDBDatabase> | undefined;

function openDb(): Promise<IDBDatabase> {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOARDS)) db.createObjectStore(BOARDS);
    };
    request.onsuccess = () => {
      const db = request.result;
      // A newer version of the site wants to upgrade the database: let it, and reopen next time.
      db.onversionchange = () => {
        db.close();
        opening = undefined;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? new Error('IndexedDB failed to open'));
    request.onblocked = () => reject(new Error('IndexedDB is blocked by another tab'));
  });
  // A failed open is tried again next time.
  opening.catch(() => {
    opening = undefined;
  });
  return opening;
}

/** Runs one transaction. Resolves with the result of the request `work` returns, once everything is written. */
async function transaction<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction([BOARDS], mode);
    const request = work(tx.objectStore(BOARDS));
    tx.oncomplete = () => resolve(request.result as T);
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

/** A saved drawing, or undefined when it was never saved. */
export function getBoard(id: string): Promise<SavedScene | undefined> {
  return transaction<SavedScene | undefined>('readonly', (store) => store.get(id));
}

export function saveBoard(id: string, scene: SavedScene): Promise<void> {
  return transaction<void>('readwrite', (store) => store.put(scene, id));
}
