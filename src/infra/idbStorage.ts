import localforage from 'localforage';
import type { StateStorage } from 'zustand/middleware';

const idb = localforage.createInstance({
  name: 'elite-procurement-center',
});

export const idbStorage: StateStorage = {
  async getItem(name) {
    const value = await idb.getItem<string>(name);
    return value ?? null;
  },
  async setItem(name, value) {
    await idb.setItem(name, value);
  },
  async removeItem(name) {
    await idb.removeItem(name);
  },
};
