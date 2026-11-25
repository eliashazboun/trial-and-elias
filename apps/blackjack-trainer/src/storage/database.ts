import { metadata } from "../config/metadata";
import { initialState } from "../engine/engine";
import { validateState } from "./validation";
import type { Environment, GameState } from "../engine/types";
const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
const finish = (t: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = t.onabort = () =>
      reject(t.error ?? Error("Storage transaction was canceled"));
  });
export class Database {
  private db: IDBDatabase | null = null;
  readonly owner = crypto.getRandomValues(new Uint32Array(4)).join("-");
  async open() {
    if (this.db) return;
    const r = indexedDB.open(metadata.database, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore("state");
      db.createObjectStore("ownership");
    };
    this.db = await request(r);
    this.db.onversionchange = () => {
      this.db?.close();
      this.db = null;
    };
  }
  async acquire(now = Date.now(), force = false) {
    await this.open();
    const tx = this.db!.transaction("ownership", "readwrite"),
      done = finish(tx),
      store = tx.objectStore("ownership");
    const lease = (await request(store.get("writer"))) as
      | { owner: string; until: number }
      | undefined;
    if (!force && lease && lease.owner !== this.owner && lease.until > now) {
      await done;
      return false;
    }
    store.put({ owner: this.owner, until: now + 8000 }, "writer");
    await done;
    return true;
  }
  async load(env: Environment) {
    await this.open();
    const tx = this.db!.transaction("state", "readonly"),
      done = finish(tx);
    const raw = await request(tx.objectStore("state").get("current"));
    await done;
    if (raw) return validateState(raw);
    const state = initialState(env);
    await this.save(state, null);
    return state;
  }
  async save(state: GameState, expected: number | null) {
    await this.open();
    const tx = this.db!.transaction(["state", "ownership"], "readwrite"),
      done = finish(tx);
    try {
      const store = tx.objectStore("state");
      const [raw, lease] = await Promise.all([
        request(store.get("current")),
        request(tx.objectStore("ownership").get("writer")),
      ]);
      if (!lease || lease.owner !== this.owner || lease.until < Date.now())
        throw Error("Another tab owns this table. Close it and retry.");
      if (expected === null ? !!raw : !raw || raw.revision !== expected)
        throw Error(
          "The saved table changed. Reload to recover the committed state.",
        );
      store.put(state, "current");
      await done;
    } catch (e) {
      try {
        tx.abort();
      } catch {}
      await done.catch(() => {});
      throw e;
    }
  }
  async release() {
    if (!this.db) return;
    const tx = this.db.transaction("ownership", "readwrite"),
      done = finish(tx),
      store = tx.objectStore("ownership");
    const lease = await request(store.get("writer"));
    if (lease?.owner === this.owner) store.delete("writer");
    await done;
  }
  close() {
    this.db?.close();
    this.db = null;
  }
}
